// ============================================================
// ROSTER — /api/bookings/[id]/meeting/token
// ------------------------------------------------------------
// POST: mints a short-lived Daily meeting token for this booking.
//
// Access gates (in order):
//   1. Caller is authenticated
//   2. Caller is either the booker (user_id) or the expert
//      (experts.user_id matches) on this booking
//   3. Booking is paid + not cancelled
//   4. Current time is within the join window:
//        [scheduled_at - 15min, scheduled_at + duration + 30min]
//   5. Room exists (meeting_room_name is populated)
//
// On success, returns { token, roomUrl, role } where role is
// either 'expert' or 'user' — used by the meeting page to
// personalize the welcome ("Welcome back, {expert name}").
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mintMeetingToken, roomUrlFor } from "@/lib/daily/client";
import { logger } from "@/lib/logger";

// Window the Join Session button is actually usable
const JOIN_BEFORE_MINUTES = 15;
const JOIN_AFTER_END_MINUTES = 30;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Use admin client for the cross-table fetch — we enforce access
    // manually below, no RLS shortcut.
    //
    // NOTE: split into two queries instead of one embed because
    // `bookings.user_id` and `profiles.id` both FK to auth.users(id)
    // (indirect relationship, not direct) — Supabase's relational
    // embed parser can't auto-resolve `profiles:user_id (...)` and
    // the whole query fails with "Booking not found".
    const admin = createAdminClient();

    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select(
        `
        id, user_id, expert_id, scheduled_at, duration_minutes,
        payment_status, booking_status,
        meeting_room_name, meeting_url,
        experts ( id, user_id, name )
      `
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found", detail: bookingError?.message },
        { status: 404 }
      );
    }

    // Fetch the booker's profile separately (see note above)
    const { data: profileRow } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", booking.user_id)
      .maybeSingle();

    // ── Role check ────────────────────────────────────────────
    const expertRow = Array.isArray(booking.experts)
      ? booking.experts[0]
      : (booking.experts as { id: string; user_id: string; name: string } | null);

    const isBooker = booking.user_id === user.id;
    const isExpert = expertRow?.user_id === user.id;

    if (!isBooker && !isExpert) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Payment / cancel check ────────────────────────────────
    if (booking.payment_status !== "paid") {
      return NextResponse.json(
        { error: "This booking hasn't been paid for yet." },
        { status: 402 }
      );
    }
    if (
      booking.booking_status === "cancelled" ||
      booking.booking_status === "no_show_expert" ||
      booking.booking_status === "no_show_user"
    ) {
      return NextResponse.json(
        { error: "This booking has been cancelled." },
        { status: 410 }
      );
    }

    // ── Join window check ─────────────────────────────────────
    const now = Date.now();
    const scheduledMs = new Date(booking.scheduled_at).getTime();
    const windowStart = scheduledMs - JOIN_BEFORE_MINUTES * 60_000;
    const windowEnd =
      scheduledMs +
      booking.duration_minutes * 60_000 +
      JOIN_AFTER_END_MINUTES * 60_000;

    if (now < windowStart) {
      return NextResponse.json(
        {
          error: `Session hasn't opened yet. You can join from ${JOIN_BEFORE_MINUTES} minutes before the scheduled time.`,
          opensAt: new Date(windowStart).toISOString(),
        },
        { status: 425 } // 425 Too Early
      );
    }
    if (now > windowEnd) {
      return NextResponse.json(
        { error: "This session has ended." },
        { status: 410 }
      );
    }

    // ── Room exists ───────────────────────────────────────────
    if (!booking.meeting_room_name) {
      return NextResponse.json(
        {
          error:
            "Meeting room hasn't been provisioned yet. Try again in a moment or contact support.",
        },
        { status: 503 }
      );
    }

    // ── Build display name for the token ──────────────────────
    const role: "expert" | "user" = isExpert ? "expert" : "user";
    const displayName = isExpert
      ? expertRow?.name || "Expert"
      : profileRow?.full_name || "Manager";

    // ── Mint the token ────────────────────────────────────────
    const token = await mintMeetingToken({
      roomName: booking.meeting_room_name,
      userId: user.id,
      userName: displayName,
      role,
    });

    return NextResponse.json({
      token,
      roomUrl: booking.meeting_url || roomUrlFor(booking.meeting_room_name),
      role,
      displayName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[bookings/meeting/token] Error", {}, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
