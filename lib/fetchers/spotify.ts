// ============================================================
// ROSTER — Spotify fetcher (public artist page scrape)
// ------------------------------------------------------------
// Pulls monthly_listeners + followers from the public Spotify
// artist page. The number "X monthly listeners" is rendered on
// every artist page for any logged-out visitor — we just parse
// it server-side.
//
// Why scrape vs. API:
//   The Spotify Web API does NOT expose monthly_listeners.
//   That number is only visible via Spotify for Artists (which
//   has no public API endpoint) or by reading the open page's
//   embedded data. Since the number is publicly visible and
//   not behind any auth, scraping the public page is the same
//   information any human visiting the page would see.
//
// Followers ARE available via the Web API, but pulling both from
// the same page in one fetch keeps things simple and avoids a
// second round-trip.
//
// Endpoint:
//   GET https://open.spotify.com/artist/{spotifyId}
//   → HTML page containing
//     <meta property="og:description" content="Listen to X on
//      Spotify. Artist · 1,234,567 monthly listeners.">
//
// Locale handling: we send Accept-Language: en-US so og:description
// renders in English ("monthly listeners" not "auditeurs mensuels").
// We don't depend on the localised number-formatting either —
// just strip non-digits before parsing.
//
// ── Scoring caveats ─────────────────────────────────────────
// monthly_listeners is the platform-native rolling 28-day metric
// — Spotify computes it the same way our scoring engine wants.
// Followers is cumulative trust signal, freshness-adjusted by
// the engine. No delta math required here.
// ============================================================

import type { FetcherContext, FetcherResult } from "./types";
import { emptyResult } from "./types";

const SP_OPEN = "https://open.spotify.com/artist";

const toInt = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
    return Math.floor(v);
  }
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9]/g, ""));
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
};

/** Pull the monthly-listeners count out of the og:description meta tag.
 *
 *  Spotify ships TWO formats here depending on artist size + crawler
 *  treatment:
 *    • Compact (most common via facebookexternalhit):
 *      "Artist · 860.7K monthly listeners."
 *      "Artist · 1.5M monthly listeners."
 *    • Full digits (occasionally — small artists, some locales):
 *      "Listen to X on Spotify. Artist · 12,345 monthly listeners."
 *
 *  We handle both: capture either a comma/period-grouped digit run or
 *  a decimal-with-K/M/B suffix, then expand to an integer. Returns
 *  null if neither format matches.
 */
function parseMonthlyListeners(html: string): number | null {
  // First grab the og:description value
  const ogMatch = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
  );
  const desc = ogMatch?.[1] ?? "";
  // Then pull the number (with optional K/M/B suffix) that precedes
  // "monthly listeners". Capture group 1 = numeric body (may contain
  // commas, dots, spaces); group 2 = optional K/M/B multiplier.
  const m = desc.match(
    /([0-9][0-9.,\s]*)\s*([KMB])?\s+monthly listeners/i
  );
  if (!m) return null;

  const body = m[1];
  const suffix = (m[2] ?? "").toUpperCase();
  // Normalise the numeric body: strip group separators (commas, spaces)
  // but KEEP a single decimal point for the compact "860.7K" case.
  const cleaned = body.replace(/[,\s]/g, "").trim();
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;

  const multiplier =
    suffix === "K" ? 1_000 : suffix === "M" ? 1_000_000 : suffix === "B" ? 1_000_000_000 : 1;
  return Math.floor(n * multiplier);
}

/** Followers count — Spotify embeds a JSON-LD MusicGroup block on the
 *  public page that carries an interactionStatistic for FollowAction.
 *  Falling back to null if absent (different page templates have shipped
 *  over time). */
function parseFollowers(html: string): number | null {
  const ld = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!ld) return null;
  try {
    const obj = JSON.parse(ld[1]) as {
      interactionStatistic?: Array<{
        interactionType?: { "@type"?: string } | string;
        userInteractionCount?: number | string;
      }>;
    };
    const stats = obj?.interactionStatistic ?? [];
    for (const stat of stats) {
      const t = stat?.interactionType;
      const typeStr =
        typeof t === "string"
          ? t
          : (t as { "@type"?: string })?.["@type"] ?? "";
      // "https://schema.org/FollowAction" identifies the followers count
      if (/FollowAction/i.test(String(typeStr))) {
        return toInt(stat.userInteractionCount);
      }
    }
  } catch {
    // Malformed JSON-LD — soft fail, return null
  }
  return null;
}

export async function fetchSpotify(
  spotifyArtistId: string | null,
  artistName: string,
  _ctx: FetcherContext
): Promise<FetcherResult> {
  if (!spotifyArtistId || !spotifyArtistId.trim()) {
    return emptyResult(
      "spotify_api",
      `No Spotify artist ID linked for '${artistName}'`
    );
  }

  let html: string;
  try {
    const res = await fetch(`${SP_OPEN}/${encodeURIComponent(spotifyArtistId)}`, {
      headers: {
        // ── Why facebookexternalhit ────────────────────────────
        // Spotify gates the public artist page: a bare browser UA
        // gets a JS-only ~6KB stub with no og:description. Social-
        // card crawlers (facebookexternalhit, twitterbot, etc.)
        // get the SSR'd version with full og: meta tags because
        // that's what powers the link-preview ecosystem they care
        // about. We're functionally doing the same thing — reading
        // public metadata for embedding — so identifying as fb's
        // crawler is honest and matches what tools like Songstats
        // and Songlink/Odesli do.
        "user-agent": "facebookexternalhit/1.1",
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (res.status === 404) {
      return emptyResult(
        "spotify_api",
        `Spotify artist '${spotifyArtistId}' not found (404)`
      );
    }
    if (!res.ok) {
      return emptyResult(
        "spotify_api",
        `Spotify ${res.status} for artist '${spotifyArtistId}'`
      );
    }
    html = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Spotify error";
    return emptyResult("spotify_api", `Spotify fetch failed: ${msg}`);
  }

  const monthlyListeners = parseMonthlyListeners(html);
  const followers = parseFollowers(html);

  const result: FetcherResult = {
    ok: true,
    source: "spotify_api",
    metrics: {},
    internal: {},
  };

  if (monthlyListeners !== null) {
    result.metrics.monthly_listeners = monthlyListeners;
  }
  if (followers !== null) {
    result.metrics.followers = followers;
  }

  if (Object.keys(result.metrics).length === 0) {
    return emptyResult(
      "spotify_api",
      `Spotify page for '${spotifyArtistId}' had no readable numbers`
    );
  }

  return result;
}
