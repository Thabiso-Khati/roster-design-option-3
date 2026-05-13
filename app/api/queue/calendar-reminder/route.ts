export const dynamic = 'force-dynamic';

/**
 * /api/queue/calendar-reminder
 * ─────────────────────────────
 * QStash consumer for calendar event reminders.
 *
 * QStash delivers the job at the scheduled time (notBefore).
 * On a non-2xx response QStash retries up to `retries` times.
 * A 400 means bad payload — QStash will NOT retry.
 *
 * Security: When QSTASH_CURRENT_SIGNING_KEY is set, every request
 * must carry a valid `upstash-signature` header.
 *
 * This route must be added to the RL_SKIP list in proxy.ts.
 */

import { NextRequest, NextResponse }      from "next/server";
import { getQStashReceiver }              from "@/lib/queue/transact";
import { enqueueTransact }                from "@/lib/queue/transact";
import { CalendarReminderJob, formatReminderDuration } from "@/lib/calendar/reminders";
import { createAdminClient }              from "@/lib/supabase/admin";
import { sendEmail }                      from "@/lib/email/send";
import { sendWhatsApp }                   from "@/lib/campaigns/whatsapp";
import { logger }                         from "@/lib/logger";

export const runtime = "nodejs";

// ── Email template ────────────────────────────────────────────

function buildReminderHtml(job: CalendarReminderJob): string {
  const startDate  = new Date(job.event_start_at);
  const dateStr    = startDate.toLocaleDateString("en-ZA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr    = startDate.toLocaleTimeString("en-ZA", {
    hour: "2-digit", minute: "2-digit",
  });
  const timeLabel  = formatReminderDuration(job.minutes_before);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#111;border:1px solid #222;border-radius:12px;padding:32px 28px;font-family:Arial,sans-serif;color:#f5f5f5;">
        <tr><td>
          <p style="margin:0 0 20px;font-size:11px;font-weight:700;text-transform:uppercase;
                    letter-spacing:2px;color:#666;">ROSTER · Calendar Reminder</p>
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">
            ${job.event_title}
          </h2>
          <p style="margin:0 0 24px;font-size:15px;color:#888;">
            Starting in <strong style="color:#C9FF4E;">${timeLabel}</strong>
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;
                        padding:16px 20px;margin-bottom:28px;">
            <tr>
              <td style="font-size:14px;color:#ccc;padding-bottom:8px;">
                📅 &nbsp;<strong>${dateStr}</strong>
              </td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#ccc;">
                🕐 &nbsp;<strong>${timeStr}</strong>
              </td>
            </tr>
          </table>
          <p style="margin:0;font-size:11px;color:#444;line-height:1.5;">
            You're receiving this because you enabled reminders for this event in ROSTER.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

// ── Consumer ──────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const receiver = getQStashReceiver();
  let job: CalendarReminderJob;

  if (receiver) {
    const signature = req.headers.get("upstash-signature") ?? "";
    const rawBody   = await req.text();

    let valid = false;
    try {
      valid = await receiver.verify({ signature, body: rawBody });
    } catch {
      valid = false;
    }

    if (!valid) {
      logger.warn("[queue/calendar-reminder] invalid QStash signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    job = JSON.parse(rawBody) as CalendarReminderJob;
  } else {
    // No signing keys — accept without verification (local dev only)
    job = (await req.json()) as CalendarReminderJob;
  }

  if (job.type !== "calendar_reminder") {
    // Bad payload — return 400 so QStash does NOT retry
    logger.error("[queue/calendar-reminder] wrong job type", { job });
    return NextResponse.json({ error: "Wrong job type" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Confirm the event still exists (may have been deleted since scheduling)
  const { data: event } = await admin
    .from("calendar_events")
    .select("id, title, start_at")
    .eq("id", job.event_id)
    .single();

  if (!event) {
    logger.info("[queue/calendar-reminder] event no longer exists — skipping", {
      eventId: job.event_id,
    });
    // ACK with 200 — no retry needed, the event is simply gone
    return NextResponse.json({ ok: true, skipped: "event_deleted" });
  }

  // Fetch user contact details via admin (bypasses RLS)
  const { data: authData } = await admin.auth.admin.getUserById(job.user_id);
  const userEmail = authData?.user?.email ?? "";

  const { data: profile } = await admin
    .from("profiles")
    .select("phone")
    .eq("id", job.user_id)
    .single();
  const userPhone = (profile as { phone?: string } | null)?.phone ?? "";

  const timeLabel = formatReminderDuration(job.minutes_before);
  const sendErrors: string[] = [];

  // ── Email ──────────────────────────────────────────────────
  if (job.send_email && userEmail) {
    const subject = `Reminder: ${job.event_title} starts in ${timeLabel}`;
    const html    = buildReminderHtml(job);

    // Try QStash transact first (for retry resilience), fall back to inline
    const { queued } = await enqueueTransact({ type: "email", to: userEmail, subject, html });
    if (!queued) {
      const result = await sendEmail({ to: userEmail, subject, html });
      if (!result.success) {
        sendErrors.push(`email: ${result.error}`);
      }
    }
  }

  // ── WhatsApp ───────────────────────────────────────────────
  if (job.send_whatsapp && userPhone) {
    const startDate = new Date(job.event_start_at);
    const dateStr   = startDate.toLocaleDateString("en-ZA", {
      weekday: "short", day: "numeric", month: "short",
    });
    const timeStr   = startDate.toLocaleTimeString("en-ZA", {
      hour: "2-digit", minute: "2-digit",
    });
    const body =
      `⏰ *ROSTER Reminder*\n\n` +
      `*${job.event_title}*\n` +
      `Starting in ${timeLabel}\n\n` +
      `📅 ${dateStr} at ${timeStr}`;

    const { queued } = await enqueueTransact({ type: "whatsapp", to: userPhone, body });
    if (!queued) {
      const result = await sendWhatsApp({ to: userPhone, body });
      if (!result.success) {
        sendErrors.push(`whatsapp: ${result.error}`);
      }
    }
  }

  if (sendErrors.length) {
    // Return 500 so QStash retries
    logger.error("[queue/calendar-reminder] send failed", {
      eventId: job.event_id, minutesBefore: job.minutes_before, errors: sendErrors,
    });
    return NextResponse.json({ error: sendErrors.join("; ") }, { status: 500 });
  }

  logger.info("[queue/calendar-reminder] reminder dispatched", {
    eventId:       job.event_id,
    minutesBefore: job.minutes_before,
    sentEmail:     job.send_email && !!userEmail,
    sentWhatsApp:  job.send_whatsapp && !!userPhone,
  });

  return NextResponse.json({ ok: true });
}
