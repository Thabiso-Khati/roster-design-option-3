// ============================================================
// ROSTER — promote booking to paid
// ------------------------------------------------------------
// Shared helper for the "transaction succeeded → finish booking"
// path. Called from two places:
//
//   1. /api/paystack/webhook (canonical) — fires when Paystack
//      pushes charge.success to us.
//   2. /dashboard/payment-result — runs when the user lands back
//      on our app after Paystack's hosted checkout. Webhooks are
//      asynchronous and can arrive after the browser redirect, so
//      this gives the result page a way to promote the booking
//      synchronously when the user sees it first.
//
// Idempotency: both callers guard against double-processing by
// checking payment_status before running side-effects (emails,
// SMS, room creation). Either caller can run first; the other
// becomes a no-op.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { createRoom } from "@/lib/daily/client";
import { sendEmail } from "@/lib/email/send";
import {
  bookingConfirmationEmail,
  expertBookingNotificationEmail,
} from "@/lib/email/templates";
import { notifyBookingViaSMS } from "@/lib/whatsapp";
import { syncBookingToCalendar } from "@/lib/calendar/sync";
import { logger } from "@/lib/logger";

export interface PromoteResult {
  /** True if this call performed the paid-state transition. False means
   *  the booking was already paid (replay / webhook raced us). */
  promoted: boolean;
  /** Final payment_status after the call. */
  paymentStatus: "paid" | "pending" | "failed" | "refunded" | string | null;
  /** Meeting URL if already provisioned. */
  meetingUrl: string | null;
}

/**
 * Mark a booking as paid, provision its Daily room, and send all
 * confirmations. Safe to call multiple times for the same bookingId —
 * the first successful call does the work, subsequent calls return
 * early with `promoted: false`.
 *
 * Must be called with an admin-scoped Supabase client because:
 *  - the webhook runs with no user session
 *  - the result page needs to bypass RLS to look up the expert +
 *    expert's auth.users row for email
 */
export async function promoteBookingToPaid(
  bookingId: string,
  paystackReference: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<PromoteResult> {
  // ── Idempotency check ─────────────────────────────────────
  const { data: existing, error: readError } = await supabase
    .from("bookings")
    .select("payment_status, meeting_url")
    .eq("id", bookingId)
    .maybeSingle();

  if (readError || !existing) {
    logger.error("[promote] Could not load booking", { bookingId }, readError);
    return { promoted: false, paymentStatus: null, meetingUrl: null };
  }

  if (existing.payment_status === "paid") {
    return {
      promoted: false,
      paymentStatus: "paid",
      meetingUrl: existing.meeting_url ?? null,
    };
  }

  // ── Flip to paid ──────────────────────────────────────────
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      payment_status: "paid",
      paystack_transaction_id: paystackReference,
      paid_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    logger.error("[promote] payment_status update failed", { bookingId }, updateError);
    return {
      promoted: false,
      paymentStatus: existing.payment_status ?? null,
      meetingUrl: existing.meeting_url ?? null,
    };
  }

  // Best-effort side-effects — logged but never fatal.
  const roomUrl = await provisionMeetingRoom(bookingId, supabase);
  await sendBookingConfirmations(bookingId, supabase);

  // Mirror the confirmed booking to the user's calendar
  void syncBookingToCalendar(bookingId, supabase);

  return {
    promoted: true,
    paymentStatus: "paid",
    meetingUrl: roomUrl ?? existing.meeting_url ?? null,
  };
}

// ─── Meeting room provisioning ───────────────────────────────
// Idempotent: short-circuits if meeting_room_name is already set.
// Non-throwing: all errors are logged and swallowed.
async function provisionMeetingRoom(
  bookingId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<string | null> {
  try {
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, scheduled_at, duration_minutes, meeting_room_name, meeting_url")
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !booking) {
      logger.error("[promote] Could not load booking for room provisioning", { bookingId }, error);
      return null;
    }

    if (booking.meeting_room_name) {
      return booking.meeting_url ?? null;
    }

    const room = await createRoom({
      bookingId: booking.id,
      scheduledAt: new Date(booking.scheduled_at),
      durationMinutes: booking.duration_minutes,
    });

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ meeting_room_name: room.name, meeting_url: room.url })
      .eq("id", bookingId);

    if (updateError) {
      logger.error("[promote] Room created but DB update failed", { bookingId, roomName: room.name }, updateError);
      return room.url;
    }
    return room.url;
  } catch (e) {
    logger.error("[promote] Daily room provisioning failed", { bookingId }, e);
    return null;
  }
}

// ─── Post-payment notifications ──────────────────────────────
// Sends:
//   1. Booker confirmation email
//   2. Booker SMS (if phone on file)
//   3. Expert notification email (if they've claimed the account)
// All sends are best-effort — logged and swallowed on failure.
async function sendBookingConfirmations(
  bookingId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<void> {
  try {
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        `id, user_id, expert_id, scheduled_at, duration_minutes,
         amount, currency, notes, expert_payout,
         experts(name, specialty, user_id)`
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !booking) {
      logger.error("[promote] Could not load booking for confirmations", { bookingId }, error);
      return;
    }

    // Supabase returns the joined `experts` as either an object or a
    // single-element array — normalize.
    const expertRaw = booking.experts as
      | { name: string; specialty: string; user_id: string | null }
      | Array<{ name: string; specialty: string; user_id: string | null }>
      | null;
    const expert = Array.isArray(expertRaw) ? expertRaw[0] : expertRaw;

    if (!expert) {
      logger.warn("[promote] Booking has no expert record — skipping emails", { bookingId });
      return;
    }

    const [{ data: profile }, { data: userRes }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", booking.user_id)
        .maybeSingle(),
      supabase.auth.admin.getUserById(booking.user_id),
    ]);

    const bookerEmail = userRes?.user?.email ?? null;
    const bookerName = profile?.full_name || "Member";
    const bookerPhone = profile?.phone ?? null;

    const scheduledDate = new Date(booking.scheduled_at).toLocaleDateString(
      "en-ZA",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    // 1. Booker email
    if (bookerEmail) {
      const { subject, html } = bookingConfirmationEmail({
        userName: bookerName,
        expertName: expert.name,
        expertSpecialty: expert.specialty,
        durationMinutes: booking.duration_minutes,
        scheduledAt: scheduledDate,
        amount: booking.amount,
        currency: booking.currency,
        bookingId: booking.id,
      });
      await sendEmail({ to: bookerEmail, subject, html });
    }

    // 2. Booker SMS
    if (bookerPhone) {
      await notifyBookingViaSMS({
        userPhone: bookerPhone,
        expertName: expert.name,
        durationMinutes: booking.duration_minutes,
        scheduledAt: booking.scheduled_at,
      });
    }

    // 3. Expert email — only if claimed
    if (expert.user_id) {
      const { data: expertUserRes } = await supabase.auth.admin.getUserById(
        expert.user_id
      );
      const expertEmail = expertUserRes?.user?.email ?? null;
      if (expertEmail) {
        const { subject, html } = expertBookingNotificationEmail({
          expertName: expert.name,
          userName: bookerName,
          durationMinutes: booking.duration_minutes,
          scheduledAt: scheduledDate,
          expertPayout: booking.expert_payout,
          currency: booking.currency,
          notes: booking.notes || undefined,
        });
        await sendEmail({ to: expertEmail, subject, html });
      }
    }
  } catch (e) {
    logger.error("[promote] Confirmation send failed", { bookingId }, e);
  }
}
