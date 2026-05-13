export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/cron/prune-conversations
// ------------------------------------------------------------
// Daily cleanup of AI conversations idle for >14 days.
// Calls the prune_old_ai_conversations() Postgres function
// (defined in migration 022) which deletes conversations +
// cascades to messages.
//
// Auth:
//   Header  x-cron-secret: $CRON_SECRET
//   Vercel  authorization: Bearer $CRON_SECRET   (Vercel cron)
//
// Scheduled in vercel.json — runs nightly at 04:00 UTC
// (just after the stats/anomaly/suggestion runs complete).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export const maxDuration = 60;
export const runtime = "nodejs";

function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerSecret = req.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;
  const auth = req.headers.get("authorization");
  if (auth && auth === `Bearer ${secret}`) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    const { data, error } = await admin.rpc("prune_old_ai_conversations");

    if (error) {
      logger.error("[cron/prune-conversations] RPC error", {}, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const deletedCount = typeof data === "number" ? data : 0;
    logger.info("[cron/prune-conversations] Pruned conversations", { deletedCount });

    return NextResponse.json({
      ok: true,
      deletedConversations: deletedCount,
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("[cron/prune-conversations] Fatal error", {}, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
