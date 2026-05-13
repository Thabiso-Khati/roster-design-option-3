// ============================================================
// ROSTER — YouTube fetcher
// ------------------------------------------------------------
// Pulls public channel statistics from YouTube via the Data
// API v3. No OAuth — only an API key is required (set as
// YOUTUBE_API_KEY).
//
// Endpoints used:
//   GET /youtube/v3/channels?id={id}&part=statistics,snippet
//      → { items: [{ statistics: { viewCount, subscriberCount },
//                    snippet: { title } }] }
//   GET /youtube/v3/search?q={name}&type=channel&part=snippet
//      → resolve a channelId from artist name on first run
//
// What we write:
//   • subscribers          — direct from API (lifetime, accurate)
//   • _total_views_lifetime — sentinel for delta math
//   • views_28d             — current_total - prior_total when
//                             we have a snapshot in the 21–35d
//                             window. Skipped on first run.
//
// Quota:
//   channels.list      = 1 unit
//   search.list        = 100 units (only on first run per artist)
// Default quota = 10,000 units/day → comfortably handles a
// few thousand artists nightly even with occasional resolves.
// ============================================================

import type { FetcherContext, FetcherResult } from "./types";
import { emptyResult } from "./types";
import { logger } from "@/lib/logger";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

interface YouTubeChannelItem {
  id?: string;
  snippet?: { title?: string };
  statistics?: {
    viewCount?: string;
    subscriberCount?: string;
    videoCount?: string;
  };
}

const toInt = (v: unknown): number | null => {
  if (typeof v === "string" && /^\d+$/.test(v)) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
    return Math.floor(v);
  }
  return null;
};

/** Heuristic: YouTube auto-creates "{Artist} - Topic" channels for
 *  any artist whose music is distributed via DSPs. They have inflated
 *  subscriber counts (auto-subscribes from YouTube Music plays) and
 *  zero engagement (no comments, no community posts). For ROSTER's
 *  scoring we always want the artist's REAL channel where they upload
 *  videos, vlogs, etc. — not the music-only Topic mirror. */
function isTopicChannel(title: string | undefined): boolean {
  if (!title) return false;
  const t = title.trim();
  // Match "X - Topic", "X – Topic" (en-dash), and just "Topic" suffix.
  return /\s[-–]\s*Topic$/i.test(t);
}

/** Search YouTube for the most likely channel for an artist name.
 *  Costs 100 quota units regardless of maxResults — we ask for 5 so
 *  we can skip Topic channels in favour of the artist's real one
 *  when both exist. Returns null on a hard miss; falls back to the
 *  first Topic channel only if nothing else matches (better some
 *  data than none — the user can override via the modal). */
async function resolveChannelId(
  name: string,
  apiKey: string
): Promise<string | null> {
  try {
    const url = new URL(`${YT_BASE}/search`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "channel");
    url.searchParams.set("q", name);
    url.searchParams.set("maxResults", "5");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      items?: Array<{
        id?: { channelId?: string };
        snippet?: { title?: string };
      }>;
    };
    const items = json.items ?? [];
    if (items.length === 0) return null;

    // Prefer the first non-Topic channel.
    const realChannel = items.find(
      (i) => i.id?.channelId && !isTopicChannel(i.snippet?.title)
    );
    if (realChannel?.id?.channelId) return realChannel.id.channelId;

    // Everything was a Topic channel — fall back to the first one but
    // log so a future audit shows where this happened.
    const fallback = items.find((i) => i.id?.channelId);
    if (fallback?.id?.channelId) {
      logger.warn(`[youtube fetcher] Only Topic channels matched '${name}' — using ${fallback.snippet?.title ?? fallback.id.channelId}. Override via Update Stats → YouTube tab if the artist has a real channel.`);
      return fallback.id.channelId;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchYouTube(
  channelId: string | null,
  artistName: string,
  ctx: FetcherContext
): Promise<FetcherResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return emptyResult("youtube_api", "YOUTUBE_API_KEY not configured");
  }

  let resolved = channelId;
  let resolvedThisRun: string | undefined;

  if (!resolved) {
    resolved = await resolveChannelId(artistName, apiKey);
    if (!resolved) {
      return emptyResult(
        "youtube_api",
        `No YouTube channel found for '${artistName}'`
      );
    }
    resolvedThisRun = resolved;
  }

  let item: YouTubeChannelItem | null = null;
  try {
    const url = new URL(`${YT_BASE}/channels`);
    url.searchParams.set("part", "statistics,snippet");
    url.searchParams.set("id", resolved);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return emptyResult(
        "youtube_api",
        `YouTube ${res.status} for channel '${resolved}'`
      );
    }
    const json = (await res.json()) as {
      items?: YouTubeChannelItem[];
    };
    item = json.items?.[0] ?? null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown YouTube error";
    return emptyResult("youtube_api", `YouTube fetch failed: ${msg}`);
  }

  if (!item || !item.statistics) {
    return emptyResult(
      "youtube_api",
      `YouTube returned no statistics for '${resolved}'`
    );
  }

  const subs = toInt(item.statistics.subscriberCount);
  const totalViews = toInt(item.statistics.viewCount);

  const result: FetcherResult = {
    ok: true,
    source: "youtube_api",
    metrics: {},
    internal: {},
    resolvedHandle: resolvedThisRun,
  };

  if (subs !== null) result.metrics.subscribers = subs;

  if (totalViews !== null) {
    result.internal._total_views_lifetime = totalViews;

    const prev = ctx.getPrevInternal("_total_views_lifetime");
    if (prev) {
      const ageDays =
        (Date.now() - new Date(prev.snapshotAt).getTime()) /
        (1000 * 60 * 60 * 24);
      if (ageDays >= 21 && ageDays <= 35 && totalViews >= prev.value) {
        result.metrics.views_28d = totalViews - prev.value;
      }
    }
  }

  if (
    Object.keys(result.metrics).length === 0 &&
    Object.keys(result.internal).length === 0
  ) {
    return emptyResult(
      "youtube_api",
      `YouTube payload had no readable numbers for '${resolved}'`
    );
  }

  return result;
}
