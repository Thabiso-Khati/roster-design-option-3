// ============================================================
// ROSTER — Fetcher orchestrator
// ------------------------------------------------------------
// One entry point the cron route calls. Loops every artist in
// the database, runs each available fetcher (Audiomack, YouTube,
// Spotify today; TikTok/Instagram/etc. later), and writes the
// results to `artist_platform_metrics` in one batch.
//
// Per-artist flow:
//   1. Read prior internal snapshots (`_total_*_lifetime`) so
//      delta math has historical context.
//   2. Run fetchers in parallel — they're network-bound and
//      hit different hosts.
//   3. Collect rows: scoring metrics use the per-platform
//      source (e.g. "audiomack_api"); internal sentinels use
//      the same source so we can tell auto-pulled deltas apart
//      from manual overrides later.
//   4. If a fetcher resolved a handle on first run, persist it
//      back to the artist row so the next run skips resolution.
//
// Returns a per-artist summary so the cron route can render
// a useful response for the dashboard's "last sync" panel.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAudiomack } from "./audiomack";
import { fetchYouTube } from "./youtube";
import { fetchSpotify } from "./spotify";
import { fetchTikTok } from "./tiktok";
import type { FetcherContext, FetcherResult } from "./types";

type Platform = "audiomack" | "youtube" | "spotify" | "tiktok";

interface ArtistRow {
  id: string;
  name: string;
  audiomack_handle: string | null;
  youtube_channel_id: string | null;
  spotify_artist_id: string | null;
  tiktok_open_id: string | null;
}

interface InternalSnapshot {
  metric: string;
  value: number;
  snapshot_at: string;
}

export interface FetcherRunSummary {
  artistId: string;
  artistName: string;
  results: Array<{
    platform: Platform;
    ok: boolean;
    metricsWritten: string[];
    error?: string;
  }>;
}

/** Build a FetcherContext from the prior internal snapshots
 *  for one artist+platform. The fetcher uses this to look up
 *  e.g. "what was _total_plays_lifetime when we last ran?". */
function buildContext(
  prevByMetric: Map<string, InternalSnapshot>
): FetcherContext {
  return {
    getPrevInternal(metricKey) {
      const row = prevByMetric.get(metricKey);
      if (!row) return null;
      return { value: row.value, snapshotAt: row.snapshot_at };
    },
  };
}

/** Insert one fetcher result's metrics + internal rows.
 *  All rows for one (artist, platform, run) share the same
 *  snapshot_at via the DB default so they cluster cleanly. */
async function persistResult(
  admin: SupabaseClient,
  artistId: string,
  platform: Platform,
  result: FetcherResult
): Promise<string[]> {
  const rows: Array<{
    artist_id: string;
    platform: string;
    metric: string;
    value: number;
    source: string;
  }> = [];

  for (const [metric, value] of Object.entries(result.metrics)) {
    rows.push({
      artist_id: artistId,
      platform,
      metric,
      value,
      source: result.source,
    });
  }
  for (const [metric, value] of Object.entries(result.internal)) {
    rows.push({
      artist_id: artistId,
      platform,
      metric, // already underscore-prefixed
      value,
      source: result.source,
    });
  }

  if (rows.length === 0) return [];

  const { error } = await admin.from("artist_platform_metrics").insert(rows);
  if (error) {
    throw new Error(
      `Insert failed for ${platform}/${artistId}: ${error.message}`
    );
  }
  return Object.keys(result.metrics);
}

/** Backfill audiomack_handle / youtube_channel_id once a fetcher
 *  resolves them. One UPDATE per artist max. */
async function persistResolvedHandles(
  admin: SupabaseClient,
  artistId: string,
  resolved: { audiomack?: string; youtube?: string }
) {
  const update: Record<string, string> = {};
  if (resolved.audiomack) update.audiomack_handle = resolved.audiomack;
  if (resolved.youtube) update.youtube_channel_id = resolved.youtube;
  if (Object.keys(update).length === 0) return;
  await admin.from("artists").update(update).eq("id", artistId);
}

