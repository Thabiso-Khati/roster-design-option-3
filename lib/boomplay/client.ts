// ============================================================
// ROSTER — Boomplay API client
// ------------------------------------------------------------
// Server-side helper for reading public artist data from the
// Boomplay Music platform using the Boomplay Partner API
// (OAuth 2.0, Client Credentials flow).
//
// Boomplay is the largest music streaming platform in Africa
// with 100M+ registered users, dominant in Nigeria, Ghana,
// Kenya, Tanzania, and across sub-Saharan Africa.
//
// API credentials (apply at https://developer.boomplay.com):
//   BOOMPLAY_CLIENT_ID      — OAuth 2.0 client ID
//   BOOMPLAY_CLIENT_SECRET  — OAuth 2.0 client secret
//
// NEVER import this from a client component. Client secret
// must stay server-side only.
//
// NOTE: Boomplay's partner API requires approval.
// Apply at https://developer.boomplay.com or contact
// developer@boomplay.com. While approval is pending,
// the module loads normally but all calls throw a helpful
// "credentials not configured" error rather than crashing.
// ============================================================

export interface BoomplayArtist {
  id: string;           // Boomplay numeric artist ID
  name: string;
  followers: number;
  monthlyStreams: number; // Streams in the past 30 days
  totalStreams: number;   // All-time streams
  imageUrl: string | null;
  externalUrl: string;   // boomplay.com/artists/{id}
  genres: string[];
  verified: boolean;
  country: string | null; // Primary market country
}

// ── Credentials ──────────────────────────────────────────────

function getClientCreds(): { id: string; secret: string } {
  const id     = process.env.BOOMPLAY_CLIENT_ID;
  const secret = process.env.BOOMPLAY_CLIENT_SECRET;

  if (!id || !secret) {
    throw new Error(
      "Boomplay credentials missing: BOOMPLAY_CLIENT_ID and " +
      "BOOMPLAY_CLIENT_SECRET must be set in .env.local\n" +
      "Apply for API access at https://developer.boomplay.com"
    );
  }
  return { id, secret };
}

// ── Token cache ──────────────────────────────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null;

interface BoomplayTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const { id, secret } = getClientCreds();
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");

  const res = await fetch("https://api.boomplay.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Boomplay token fetch failed (${res.status}): ${body}`);
  }

  const json: BoomplayTokenResponse = await res.json();
  cachedToken = {
    value:     json.access_token,
    expiresAt: Date.now() + json.expires_in * 1_000,
  };
  return json.access_token;
}

// ── Low-level fetch ──────────────────────────────────────────

const BASE_URL = "https://api.boomplay.com/v1";

async function apiFetch<T>(
  path: string,
  queryParams: Record<string, string> = {},
): Promise<T> {
  const token = await getAccessToken();

  const qs = Object.keys(queryParams).length > 0
    ? `?${new URLSearchParams(queryParams).toString()}`
    : "";

  const res = await fetch(`${BASE_URL}${path}${qs}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-Boomplay-Market": "NG", // Default to Nigeria; can be overridden
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Boomplay API error (${res.status}) on ${path}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── URL / ID parsing ─────────────────────────────────────────

/**
 * Extract a Boomplay artist ID from any of these user-pasted forms:
 *   https://www.boomplay.com/artists/12345       → "12345"
 *   boomplay.com/artists/12345                   → "12345"
 *   12345                                         → "12345"  (raw numeric ID)
 *
 * Returns null if input is empty or can't be parsed.
 */
export function parseBoomplayArtistId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // URL form: boomplay.com/artists/{id}
  const urlMatch = trimmed.match(/boomplay\.com\/artists\/(\d+)/);
  if (urlMatch) return urlMatch[1];

  // Raw numeric ID
  if (/^\d+$/.test(trimmed)) return trimmed;

  return null;
}

// ── Internal response types ──────────────────────────────────

interface BoomplayArtistResult {
  artistId?: string | number;
  artistName?: string;
  name?: string;
  followCount?: number | string;
  monthlyStreamCount?: number | string;
  totalStreamCount?: number | string;
  coverImgUrl?: string;
  bigImgUrl?: string;
  genre?: string;
  genres?: string[];
  isVerify?: boolean | number;
  country?: string;
}

function normaliseArtist(r: BoomplayArtistResult, fallbackId = ""): BoomplayArtist {
  const id        = String(r.artistId ?? fallbackId);
  const name      = r.artistName ?? r.name ?? id;
  const followers = parseNum(r.followCount);
  const monthly   = parseNum(r.monthlyStreamCount);
  const total     = parseNum(r.totalStreamCount);

  const imageUrl  = r.bigImgUrl ?? r.coverImgUrl ?? null;
  const genres: string[] = Array.isArray(r.genres)
    ? r.genres
    : r.genre ? [r.genre] : [];

  return {
    id,
    name,
    followers,
    monthlyStreams: monthly,
    totalStreams:   total,
    imageUrl,
    externalUrl: `https://www.boomplay.com/artists/${id}`,
    genres,
    verified: !!r.isVerify,
    country: r.country ?? null,
  };
}

function parseNum(v: number | string | undefined): number {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "string" ? parseInt(v, 10) : v;
  return isNaN(n) ? 0 : n;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Fetch an artist's public profile and stream counts by Boomplay artist ID.
 * Throws "Boomplay artist not found: {id}" if the ID doesn't exist.
 *
 * Get an artist's ID from their Boomplay profile URL:
 *   https://www.boomplay.com/artists/12345 → ID is 12345
 */
export async function getBoomplayArtist(artistId: string): Promise<BoomplayArtist> {
  const data = await apiFetch<{
    data?: BoomplayArtistResult;
    code?: number;
    message?: string;
  }>(`/artists/${encodeURIComponent(artistId)}`);

  if (!data.data) {
    throw new Error(`Boomplay artist not found: ${artistId}`);
  }

  return normaliseArtist(data.data, artistId);
}

/**
 * Search Boomplay artists by name.
 * Returns up to `limit` candidates (max 20).
 * Used by the typeahead in the Add Artist modal.
 */
export async function searchBoomplayArtists(
  query: string,
  limit = 8,
): Promise<BoomplayArtist[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cappedLimit = Math.min(Math.max(limit, 1), 20);

  const data = await apiFetch<{
    data?: { artists?: BoomplayArtistResult[] };
    code?: number;
  }>("/search", {
    keyword: trimmed,
    types:   "artist",
    limit:   String(cappedLimit),
  });

  return (data.data?.artists ?? [])
    .map(r => normaliseArtist(r))
    .filter(a => a.id !== "");
}

/**
 * Fetch monthly stream counts for multiple artist IDs in one call.
 * Boomplay supports batching up to 50 IDs.
 * Used by the nightly cron to refresh metrics efficiently.
 */
export async function getBoomplayArtistsBatch(
  artistIds: string[],
): Promise<BoomplayArtist[]> {
  if (artistIds.length === 0) return [];
  if (artistIds.length > 50) {
    throw new Error("getBoomplayArtistsBatch supports max 50 IDs per call");
  }

  const data = await apiFetch<{
    data?: { artists?: BoomplayArtistResult[] };
    code?: number;
  }>("/artists", {
    ids: artistIds.join(","),
  });

  return (data.data?.artists ?? []).map(r => normaliseArtist(r));
}

/**
 * Human-readable primary genre from a Boomplay artist's genre list.
 */
export function primaryBoomplayGenre(genres: string[]): string {
  if (!genres || genres.length === 0) return "Unknown";
  return genres[0]
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
