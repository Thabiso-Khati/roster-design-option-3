export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/artists/[id]
// ------------------------------------------------------------
// DELETE a single artist (only if owned by the current user)
// PATCH  audiomack_handle / youtube_channel_id — the platform
//        identifiers the nightly fetcher uses to look an artist
//        up. Lets the user override a wrong auto-resolved
//        channel without touching the DB directly.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Reuse the same ownership check pattern the DELETE handler uses.
 *  Returns the artist row on success, or a 4xx NextResponse the caller
 *  should return as-is. */
async function loadOwnedArtist(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      ),
    };
  }

  const admin = createAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!artist) {
    return {
      response: NextResponse.json(
        { error: "Artist not found" },
        { status: 404 }
      ),
    };
  }
  if (artist.user_id !== user.id) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { admin, userId: user.id, artistId: id };
}

/** Light shape-checker: handles must be either a non-empty string
 *  (which we'll trim) or null/undefined (intentional clear). */
function cleanHandle(v: unknown): string | null | undefined {
  if (v === null) return null;
  if (v === undefined) return undefined;
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const owned = await loadOwnedArtist(id);
    if ("response" in owned) return owned.response;
    const { admin } = owned;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const audiomackHandle = cleanHandle(b.audiomack_handle);
    const youtubeChannelId = cleanHandle(b.youtube_channel_id);

    // Build the UPDATE payload only with fields the caller actually
    // sent (undefined = "leave it alone", null = "clear it").
    const update: Record<string, string | null> = {};
    if (audiomackHandle !== undefined) update.audiomack_handle = audiomackHandle;
    if (youtubeChannelId !== undefined) update.youtube_channel_id = youtubeChannelId;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No supported fields in request body" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await admin
      .from("artists")
      .update(update)
      .eq("id", id)
      .select("id, name, audiomack_handle, youtube_channel_id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, artist: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify ownership before deleting
    const { data: artist } = await admin
      .from("artists")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    if (artist.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await admin.from("artists").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
