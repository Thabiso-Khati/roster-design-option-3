// ============================================================
// ROSTER — GET /api/tiktok/callback
// ------------------------------------------------------------
// TikTok redirects here after the user approves/denies consent.
//   1. Verify state cookie matches query param (CSRF guard).
//   2. Decode artistId from state.
//   3. Verify the signed-in user owns that artist.
//   4. Exchange code → tokens.
//   5. Upsert into artist_tiktok_tokens + backfill artist columns.
//   6. Redirect to the artist's settings page.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  exchangeCodeForTokens,
  decodeState,
  TIKTOK_STATE_COOKIE,
} from "@/lib/tiktok/oauth";
import { logger } from "@/lib/logger";

function artistUrl(artistId: string, flag: string) {
  return new URL(
    `/dashboard/artists/${artistId}?tiktok=${flag}`,
    process.env.NEXT_PUBLIC_APP_URL
  );
}

export async function GET(req: NextRequest) {
  try {
    const url    = new URL(req.url);
    const code   = url.searchParams.get("code");
    const state  = url.searchParams.get("state");
    const errParam = url.searchParams.get("error");

    // User denied consent
    if (errParam) {
      logger.error("[tiktok/callback] TikTok error param", {}, errParam);
      // We don't know artistId yet, redirect to artists list
      return NextResponse.redirect(
        new URL("/dashboard/artists?tiktok=denied", process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/artists?tiktok=error", process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    // CSRF check
    const cookieState = req.cookies.get(TIKTOK_STATE_COOKIE)?.value;
    if (!cookieState || cookieState !== state) {
      logger.error("[tiktok/callback] State mismatch");
      return NextResponse.redirect(
        new URL("/dashboard/artists?tiktok=state_mismatch", process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    // Decode state → artistId
    const { artistId } = decodeState(state);

    // Must be signed in
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    // Verify ownership
    const admin = createAdminClient();
    const { data: artist } = await admin
      .from("artists")
      .select("id, user_id")
      .eq("id", artistId)
      .maybeSingle();

    if (!artist || artist.user_id !== user.id) {
      logger.error("[tiktok/callback] Artist ownership mismatch", {}, {
        artistId,
        userId: user.id,
      });
      return NextResponse.redirect(artistUrl(artistId, "forbidden"));
    }

    // Exchange code → tokens
    const tokens = await exchangeCodeForTokens(code);

    const now              = Date.now();
    const expiresAt        = new Date(now + tokens.expires_in * 1000).toISOString();
    const refreshExpiresAt = new Date(now + tokens.refresh_expires_in * 1000).toISOString();

    // Upsert artist_tiktok_tokens
    const { error: upsertError } = await admin
      .from("artist_tiktok_tokens")
      .upsert(
        {
          artist_id:           artistId,
          open_id:             tokens.open_id,
          union_id:            tokens.union_id ?? null,
          scope:               tokens.scope,
          access_token:        tokens.access_token,
          refresh_token:       tokens.refresh_token,
          expires_at:          expiresAt,
          refresh_expires_at:  refreshExpiresAt,
          updated_at:          new Date().toISOString(),
        },
        { onConflict: "artist_id" }
      );

    if (upsertError) {
      logger.error("[tiktok/callback] DB upsert error", {}, upsertError);
      return NextResponse.redirect(artistUrl(artistId, "db_error"));
    }

    // Backfill denormalised columns on artists so the fetcher
    // orchestrator can skip the join when checking eligibility.
    await admin
      .from("artists")
      .update({
        tiktok_open_id: tokens.open_id,
        // display_name refreshed on first fetch
      })
      .eq("id", artistId);

    const res = NextResponse.redirect(artistUrl(artistId, "connected"));
    res.cookies.delete(TIKTOK_STATE_COOKIE);
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    logger.error("[tiktok/callback] Error", {}, msg);
    return NextResponse.redirect(
      new URL("/dashboard/artists?tiktok=error", process.env.NEXT_PUBLIC_APP_URL)
    );
  }
}
