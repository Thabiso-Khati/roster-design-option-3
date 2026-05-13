export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — GET /api/spotify/auth
// ------------------------------------------------------------
// Kick off the Spotify OAuth flow for the signed-in user.
// - Generates a random `state` string and stores it in a short-
//   lived httpOnly cookie.
// - Redirects the browser to Spotify's consent page.
// - After user approves, Spotify redirects back to /callback.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl } from "@/lib/spotify/oauth";
import crypto from "node:crypto";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/sign-in", process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const authUrl = buildAuthUrl(state);

  const res = NextResponse.redirect(authUrl);
  // httpOnly cookie — we'll verify this on the callback
  res.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  return res;
}
