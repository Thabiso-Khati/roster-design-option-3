// ============================================================
// ROSTER — /api/artists/[id]/platform-metrics
// ------------------------------------------------------------
// PATCH — write one or more new metric snapshots for a single
// artist into the long-format `artist_platform_metrics` table.
//
// Request body shape:
//   {
//     "platform": "spotify",       // required, must be in registry
//     "source":   "manual",        // optional, defaults to manual
//     "metrics":  {                // required, at least one entry
//       "monthly_listeners": 1240000,
//       "streams":           18000000
//     }
//   }
//
// Each (metric, value) pair becomes ONE row in the table. The
// snapshot timestamp is set server-side so a slow client clock
// can't reorder snapshots. Empty/null values are skipped (so the
// modal can submit an entire platform tab with only the fields
// the user actually filled in).
//
// Why a separate route from /stats:
//   • The legacy /stats route writes the wide `artist_stats` row
//     (Spotify-only). It stays for backwards compat until that
//     table is fully retired.
//   • This route is generic — every platform/metric goes through
//     the same code path, validated against the registry.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidMetric } from "@/lib/scoring/platforms";
import type { MetricSource, Platform } from "@/lib/scoring/types";
import { logger } from "@/lib/logger";

const VALID_PLATFORMS = new Set<Platform>([
  "spotify",
  "youtube",
  "audiomack",
  "boomplay",
  "tiktok",
  "instagram",
  "mdundo",
  "deezer",
]);

const VALID_SOURCES = new Set<MetricSource>([
  "manual",
  "spotify_api",
  "spotify_oauth",
  "youtube_api",
  "audiomack_api",
  "tiktok_oauth",
  "tiktok_api",
  "instagram_api",
  "boomplay_api",
  "mdundo_api",
  "deezer_api",
]);

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
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { platform, source = "manual", metrics } = body ?? {};

    // ── Validate platform ─────────────────────────────────────
    if (typeof platform !== "string" || !VALID_PLATFORMS.has(platform as Platform)) {
      return NextResponse.json(
        {
          error: `Unknown platform '${platform}'. Expected one of: ${[...VALID_PLATFORMS].join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (typeof source !== "string" || !VALID_SOURCES.has(source as MetricSource)) {
      return NextResponse.json(
        { error: `Unknown source '${source}'.` },
        { status: 400 }
      );
    }

    // ── Validate + normalise the metrics map ──────────────────
    if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) {
      return NextResponse.json(
        { error: "Body must include a 'metrics' object." },
        { status: 400 }
      );
    }

    const toNonNegativeNumber = (v: unknown): number | null => {
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return null;
      // Counts can be huge — Math.floor (not parseInt) preserves precision
      // up to Number.MAX_SAFE_INTEGER (~9e15). Watch time + lifetime stream
      // counts could plausibly exceed an Int32, hence numeric in the DB.
      return Math.floor(v);
    };

    const rows: Array<{
      artist_id: string;
      platform: string;
      metric: string;
      value: number;
      source: string;
    }> = [];

    const skipped: string[] = [];

    for (const [metric, raw] of Object.entries(metrics as Record<string, unknown>)) {
      // Reject unknown metrics so a client typo doesn't silently
      // dump junk into the table the scoring engine never reads.
      if (!isValidMetric(platform, metric)) {
        return NextResponse.json(
          {
            error: `Unknown metric '${metric}' for platform '${platform}'.`,
          },
          { status: 400 }
        );
      }

      const value = toNonNegativeNumber(raw);
      if (value === null) {
        // Null or negative or NaN → skip silently. The modal sends
        // empty fields as null so the user can fill in only what
        // they have — that shouldn't be an error.
        skipped.push(metric);
        continue;
      }

      rows.push({
        artist_id: id,
        platform,
        metric,
        value,
        source,
      });
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: "No valid metric values provided.",
          skipped,
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ── Verify ownership ──────────────────────────────────────
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

    // ── Insert all rows in one shot ───────────────────────────
    const { data: inserted, error: insertError } = await admin
      .from("artist_platform_metrics")
      .insert(rows)
      .select("platform, metric, value, snapshot_at, source");

    if (insertError) {
      logger.error("[artists/platform-metrics PATCH] Insert error", {}, insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      inserted: inserted ?? [],
      skipped,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[artists/platform-metrics PATCH] Error", {}, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
