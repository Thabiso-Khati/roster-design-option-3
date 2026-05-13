export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — GET /api/spotify/search?q=...
// ------------------------------------------------------------
// Typeahead endpoint for the Add Artist flow. Resolves a free-
// text artist name to candidate Spotify artists so the user
// doesn't have to hunt for the share URL.
//
// Auth: requires the caller to be signed in AND to have linked
// Spotify (we use their personal user token so the response
// includes followers / popularity / images that Client
// Credentials strips for most dev apps).
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessTokenForUser } from "@/lib/spotify/oauth";
import { searchArtists } from "@/lib/spotify/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 8, 1), 20) : 8;

  if (!q) {
    return NextResponse.json({ artists: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 },
    );
  }

  let userToken: string;
  try {
    userToken = await getAccessTokenForUser(user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "SPOTIFY_NOT_CONNECTED") {
      return NextResponse.json(
        {
          error:
            "Connect your Spotify account in Settings → Integrations to search the catalogue.",
          code: "SPOTIFY_NOT_CONNECTED",
        },
        { status: 428 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const artists = await searchArtists(q, userToken, limit);
    return NextResponse.json({ artists });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
