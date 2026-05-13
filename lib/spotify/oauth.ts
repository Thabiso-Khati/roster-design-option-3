// ============================================================
// ROSTER — Spotify OAuth helpers (Authorization Code flow)
// ------------------------------------------------------------
// Each ROSTER user links their own Spotify account. We store the
// resulting access + refresh tokens in public.spotify_tokens and
// refresh them transparently when they expire.
//
// Why user tokens instead of Client Credentials?
// Because Spotify's Client Credentials response now strips
// followers / popularity / genres for most new apps. User tokens
// get the full payload.
// ============================================================

import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

// The minimum scope that guarantees us a usable user token.
// We don't need anything privileged — even an empty string works —
// but this keeps the consent screen honest about what's happening.
export const SPOTIFY_SCOPES = "user-read-email user-read-private";

function getRedirectUri(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL must be set in .env.local");
  }
  return `${appUrl}/api/spotify/callback`;
}

function getClientCreds(): { id: string; secret: string } {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error(
      "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env.local"
    );
  }
  return { id, secret };
}

/**
 * Build the Spotify consent URL. `state` is a random string we
 * generate per auth attempt and verify on the callback to defend
 * against CSRF.
 */
export function buildAuthUrl(state: string): string {
  const { id } = getClientCreds();
  const params = new URLSearchParams({
    client_id: id,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SPOTIFY_SCOPES,
    state,
    show_dialog: "false",
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

/**
 * Exchange the `code` returned by Spotify for a real access + refresh
 * token pair. Called once, on the OAuth callback.
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<SpotifyTokenResponse> {
  const { id, secret } = getClientCreds();
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
    }).toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify token exchange failed (${res.status}): ${body}`);
  }

  return (await res.json()) as SpotifyTokenResponse;
}

/**
 * Refresh an expired access token using the stored refresh token.
 * Note: Spotify MAY return a new refresh_token in the response; if
 * it does we store it, otherwise we keep the old one.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<SpotifyTokenResponse> {
  const { id, secret } = getClientCreds();
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify token refresh failed (${res.status}): ${body}`);
  }

  return (await res.json()) as SpotifyTokenResponse;
}

/**
 * Fetch the currently-authenticated Spotify user's profile — we
 * use this on the callback to display "Connected as <name>" in
 * Settings.
 */
export async function fetchSpotifyMe(
  accessToken: string
): Promise<{ id: string; displayName: string }> {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify /me fetch failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return {
    id: data.id,
    displayName: data.display_name ?? data.id,
  };
}

/**
 * Return a valid access token for `userId`, refreshing it if it's
 * within 60s of expiring. Throws if the user hasn't connected
 * Spotify yet — callers should handle that with a clear error to
 * prompt the user to link.
 */
export async function getAccessTokenForUser(userId: string): Promise<string> {
  const admin = createAdminClient();

  const { data: row, error } = await admin
    .from("spotify_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load Spotify token: ${error.message}`);
  }
  if (!row) {
    throw new Error("SPOTIFY_NOT_CONNECTED");
  }

  const expiresAt = new Date(row.expires_at).getTime();
  const now = Date.now();

  if (now < expiresAt - 60_000) {
    return row.access_token;
  }

  // Refresh
  const refreshed = await refreshAccessToken(row.refresh_token);
  const newExpiresAt = new Date(now + refreshed.expires_in * 1000).toISOString();

  const update: {
    access_token: string;
    expires_at: string;
    updated_at: string;
    refresh_token?: string;
  } = {
    access_token: refreshed.access_token,
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString(),
  };
  if (refreshed.refresh_token) {
    update.refresh_token = refreshed.refresh_token;
  }

  const { error: updateError } = await admin
    .from("spotify_tokens")
    .update(update)
    .eq("user_id", userId);

  if (updateError) {
    logger.error("[spotify oauth] refresh store failed", {}, updateError);
  }

  return refreshed.access_token;
}
