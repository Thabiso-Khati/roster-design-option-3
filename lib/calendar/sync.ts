// ============================================================
// ROSTER — lib/calendar/sync.ts
// ------------------------------------------------------------
// Shared helpers that mirror ROSTER records into calendar_events.
//
// All functions are:
//  - Idempotent: safe to call multiple times for the same record.
//    They query by (user_id, source_type, source_id) and upsert.
//  - Best-effort: errors are logged and swallowed — a calendar
//    sync failure must never break the primary operation.
//  - Admin-client compatible: accept any SupabaseClient so they
//    work both inside user-session routes and in webhook/promote
//    contexts that use the service role client.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// ── Types ────────────────────────────────────────────────────

interface BookingRow {
  id:               string;
  user_id:          string;
  scheduled_at:     string;
  duration_minutes: number;
  booking_status:   string;
  experts: {
    name:      string;
    specialty: string | null;
  } | Array<{ name: string; specialty: string | null }> | null;
}

interface ReleaseTaskRow {
  id:         string;
  user_id:    string;
  text:       string;
  due_date:   string | null;
  phase:      string;
  release_id: string;
}

// ── Phase → event type mapping ────────────────────────────────

const PHASE_EVENT_TYPE: Record<string, string> = {
  pre_8w:  "sync_deadline",
  pre_6w:  "sync_deadline",
  pre_4w:  "sync_deadline",
  pre_2w:  "sync_deadline",
  pre_1w:  "sync_deadline",
  release: "release_date",
  post_1w: "release_date",
  post_1m: "release_date",
};

// ── Upsert helper ─────────────────────────────────────────────

async function upsertCalendarEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  payload: {
    user_id:     string;
    title:       string;
    description?: string;
    start_at:    string;
    end_at:      string;
    all_day:     boolean;
    event_type:  string;
    source_type: string;
    source_id:   string;
  }
) {
  // Check for existing mirror
  const { data: existing } = await supabase
    .from("calendar_events")
    .select("id")
    .eq("user_id",     payload.user_id)
    .eq("source_type", payload.source_type)
    .eq("source_id",   payload.source_id)
    .maybeSingle();

  if (existing?.id) {
    // Update existing mirror
    const { error } = await supabase
      .from("calendar_events")
      .update({
        title:      payload.title,
        description:payload.description ?? null,
        start_at:   payload.start_at,
        end_at:     payload.end_at,
        all_day:    payload.all_day,
        event_type: payload.event_type,
      })
      .eq("id", existing.id);

    if (error) {
      logger.warn("[calendar/sync] update failed", { sourceType: payload.source_type, sourceId: payload.source_id }, error);
    }
  } else {
    // Insert new mirror
    const { error } = await supabase
      .from("calendar_events")
      .insert({
        ...payload,
        privacy: "private",
      });

    if (error) {
      logger.warn("[calendar/sync] insert failed", { sourceType: payload.source_type, sourceId: payload.source_id }, error);
    }
  }
}

// ── syncBookingToCalendar ─────────────────────────────────────

/**
 * Mirror an expert booking into calendar_events.
 * Accepts either the full booking row (with joined expert) or just
 * the bookingId — in the latter case it fetches from DB first.
 */
