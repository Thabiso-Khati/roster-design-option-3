// ============================================================
// ROSTER — GET /api/tiktok/connect?artistId=<uuid>
// ------------------------------------------------------------
// Kicks off TikTok OAuth for a specific artist.
//   1. Verify the signed-in user owns the artist.
//   2. Generate a CSRF nonce + encode { artistId, csrfNonce }
//      into the OAuth state parameter.
//   3. Store the raw state in a short-lived httpOnly cookie.
//   4. Redirect to TikTok's consent screen.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAuthUrl, encodeState, TIKTOK_STATE_COOKIE } from "@/lib/tiktok/oauth";
import crypto from "node:crypto";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  const artistId = req.nextUrl.searchParams.get("artistId");
  if (!artistId) {
    return NextResponse.json({ error: "artistId is required" }, { status: 400 });
  }

  // Verify ownership — only the workspace owner may connect
  const admin = createAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id, user_id")
    .eq("id", artistId)
    .maybeSingle();

  if (!artist || artist.user_id !== user.id) {
    return NextResponse.json({ error: "Artist not found or forbidden" }, { status: 403 });
  }

  const csrfNonce = crypto.randomBytes(16).toString("hex");
  const state     = encodeState({ artistId, csrfNonce });
  const authUrl   = buildAuthUrl(state);

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(TIKTOK_STATE_COOKIE, state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   600, // 10 minutes
    path:     "/",
  });
  return res;
}
