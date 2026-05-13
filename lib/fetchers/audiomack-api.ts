// ============================================================
// ROSTER — Audiomack official API client (SCAFFOLD)
// ------------------------------------------------------------
// Wraps Audiomack's official API at https://api.audiomack.com/v1
// using OAuth 1.0a request signing.
//
// COEXISTS with lib/fetchers/audiomack.ts (the public-page
// scraper). The scraper continues to work without credentials;
// this API client kicks in once OAuth consumer keys are
// approved, giving us:
//   • Real-time charts
//   • Genre-specific trending
//   • Artist feed / repost data
//   • Reliable metrics (no scraping fragility)
//
// Status: STUB — needs OAuth consumer credentials.
//
// ── Application path ──────────────────────────────────────
// 1. Email api@audiomack.com OR check audiomack.com/developers
// 2. Provide:
//      • JO:LA LABS company registration
//      • Brief on ROSTER
//      • List of artists currently managed
//      • Expected API call volume (start small)
// 3. Approval typically 2–6 weeks — Audiomack is selective
// 4. Receive `oauth_consumer_key` + `oauth_consumer_secret`
// 5. Add to .env.local:
//      AUDIOMACK_CONSUMER_KEY=...
//      AUDIOMACK_CONSUMER_SECRET=...
//
// ── Auth model ─────────────────────────────────────────────
// OAuth 1.0a (NOT OAuth 2.0). Each request must be signed with
// HMAC-SHA1, including:
//   • oauth_consumer_key
//   • oauth_nonce (random per-request)
//   • oauth_signature_method = "HMAC-SHA1"
//   • oauth_timestamp (epoch seconds)
//   • oauth_version = "1.0"
//   • oauth_signature (computed)
//
// For "two-legged" auth (server-to-server, no user token),
// signature base string = HTTP_METHOD + & + URL + & + sorted_params
// signing key = consumer_secret + "&"
//
// For "three-legged" auth (user-authorized for actions like
// favoriting), we need an oauth_token + oauth_token_secret
// per user — that's a separate flow we'll add later if needed.
//
// ── Reference ──────────────────────────────────────────────
// • Audiomack PDF: in /Users/thabiso/.../uploads/Audiomack API.pdf
// • OAuth 1.0a spec: https://oauth.net/core/1.0a/
// • Endpoints: see PDF "Endpoints" section
// ============================================================

import crypto from "crypto";
import type { FetcherResult } from "./types";
import { logger } from "@/lib/logger";

// ── Config ─────────────────────────────────────────────────
const AUDIOMACK_BASE_URL = "https://api.audiomack.com/v1";

function getCredentials(): { consumerKey: string; consumerSecret: string } | null {
  const consumerKey = process.env.AUDIOMACK_CONSUMER_KEY;
  const consumerSecret = process.env.AUDIOMACK_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) return null;
  return { consumerKey, consumerSecret };
}

// ── OAuth 1.0a signing ─────────────────────────────────────
function rfc3986Encode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Sign a request using OAuth 1.0a (two-legged — no user token).
 * Returns an Authorization header value to attach to the fetch.
 */
function signRequest(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  oauthToken?: string,
  oauthTokenSecret?: string,
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
    ...(oauthToken ? { oauth_token: oauthToken } : {}),
  };

  // Combine query params + oauth params for signature base string
  const allParams: Record<string, string> = { ...params, ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map((k) => `${rfc3986Encode(k)}=${rfc3986Encode(allParams[k])}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    rfc3986Encode(url),
    rfc3986Encode(paramString),
  ].join("&");

  const signingKey = `${rfc3986Encode(consumerSecret)}&${rfc3986Encode(oauthTokenSecret || "")}`;

  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  oauthParams.oauth_signature = signature;

  // Build OAuth Authorization header
  const oauthHeader = Object.keys(oauthParams)
    .map((k) => `${rfc3986Encode(k)}="${rfc3986Encode(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${oauthHeader}`;
}

// ── Generic signed-fetch helper ────────────────────────────
async function signedFetch(
  method: string,
  path: string,
  queryParams: Record<string, string> = {},
): Promise<unknown | null> {
  const creds = getCredentials();
  if (!creds) {
    logger.warn("[audiomack-api] credentials not configured — set AUDIOMACK_CONSUMER_KEY + AUDIOMACK_CONSUMER_SECRET");
    return null;
  }

  const url = `${AUDIOMACK_BASE_URL}${path}`;
  const queryString = new URLSearchParams(queryParams).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  const authHeader = signRequest(
    method,
    url,
    queryParams,
    creds.consumerKey,
    creds.consumerSecret,
  );

  try {
    const res = await fetch(fullUrl, {
      method,
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      logger.error(`[audiomack-api] ${method} ${path} failed`, { status: res.status, body: await res.text() });
      return null;
    }

    return await res.json();
  } catch (e) {
    logger.error(`[audiomack-api] ${method} ${path} error`, {}, e);
    return null;
  }
}

// ── Endpoints ──────────────────────────────────────────────
/**
 * Get artist info + uploads + metrics.
 * @param slug - Audiomack artist slug (URL-style, e.g. "burna-boy")
 */
export async function getArtistInfo(slug: string): Promise<unknown | null> {
  return signedFetch("GET", `/artist/${slug}`);
}

export async function getArtistUploads(slug: string, limit = 50): Promise<unknown | null> {
  return signedFetch("GET", `/artist/${slug}/uploads`, { limit: String(limit) });
}

export async function getArtistMetrics(slug: string): Promise<unknown | null> {
  return signedFetch("GET", `/artist/${slug}/metrics`);
}

export async function getArtistFollowers(slug: string): Promise<unknown | null> {
  return signedFetch("GET", `/artist/${slug}/followers`);
}

export async function getMostRecent(genre?: string): Promise<unknown | null> {
  const path = genre ? `/music/recent/genre/${genre}` : `/music/recent`;
  return signedFetch("GET", path);
}

export async function getTrending(genre?: string): Promise<unknown | null> {
  const path = genre ? `/music/trending/genre/${genre}` : `/music/trending`;
  return signedFetch("GET", path);
}

export async function getChartTracks(period: "weekly" | "daily" | "monthly" = "weekly", genre?: string): Promise<unknown | null> {
  const path = genre ? `/chart/songs/${period}/genre/${genre}` : `/chart/songs/${period}`;
  return signedFetch("GET", path);
}

export async function searchSongs(query: string, limit = 20): Promise<unknown | null> {
  return signedFetch("GET", `/music/search`, { q: query, limit: String(limit) });
}

// ── Public fetcher (FetcherResult shape) ───────────────────
export async function fetchAudiomackArtistViaApi(slug: string): Promise<FetcherResult> {
  const info = await getArtistInfo(slug);
  if (!info || typeof info !== "object") {
    return {
      ok: false,
      source: "audiomack" as FetcherResult["source"],
      metrics: {},
      internal: {},
      error: "Audiomack API credentials not configured or artist not found",
    };
  }

  const artist = (info as { results?: { artist?: Record<string, unknown> } }).results?.artist;
  if (!artist) {
    return {
      ok: false,
      source: "audiomack" as FetcherResult["source"],
      metrics: {},
      internal: {},
      error: "Artist not found in Audiomack API response",
    };
  }

  const totalPlays = Number(artist.total_plays ?? 0);
  return {
    ok: true,
    source: "audiomack" as FetcherResult["source"],
    metrics: {
      audiomack_followers: Number(artist.followers ?? 0),
      audiomack_plays_lifetime: totalPlays,
    },
    internal: {
      _total_plays_lifetime: totalPlays,
    },
  };
}
