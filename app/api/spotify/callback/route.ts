export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — GET /api/spotify/callback
// ------------------------------------------------------------
// Spotify redirects here after the user approves/denies consent.
// - Verifies state cookie to block CSRF
// - Exchanges auth code for access + refresh tokens
// - Fetches the Spotify /me profile to show a friendly name
// - Upserts into public.spotify_tokens
// - Redirects back to /dashboard/settings with a success/error flag
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeCodeForTokens, fetchSpotifyMe } from "@/lib/spotify/oauth";
import { logger } from "@/lib/logger";

const settingsUrl = (flag: string) =>
  new URL(`/dashboard/settings?spotify=${flag}`, process.env.NEXT_PUBLIC_APP_URL);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // User denied consent or Spotify returned an error
    if (error) {
      logger.error("[spotify/callback] Spotify error param", {}, error);
      return NextResponse.redirect(settingsUrl("denied"));
    }

    if (!code || !state) {
      return NextResponse.redirect(settingsUrl("error"));
    }

    // CSRF check
    const cookieState = req.cookies.get("spotify_oauth_state")?.value;
    if (!cookieState || cookieState !== state) {
      logger.error("[spotify/callback] State mismatch");
      return NextResponse.redirect(settingsUrl("state_mismatch"));
    }

    // Must be signed in
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/sign-in", process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    // Exchange code → tokens
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      logger.error("[spotify/callback] No refresh_token in response");
      return NextResponse.redirect(settingsUrl("no_refresh"));
    }

    // Fetch profile for display name
    const me = await fetchSpotifyMe(tokens.access_token);

    // Upsert (user_id is primary key)
    const admin = createAdminClient();
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    const { error: upsertError } = await admin
      .from("spotify_tokens")
      .upsert(
        {
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          scope: tokens.scope,
          spotify_user_id: me.id,
          spotify_display_name: me.displayName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      logger.error("[spotify/callback] DB upsert error", {}, upsertError);
      return NextResponse.redirect(settingsUrl("db_error"));
    }

    const res = NextResponse.redirect(settingsUrl("connected"));
    res.cookies.delete("spotify_oauth_state");
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    logger.error("[spotify/callback] Error", {}, msg);
    return NextResponse.redirect(settingsUrl("error"));
  }
}
