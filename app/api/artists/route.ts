// ============================================================
// ROSTER — /api/artists
// ------------------------------------------------------------
// GET:  list the current user's artists with latest stats
// POST: add an artist by Spotify URL/ID — fetches live data
//       from Spotify, inserts `artists` row + initial `artist_stats`
//       snapshot in one go.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext, canEdit } from "@/lib/workspace/context";
import { AddArtistSchema, formatZodError } from "@/lib/validation/schemas";
import {
  getArtist,
  parseSpotifyArtistId,
  primaryGenre,
} from "@/lib/spotify/client";
import { getAccessTokenForUser } from "@/lib/spotify/oauth";
import { runFetchers } from "@/lib/fetchers";
import { scoreArtist } from "@/lib/scoring";
import type {
  ArtistScores,
  MetricSnapshot,
  Platform,
} from "@/lib/scoring/types";
import { logger } from "@/lib/logger";

// Allow up to 60s so the post-insert stats fetch (runFetchers) doesn't
// get cut off by Vercel's default 10s serverless function timeout.
export const maxDuration = 60;
export const runtime = "nodejs";

// ─── GET ────────────────────────────────────────────────────
export async function GET() {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Use the admin client for the embed query. RLS on artist_stats
    // only allows SELECT via a subquery-based policy, and PostgREST's
    // embedded resource joins can silently return empty arrays in
    // that case. Admin client reads are safe here because we've
    // already auth'd the user and scoped the query by ownerId.
    const admin = createAdminClient();

    const { data: artists, error } = await admin
      .from("artists")
      .select(
        `
        id, name, genre, country, country_flag, countries, country_flags,
        spotify_artist_id, spotify_url, image_url, popularity, created_at,
        audiomack_handle, youtube_channel_id, tiktok_open_id,
        artist_stats (
          followers, popularity, monthly_listeners,
          monthly_active_listeners, new_active_listeners, super_listeners,
          snapshot_at
        )
      `
      )
      .eq("user_id", ctx.ownerId)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("[artists GET] DB error", {}, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Pull every platform-metric snapshot for this user's artists in
    // a single round-trip — way cheaper than N+1 queries per artist.
    // The scoring engine needs the FULL history (or at least the
    // latest two per metric) to compute momentum velocity.
    const artistIds = (artists ?? []).map((a) => a.id);
    const metricsByArtist = new Map<string, MetricSnapshot[]>();

    if (artistIds.length > 0) {
      const { data: metrics, error: metricsErr } = await admin
        .from("artist_platform_metrics")
        .select("artist_id, platform, metric, value, snapshot_at, source")
        .in("artist_id", artistIds)
        .order("snapshot_at", { ascending: false });

      if (metricsErr) {
        logger.error("[artists GET] Metrics fetch error", {}, metricsErr);
        // Non-fatal — fall through with empty metrics map.
      } else {
        for (const m of metrics ?? []) {
          const list = metricsByArtist.get(m.artist_id) ?? [];
          list.push({
            platform: m.platform as Platform,
            metric: m.metric,
            value: typeof m.value === "string" ? Number(m.value) : (m.value as number),
            snapshotAt: m.snapshot_at,
            source: m.source,
          });
          metricsByArtist.set(m.artist_id, list);
        }
      }
    }

    // Shape the response: attach { current, previous } stats per artist
    const shaped = (artists ?? []).map((a) => {
      const stats = ((a.artist_stats ?? []) as {
        followers: number;
        popularity: number;
        monthly_listeners: number | null;
        monthly_active_listeners: number | null;
        new_active_listeners: number | null;
        super_listeners: number | null;
        snapshot_at: string;
      }[])
        .slice()
        .sort(
          (x, y) =>
            new Date(y.snapshot_at).getTime() -
            new Date(x.snapshot_at).getTime()
        );
      const current = stats[0] ?? null;
      const previous = stats[1] ?? null;

      // Manually-entered metrics are sparse — always find the most
      // recent non-null snapshot per metric so an API sync row (which
      // doesn't touch these fields) doesn't "clear" the vanity number.
      const latestOf = (key: keyof typeof stats[0]): number | null => {
        const v = stats.find((s) => s[key] != null)?.[key];
        return typeof v === "number" ? v : null;
      };

      const latestMonthlyListeners = latestOf("monthly_listeners");
      const latestMAL = latestOf("monthly_active_listeners");
      const latestNAL = latestOf("new_active_listeners");
      const latestSuper = latestOf("super_listeners");

      const previousMonthlyListenersEntry = stats.find(
        (s, i) => i > 0 && s.monthly_listeners != null
      );

      // Trend is driven by monthly listeners (the headline number) when
      // we have two non-null snapshots, falls back to follower delta.
      let trend: "up" | "down" | "flat" = "flat";
      let trendPct = 0;
      const curML = latestMonthlyListeners;
      const prevML =
        previousMonthlyListenersEntry?.monthly_listeners ?? null;
      if (curML != null && prevML != null && prevML > 0) {
        const delta = curML - prevML;
        trendPct = +((delta / prevML) * 100).toFixed(1);
        trend = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
      } else if (current && previous && previous.followers > 0) {
        const delta = current.followers - previous.followers;
        trendPct = +((delta / previous.followers) * 100).toFixed(1);
        trend = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
      }

      // Multi-jurisdiction: fall back to single-value columns for rows
      // that pre-date migration 016 and never got the array backfill.
      const countriesArr =
        Array.isArray((a as { countries?: string[] }).countries) &&
        (a as { countries?: string[] }).countries!.length > 0
          ? (a as { countries: string[] }).countries
          : a.country
            ? [a.country]
            : [];
      const flagsArr =
        Array.isArray((a as { country_flags?: string[] }).country_flags) &&
        (a as { country_flags?: string[] }).country_flags!.length > 0
          ? (a as { country_flags: string[] }).country_flags
          : a.country_flag
            ? [a.country_flag]
            : [];

      // Bridge: feed the legacy artist_stats numbers into the
      // scoring engine as synthetic platform-metric snapshots so
      // pre-migration-018 artists still get a Reach score. Once
      // every artist has at least one row in
      // artist_platform_metrics, this bridge can be dropped.
      const platformMetrics: MetricSnapshot[] = [
        ...(metricsByArtist.get(a.id) ?? []),
      ];

      const synth = (
        metric: string,
        value: number | null | undefined,
        snapshotAt: string
      ) => {
        if (value == null || !Number.isFinite(value) || value <= 0) return;
        platformMetrics.push({
          platform: "spotify",
          metric,
          value,
          snapshotAt,
          source: "spotify_api",
        });
      };

      // Seed every artist_stats snapshot so velocity also works
      // off the legacy data, not just the latest level.
      for (const s of stats) {
        synth("followers", s.followers, s.snapshot_at);
        synth("monthly_listeners", s.monthly_listeners, s.snapshot_at);
        synth("super_listeners", s.super_listeners, s.snapshot_at);
      }

      // Per-country Reach weight profile: SA artists weight TikTok
      // more, Boomplay/Audiomack less, etc. Falls back to the global
      // default for countries without a profile (or null country).
      // Uses the legacy `country` column first (single value) then
      // the multi-jurisdiction array's first entry as backstop.
      const primaryCountry: string | null =
        a.country ?? countriesArr[0] ?? null;
      const scores: ArtistScores = scoreArtist(platformMetrics, {
        primaryCountry,
      });

      return {
        id: a.id,
        name: a.name,
        genre: a.genre,
        country: a.country,
        countryFlag: a.country_flag,
        countries: countriesArr,
        countryFlags: flagsArr,
        spotifyId: a.spotify_artist_id ?? "",
        spotifyUrl: a.spotify_url ?? "",
        imageUrl: a.image_url,
        popularity: current?.popularity ?? a.popularity ?? 0,
        followers: current?.followers ?? 0,
        monthlyListeners: latestMonthlyListeners,
        monthlyActiveListeners: latestMAL,
        newActiveListeners: latestNAL,
        superListeners: latestSuper,
        lastSyncedAt: current?.snapshot_at ?? null,
        trend,
        trendPct,
        // Platform handles the nightly fetcher uses. Surfaced so the
        // Update Stats modal can show "linked to channel X" and let
        // the user override a wrong auto-resolved channel.
        audiomackHandle: (a as { audiomack_handle: string | null }).audiomack_handle ?? null,
        youtubeChannelId: (a as { youtube_channel_id: string | null }).youtube_channel_id ?? null,
        tiktokOpenId: (a as { tiktok_open_id: string | null }).tiktok_open_id ?? null,
        // ROSTER-native composite scores — replace Popularity in the UI.
        reach: scores.reach,
        momentum: scores.momentum,
        engagement: scores.engagement,
        scoreBreakdown: scores.breakdown,
        scoreCoverage: {
          ...scores.coverage,
          platformCount: new Set(
            (scores.breakdown.reach ?? [])
              .concat(scores.breakdown.momentum ?? [])
              .concat(scores.breakdown.engagement ?? [])
              .map((s) => s.signal.split(".")[0])
          ).size,
        },
      };
    });

    return NextResponse.json({ artists: shaped });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[artists GET] Error", {}, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    // Only owners, admins, and editors with artist-edit permission may add artists
    if (!canEdit(ctx, "artists")) {
      return NextResponse.json({ error: "You don't have permission to add artists." }, { status: 403 });
    }

    // ── Tier artist-limit check ───────────────────────────────
    // Count existing artists for this workspace and compare against
    // the tier's artist cap. Enterprise (20) and lower tiers all
    // have explicit limits; -1 would mean unlimited (reserved for future).
    {
      const { getUserTier } = await import("@/lib/vault/get-user-tier");
      const { TIERS }       = await import("@/lib/constants");
      const supabaseForTier = (await import("@/lib/supabase/server")).createClient();
      const tierClient      = await supabaseForTier;
      const tierId          = await getUserTier(tierClient, ctx.ownerId);
      const tierDef         = TIERS.find(t => t.id === tierId);
      const artistLimit     = tierDef?.artists ?? 0; // 0 = free (can't add any)

      if (artistLimit > 0) {
        const adminCount = createAdminClient();
        const { count, error: countErr } = await adminCount
          .from("artists")
          .select("id", { count: "exact", head: true })
          .eq("user_id", ctx.ownerId);

        if (!countErr && count !== null && count >= artistLimit) {
          const nextTier = TIERS[TIERS.findIndex(t => t.id === tierId) + 1];
          return NextResponse.json(
            {
              error: `Your ${tierDef?.name ?? tierId} plan supports up to ${artistLimit} artist${artistLimit === 1 ? "" : "s"}. Upgrade${nextTier ? ` to ${nextTier.name}` : ""} to add more.`,
              code:  "ARTIST_LIMIT_REACHED",
              limit: artistLimit,
              upgradeUrl: "/dashboard/settings#billing",
            },
            { status: 403 }
          );
        }
      } else if (artistLimit === 0) {
        return NextResponse.json(
          {
            error: "Free accounts can't add artists. Upgrade to Pro to start building your roster.",
            code:  "ARTIST_LIMIT_REACHED",
            limit: 0,
            upgradeUrl: "/pricing",
          },
          { status: 403 }
        );
      }
    }

    // ── Validate request body ──────────────────────────────────────────────
    const parsedBody = AddArtistSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(formatZodError(parsedBody.error), { status: 400 });
    }

    const {
      spotifyUrl,
      country,
      countries: countriesInput,
      manualName,
      manualGenre,
      manualFollowers,
      manualMonthlyListeners,
    } = parsedBody.data;

    // Zod already validates these are non-negative integers; Math.floor is
    // kept as a safety net in case fractional values slip through future schema changes.
    const manualFollowersClean        = manualFollowers        != null ? Math.floor(manualFollowers)        : null;
    const manualMonthlyListenersClean = manualMonthlyListeners != null ? Math.floor(manualMonthlyListeners) : null;

    // Build the multi-jurisdiction arrays. We always keep the legacy
    // `country` column populated (using the first country) so older
    // code paths don't break.
    const normalisedCountries: string[] = (() => {
      if (Array.isArray(countriesInput)) {
        const cleaned = countriesInput
          .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
          .map((c) => c.trim());
        if (cleaned.length > 0) return cleaned;
      }
      if (typeof country === "string" && country.trim().length > 0) {
        return [country.trim()];
      }
      return [];
    })();
    const primaryCountry = normalisedCountries[0] ?? null;
    const flagsArr = normalisedCountries.map(countryFlagFromName);
    const primaryFlag = flagsArr[0] ?? "🌍";

    // ── Manual path: no Spotify URL provided ─────────────────
    // Use this when Spotify's API is gated (dev mode pre-extended-quota)
    // or when adding an artist who isn't on Spotify yet.
    if (!spotifyUrl || !String(spotifyUrl).trim()) {
      const cleanName =
        typeof manualName === "string" ? manualName.trim() : "";
      if (!cleanName) {
        return NextResponse.json(
          {
            error:
              "Either a Spotify URL or an artist name (manual mode) is required.",
          },
          { status: 400 }
        );
      }

      const admin = createAdminClient();

      // Dedupe on lowered name within this roster — the unique
      // constraint can't catch this because spotify_artist_id is null.
      const { data: existing } = await admin
        .from("artists")
        .select("id, name")
        .eq("user_id", ctx.ownerId)
        .ilike("name", cleanName)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: `${existing.name} is already on your roster.` },
          { status: 409 }
        );
      }

      const { data: inserted, error: insertError } = await admin
        .from("artists")
        .insert({
          user_id: ctx.ownerId,
          name: cleanName,
          genre:
            typeof manualGenre === "string" && manualGenre.trim()
              ? manualGenre.trim()
              : null,
          country: primaryCountry,
          country_flag: primaryFlag,
          countries: normalisedCountries,
          country_flags: flagsArr,
          spotify_artist_id: null,
          spotify_url: null,
          image_url: null,
          popularity: null,
        })
        .select()
        .single();

      if (insertError) {
        logger.error("[artists POST manual] Insert error", {}, insertError);
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }

      // Initial stats snapshot (zeros if user didn't enter anything).
      // Always insert at least one row so the brief engine + sync flow
      // have a baseline to compare future numbers against.
      const initialFollowers = manualFollowersClean ?? 0;
      const { error: statsError } = await admin.from("artist_stats").insert({
        artist_id: inserted.id,
        followers: initialFollowers,
        popularity: null,
        monthly_listeners: manualMonthlyListenersClean,
      });
      if (statsError) {
        logger.error("[artists POST manual] Stats error", {}, statsError);
      }

      return NextResponse.json({
        artist: {
          id: inserted.id,
          name: inserted.name,
          genre: inserted.genre ?? "",
          country: inserted.country,
          countryFlag: inserted.country_flag ?? primaryFlag,
          countries: normalisedCountries,
          countryFlags: flagsArr,
          spotifyId: "",
          spotifyUrl: "",
          imageUrl: null,
          popularity: 0,
          followers: initialFollowers,
          monthlyListeners: manualMonthlyListenersClean,
          monthlyActiveListeners: null,
          newActiveListeners: null,
          superListeners: null,
          trend: "flat" as const,
          trendPct: 0,
        },
      });
    }

    // ── Spotify path: URL/ID provided ────────────────────────
    const spotifyId = parseSpotifyArtistId(spotifyUrl);
    if (!spotifyId) {
      return NextResponse.json(
        {
          error:
            "Couldn't find a Spotify artist ID in that input. Paste the URL from an artist's Spotify page (e.g. https://open.spotify.com/artist/…)",
        },
        { status: 400 }
      );
    }

    // Fetch live data from Spotify — needs the workspace owner's linked token
    let artist;
    try {
      const userToken = await getAccessTokenForUser(ctx.ownerId);
      artist = await getArtist(spotifyId, userToken);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown Spotify error";
      if (msg === "SPOTIFY_NOT_CONNECTED") {
        return NextResponse.json(
          {
            error:
              "Connect your Spotify account in Settings before adding artists.",
            code: "SPOTIFY_NOT_CONNECTED",
          },
          { status: 428 } // 428 Precondition Required
        );
      }
      logger.error("[artists POST] Spotify fetch failed", {}, msg);
      return NextResponse.json(
        { error: `Spotify lookup failed: ${msg}` },
        { status: 502 }
      );
    }

    // Admin client to insert (bypass RLS; we've already auth'd the user)
    const admin = createAdminClient();

    // Check if this artist is already on the roster
    const { data: existing } = await admin
      .from("artists")
      .select("id")
      .eq("user_id", ctx.ownerId)
      .eq("spotify_artist_id", spotifyId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `${artist.name} is already on your roster.` },
        { status: 409 }
      );
    }

    const { data: inserted, error: insertError } = await admin
      .from("artists")
      .insert({
        user_id: ctx.ownerId,
        name: artist.name,
        genre: primaryGenre(artist.genres),
        country: primaryCountry,
        country_flag: primaryFlag,
        countries: normalisedCountries,
        country_flags: flagsArr,
        spotify_artist_id: artist.id,
        spotify_url: artist.externalUrl,
        image_url: artist.imageUrl,
        popularity: artist.popularity,
      })
      .select()
      .single();

    if (insertError) {
      logger.error("[artists POST] Insert error", {}, insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Decide which follower count to persist:
    //   - If Spotify returned a real number (> 0), trust it.
    //   - Otherwise fall back to the manual override the user typed
    //     in the Add modal (workaround for Spotify Dev Mode stripping
    //     followers until Extended Quota is approved).
    //   - If neither, store 0 and let the user edit later.
    const initialFollowers =
      artist.followers > 0
        ? artist.followers
        : manualFollowersClean ?? 0;

    // First stats snapshot
    const { error: statsError } = await admin.from("artist_stats").insert({
      artist_id: inserted.id,
      followers: initialFollowers,
      popularity: artist.popularity,
      monthly_listeners: manualMonthlyListenersClean,
    });

    if (statsError) {
      logger.error("[artists POST] Stats snapshot error", {}, statsError);
      // Don't fail the whole request — artist is saved, stats will catch up
    }

    // ── Trigger on-demand stats fetch immediately ─────────────────────────
    // Without this, the new artist sits with zero platform metrics until the
    // 03:00 UTC cron — up to a 21-hour gap before any stats appear. We fire
    // runFetchers here so Spotify monthly listeners, Audiomack plays, and
    // YouTube views are populated before the response returns. The user sees
    // real numbers the moment their artist card renders.
    // Non-fatal: if the fetch fails we log and continue — the cron will pick
    // it up overnight.
    try {
      await runFetchers(admin, { artistIds: [inserted.id] });
    } catch (fetchErr) {
      logger.warn("[artists POST] Initial stats fetch failed (non-fatal)", {}, fetchErr);
    }

    return NextResponse.json({
      artist: {
        id: inserted.id,
        name: inserted.name,
        genre: inserted.genre,
        country: inserted.country,
        countryFlag: inserted.country_flag,
        countries: normalisedCountries,
        countryFlags: flagsArr,
        spotifyId: inserted.spotify_artist_id,
        spotifyUrl: inserted.spotify_url,
        imageUrl: inserted.image_url,
        popularity: artist.popularity,
        followers: initialFollowers,
        monthlyListeners: manualMonthlyListenersClean,
        monthlyActiveListeners: null,
        newActiveListeners: null,
        superListeners: null,
        trend: "flat" as const,
        trendPct: 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[artists POST] Error", {}, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function countryFlagFromName(name: string): string {
  const map: Record<string, string> = {
    "South Africa": "🇿🇦",
    Nigeria: "🇳🇬",
    Ghana: "🇬🇭",
    Kenya: "🇰🇪",
    Uganda: "🇺🇬",
    Tanzania: "🇹🇿",
    Zimbabwe: "🇿🇼",
    Ethiopia: "🇪🇹",
    Egypt: "🇪🇬",
    Morocco: "🇲🇦",
    Algeria: "🇩🇿",
    "Côte d'Ivoire": "🇨🇮",
    "United Kingdom": "🇬🇧",
    "United States": "🇺🇸",
    Jamaica: "🇯🇲",
    Brazil: "🇧🇷",
    France: "🇫🇷",
  };
  return map[name] ?? "🌍";
}