export async function runFetchers(
  admin: SupabaseClient,
  opts: { artistIds?: string[] } = {}
): Promise<FetcherRunSummary[]> {
  // Load every artist (or just the requested ones) along with
  // their persisted handles. We don't need stats here — the
  // fetchers compute their own deltas.
  const query = admin
    .from("artists")
    .select(
      "id, name, audiomack_handle, youtube_channel_id, spotify_artist_id, tiktok_open_id"
    );

  const { data: artists, error: artistsErr } = opts.artistIds?.length
    ? await query.in("id", opts.artistIds)
    : await query;

  if (artistsErr) {
    throw new Error(`Failed to load artists: ${artistsErr.message}`);
  }

  const summaries: FetcherRunSummary[] = [];

  for (const artist of (artists ?? []) as ArtistRow[]) {
    // Pull every internal snapshot for this artist in one query —
    // we filter client-side by metric prefix so the orchestrator
    // doesn't need to know each platform's bookkeeping keys.
    const { data: priorRows } = await admin
      .from("artist_platform_metrics")
      .select("platform, metric, value, snapshot_at")
      .eq("artist_id", artist.id)
      .like("metric", "\\_%") // underscore-prefixed (escape Postgres LIKE wildcard)
      .order("snapshot_at", { ascending: false });

    // Latest snapshot per (platform, metric) — first wins because
    // we sorted DESC.
    const priorByPlatform = new Map<string, Map<string, InternalSnapshot>>();
    for (const row of priorRows ?? []) {
      const platMap =
        priorByPlatform.get(row.platform) ?? new Map<string, InternalSnapshot>();
      if (!platMap.has(row.metric)) {
        platMap.set(row.metric, {
          metric: row.metric,
          value:
            typeof row.value === "string" ? Number(row.value) : (row.value as number),
          snapshot_at: row.snapshot_at,
        });
      }
      priorByPlatform.set(row.platform, platMap);
    }

    const audiomackCtx = buildContext(
      priorByPlatform.get("audiomack") ?? new Map()
    );
    const youtubeCtx = buildContext(
      priorByPlatform.get("youtube") ?? new Map()
    );
    const spotifyCtx = buildContext(
      priorByPlatform.get("spotify") ?? new Map()
    );
    const tiktokCtx = buildContext(
      priorByPlatform.get("tiktok") ?? new Map()
    );

    const [audiomackResult, youtubeResult, spotifyResult, tiktokResult] =
      await Promise.all([
        fetchAudiomack(artist.audiomack_handle, artist.name, audiomackCtx),
        fetchYouTube(artist.youtube_channel_id, artist.name, youtubeCtx),
        fetchSpotify(artist.spotify_artist_id, artist.name, spotifyCtx),
        // Only attempt TikTok if the artist has linked their account
        artist.tiktok_open_id
          ? fetchTikTok(artist.id, artist.name, tiktokCtx)
          : Promise.resolve({ ok: false, source: "tiktok_oauth" as const, metrics: {}, internal: {}, error: "TikTok not connected" }),
      ]);

    const summary: FetcherRunSummary = {
      artistId: artist.id,
      artistName: artist.name,
      results: [],
    };

    for (const [platform, result] of [
      ["audiomack", audiomackResult] as const,
      ["youtube", youtubeResult] as const,
      ["spotify", spotifyResult] as const,
      ["tiktok", tiktokResult] as const,
    ]) {
      try {
        const written = result.ok
          ? await persistResult(admin, artist.id, platform, result)
          : [];
        summary.results.push({
          platform,
          ok: result.ok,
          metricsWritten: written,
          error: result.error,
        });
      } catch (err) {
        summary.results.push({
          platform,
          ok: false,
          metricsWritten: [],
          error: err instanceof Error ? err.message : "Unknown insert error",
        });
      }
    }

    // Backfill handles only on success
    await persistResolvedHandles(admin, artist.id, {
      audiomack: audiomackResult.ok ? audiomackResult.resolvedHandle : undefined,
      youtube: youtubeResult.ok ? youtubeResult.resolvedHandle : undefined,
    });

    summaries.push(summary);
  }

  return summaries;
}
