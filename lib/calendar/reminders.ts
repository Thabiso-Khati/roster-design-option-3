/**
 * lib/calendar/reminders.ts
 * ─────────────────────────
 * Schedules and cancels QStash reminder jobs for calendar events.
 *
 * Each job is published with a `notBefore` Unix timestamp so QStash
 * holds the message until the correct reminder time, then delivers it
 * to /api/queue/calendar-reminder.
 *
 * When QStash is not configured (QSTASH_TOKEN absent) the function
 * logs and returns empty — no crash, just no reminders.
 *
 * Env vars (same as lib/queue/transact.ts):
 *   QSTASH_TOKEN            — required for scheduling
 *   NEXT_PUBLIC_APP_URL     — required for the delivery endpoint URL
 */

import { Client } from "@upstash/qstash";
import { logger } from "@/lib/logger";

// ── Job payload ──────────────────────────────────────────────

export interface CalendarReminderJob {
  type:           "calendar_reminder";
  event_id:       string;
  user_id:        string;
  minutes_before: number;
  /** Snapshot of title at scheduling time — used for the message body. */
  event_title:    string;
  event_start_at: string;
  event_type:     string;
  send_email:     boolean;
  send_whatsapp:  boolean;
}

// ── Schedule ─────────────────────────────────────────────────

/**
 * Cancels any previous reminder jobs for the event, then schedules
 * fresh jobs based on the current reminder settings.
 *
 * Returns the new QStash message IDs to persist on the event row.
 * On a non-configured environment returns [] without throwing.
 */
export async function scheduleEventReminders(event: {
  id:                string;
  user_id:           string;
  title:             string;
  start_at:          string;
  event_type:        string;
  reminder_email:    boolean;
  reminder_whatsapp: boolean;
  reminder_minutes:  number[];
  reminder_job_ids?: string[] | null;
}): Promise<string[]> {
  // Read at call time so tests can stub freely
  const token  = process.env.QSTASH_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // Cancel previous jobs first (best-effort, non-fatal)
  if (event.reminder_job_ids?.length && token) {
    await cancelEventReminders(event.reminder_job_ids, token);
  }

  // Nothing to schedule?
  const wantsReminders = event.reminder_email || event.reminder_whatsapp;
  if (!wantsReminders || !event.reminder_minutes?.length) return [];

  if (!token || !appUrl) {
    logger.info("[calendar/reminders] QStash not configured — skipping reminder scheduling", {
      eventId: event.id,
    });
    return [];
  }

  const client       = new Client({ token });
  const eventStartMs = new Date(event.start_at).getTime();
  const nowMs        = Date.now();
  const newJobIds: string[] = [];

  for (const minutesBefore of event.reminder_minutes) {
    const sendAtMs = eventStartMs - minutesBefore * 60_000;

    if (sendAtMs <= nowMs) {
      // Reminder time is already in the past — skip silently
      continue;
    }

    const notBefore = Math.floor(sendAtMs / 1000); // QStash expects Unix seconds

    const job: CalendarReminderJob = {
      type:           "calendar_reminder",
      event_id:       event.id,
      user_id:        event.user_id,
      minutes_before: minutesBefore,
      event_title:    event.title,
      event_start_at: event.start_at,
      event_type:     event.event_type,
      send_email:     event.reminder_email,
      send_whatsapp:  event.reminder_whatsapp,
    };

    try {
      const res = await client.publishJSON({
        url:       `${appUrl}/api/queue/calendar-reminder`,
        body:      job,
        retries:   2,
        notBefore,
      });
      if (res.messageId) newJobIds.push(res.messageId);
      logger.info("[calendar/reminders] reminder scheduled", {
        eventId: event.id, minutesBefore, notBefore, messageId: res.messageId,
      });
    } catch (err) {
      // Non-fatal — continue scheduling remaining offsets
      logger.warn("[calendar/reminders] failed to schedule reminder", {
        eventId: event.id, minutesBefore,
      }, err);
    }
  }

  return newJobIds;
}

// ── Cancel ────────────────────────────────────────────────────

/**
 * Cancels QStash jobs by message ID.
 * All errors are swallowed — cancellation is best-effort.
 */
export async function cancelEventReminders(
  jobIds: string[],
  token?: string,
): Promise<void> {
  const qstashToken = token ?? process.env.QSTASH_TOKEN;
  if (!qstashToken || !jobIds.length) return;

  await Promise.allSettled(
    jobIds.map(id =>
      fetch(`https://qstash.upstash.io/v2/messages/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${qstashToken}` },
      }).catch(err =>
        logger.warn("[calendar/reminders] cancel job failed", { id }, err)
      )
    )
  );
}

// ── Display helpers ───────────────────────────────────────────

export function formatReminderDuration(minutesBefore: number): string {
  if (minutesBefore < 60) {
    return `${minutesBefore} minute${minutesBefore !== 1 ? "s" : ""}`;
  }
  const hours = minutesBefore / 60;
  if (Number.isInteger(hours) && hours < 24) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  const days = hours / 24;
  if (Number.isInteger(days)) {
    return `${days} day${days !== 1 ? "s" : ""}`;
  }
  return `${minutesBefore} minutes`;
}
