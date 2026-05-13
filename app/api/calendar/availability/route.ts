// ============================================================
// ROSTER — /api/calendar/availability
// ------------------------------------------------------------
// GET — return available booking slots for a given slug + date
//
// Query params:
//   slug  — the booking link slug
//   date  — YYYY-MM-DD  (in the user's local timezone)
//
// Returns:
//   { slots: ["09:00","09:30",...], duration: 60, currency, rate_cents }
//
// Public route — no auth required.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

// Convert "HH:MM" to minutes-since-midnight
function toMins(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(mins: number) {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const slug     = searchParams.get("slug");
    const dateStr  = searchParams.get("date"); // YYYY-MM-DD
    const durParam = searchParams.get("duration"); // minutes

    if (!slug || !dateStr) {
      return NextResponse.json({ error: "slug and date are required" }, { status: 422 });
    }

    const supabase = await createClient();

    // Load booking link config (public read via RLS)
    const { data: config, error: configErr } = await supabase
      .from("calendar_booking_link")
      .select("user_id, availability, buffer_minutes, notice_hours, durations, rate_cents, currency, active")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (configErr || !config) {
      return NextResponse.json({ error: "Booking link not found" }, { status: 404 });
    }

    // Parse date
    const date    = new Date(`${dateStr}T00:00:00`);
    const dayOfWk = date.getDay(); // 0=Sun … 6=Sat

    // Find availability window for this day
    const windows = (config.availability as Array<{ day: number; from: string; to: string }>)
      .filter(w => w.day === dayOfWk);

    if (windows.length === 0) {
      return NextResponse.json({ slots: [], durations: config.durations, rate_cents: config.rate_cents, currency: config.currency });
    }

    const duration    = durParam ? parseInt(durParam, 10) : (config.durations as number[])[0];
    const buffer      = (config.buffer_minutes as number) ?? 15;
    const noticeHours = (config.notice_hours  as number) ?? 24;
    const nowPlus     = new Date(Date.now() + noticeHours * 3_600_000);

    // Build all candidate slots (30-min granularity, fits within window)
    const candidateSlots: number[] = []; // minutes-since-midnight
    for (const w of windows) {
      const winFrom = toMins(w.from);
      const winTo   = toMins(w.to);
      for (let s = winFrom; s + duration <= winTo; s += 30) {
        candidateSlots.push(s);
      }
    }

    // Load busy events for this user on this date.
    // We cast a wide net (±1 day in UTC) so that events near midnight in any
    // timezone are caught regardless of server UTC offset.
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    dayStart.setUTCDate(dayStart.getUTCDate() - 1); // one day before in UTC
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);     // one day after in UTC

    const { data: busyEvents } = await supabase
      .from("calendar_events")
      .select("start_at, end_at, all_day")
      .eq("user_id", config.user_id)
      .gte("end_at",   dayStart.toISOString())
      .lte("start_at", dayEnd.toISOString());

    // Convert busy events to minute ranges relative to the LOCAL date's midnight.
    // availability windows are in local time (HH:MM with no tz offset), so we
    // compute busy minutes the same way: treat the event UTC timestamp as a
    // wall-clock offset from dateStr midnight local.
    //
    // Strategy: build a reference "local midnight" for dateStr as a Date object
    // using `new Date(`${dateStr}T00:00:00`)` (no Z suffix = local time), then
    // express event start/end as minutes since that local midnight.
    const localMidnight = new Date(`${dateStr}T00:00:00`).getTime(); // ms, local

    const busyRanges: Array<{ from: number; to: number }> = [];
    for (const ev of busyEvents ?? []) {
      if (ev.all_day) {
        busyRanges.push({ from: 0, to: 24 * 60 });
        continue;
      }
      const sMs = new Date(ev.start_at).getTime();
      const eMs = new Date(ev.end_at).getTime();

      // Convert to minutes-since-local-midnight (can be negative or > 1440)
      const fromMins = Math.floor((sMs - localMidnight) / 60_000) - buffer;
      const toMins   = Math.ceil( (eMs - localMidnight) / 60_000) + buffer;

      // Only include if the event overlaps the day at all (0 to 1440 mins)
      if (toMins > 0 && fromMins < 24 * 60) {
        busyRanges.push({ from: fromMins, to: toMins });
      }
    }

    // Filter: remove slots that overlap busy ranges or are too soon
    const available = candidateSlots.filter(slot => {
      const slotEnd = slot + duration;

      // Minimum notice check
      const slotDateTime = new Date(`${dateStr}T${toHHMM(slot)}:00`);
      if (slotDateTime < nowPlus) return false;

      // Overlap check with busy ranges
      for (const busy of busyRanges) {
        if (slot < busy.to && slotEnd > busy.from) return false;
      }
      return true;
    });

    return NextResponse.json({
      slots:      available.map(toHHMM),
      durations:  config.durations,
      rate_cents: config.rate_cents,
      currency:   config.currency,
    });
  } catch (err) {
    logger.error("[calendar/availability GET] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
