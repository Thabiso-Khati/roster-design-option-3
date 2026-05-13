// ============================================================
// ROSTER — POST /api/tiktok/disconnect
// Body: { artistId: string }
// ------------------------------------------------------------
// Revokes the TikTok access token (best-effort) then deletes
// the artist_tiktok_tokens row and clears the denormalised
// tiktok_open_id / tiktok_display_name columns on the artist.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revokeAccessToken } from "@/lib/tiktok/oauth";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const artistId = body?.artistId as string | undefined;

  if (!artistId) {
    return NextResponse.json({ error: "artistId is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify ownership
  const { data: artist } = await admin
    .from("artists")
    .select("id, user_id")
    .eq("id", artistId)
    .maybeSingle();

  if (!artist || artist.user_id !== user.id) {
    return NextResponse.json({ error: "Artist not found or forbidden" }, { status: 403 });
  }

  // Fetch the current access_token for revocation
  const { data: tokenRow } = await admin
    .from("artist_tiktok_tokens")
    .select("access_token")
    .eq("artist_id", artistId)
    .maybeSingle();

  // Best-effort revoke — errors are swallowed inside revokeAccessToken
  if (tokenRow?.access_token) {
    await revokeAccessToken(tokenRow.access_token);
  }

  // Delete the token row
  const { error: deleteError } = await admin
    .from("artist_tiktok_tokens")
    .delete()
    .eq("artist_id", artistId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Clear denormalised columns
  await admin
    .from("artists")
    .update({ tiktok_open_id: null, tiktok_display_name: null })
    .eq("id", artistId);

  return NextResponse.json({ ok: true });
}
