// ============================================================
// ROSTER — /api/calendar/availability/month
// ------------------------------------------------------------
// GET — return which dates in a given month have at least one
//       available booking slot for a given slug.
//
// Query params:
//   slug  — the booking link slug
//   year  — 4-digit year   e.g. 2026
//   month — 1-based month  e.g. 5 (May)
//
// Returns:
//   { availableDates: ["2026-05-12", "2026-05-14", ...] }
//
// One DB round-trip for events (whole month), no N+1 queries.
// Public route — no auth required.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

function toMins(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function pad2(n: number) { return String(n).padStart(2, "0"); }

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const slug     = searchParams.get("slug");
    const yearStr  = searchParams.get("year");
    const monthStr = searchParams.get("month"); // 1-based

    if (!slug || !yearStr || !monthStr) {
      return NextResponse.json({ error: "slug, year and month are required" }, { status: 422 });
    }

    const year  = parseInt(yearStr,  10);
    const month = parseInt(monthStr, 10); // 1-based

    const supabase = await createClient();

    // Load booking link config
    const { data: config, error: configErr } = await supabase
      .from("calendar_booking_link")
      .select("user_id, availability, buffer_minutes, notice_hours, durations, active")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (configErr || !config) {
      return NextResponse.json({ error: "Booking link not found" }, { status: 404 });
    }

    const availability  = config.availability  as Array<{ day: number; from: string; to: string }>;
    const durations     = config.durations     as number[];
    const buffer        = (config.buffer_minutes as number) ?? 15;
    const noticeHours   = (config.notice_hours  as number) ?? 24;
    const nowPlus       = new Date(Date.now() + noticeHours * 3_600_000);
    const shortestDur   = Math.min(...durations); // use shortest duration for "has any slot" check

    // Month bounds — cast a wide net (±1 day UTC) for timezone safety
    const monthStart = new Date(`${year}-${pad2(month)}-01T00:00:00.000Z`);
    monthStart.setUTCDate(monthStart.getUTCDate() - 1);

    // Last day of the month
    const lastDay    = new Date(year, month, 0).getDate(); // month is 1-based; Date(y, m, 0) = last day of month m-1
    const monthEnd   = new Date(`${year}-${pad2(month)}-${pad2(lastDay)}T23:59:59.999Z`);
    monthEnd.setUTCDate(monthEnd.getUTCDate() + 1);

    // Load ALL busy events for the month in one query
    const { data: busyEvents } = await supabase
      .from("calendar_events")
      .select("start_at, end_at, all_day")
      .eq("user_id", config.user_id)
      .gte("end_at",   monthStart.toISOString())
      .lte("start_at", monthEnd.toISOString());

    // Check each day in the month
    const availableDates: string[] = [];

    for (let d = 1; d <= lastDay; d++) {
      const dk      = dateKey(year, month, d);
      const date    = new Date(`${dk}T00:00:00`); // local midnight
      const dayOfWk = date.getDay();

      // Does this day have any availability windows?
      const windows = availability.filter(w => w.day === dayOfWk);
      if (windows.length === 0) continue;

      // Build candidate slots for this day using the shortest duration
      const candidateSlots: number[] = [];
      for (const w of windows) {
        const winFrom = toMins(w.from);
        const winTo   = toMins(w.to);
        for (let s = winFrom; s + shortestDur <= winTo; s += 30) {
          candidateSlots.push(s);
        }
      }
      if (candidateSlots.length === 0) continue;

      // Build busy ranges for this day (minutes since local midnight)
      const localMidnightMs = date.getTime();
      const busyRanges: Array<{ from: number; to: number }> = [];

      for (const ev of busyEvents ?? []) {
        if (ev.all_day) {
          busyRanges.push({ from: 0, to: 24 * 60 });
          continue;
        }
        const sMs      = new Date(ev.start_at).getTime();
        const eMs      = new Date(ev.end_at).getTime();
        const fromMins = Math.floor((sMs - localMidnightMs) / 60_000) - buffer;
        const toMins_  = Math.ceil( (eMs - localMidnightMs) / 60_000) + buffer;
        if (toMins_ > 0 && fromMins < 24 * 60) {
          busyRanges.push({ from: fromMins, to: toMins_ });
        }
      }

      // Does at least one slot survive?
      const hasSlot = candidateSlots.some(slot => {
        const slotEnd = slot + shortestDur;

        // Minimum notice check
        const slotDateTime = new Date(`${dk}T${String(Math.floor(slot / 60)).padStart(2,"0")}:${String(slot % 60).padStart(2,"0")}:00`);
        if (slotDateTime < nowPlus) return false;

        // Overlap check
        for (const busy of busyRanges) {
          if (slot < busy.to && slotEnd > busy.from) return false;
        }
        return true;
      });

      if (hasSlot) availableDates.push(dk);
    }

    return NextResponse.json({ availableDates });
  } catch (err) {
    logger.error("[calendar/availability/month GET] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
