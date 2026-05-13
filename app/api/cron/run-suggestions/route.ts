/**
 * GET /api/cron/run-suggestions
 * ─────────────────────────────
 * Nightly cron that:
 *   1. Wakes any snoozed suggestions whose timer has elapsed (status → "open").
 *   2. Runs the Tier B Proactive Suggestion engine (4 rule categories).
 *
 * Both passes are idempotent — safe to invoke multiple times in a day.
 */
import { NextRequest, NextResponse } from "next/server";
import { runSuggestionEngine } from "@/lib/suggestions/engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected = process.env.CRON_SECRET;
  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Pass 1 — wake snoozed nudges whose timer has elapsed
    const admin = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data: woken, error: wakeErr } = await admin
      .from("proactive_suggestions")
      .update({ status: "open", snoozed_until: null })
      .eq("status", "snoozed")
      .lte("snoozed_until", nowIso)
      .select("id");

    if (wakeErr) {
      logger.error("[cron/run-suggestions] snooze-wake pass failed", {}, wakeErr);
    }

    // Pass 2 — evaluate fresh rule outputs
    const summary = await runSuggestionEngine();

    return NextResponse.json({
      ok: true,
      woken: woken?.length ?? 0,
      ...summary,
      ranAt: new Date().toISOString(),
    });
  } catch (e) {
    logger.error("[cron/run-suggestions] unhandled error", {}, e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
