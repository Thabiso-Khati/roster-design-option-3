// ============================================================
// ROSTER — /api/calendar/sync
// ------------------------------------------------------------
// POST — backfill existing bookings and release tasks into
//        calendar_events for the authenticated user.
//
// Called once from the calendar page on first load (if the user
// has bookings but no calendar events yet). Idempotent — safe
// to call multiple times.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { backfillCalendarForUser } from "@/lib/calendar/sync";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const result = await backfillCalendarForUser(user.id, supabase);

    logger.info("[calendar/sync] backfill triggered", { userId: user.id, ...result });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("[calendar/sync] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
