// ============================================================
// ROSTER — TikTok OAuth helpers (Authorization Code flow v2)
// ------------------------------------------------------------
// Each ROSTER artist connects their own TikTok account via
// TikTok's Content Posting API v2. Tokens are stored per-artist
// in public.artist_tiktok_tokens (migration 033).
//
// Key differences from Spotify:
//   - Token is per-ARTIST, not per-user
//   - State encodes { artistId, csrfNonce } so the callback
//     knows which artist row to update
//   - Two expiry timestamps: access_token (~24 h) and
//     refresh_token (~1 year)
//   - TikTok uses client_key / client_secret (not client_id)
//
// Env vars required:
//   TIKTOK_CLIENT_KEY     — from TikTok Developer portal
//   TIKTOK_CLIENT_SECRET  — from TikTok Developer portal
//   NEXT_PUBLIC_APP_URL   — e.g. https://rosterapp.ai
// ============================================================

import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

// ── Scopes ───────────────────────────────────────────────────
export const TIKTOK_SCOPES =
  "user.info.basic,user.info.profile,user.info.stats,video.list";

// ── Endpoints ────────────────────────────────────────────────
const AUTH_URL   = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL  = "https://open.tiktokapis.com/v2/oauth/token/";
const REVOKE_URL = "https://open.tiktokapis.com/v2/oauth/revoke/";

// ── Cookie name ───────────────────────────────────────────────
export const TIKTOK_STATE_COOKIE = "roster_tiktok_state";

// ── Internal helpers ──────────────────────────────────────────
function getRedirectUri(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL must be set in .env.local");
  }
  return `${appUrl}/api/tiktok/callback`;
}

function getClientCreds(): { key: string; secret: string } {
  const key    = process.env.TIKTOK_CLIENT_KEY;
  const secret = process.env.TIKTOK_CLIENT_SECRET;
  if (!key || !secret) {
    throw new Error(
      "TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET must be set in .env.local"
    );
  }
  return { key, secret };
}

// ── State encoding ────────────────────────────────────────────
export interface TikTokStatePayload {
  artistId:  string;
  csrfNonce: string;
}

export function encodeState(payload: TikTokStatePayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeState(raw: string): TikTokStatePayload {
  try {
    return JSON.parse(
      Buffer.from(raw, "base64url").toString("utf-8")
    ) as TikTokStatePayload;
  } catch {
    throw new Error("TikTok OAuth state is malformed");
  }
}

// ── Auth URL builder ──────────────────────────────────────────
/**
 * Returns the TikTok consent-page URL. The caller should store
 * the raw `state` string in a short-lived httpOnly cookie so the
 * callback can verify it.
 */
export function buildAuthUrl(state: string): string {
  const { key } = getClientCreds();
  const params = new URLSearchParams({
    client_key:    key,
    scope:         TIKTOK_SCOPES,
    response_type: "code",
    redirect_uri:  getRedirectUri(),
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

// ── Token response shape ──────────────────────────────────────
export interface TikTokTokenResponse {
  open_id:             string;
  union_id?:           string;
  scope:               string;
  access_token:        string;
  expires_in:          number;   // seconds (~86400)
  refresh_token:       string;
  refresh_expires_in:  number;   // seconds (~31536000)
  token_type:          string;
}

// ── Code exchange ─────────────────────────────────────────────
/**
 * Exchange the `code` from the OAuth callback for an access +
 * refresh token pair. Called once per artist connect.
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<TikTokTokenResponse> {
  const { key, secret } = getClientCreds();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key:    key,
      client_secret: secret,
      code,
      grant_type:    "authorization_code",
      redirect_uri:  getRedirectUri(),
    }).toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TikTok token exchange failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  // TikTok wraps the response in data.data on some SDK versions;
  // handle both shapes.
  const data =
    json?.data ?? json;
  if (!data?.access_token) {
    throw new Error(`TikTok token exchange: unexpected response shape: ${JSON.stringify(json)}`);
  }
  return data as TikTokTokenResponse;
}

// ── Refresh ───────────────────────────────────────────────────
/**
 * Refresh an expired access token using the stored refresh token.
 * TikTok does NOT rotate the refresh token on refresh — the same
 * refresh token stays valid until refresh_expires_in elapses.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TikTokTokenResponse> {
  const { key, secret } = getClientCreds();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key:    key,
      client_secret: secret,
      grant_type:    "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TikTok token refresh failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  const data = json?.data ?? json;
  if (!data?.access_token) {
    throw new Error(`TikTok token refresh: unexpected response shape`);
  }
  return data as TikTokTokenResponse;
}

// ── Revoke ────────────────────────────────────────────────────
/**
 * Revoke a TikTok access token. Best-effort — call this before
 * deleting the DB row on disconnect. Errors are logged but not
 * re-thrown so the DB delete still proceeds.
 */
export async function revokeAccessToken(accessToken: string): Promise<void> {
  const { key, secret } = getClientCreds();
  try {
    await fetch(REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key:    key,
        client_secret: secret,
        token:         accessToken,
      }).toString(),
      cache: "no-store",
    });
  } catch (e) {
    logger.error("[tiktok oauth] revoke failed (non-fatal)", {}, e);
  }
}

// ── Token retrieval for fetcher ───────────────────────────────
/**
 * Return a valid access token for `artistId`, refreshing
 * transparently if the token expires within 60 s.
 * Throws "TIKTOK_NOT_CONNECTED" if the artist hasn't linked TikTok.
 */
export async function getAccessTokenForArtist(
  artistId: string
): Promise<string> {
  const admin = createAdminClient();

  const { data: row, error } = await admin
    .from("artist_tiktok_tokens")
    .select("access_token, refresh_token, expires_at, refresh_expires_at")
    .eq("artist_id", artistId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load TikTok token: ${error.message}`);
  if (!row)  throw new Error("TIKTOK_NOT_CONNECTED");

  const now              = Date.now();
  const expiresAt        = new Date(row.expires_at).getTime();
  const refreshExpiresAt = new Date(row.refresh_expires_at).getTime();

  // Refresh token itself has expired → user must reconnect
  if (now >= refreshExpiresAt) {
    throw new Error("TIKTOK_REFRESH_EXPIRED");
  }

  // Access token still valid
  if (now < expiresAt - 60_000) {
    return row.access_token;
  }

  // Refresh
  const refreshed    = await refreshAccessToken(row.refresh_token);
  const newExpiresAt = new Date(now + refreshed.expires_in * 1000).toISOString();

  const { error: updateErr } = await admin
    .from("artist_tiktok_tokens")
    .update({
      access_token: refreshed.access_token,
      expires_at:   newExpiresAt,
      updated_at:   new Date().toISOString(),
    })
    .eq("artist_id", artistId);

  if (updateErr) {
    logger.error("[tiktok oauth] refresh store failed", {}, updateErr);
  }

  return refreshed.access_token;
}
