export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — GET /api/spotify/status
// Tells the Settings UI whether the user has linked Spotify.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("spotify_tokens")
    .select("spotify_display_name, spotify_user_id, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    connected: !!data,
    displayName: data?.spotify_display_name ?? null,
    spotifyUserId: data?.spotify_user_id ?? null,
    connectedAt: data?.created_at ?? null,
  });
}
