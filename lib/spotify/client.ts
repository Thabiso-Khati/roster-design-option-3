// ============================================================
// ROSTER — Spotify Web API client
// ------------------------------------------------------------
// Server-side helper for talking to the public Spotify API using
// the Client Credentials flow (no user OAuth needed — we only
// read public catalogue data: artist name, image, followers,
// genres, popularity, releases).
//
// NEVER import this from a client component. It uses
// SPOTIFY_CLIENT_SECRET which must stay server-side.
// ============================================================

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  followers: number;
  popularity: number;      // 0–100
  genres: string[];
  imageUrl: string | null; // highest-res available
  externalUrl: string;     // open.spotify.com link
}

// In-memory token cache. Spotify app-level tokens last 1hr.
// Serverless cold starts will reset this — that's fine, token
// endpoint is free and fast.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Spotify client missing config: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env.local"
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    // No cache — always fetch fresh on miss
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify token fetch failed (${res.status}): ${body}`);
  }

  const json: SpotifyToken = await res.json();
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

/**
 * Extract a Spotify artist ID from any of these user-pasted forms:
 *   - open.spotify.com/artist/4k8bYkLjRzt...
 *   - https://open.spotify.com/artist/4k8bYkLjRzt...?si=...
 *   - spotify:artist:4k8bYkLjRzt...
 *   - raw ID: 4k8bYkLjRzt...
 * Returns null if nothing valid found.
 */
export function parseSpotifyArtistId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Spotify IDs are 22-char base62 strings
  const idPattern = /[a-zA-Z0-9]{22}/;

  // URI form
  const uriMatch = trimmed.match(/^spotify:artist:([a-zA-Z0-9]{22})$/);
  if (uriMatch) return uriMatch[1];

  // URL form
  const urlMatch = trimmed.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?artist\/([a-zA-Z0-9]{22})/);
  if (urlMatch) return urlMatch[1];

  // Bare ID
  if (idPattern.test(trimmed) && trimmed.length === 22) return trimmed;

  return null;
}

/**
 * Fetch one artist. Pass `userAccessToken` to use the caller's
 * Spotify user token (returns full followers + popularity + genres).
 * Omit to fall back to the app-level Client Credentials token
 * (returns a truncated payload in most dev apps — kept only as a
 * legacy fallback).
 */
export async function getArtist(
  artistId: string,
  userAccessToken?: string
): Promise<SpotifyArtist> {
  const token = userAccessToken ?? (await getAccessToken());

  const url = `https://api.spotify.com/v1/artists/${artistId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    // No cache — we want fresh data every sync to catch zeros / bad responses
    cache: "no-store",
  });

  if (res.status === 404) {
    throw new Error(`Spotify artist not found: ${artistId}`);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify artist fetch failed (${res.status}): ${body}`);
  }

  const data = await res.json();

  // DIAGNOSTIC — silent in prod (logger.debug is suppressed unless LOG_LEVEL=debug).
  // Switch to logger.info temporarily if you need to inspect live Spotify responses.

  // Pick the highest-resolution image available
  const images = (data.images ?? []) as { url: string; height: number }[];
  const bestImage = images.length > 0
    ? images.reduce((a, b) => (a.height > b.height ? a : b)).url
    : null;

  return {
    id: data.id,
    name: data.name,
    followers: data.followers?.total ?? 0,
    popularity: data.popularity ?? 0,
    genres: data.genres ?? [],
    imageUrl: bestImage,
    externalUrl: data.external_urls?.spotify ?? `https://open.spotify.com/artist/${data.id}`,
  };
}

/**
 * Search Spotify's artist catalogue by free-text query and return
 * the top N candidates. Used by the typeahead in the Add Artist
 * modal so the user can type "De Mthuda" instead of hunting down
 * the Spotify URL.
 *
 * Pass the caller's `userAccessToken` so we get full payloads
 * (followers, popularity, genres). The Client Credentials fallback
 * still works but Spotify strips most of the useful fields.
 */
export async function searchArtists(
  query: string,
  userAccessToken: string,
  limit = 8,
): Promise<SpotifyArtist[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cappedLimit = Math.min(Math.max(limit, 1), 20);
  const params = new URLSearchParams({
    q: trimmed,
    type: "artist",
    limit: String(cappedLimit),
  });

  const res = await fetch(
    `https://api.spotify.com/v1/search?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${userAccessToken}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify search failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const items = (data.artists?.items ?? []) as Array<{
    id: string;
    name: string;
    followers?: { total?: number };
    popularity?: number;
    genres?: string[];
    images?: { url: string; height: number }[];
    external_urls?: { spotify?: string };
  }>;

  return items.map(a => {
    const images = a.images ?? [];
    const bestImage =
      images.length > 0
        ? images.reduce((x, y) => (x.height > y.height ? x : y)).url
        : null;
    return {
      id: a.id,
      name: a.name,
      followers: a.followers?.total ?? 0,
      popularity: a.popularity ?? 0,
      genres: a.genres ?? [],
      imageUrl: bestImage,
      externalUrl:
        a.external_urls?.spotify ?? `https://open.spotify.com/artist/${a.id}`,
    };
  });
}

/**
 * Fetch multiple artists in one call (up to 50). Used by the
 * cron to refresh follower counts for every artist on the
 * platform without burning rate limits.
 */
export async function getArtists(artistIds: string[]): Promise<SpotifyArtist[]> {
  if (artistIds.length === 0) return [];
  if (artistIds.length > 50) {
    throw new Error("getArtists supports max 50 IDs per call");
  }

  const token = await getAccessToken();
  const res = await fetch(
    `https://api.spotify.com/v1/artists?ids=${artistIds.join(",")}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify artists batch fetch failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return (data.artists ?? []).map((a: {
    id: string;
    name: string;
    followers?: { total?: number };
    popularity?: number;
    genres?: string[];
    images?: { url: string; height: number }[];
    external_urls?: { spotify?: string };
  }) => {
    const images = a.images ?? [];
    const bestImage = images.length > 0
      ? images.reduce((x, y) => (x.height > y.height ? x : y)).url
      : null;
    return {
      id: a.id,
      name: a.name,
      followers: a.followers?.total ?? 0,
      popularity: a.popularity ?? 0,
      genres: a.genres ?? [],
      imageUrl: bestImage,
      externalUrl: a.external_urls?.spotify ?? `https://open.spotify.com/artist/${a.id}`,
    };
  });
}

/**
 * Human-friendly "genre → bucket" mapper so we can show a clean
 * primary genre in the widget instead of Spotify's hyper-specific
 * tags ("gqom", "afro house", "gengetone"). Falls back to the
 * first tag, title-cased.
 */
export function primaryGenre(genres: string[]): string {
  if (!genres || genres.length === 0) return "Unknown";
  const first = genres[0];
  return first
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
