export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initBookingPayment } from "@/lib/paystack";
import { BOOKING_COMMISSION } from "@/lib/constants";
import { sendEmail } from "@/lib/email/send";
import { bookingConfirmationEmail, expertBookingNotificationEmail } from "@/lib/email/templates";
import { notifyBookingViaSMS } from "@/lib/whatsapp";
import { promoteBookingToPaid } from "@/lib/bookings/promote";
import { syncBookingToCalendar } from "@/lib/calendar/sync";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/lib/logger";
import { CreateBookingSchema, formatZodError } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ── Validate request body ──────────────────────────────────────────────
    const parsed = CreateBookingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { expertId, sessionId, durationMinutes, amount, currency, scheduledAt, notes } = parsed.data;

    // Verify active subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();
    if (!sub) {
      return NextResponse.json({ error: "Active subscription required to book sessions." }, { status: 403 });
    }

    // Fetch expert
    const { data: expert } = await supabase
      .from("experts")
      .select("name, specialty, paystack_subaccount_code, user_id")
      .eq("id", expertId)
      .single();
    if (!expert) return NextResponse.json({ error: "Expert not found" }, { status: 404 });

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    const bookingId = uuidv4();
    const platformCommission = Math.round(amount * BOOKING_COMMISSION);
    const expertPayout = amount - platformCommission;

    // ── DEMO MODE — expert has no Paystack subaccount ────────────────────────
    // Promote the booking immediately so the Daily.co room is provisioned
    // and confirmation emails fire, mirroring the post-payment flow.
    // ACTIVATE: remove this demo branch + require paystack_subaccount_code when paid bookings go live.
    if (!expert.paystack_subaccount_code) {
      const { error: demoBookingError } = await supabase.from("bookings").insert({
        id: bookingId,
        user_id: user.id,
        expert_id: expertId,
        session_id: sessionId,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        amount,
        currency,
        platform_commission: platformCommission,
        expert_payout: expertPayout,
        notes: notes || null,
        payment_status: "pending",
        booking_status: "confirmed",
      });
      if (demoBookingError) return NextResponse.json({ error: demoBookingError.message }, { status: 500 });

      const admin = createAdminClient();
      const promoted = await promoteBookingToPaid(bookingId, `DEMO_${bookingId}`, admin);

      // Mirror to calendar (best-effort — non-fatal)
      void syncBookingToCalendar(bookingId, admin);

      return NextResponse.json({
        bookingId,
        paymentLink: null,
        meetingUrl: promoted.meetingUrl,
        success: true,
        demo: true,
      });
    }

    // ── PAID PATH — get payment link FIRST, then persist ─────────────────────
    // This ordering is intentional: if Paystack fails, no booking row is created
    // and there is no orphaned pending record to clean up. The tx_ref is written
    // in a single insert so there is also no separate update step that could race.
    let paymentResult: { paymentLink: string; txRef: string };
    try {
      paymentResult = await initBookingPayment({
        email: user.email!,
        name: profile?.full_name || user.email!,
        phone: profile?.phone,
        amount,
        currency,
        expertSubaccountCode: expert.paystack_subaccount_code,
        expertName: expert.name,
        sessionDurationMinutes: durationMinutes,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings?booking=${bookingId}`,
        bookingId,
      });
    } catch (paystackErr) {
      logger.error("[bookings/create] Paystack init failed — no booking row created", { bookingId }, paystackErr);
      return NextResponse.json({ error: "Payment initialisation failed. Please try again." }, { status: 502 });
    }

    // Paystack succeeded — now persist the booking with tx_ref in one write
    const { error: bookingError } = await supabase.from("bookings").insert({
      id: bookingId,
      user_id: user.id,
      expert_id: expertId,
      session_id: sessionId,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      amount,
      currency,
      platform_commission: platformCommission,
      expert_payout: expertPayout,
      notes: notes || null,
      tx_ref: paymentResult.txRef,
      payment_status: "pending",
      booking_status: "confirmed",
    });
    if (bookingError) {
      logger.error("[bookings/create] Booking insert failed after Paystack init", { bookingId, txRef: paymentResult.txRef }, bookingError);
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    const paymentLink = paymentResult.paymentLink;

    // Send confirmation email to user
    const scheduledDate = new Date(scheduledAt).toLocaleDateString("en-ZA", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const { subject: userSubject, html: userHtml } = bookingConfirmationEmail({
      userName: profile?.full_name || "Member",
      expertName: expert.name,
      expertSpecialty: expert.specialty,
      durationMinutes,
      scheduledAt: scheduledDate,
      amount,
      currency,
      bookingId,
    });
    await sendEmail({ to: user.email!, subject: userSubject, html: userHtml });

    // SMS fallback — reaches users on low data or without email access
    if (profile?.phone) {
      await notifyBookingViaSMS({
        userPhone: profile.phone,
        expertName: expert.name,
        durationMinutes,
        scheduledAt,
      });
    }

    // Send notification email to expert (look up their auth email via admin client)
    if (expert.user_id) {
      const admin = createAdminClient();
      const { data: expertAuthUser } = await admin.auth.admin.getUserById(expert.user_id);
      const expertEmail = expertAuthUser?.user?.email;
      if (expertEmail) {
        const { subject: expertSubject, html: expertHtml } = expertBookingNotificationEmail({
          expertName: expert.name,
          userName: profile?.full_name || "A ROSTER member",
          durationMinutes,
          scheduledAt: scheduledDate,
          expertPayout,
          currency,
          notes,
        });
        await sendEmail({ to: expertEmail, subject: expertSubject, html: expertHtml });
      } else {
        logger.warn("[bookings/create] Expert has no auth email; skipping notification", { expertId });
      }
    }

    return NextResponse.json({ bookingId, paymentLink, success: true });
  } catch (err) {
    logger.error("[bookings/create] unhandled error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
