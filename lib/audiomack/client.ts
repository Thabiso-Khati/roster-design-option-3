// ============================================================
// ROSTER — Audiomack API client
// ------------------------------------------------------------
// Server-side helper for reading public artist data from the
// Audiomack API using OAuth 1.0a (two-legged — no user token
// needed for public read endpoints).
//
// Audiomack is a top platform for West African artists, with
// strong penetration in Nigeria, Ghana, Tanzania, and the
// diaspora market.
//
// API credentials:
//   AUDIOMACK_CONSUMER_KEY     — from developer.audiomack.com
//   AUDIOMACK_CONSUMER_SECRET  — from developer.audiomack.com
//
// NEVER import this from a client component. Consumer secret
// must stay server-side only.
// ============================================================

import { createHmac } from "node:crypto";

export interface AudiomackArtist {
  id: string;             // URL slug (e.g. "rema", "burna-boy")
  urlSlug: string;
  name: string;
  followers: number;
  verifiedPlays: number;  // Lifetime verified plays (Audiomack's key metric)
  monthlyListeners: number; // 0 — Audiomack doesn't expose this publicly
  imageUrl: string | null;
  externalUrl: string;    // audiomack.com/{slug}
  genres: string[];
  verified: boolean;
}

// ── Credentials ──────────────────────────────────────────────

function getClientCreds(): { key: string; secret: string } {
  const key    = process.env.AUDIOMACK_CONSUMER_KEY;
  const secret = process.env.AUDIOMACK_CONSUMER_SECRET;

  if (!key || !secret) {
    throw new Error(
      "Audiomack credentials missing: AUDIOMACK_CONSUMER_KEY and " +
      "AUDIOMACK_CONSUMER_SECRET must be set in .env.local\n" +
      "Get your keys at https://developer.audiomack.com"
    );
  }
  return { key, secret };
}

// ── OAuth 1.0a helper ────────────────────────────────────────

/**
 * Build a signed OAuth 1.0a Authorization header.
 * Audiomack uses HMAC-SHA1, two-legged (consumer credentials only).
 */
function buildOAuthHeader(
  method: string,
  url: string,
  queryParams: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp:        Math.floor(Date.now() / 1_000).toString(),
    oauth_version:          "1.0",
  };

  // Merge all params and sort for signature base string
  const allParams = { ...queryParams, ...oauthParams };
  const normalised = Object.keys(allParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(normalised),
  ].join("&");

  // No user token secret for two-legged flow → trailing "&"
  const signingKey = `${encodeURIComponent(consumerSecret)}&`;
  const sig = createHmac("sha1", signingKey).update(baseString).digest("base64");

  oauthParams.oauth_signature = sig;

  return (
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
      .join(", ")
  );
}

// ── Low-level fetch ──────────────────────────────────────────

const BASE_URL = "https://api.audiomack.com/v1";

async function apiFetch<T>(
  path: string,
  queryParams: Record<string, string> = {},
): Promise<T> {
  const { key, secret } = getClientCreds();
  const url = `${BASE_URL}${path}`;
  const authHeader = buildOAuthHeader("GET", url, queryParams, key, secret);

  const qs = Object.keys(queryParams).length > 0
    ? `?${new URLSearchParams(queryParams).toString()}`
    : "";

  const res = await fetch(`${url}${qs}`, {
    headers: {
      Authorization: authHeader,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Audiomack API error (${res.status}) on ${path}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── URL / slug parsing ───────────────────────────────────────

/**
 * Extract an Audiomack artist slug from any of these user-pasted forms:
 *   https://audiomack.com/rema           → "rema"
 *   https://audiomack.com/burna-boy      → "burna-boy"
 *   audiomack.com/rema                   → "rema"
 *   rema                                 → "rema"  (raw slug)
 *
 * Returns null if input is empty or can't be parsed.
 */
export function parseAudiomackSlug(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // URL form: audiomack.com/{slug}
  const urlMatch = trimmed.match(/audiomack\.com\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1].toLowerCase();

  // Bare slug: only alphanumeric, hyphens, underscores
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed.toLowerCase();

  return null;
}

// ── Internal response types ──────────────────────────────────

interface AudiomackUserResult {
  url_slug?: string;
  name?: string;
  follows?: number | string;
  plays?: number | string;
  image?: string;
  genre?: string;
  genres?: string[];
  verified?: boolean | number;
}

function normaliseArtist(r: AudiomackUserResult, fallbackSlug = ""): AudiomackArtist {
  const followers = typeof r.follows === "string" ? parseInt(r.follows, 10) : (r.follows ?? 0);
  const plays     = typeof r.plays === "string"   ? parseInt(r.plays, 10)   : (r.plays ?? 0);

  // Audiomack may return either `genre` (string) or `genres` (array)
  const genres: string[] = Array.isArray(r.genres)
    ? r.genres
    : r.genre ? [r.genre] : [];

  const slug = r.url_slug ?? fallbackSlug;

  return {
    id:               slug,
    urlSlug:          slug,
    name:             r.name ?? slug,
    followers:        isNaN(followers) ? 0 : followers,
    verifiedPlays:    isNaN(plays) ? 0 : plays,
    monthlyListeners: 0, // Not exposed in Audiomack's public API
    imageUrl:         r.image ?? null,
    externalUrl:      `https://audiomack.com/${slug}`,
    genres,
    verified:         !!r.verified,
  };
}

// ── Public API ───────────────────────────────────────────────

/**
 * Fetch an artist's public profile and stats by URL slug.
 * Throws "Audiomack artist not found: {slug}" on 404-equivalent responses.
 *
 * Example slugs: "rema", "burna-boy", "wizkid", "diamond-platnumz"
 */
export async function getAudiomackArtist(slug: string): Promise<AudiomackArtist> {
  const data = await apiFetch<{
    results?: AudiomackUserResult;
    error_message?: string;
    status?: string;
  }>(`/user/${encodeURIComponent(slug)}`);

  if (!data.results || data.status === "Error") {
    throw new Error(`Audiomack artist not found: ${slug}`);
  }

  return normaliseArtist(data.results, slug);
}

/**
 * Search Audiomack's catalogue by free-text name query.
 * Returns up to `limit` artist candidates (max 20).
 * Used by the typeahead in the Add Artist modal.
 */
export async function searchAudiomackArtists(
  query: string,
  limit = 8,
): Promise<AudiomackArtist[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cappedLimit = Math.min(Math.max(limit, 1), 20);

  const data = await apiFetch<{
    results?: AudiomackUserResult[];
    error_message?: string;
  }>("/search", {
    q:           trimmed,
    limit:       String(cappedLimit),
    object_type: "user",
  });

  return (data.results ?? [])
    .map(r => normaliseArtist(r))
    .filter(a => a.id !== "");
}

/**
 * Human-readable primary genre from an Audiomack artist's genre list.
 * Falls back to "Unknown" for empty arrays.
 */
export function primaryAudiomackGenre(genres: string[]): string {
  if (!genres || genres.length === 0) return "Unknown";
  return genres[0]
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
