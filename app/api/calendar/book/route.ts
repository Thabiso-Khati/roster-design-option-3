// ============================================================
// ROSTER — /api/calendar/book
// ------------------------------------------------------------
// POST — create a meeting booking via a public booking link.
//
// Free meetings: confirmed immediately, calendar event created.
// Paid meetings: Paystack payment link returned, booking held
//               as "pending_payment" until webhook confirms.
//
// Public route — no auth required.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncBookingToCalendar } from "@/lib/calendar/sync";
import { enqueueTransact } from "@/lib/queue/transact";
import { sendEmail } from "@/lib/email/send";
import { logger } from "@/lib/logger";
import { z } from "zod";

// ── Email helpers ─────────────────────────────────────────────

function formatDateLabel(date: string, time: string): string {
  const dt = new Date(`${date}T${time}:00`);
  return dt.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function buildGuestConfirmationHtml(opts: {
  hostName: string;
  guestName: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
}): string {
  const dateLabel = formatDateLabel(opts.date, opts.time);
  const durLabel  = opts.duration < 60
    ? `${opts.duration} min`
    : `${Math.floor(opts.duration / 60)}h${opts.duration % 60 > 0 ? ` ${opts.duration % 60}min` : ""}`;

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#111;border:1px solid #222;border-radius:12px;padding:32px 28px;
                    font-family:Arial,sans-serif;color:#f5f5f5;">
        <tr><td>
          <p style="margin:0 0 20px;font-size:11px;font-weight:700;text-transform:uppercase;
                    letter-spacing:2px;color:#666;">ROSTER · Booking Confirmed</p>
          <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#fff;">
            You&#39;re booked, ${opts.guestName}!
          </h2>
          <p style="margin:0 0 24px;font-size:15px;color:#888;">
            Your meeting with <strong style="color:#fff;">${opts.hostName}</strong> is confirmed.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;
                        padding:16px 20px;margin-bottom:28px;">
            <tr><td style="font-size:14px;color:#ccc;padding-bottom:8px;">
              📅 &nbsp;<strong>${dateLabel}</strong>
            </td></tr>
            <tr><td style="font-size:14px;color:#ccc;padding-bottom:8px;">
              🕐 &nbsp;<strong>${opts.time}</strong> &nbsp;·&nbsp; ${durLabel}
            </td></tr>
            ${opts.notes ? `<tr><td style="font-size:13px;color:#888;padding-top:4px;">
              📝 &nbsp;${opts.notes}
            </td></tr>` : ""}
          </table>
          <p style="margin:0;font-size:11px;color:#444;line-height:1.5;">
            Powered by ROSTER. If you need to cancel, please contact ${opts.hostName} directly.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function buildHostNotificationHtml(opts: {
  hostName: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
  appUrl: string;
}): string {
  const dateLabel = formatDateLabel(opts.date, opts.time);
  const durLabel  = opts.duration < 60
    ? `${opts.duration} min`
    : `${Math.floor(opts.duration / 60)}h${opts.duration % 60 > 0 ? ` ${opts.duration % 60}min` : ""}`;

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#111;border:1px solid #222;border-radius:12px;padding:32px 28px;
                    font-family:Arial,sans-serif;color:#f5f5f5;">
        <tr><td>
          <p style="margin:0 0 20px;font-size:11px;font-weight:700;text-transform:uppercase;
                    letter-spacing:2px;color:#666;">ROSTER · New Booking</p>
          <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#fff;">
            New meeting booked
          </h2>
          <p style="margin:0 0 24px;font-size:15px;color:#888;">
            <strong style="color:#C9FF4E;">${opts.guestName}</strong> just booked time with you.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;
                        padding:16px 20px;margin-bottom:16px;">
            <tr><td style="font-size:14px;color:#ccc;padding-bottom:8px;">
              📅 &nbsp;<strong>${dateLabel}</strong>
            </td></tr>
            <tr><td style="font-size:14px;color:#ccc;padding-bottom:8px;">
              🕐 &nbsp;<strong>${opts.time}</strong> &nbsp;·&nbsp; ${durLabel}
            </td></tr>
            <tr><td style="font-size:14px;color:#ccc;padding-bottom:8px;">
              ✉️ &nbsp;<a href="mailto:${opts.guestEmail}" style="color:#C9FF4E;">${opts.guestEmail}</a>
            </td></tr>
            ${opts.guestPhone ? `<tr><td style="font-size:14px;color:#ccc;padding-bottom:8px;">
              📱 &nbsp;${opts.guestPhone}
            </td></tr>` : ""}
            ${opts.notes ? `<tr><td style="font-size:13px;color:#888;padding-top:4px;">
              📝 &nbsp;${opts.notes}
            </td></tr>` : ""}
          </table>
          <a href="${opts.appUrl}/dashboard/calendar"
             style="display:inline-block;padding:12px 24px;background:#C9FF4E;color:#000;
                    font-weight:700;font-size:13px;border-radius:8px;text-decoration:none;">
            View in Calendar →
          </a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export const runtime = "nodejs";

const BookSchema = z.object({
  slug:        z.string().min(1),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  time:        z.string().regex(/^\d{2}:\d{2}$/, "time must be HH:MM"),
  duration:    z.number().int().positive(),
  guest_name:  z.string().trim().min(1).max(120),
  guest_email: z.string().email(),
  guest_phone: z.string().max(30).optional(),
  notes:       z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = BookSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: `${first.path.join(".")} — ${first.message}` },
        { status: 422 }
      );
    }

    const { slug, date, time, duration, guest_name, guest_email, guest_phone, notes } = parsed.data;
    const supabase = await createClient();
    const admin    = createAdminClient();

    // Load booking link config
    const { data: config } = await supabase
      .from("calendar_booking_link")
      .select("user_id, display_name, availability, buffer_minutes, notice_hours, durations, rate_cents, currency, active")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (!config) {
      return NextResponse.json({ error: "Booking link not found or inactive." }, { status: 404 });
    }

    // Validate duration is allowed
    if (!(config.durations as number[]).includes(duration)) {
      return NextResponse.json({ error: "Invalid duration for this booking link." }, { status: 422 });
    }

    // Build ISO datetimes
    const startISO = new Date(`${date}T${time}:00`).toISOString();
    const endISO   = new Date(new Date(`${date}T${time}:00`).getTime() + duration * 60_000).toISOString();

    // Re-verify slot is still available (race condition guard)
    const { data: conflicts } = await admin
      .from("calendar_events")
      .select("id")
      .eq("user_id", config.user_id)
      .lt("start_at", endISO)
      .gt("end_at",   startISO)
      .limit(1);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: "That slot was just taken — please pick another time." },
        { status: 409 }
      );
    }

    const rateCents = config.rate_cents as number;

    // ── FREE BOOKING — confirm immediately ────────────────────
    if (rateCents === 0) {
      const { data: event, error: evErr } = await admin
        .from("calendar_events")
        .insert({
          user_id:     config.user_id,
          title:       `Meeting with ${guest_name}`,
          description: notes || null,
          start_at:    startISO,
          end_at:      endISO,
          all_day:     false,
          event_type:  "meeting",
          source_type: "manual",
          privacy:     "private",
        })
        .select("id")
        .single();

      if (evErr) {
        logger.error("[calendar/book] event insert failed", {}, evErr);
        return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
      }

      logger.info("[calendar/book] free booking confirmed", {
        hostUserId: config.user_id, guestEmail: guest_email, eventId: event.id,
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://rosterapp.ai";

      // ── Notify guest (confirmation) ───────────────────────
      const guestHtml    = buildGuestConfirmationHtml({
        hostName: config.display_name as string,
        guestName: guest_name,
        date, time, duration,
        notes: notes ?? undefined,
      });
      const guestSubject = `Booking confirmed: meeting with ${config.display_name}`;
      const { queued: guestQueued } = await enqueueTransact({
        type: "email", to: guest_email, subject: guestSubject, html: guestHtml,
      });
      if (!guestQueued) {
        await sendEmail({ to: guest_email, subject: guestSubject, html: guestHtml });
      }

      // ── Notify host ───────────────────────────────────────
      const { data: hostAuth } = await admin.auth.admin.getUserById(config.user_id as string);
      const hostEmail = hostAuth?.user?.email;
      if (hostEmail) {
        const hostHtml    = buildHostNotificationHtml({
          hostName:   config.display_name as string,
          guestName:  guest_name,
          guestEmail: guest_email,
          guestPhone: guest_phone ?? undefined,
          date, time, duration,
          notes: notes ?? undefined,
          appUrl,
        });
        const hostSubject = `New booking: ${guest_name} on ${date} at ${time}`;
        const { queued: hostQueued } = await enqueueTransact({
          type: "email", to: hostEmail, subject: hostSubject, html: hostHtml,
        });
        if (!hostQueued) {
          await sendEmail({ to: hostEmail, subject: hostSubject, html: hostHtml });
        }
      }

      return NextResponse.json({
        ok:          true,
        paid:        false,
        paymentLink: null,
        message:     `You're booked with ${config.display_name} on ${date} at ${time}.`,
      }, { status: 201 });
    }

    // ── PAID BOOKING — create Paystack payment link ───────────
    // We hold a "pending_payment" calendar event that gets confirmed
    // by the webhook when payment lands.
    const { data: pendingEvent, error: pendingErr } = await admin
      .from("calendar_events")
      .insert({
        user_id:     config.user_id,
        title:       `[Pending] Meeting with ${guest_name}`,
        description: `Awaiting payment. Guest: ${guest_email}${notes ? ` | Notes: ${notes}` : ""}`,
        start_at:    startISO,
        end_at:      endISO,
        all_day:     false,
        event_type:  "meeting",
        source_type: "manual",
        privacy:     "private",
      })
      .select("id")
      .single();

    if (pendingErr || !pendingEvent) {
      logger.error("[calendar/book] pending event insert failed", {}, pendingErr);
      return NextResponse.json({ error: "Failed to reserve slot." }, { status: 500 });
    }

    // Build Paystack payment link
    let paymentLink: string | null = null;
    try {
      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email:        guest_email,
          amount:       rateCents,  // already in cents
          currency:     config.currency,
          reference:    `BOOK_${pendingEvent.id}`,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/${slug}/confirmed`,
          metadata: {
            calendar_event_id: pendingEvent.id,
            host_user_id:      config.user_id,
            guest_name,
            guest_email,
            guest_phone: guest_phone ?? "",
            duration,
            slug,
          },
        }),
      });
      const ps = await paystackRes.json();
      if (ps.status) paymentLink = ps.data.authorization_url;
    } catch (psErr) {
      logger.error("[calendar/book] Paystack init failed", {}, psErr);
      // Clean up the pending slot
      await admin.from("calendar_events").delete().eq("id", pendingEvent.id);
      return NextResponse.json({ error: "Payment initialisation failed." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, paid: true, paymentLink }, { status: 201 });
  } catch (err) {
    logger.error("[calendar/book] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
