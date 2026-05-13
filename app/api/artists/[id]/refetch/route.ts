// ============================================================
// ROSTER — /api/artists/[id]/refetch
// ------------------------------------------------------------
// On-demand re-pull of stats for a single artist. Same machinery
// the nightly cron uses (runFetchers) but scoped to one ID and
// auth'd by user session + ownership instead of the cron secret.
//
// Lives next to PATCH /api/artists/[id] so the Update Stats
// modal can fix a wrong YouTube channel ID and immediately
// re-pull without waiting for 03:00 UTC.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runFetchers } from "@/lib/fetchers";
import { logger } from "@/lib/logger";

// Single-artist refetches are quick (a couple HTTP calls each), but
// keep the same generous ceiling we use on the cron route in case
// Audiomack/YouTube sit on a slow socket.
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(
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

    // Ownership check — never let a logged-in user trigger a fetcher
    // run against an artist they don't own (would burn YouTube quota
    // on someone else's behalf).
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

    const startedAt = Date.now();
    const summaries = await runFetchers(admin, { artistIds: [id] });
    const summary = summaries[0];

    const metricsWritten = summary
      ? summary.results.reduce((c, r) => c + r.metricsWritten.length, 0)
      : 0;
    const failures = summary
      ? summary.results.filter((r) => !r.ok)
      : [];

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      metricsWritten,
      failures: failures.map((f) => ({
        platform: f.platform,
        error: f.error,
      })),
      summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[artists/refetch] Error", {}, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
