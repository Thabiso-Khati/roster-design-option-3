export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — POST /api/competitor/lookup
// ------------------------------------------------------------
// Pulls live public data for any artist by name from Spotify
// and YouTube, maps it to ROSTER's Reach / Engagement /
// Momentum scores, stores a snapshot, and returns the result.
//
// Score sources (what's live today vs. coming soon):
//   Reach      → Spotify popularity (0–100 direct) + YouTube
//                subscriber log-score, weighted average.
//   Engagement → YouTube views-per-subscriber ratio, log-
//                normalised to 0–100. (Instagram / TikTok will
//                slot in here once those credentials exist.)
//   Momentum   → delta vs previous snapshot for this artist.
//                Zero on first pull — updates on every pull
//                thereafter, giving you trend direction.
//
// Platform stubs for future sources:
//   Each source lives in its own try/catch so a missing API
//   key or quota error never blocks the whole lookup.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchArtists } from "@/lib/spotify/client";
import { getAccessTokenForUser } from "@/lib/spotify/oauth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 30;

const YT_BASE = "https://www.googleapis.com/youtube/v3";

// ─── Score helpers ────────────────────────────────────────────────────────────

/** Log-normalise a raw count to 0–100. Ceiling set at 50M
 *  (enough to score Beyoncé at ~100 while giving smaller
 *  African artists meaningful spread in the 20–70 range). */
function logScore(count: number, ceiling = 50_000_000): number {
  if (count <= 0) return 0;
  return Math.min(100, Math.round((Math.log10(count + 1) / Math.log10(ceiling + 1)) * 100));
}

/** Engagement = views-per-subscriber ratio, log-normalised.
 *  1 000 views/sub  → ~100 (viral channel)
 *  100  views/sub   → ~67
 *  10   views/sub   → ~33
 *  Ceiling at 2000 so outlier channels don't break the scale. */
function engagementFromYouTube(
  totalViews: number,
  subscribers: number
): number {
  if (subscribers <= 0 || totalViews <= 0) return 0;
  const ratio = totalViews / subscribers;
  return Math.min(
    100,
    Math.round((Math.log10(ratio + 1) / Math.log10(2001)) * 100)
  );
}

/** Weighted Reach: Spotify popularity is the anchor (most reliable
 *  0–100 signal), YouTube log-score augments it when available. */
function computeReach(
  spotifyPopularity: number | null,
  ytSubscribers: number | null
): { score: number; platformCount: number } {
  const signals: number[] = [];
  if (spotifyPopularity !== null) signals.push(spotifyPopularity * 0.65);
  if (ytSubscribers !== null) signals.push(logScore(ytSubscribers) * 0.35);
  if (signals.length === 0) return { score: 0, platformCount: 0 };
  // Scale back to 0–100 regardless of how many signals contributed
  const raw = signals.reduce((a, b) => a + b, 0);
  const weight = (spotifyPopularity !== null ? 0.65 : 0) + (ytSubscribers !== null ? 0.35 : 0);
  return {
    score: Math.round(raw / weight),
    platformCount: signals.length,
  };
}

/** Composite used for Momentum delta: same weights as the main
 *  scoring engine (Reach 40%, Momentum ignored, Engagement 25%,
 *  remaining 35% is blank until more sources land). */
function composite(reach: number, engagement: number): number {
  return Math.round(reach * 0.4 + engagement * 0.25);
}

// ─── YouTube lookup ──────────────────────────────────────────────────────────

interface YouTubeResult {
  channelId: string;
  subscribers: number;
  totalViews: number;
}

async function youtubeResolveChannel(name: string, apiKey: string): Promise<string | null> {
  try {
    const url = new URL(`${YT_BASE}/search`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "channel");
    url.searchParams.set("q", name);
    url.searchParams.set("maxResults", "5");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const json = await res.json() as {
      items?: Array<{ id?: { channelId?: string }; snippet?: { title?: string } }>;
    };
    const items = json.items ?? [];

    // Prefer non-Topic channels (Topic = auto-generated, no real engagement)
    const real = items.find(
      (i) => i.id?.channelId && !/\s[-–]\s*Topic$/i.test(i.snippet?.title ?? "")
    );
    if (real?.id?.channelId) return real.id.channelId;
    return items.find((i) => i.id?.channelId)?.id?.channelId ?? null;
  } catch {
    return null;
  }
}

