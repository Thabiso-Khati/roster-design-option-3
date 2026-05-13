// ============================================================
// ROSTER — /api/artists/sync
// ------------------------------------------------------------
// Refresh follower counts for every artist belonging to the
// current user (manual trigger for now; later: daily cron).
//
// Batches 50 artists per Spotify call for efficiency.
// Writes a new row into artist_stats so the widget can compute
// growth trend over time.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getArtist } from "@/lib/spotify/client";
import { getAccessTokenForUser } from "@/lib/spotify/oauth";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Resolve the user's Spotify token up-front so we fail fast
    // with a clear "connect Spotify" signal to the UI.
    let userToken: string;
    try {
      userToken = await getAccessTokenForUser(user.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg === "SPOTIFY_NOT_CONNECTED") {
        return NextResponse.json(
          {
            error:
              "Connect your Spotify account in Settings before syncing.",
            code: "SPOTIFY_NOT_CONNECTED",
          },
          { status: 428 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const admin = createAdminClient();

    const { data: artists, error } = await admin
      .from("artists")
      .select("id, spotify_artist_id")
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!artists || artists.length === 0) {
      return NextResponse.json({ synced: 0 });
    }

    // NOTE: Spotify's batch endpoint /v1/artists?ids=... has been
    // returning 403 Forbidden for Client Credentials tokens in some
    // markets — likely a regional gate. The single-artist endpoint
    // works fine, so we fall back to per-artist calls in parallel.
    // For a roster of <100 artists this is still sub-second.
    let synced = 0;
    const failed: string[] = [];

    const results = await Promise.allSettled(
      artists
        .filter((a) => a.spotify_artist_id)
        .map(async (a) => {
          const fetched = await getArtist(a.spotify_artist_id!, userToken);
          return { dbId: a.id, fetched };
        })
    );

    // Read the most recent non-null monthly_listeners per artist so
    // we can carry it forward when we insert a fresh sync row. This
    // keeps the vanity number alive even if the user hasn't edited
    // it this week.
    const { data: latestStats } = await admin
      .from("artist_stats")
      .select("artist_id, monthly_listeners, snapshot_at")
      .in(
        "artist_id",
        artists.map((a) => a.id)
      )
      .order("snapshot_at", { ascending: false });

    const lastMonthlyListenersByArtist: Record<string, number | null> = {};
    for (const s of latestStats ?? []) {
      if (
        !(s.artist_id in lastMonthlyListenersByArtist) &&
        s.monthly_listeners != null
      ) {
        lastMonthlyListenersByArtist[s.artist_id] = s.monthly_listeners;
      }
    }

    const rows: {
      artist_id: string;
      followers: number;
      popularity: number;
      monthly_listeners: number | null;
    }[] = [];

    const artistUpdates: {
      id: string;
      image_url: string | null;
      popularity: number;
    }[] = [];

    // Track how many artists actually got a fresh follower count
    // vs. how many came back with Spotify's stripped Dev-Mode
    // payload (0 followers). We don't want to overwrite real
    // numbers — manually entered or previously synced — with zeros.
    let skippedStripped = 0;

    for (const r of results) {
      if (r.status === "fulfilled") {
        const { dbId, fetched } = r.value;

        if (fetched.followers > 0) {
          rows.push({
            artist_id: dbId,
            followers: fetched.followers,
            popularity: fetched.popularity,
            monthly_listeners:
              lastMonthlyListenersByArtist[dbId] ?? null,
          });
          synced += 1;
        } else {
          // Stripped payload — still refresh the avatar and popularity
          // (if present), but DON'T insert a zeroed stats row that
          // would clobber the manual number.
          skippedStripped += 1;
        }

        artistUpdates.push({
          id: dbId,
          image_url: fetched.imageUrl,
          popularity: fetched.popularity,
        });
      } else {
        logger.error("[artists/sync] Artist fetch failed", {}, r.reason);
        failed.push(String(r.reason));
      }
    }

    if (rows.length > 0) {
      const { error: insertError } = await admin
        .from("artist_stats")
        .insert(rows);
      if (insertError) {
        logger.error("[artists/sync] Insert error", {}, insertError);
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }

      // Refresh avatar + popularity on artist rows
      for (const u of artistUpdates) {
        await admin
          .from("artists")
          .update({ image_url: u.image_url, popularity: u.popularity })
          .eq("id", u.id);
      }
    }

    return NextResponse.json({
      synced,
      failed: failed.length,
      skippedStripped,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[artists/sync] Error", {}, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
