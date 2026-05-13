/**
 * GET /api/cron/detect-anomalies
 * ──────────────────────────────
 * Nightly cron job that runs the anomaly detector across all users.
 * Triggered by Vercel Cron (or any external scheduler).
 *
 * Authentication: requires CRON_SECRET header to match env var,
 * matching the existing /api/cron/fetch-stats pattern.
 */
import { NextRequest, NextResponse } from "next/server";
import { runAnomalyDetection } from "@/lib/anomaly/detector";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min cap

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected = process.env.CRON_SECRET;
  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runAnomalyDetection();
    return NextResponse.json({
      ok: true,
      ...summary,
      ranAt: new Date().toISOString(),
    });
  } catch (e) {
    logger.error("[cron/detect-anomalies] unhandled error", {}, e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
