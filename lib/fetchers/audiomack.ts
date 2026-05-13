// ============================================================
// ROSTER — Audiomack fetcher
// ------------------------------------------------------------
// Pulls public artist stats from Audiomack by scraping the
// public artist page and reading the __NEXT_DATA__ JSON blob
// that Next.js embeds for hydration. No OAuth, no API key —
// works against any public artist.
//
// Why scrape vs. API:
//   Audiomack does have an official Music Data API
//   (api.audiomack.com) but it requires OAuth client
//   credentials approval, which is a multi-day process.
//   The __NEXT_DATA__ blob exposes the same fields the
//   official API would return (followers, total_plays,
//   supporters) and updates as soon as the public page does.
//
// Endpoint:
//   GET https://audiomack.com/{slug}
//   → HTML page containing
//     <script id="__NEXT_DATA__">{ props.pageProps.artist: {...} }</script>
//
// We deliberately keep this resilient to schema drift — if the
// shape changes we log it and return an empty result rather
// than throwing the whole nightly run.
//
// ── 28d numbers caveat ──────────────────────────────────────
// The page reports LIFETIME totals (total_plays). To get a
// 28-day rolling number — which is what the scoring engine
// wants — we store the lifetime total each run as
// "_total_plays_lifetime" (underscore prefix → ignored by the
// scoring engine), then compute plays_28d = current - prior
// once we have a snapshot from ≥28 days ago. On the very first
// run for an artist we only write followers + supporters; the
// 28d number kicks in after the second nightly run that crosses
// the 28-day window.
// ============================================================

import type { FetcherContext, FetcherResult } from "./types";
import { emptyResult } from "./types";

const AM_PAGE = "https://audiomack.com";

/** Loose-typed slice of the Audiomack artist JSON we read from.
 *  Field names vary between API versions and the embedded hydration
 *  data — the fetcher tries each candidate before giving up. */
interface AudiomackArtistPayload {
  name?: string;
  slug?: string;
  followers?: number | string;
  followers_count?: number | string;
  total_plays?: number | string;
  total_plays_count?: number | string;
  plays_count?: number | string;
  supporters?: number | string;
  supporters_count?: number | string;
}

/** Returns the first numeric field present in the payload, walking
 *  through the known aliases. Lets us paper over Audiomack changing
 *  `followers` → `followers_count` (or vice versa) without code. */
function pickField(
  p: AudiomackArtistPayload,
  keys: Array<keyof AudiomackArtistPayload>
): unknown {
  for (const k of keys) {
    const v = p[k];
    if (v !== undefined && v !== null) return v;
  }
  return null;
}

const toInt = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
    return Math.floor(v);
  }
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return null;
};

/** Audiomack slug = lowercased artist name with non-alphanumeric → dash.
 *  This is the convention Audiomack itself uses when an artist signs up
 *  without a custom URL. Used as a fallback when an explicit handle
 *  hasn't been set on the artist row yet. */
export function audiomackSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function fetchAudiomack(
  handle: string | null,
  artistName: string,
  ctx: FetcherContext
): Promise<FetcherResult> {
  const slug = (handle && handle.trim()) || audiomackSlugFromName(artistName);
  if (!slug) {
    return emptyResult("audiomack_api", "Empty Audiomack slug");
  }

  let payload: AudiomackArtistPayload | null = null;
  try {
    const res = await fetch(`${AM_PAGE}/${encodeURIComponent(slug)}`, {
      headers: {
        // Mimic a browser; bare default fetch UA is sometimes 403'd
        // by Audiomack's anti-scraper layer.
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        accept: "text/html,application/xhtml+xml",
      },
      // Don't let a slow Audiomack response stall the whole cron.
      signal: AbortSignal.timeout(15_000),
    });

    if (res.status === 404) {
      return emptyResult(
        "audiomack_api",
        `Audiomack artist '${slug}' not found (404)`
      );
    }
    if (!res.ok) {
      return emptyResult(
        "audiomack_api",
        `Audiomack ${res.status} for slug '${slug}'`
      );
    }

    const html = await res.text();

    // Pull out the __NEXT_DATA__ script tag that Next.js embeds for
    // client-side hydration. Same data the rendered page sees, so it
    // includes followers / total_plays / supporters even if the page
    // doesn't visually display them.
    const m = html.match(
      /<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
    );
    if (!m) {
      return emptyResult(
        "audiomack_api",
        `Audiomack page for '${slug}' had no __NEXT_DATA__ block`
      );
    }

    let nextData: unknown;
    try {
      nextData = JSON.parse(m[1]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown JSON error";
      return emptyResult(
        "audiomack_api",
        `Audiomack __NEXT_DATA__ parse failed for '${slug}': ${msg}`
      );
    }

    // The artist object lives at props.pageProps.artist (Audiomack's
    // current shape). Defensive walk so a layout change downgrades
    // to a soft failure instead of a crash.
    const artist =
      nextData &&
      typeof nextData === "object" &&
      "props" in nextData &&
      (nextData as { props?: { pageProps?: { artist?: unknown } } }).props
        ?.pageProps?.artist;

    payload = (artist && typeof artist === "object"
      ? (artist as AudiomackArtistPayload)
      : null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Audiomack error";
    return emptyResult("audiomack_api", `Audiomack fetch failed: ${msg}`);
  }

  if (!payload) {
    return emptyResult("audiomack_api", `Audiomack empty payload for '${slug}'`);
  }

  const followers = toInt(pickField(payload, ["followers", "followers_count"]));
  const totalPlays = toInt(
    pickField(payload, ["total_plays", "total_plays_count", "plays_count"])
  );
  const supporters = toInt(
    pickField(payload, ["supporters", "supporters_count"])
  );

  const result: FetcherResult = {
    ok: true,
    source: "audiomack_api",
    metrics: {},
    internal: {},
    resolvedHandle: handle ? undefined : slug, // backfill if we resolved it
  };

  if (followers !== null) result.metrics.followers = followers;
  if (supporters !== null) result.metrics.supporters = supporters;

  if (totalPlays !== null) {
    // Always record the lifetime number for next-run delta math.
    result.internal._total_plays_lifetime = totalPlays;

    // Compute plays_28d if we have a previous lifetime snapshot at
    // least 21 days old. Window is wider than 28d on the low side
    // because nightly cron drift means "28 days ago" might be the
    // 27.9-day-old or 28.1-day-old snapshot, and we'd rather use a
    // slightly-shorter window than emit nothing.
    const prev = ctx.getPrevInternal("_total_plays_lifetime");
    if (prev) {
      const ageDays =
        (Date.now() - new Date(prev.snapshotAt).getTime()) /
        (1000 * 60 * 60 * 24);
      if (ageDays >= 21 && ageDays <= 35 && totalPlays >= prev.value) {
        result.metrics.plays_28d = totalPlays - prev.value;
      }
    }
  }

  // If we got nothing useful at all, mark the result as a soft
  // failure so the orchestrator logs it but doesn't write a junk
  // row.
  if (
    Object.keys(result.metrics).length === 0 &&
    Object.keys(result.internal).length === 0
  ) {
    return emptyResult(
      "audiomack_api",
      `Audiomack payload had no readable numbers for '${slug}'`
    );
  }

  return result;
}