async function youtubeStats(channelId: string, apiKey: string): Promise<YouTubeResult | null> {
  try {
    const url = new URL(`${YT_BASE}/channels`);
    url.searchParams.set("part", "statistics");
    url.searchParams.set("id", channelId);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const json = await res.json() as {
      items?: Array<{ statistics?: { subscriberCount?: string; viewCount?: string } }>;
    };
    const stats = json.items?.[0]?.statistics;
    if (!stats) return null;
    return {
      channelId,
      subscribers: parseInt(stats.subscriberCount ?? "0", 10) || 0,
      totalViews: parseInt(stats.viewCount ?? "0", 10) || 0,
    };
  } catch {
    return null;
  }
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { name?: string };
    const rawName = typeof body.name === "string" ? body.name.trim() : "";
    if (!rawName) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const normalisedName = rawName.toLowerCase();

    // ── Auth ─────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ── Spotify ──────────────────────────────────────────────────────────────
    let spotifyId: string | null = null;
    let spotifyPopularity: number | null = null;
    let spotifyFollowers: number | null = null;
    let spotifyError: string | null = null;

    try {
      const userToken = await getAccessTokenForUser(user.id);
      const results = await searchArtists(rawName, userToken, 1);
      if (results.length > 0) {
        const top = results[0];
        spotifyId = top.id;
        spotifyPopularity = top.popularity;
        spotifyFollowers = top.followers;
      } else {
        spotifyError = `No Spotify artist found for "${rawName}"`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Spotify lookup failed";
      spotifyError = msg === "SPOTIFY_NOT_CONNECTED"
        ? "Connect Spotify in Settings → Integrations to enable Spotify data"
        : msg;
      logger.warn("[competitor/lookup] Spotify error", {}, err);
    }

    // ── YouTube ──────────────────────────────────────────────────────────────
    let ytChannelId: string | null = null;
    let ytSubscribers: number | null = null;
    let ytViews: number | null = null;
    let ytError: string | null = null;

    const ytKey = process.env.YOUTUBE_API_KEY;
    if (ytKey) {
      try {
        const channelId = await youtubeResolveChannel(rawName, ytKey);
        if (channelId) {
          const stats = await youtubeStats(channelId, ytKey);
          if (stats) {
            ytChannelId = stats.channelId;
            ytSubscribers = stats.subscribers;
            ytViews = stats.totalViews;
          } else {
            ytError = "YouTube channel found but stats unavailable";
          }
        } else {
          ytError = `No YouTube channel found for "${rawName}"`;
        }
      } catch (err) {
        ytError = err instanceof Error ? err.message : "YouTube lookup failed";
        logger.warn("[competitor/lookup] YouTube error", {}, err);
      }
    } else {
      ytError = "YOUTUBE_API_KEY not configured";
    }

    // ── Compute scores ───────────────────────────────────────────────────────
    const { score: reach, platformCount } = computeReach(spotifyPopularity, ytSubscribers);
    const engagement = engagementFromYouTube(ytViews ?? 0, ytSubscribers ?? 0);

    // ── Momentum: delta vs previous snapshot ─────────────────────────────────
    let momentum = 0;
    const { data: prevSnap } = await supabase
      .from("competitor_snapshots")
      .select("reach_score, engagement_score, snapped_at")
      .eq("user_id", user.id)
      .eq("artist_name", normalisedName)
      .order("snapped_at", { ascending: false })
      .limit(1)
      .single();

    if (prevSnap) {
      const prevComposite = composite(prevSnap.reach_score, prevSnap.engagement_score);
      const currComposite = composite(reach, engagement);
      const rawDelta = currComposite - prevComposite;
      // Clamp to ±50 — mirrors the existing momentum chip range
      momentum = Math.max(-50, Math.min(50, rawDelta));
    }

    // ── Store snapshot ───────────────────────────────────────────────────────
    if (platformCount > 0) {
      const { error: insertErr } = await supabase
        .from("competitor_snapshots")
        .insert({
          user_id: user.id,
          artist_name: normalisedName,
          spotify_id: spotifyId,
          spotify_popularity: spotifyPopularity,
          spotify_followers: spotifyFollowers,
          youtube_channel_id: ytChannelId,
          youtube_subscribers: ytSubscribers,
          youtube_views: ytViews,
          reach_score: reach,
          engagement_score: engagement,
          momentum_score: momentum,
          platform_count: platformCount,
        });
      if (insertErr) {
        logger.error("[competitor/lookup] snapshot insert failed", {}, insertErr);
        // Non-fatal — still return the scores
      }
    }

    // ── Response ─────────────────────────────────────────────────────────────
    return NextResponse.json({
      name: rawName,
      scores: {
        reach,
        engagement,
        momentum,
        platformCount,
      },
      sources: {
        spotify: spotifyError
          ? { ok: false, error: spotifyError }
          : { ok: true, popularity: spotifyPopularity, followers: spotifyFollowers, id: spotifyId },
        youtube: ytError
          ? { ok: false, error: ytError }
          : { ok: true, subscribers: ytSubscribers, totalViews: ytViews, channelId: ytChannelId },
        // Stubs — will be populated as each integration lands
        instagram: { ok: false, error: "Coming soon" },
        tiktok:    { ok: false, error: "Coming soon — TikTok integration in progress" },
        deezer:    { ok: false, error: "Coming soon" },
        appleMusic:{ ok: false, error: "Coming soon" },
      },
      pulledAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("[competitor/lookup] unexpected error", {}, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lookup failed" },
      { status: 500 }
    );
  }
}
