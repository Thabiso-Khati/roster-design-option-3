export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/cron/fetch-stats
// ------------------------------------------------------------
// Nightly auto-pull endpoint. Runs the Audiomack + YouTube
// fetchers across every artist in the database and writes the
// results to artist_platform_metrics. Hit by the scheduled
// task at ~03:00 local each night.
//
// Auth:
//   Header  x-cron-secret: $CRON_SECRET
//   Vercel  authorization: Bearer $CRON_SECRET   (Vercel cron)
//
// Both are accepted so the same route works for the local
// scheduled task (curl with x-cron-secret) and a Vercel
// Cron job. Returns a per-artist summary so a manual run
// from the dashboard can show what landed.
//
// Body (optional, POST):
//   { "artistIds": ["uuid", "uuid"] }
//   → only refresh those artists. Used by the "refresh now"
//     button on a single artist row.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runFetchers } from "@/lib/fetchers";
import { logger } from "@/lib/logger";

// Allow up to 5 min — refreshing a few hundred artists serially
// can outrun the default 10s edge timeout.
export const maxDuration = 300;
export const runtime = "nodejs";

function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed
  const headerSecret = req.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;
  const auth = req.headers.get("authorization");
  if (auth && auth === `Bearer ${secret}`) return true;
  return false;
}

async function handle(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let artistIds: string[] | undefined;
  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (Array.isArray(body?.artistIds)) {
        artistIds = body.artistIds.filter(
          (x: unknown): x is string => typeof x === "string" && x.length > 0
        );
      }
    } catch {
      // Empty body on POST is fine — falls through to "all artists".
    }
  }

  const startedAt = Date.now();
  const admin = createAdminClient();

  try {
    const summaries = await runFetchers(admin, { artistIds });
    const totalMetricsWritten = summaries.reduce(
      (sum, s) =>
        sum + s.results.reduce((c, r) => c + r.metricsWritten.length, 0),
      0
    );
    const failures = summaries.reduce(
      (sum, s) => sum + s.results.filter((r) => !r.ok).length,
      0
    );

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      artistsProcessed: summaries.length,
      metricsWritten: totalMetricsWritten,
      failures,
      summaries,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[cron/fetch-stats] Error", {}, message);
    return NextResponse.json(
      { ok: false, error: message, durationMs: Date.now() - startedAt },
      { status: 500 }
    );
  }
}

// Vercel Cron uses GET; manual / on-demand calls use POST with
// an optional artistIds array. Same handler, different verbs.
export const GET = handle;
export const POST = handle;
