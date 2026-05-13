// ============================================================
// ROSTER — /api/artists/[id]/stats
// ------------------------------------------------------------
// PATCH — write a new artist_stats snapshot for a specific
// artist. Used by the inline "edit stats" pencil in the widget
// to update any of the user-editable numbers without having to
// delete and re-add the artist.
//
// Editable fields:
//   • followers                 — public Spotify number, usually
//                                 pulled on sync but override-able
//                                 for plans where Spotify strips it
//   • popularity                — 0–100 index; editable so users
//                                 can paste it in from the Spotify
//                                 artist page without OAuth
//   • monthlyListeners          — public Spotify number on the
//                                 artist page, not in the public API
//   • monthlyActiveListeners    — Spotify for Artists "MAL"
//   • newActiveListeners        — Spotify for Artists "NAL"
//   • superListeners            — Spotify for Artists "Super Listeners"
//
// Any field the caller omits (or sends as null/undefined) is
// carried forward from the most recent snapshot so we don't
// accidentally zero out a number the user didn't mean to change.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export async function PATCH(
  req: NextRequest,
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

    const {
      followers,
      popularity,
      monthlyListeners,
      monthlyActiveListeners,
      newActiveListeners,
      superListeners,
    } = await req.json();

    const toPositiveInt = (n: unknown): number | null =>
      typeof n === "number" && Number.isFinite(n) && n >= 0
        ? Math.floor(n)
        : null;

    // Popularity is capped at 100 by Spotify's scale; clamp on write
    // so junk input can't break the UI.
    const toPopularity = (n: unknown): number | null => {
      const v = toPositiveInt(n);
      if (v === null) return null;
      return Math.min(v, 100);
    };

    const nextFollowers = toPositiveInt(followers);
    const nextPopularity = toPopularity(popularity);
    const nextMonthlyListeners = toPositiveInt(monthlyListeners);
    const nextMAL = toPositiveInt(monthlyActiveListeners);
    const nextNAL = toPositiveInt(newActiveListeners);
    const nextSuper = toPositiveInt(superListeners);

    // At least one field must be supplied
    const allNull = [
      nextFollowers,
      nextPopularity,
      nextMonthlyListeners,
      nextMAL,
      nextNAL,
      nextSuper,
    ].every((v) => v === null);

    if (allNull) {
      return NextResponse.json(
        {
          error:
            "Provide at least one of: followers, popularity, monthlyListeners, monthlyActiveListeners, newActiveListeners, superListeners",
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify ownership
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

    // Carry forward any field the caller didn't update by reading the
    // most recent snapshot. This is a per-snapshot fallback for the
    // "required" columns (followers, popularity); for the nullable
    // metric columns we fall back to the most recent *non-null* value
    // so a sparse update doesn't clobber a real number that was set
    // earlier. That mirrors the `latestOf()` logic in the GET shaper.
    const { data: recent } = await admin
      .from("artist_stats")
      .select(
        `
        followers, popularity, monthly_listeners,
        monthly_active_listeners, new_active_listeners, super_listeners,
        snapshot_at
      `
      )
      .eq("artist_id", id)
      .order("snapshot_at", { ascending: false })
      .limit(25);

    const latestOf = (key: string): number | null => {
      const row = (recent ?? []).find(
        (r) => (r as Record<string, unknown>)[key] != null
      );
      const v = row ? (row as Record<string, unknown>)[key] : null;
      return typeof v === "number" ? v : null;
    };

    const latest = recent?.[0];

    const row = {
      artist_id: id,
      followers: nextFollowers ?? latest?.followers ?? 0,
      popularity: nextPopularity ?? latest?.popularity ?? 0,
      monthly_listeners:
        nextMonthlyListeners ?? latestOf("monthly_listeners"),
      monthly_active_listeners:
        nextMAL ?? latestOf("monthly_active_listeners"),
      new_active_listeners:
        nextNAL ?? latestOf("new_active_listeners"),
      super_listeners: nextSuper ?? latestOf("super_listeners"),
    };

    const { error: insertError } = await admin
      .from("artist_stats")
      .insert(row);

    if (insertError) {
      logger.error("[artists/stats PATCH] Insert error", {}, insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      stats: {
        followers: row.followers,
        popularity: row.popularity,
        monthlyListeners: row.monthly_listeners,
        monthlyActiveListeners: row.monthly_active_listeners,
        newActiveListeners: row.new_active_listeners,
        superListeners: row.super_listeners,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[artists/stats PATCH] Error", {}, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