export async function syncBookingToCalendar(
  bookingIdOrRow: string | BookingRow,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<void> {
  try {
    let booking: BookingRow | null = null;

    if (typeof bookingIdOrRow === "string") {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id, user_id, scheduled_at, duration_minutes, booking_status,
          experts(name, specialty)
        `)
        .eq("id", bookingIdOrRow)
        .maybeSingle();

      if (error || !data) {
        logger.warn("[calendar/sync] could not load booking", { bookingId: bookingIdOrRow }, error);
        return;
      }
      booking = data as BookingRow;
    } else {
      booking = bookingIdOrRow;
    }

    // Skip cancelled bookings — remove their mirror if it exists
    if (booking.booking_status === "cancelled") {
      await removeCalendarEventBySource("booking", booking.id, booking.user_id, supabase);
      return;
    }

    const expertRaw = booking.experts;
    const expert = Array.isArray(expertRaw) ? expertRaw[0] : expertRaw;
    const expertName = expert?.name ?? "Expert Session";
    const specialty  = expert?.specialty ?? null;

    const start = new Date(booking.scheduled_at);
    const end   = new Date(start.getTime() + booking.duration_minutes * 60_000);

    await upsertCalendarEvent(supabase, {
      user_id:     booking.user_id,
      title:       `${expertName}${specialty ? ` — ${specialty}` : ""}`,
      description: `${booking.duration_minutes} min expert session`,
      start_at:    start.toISOString(),
      end_at:      end.toISOString(),
      all_day:     false,
      event_type:  "expert_booking",
      source_type: "booking",
      source_id:   booking.id,
    });

    logger.info("[calendar/sync] booking synced", { bookingId: booking.id });
  } catch (e) {
    logger.error("[calendar/sync] syncBookingToCalendar failed", {}, e);
  }
}

// ── syncReleaseTaskToCalendar ─────────────────────────────────

/**
 * Mirror a release task (with a due_date) into calendar_events.
 * Tasks without a due_date are silently skipped.
 */
export async function syncReleaseTaskToCalendar(
  task: ReleaseTaskRow,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<void> {
  try {
    if (!task.due_date) return; // no date — nothing to calendar

    const eventType = PHASE_EVENT_TYPE[task.phase] ?? "sync_deadline";
    const dayStart  = `${task.due_date}T00:00:00.000Z`;
    const dayEnd    = `${task.due_date}T23:59:59.000Z`;

    await upsertCalendarEvent(supabase, {
      user_id:     task.user_id,
      title:       task.text,
      start_at:    dayStart,
      end_at:      dayEnd,
      all_day:     true,
      event_type:  eventType,
      source_type: "release_task",
      source_id:   task.id,
    });

    logger.info("[calendar/sync] release task synced", { taskId: task.id });
  } catch (e) {
    logger.error("[calendar/sync] syncReleaseTaskToCalendar failed", {}, e);
  }
}

// ── removeCalendarEventBySource ───────────────────────────────

/**
 * Delete a calendar mirror when the source record is cancelled or deleted.
 */
export async function removeCalendarEventBySource(
  sourceType: string,
  sourceId:   string,
  userId:     string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<void> {
  try {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("user_id",     userId)
      .eq("source_type", sourceType)
      .eq("source_id",   sourceId);

    if (error) {
      logger.warn("[calendar/sync] removeCalendarEventBySource failed", { sourceType, sourceId }, error);
    }
  } catch (e) {
    logger.error("[calendar/sync] removeCalendarEventBySource threw", {}, e);
  }
}

// ── backfillCalendarForUser ───────────────────────────────────

/**
 * One-shot backfill of ALL existing bookings and release tasks
 * for a user. Called from /api/calendar/sync to handle data
 * created before the calendar feature existed.
 */
export async function backfillCalendarForUser(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<{ bookings: number; tasks: number }> {
  let syncedBookings = 0;
  let syncedTasks    = 0;

  // ── Bookings ──────────────────────────────────────────────
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`id, user_id, scheduled_at, duration_minutes, booking_status, experts(name, specialty)`)
    .eq("user_id", userId)
    .neq("booking_status", "cancelled");

  for (const booking of bookings ?? []) {
    await syncBookingToCalendar(booking as BookingRow, supabase);
    syncedBookings++;
  }

  // ── Release tasks with due dates ──────────────────────────
  const { data: tasks } = await supabase
    .from("release_tasks")
    .select("id, user_id, text, due_date, phase, release_id")
    .eq("user_id", userId)
    .not("due_date", "is", null);

  for (const task of tasks ?? []) {
    await syncReleaseTaskToCalendar(task as ReleaseTaskRow, supabase);
    syncedTasks++;
  }

  logger.info("[calendar/sync] backfill complete", { userId, syncedBookings, syncedTasks });
  return { bookings: syncedBookings, tasks: syncedTasks };
}
