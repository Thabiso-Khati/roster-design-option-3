/**
 * GET /api/artists/[id]/score-history
 * ─────────────────────────────────────
 * Returns a weekly time-series of ROSTER scores (Reach, Momentum,
 * Engagement) computed from the artist's existing metric snapshots.
 *
 * Algorithm:
 *   1. Fetch all artist_platform_metrics rows for this artist (from admin client).
 *   2. Group snapshot dates into ISO-week buckets ("2025-W14").
 *   3. For each week bucket, filter snapshots to only include rows on or before
 *      that week's end date — simulating "what would the score have been at
 *      the end of that week?" This means Momentum can be computed from
 *      two weeks of data.
 *   4. Run scoreArtist() for each week bucket.
 *   5. Return the last 12 weeks so the chart never gets cluttered.
 *
 * No new migration needed — uses the existing artist_platform_metrics table.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { scoreArtist } from "@/lib/scoring";
import type { MetricSnapshot, Platform } from "@/lib/scoring/types";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 30;

// ─── ISO week helpers ─────────────────────────────────────────────────────────

/** Returns "YYYY-Www" for any Date */
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Day 4 of any week is always in the right year for ISO weeks
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Returns the ISO Monday (start of week) for a "YYYY-Www" key */
function weekStart(key: string): Date {
  const [year, weekPart] = key.split("-W");
  const y = parseInt(year, 10);
  const w = parseInt(weekPart, 10);
  // Jan 4 is always in week 1 — work backwards to Monday of that week, then forwards
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4.getTime() - (dayOfWeek - 1) * 86_400_000);
  return new Date(week1Monday.getTime() + (w - 1) * 7 * 86_400_000);
}

/** End-of-week (Sunday 23:59:59 UTC) for a "YYYY-Www" key */
function weekEnd(key: string): Date {
  const start = weekStart(key);
  return new Date(start.getTime() + 6 * 86_400_000 + 86_399_000);
}

/** Short display label: "Apr 7" */
function shortLabel(key: string): string {
  const d = weekStart(key);
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "UTC" });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: artistId } = await params;

    const ctx = await getWorkspaceContext();
    if (!ctx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify this artist belongs to the authenticated user
    const { data: artist, error: artistErr } = await admin
      .from("artists")
      .select("id, country, user_id")
      .eq("id", artistId)
      .eq("user_id", ctx.ownerId)
      .single();

    if (artistErr || !artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Fetch all platform-metric rows for this artist
    const { data: metrics, error: metricsErr } = await admin
      .from("artist_platform_metrics")
      .select("platform, metric, value, snapshot_at")
      .eq("artist_id", artistId)
      .order("snapshot_at", { ascending: true });

    if (metricsErr) {
      logger.error("[score-history] metrics fetch error", {}, metricsErr);
      return NextResponse.json({ error: metricsErr.message }, { status: 500 });
    }

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({ history: [] });
    }

    // Convert to typed MetricSnapshot[]
    // `source` is required in the type but only used for trust-weighting
    // in future — safe to default to "manual" when the DB row lacks it.
    const allSnapshots: MetricSnapshot[] = metrics.map((m) => ({
      platform: m.platform as Platform,
      metric: m.metric,
      value: typeof m.value === "string" ? Number(m.value) : (m.value as number),
      snapshotAt: m.snapshot_at,
      source: ((m as Record<string, unknown>).source ?? "manual") as MetricSnapshot["source"],
    }));

    // Collect all unique weeks represented in the data
    const weekSet = new Set<string>();
    for (const s of allSnapshots) {
      weekSet.add(isoWeekKey(new Date(s.snapshotAt)));
    }
    const sortedWeeks = Array.from(weekSet).sort();

    // Take the last 12 weeks to keep the chart readable
    const recentWeeks = sortedWeeks.slice(-12);

    // For each week: score using snapshots up to and including that week's end
    const history = recentWeeks.map((weekKey) => {
      const cutoff = weekEnd(weekKey);
      const windowSnapshots = allSnapshots.filter(
        (s) => new Date(s.snapshotAt) <= cutoff
      );

      const scores = scoreArtist(windowSnapshots, {
        primaryCountry: artist.country ?? undefined,
      });

      return {
        week: shortLabel(weekKey),
        reach: scores.coverage.reachSignals > 0 ? scores.reach : null,
        momentum: scores.coverage.momentumSignals > 0 ? scores.momentum : null,
        engagement: scores.coverage.engagementSignals > 0 ? scores.engagement : null,
      };
    });

    return NextResponse.json({ history });
  } catch (err: unknown) {
    logger.error("[score-history] unexpected error", {}, err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
