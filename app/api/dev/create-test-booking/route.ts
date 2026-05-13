// ============================================================
// ROSTER — DEV ONLY: /api/dev/create-test-booking
// ------------------------------------------------------------
// Creates a paid, confirmed booking scheduled ~1 minute out,
// provisions a real Daily room, and returns the booking ID so
// the founder can test the end-to-end meeting flow without
// dealing with Paystack, expert onboarding, or seed data.
//
// The user is recorded as BOTH booker and expert on this test
// booking — that way the token endpoint's "is either party"
// gate passes, and the meeting page joins you as role=expert.
//
// Admin-gated to a single email + only callable when
// ROSTER_ALLOW_DEV_TOOLS=true. Safe to deploy; harmless on prod
// as long as the env flag is off.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRoom } from "@/lib/daily/client";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/lib/logger";

const ADMIN_EMAIL = "thabiso.khati@gmail.com";

export async function POST(request: Request) {
  try {
    // ── Auth gate ───────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ── Admin + env gate ────────────────────────────────────
    const isAdmin = user.email === ADMIN_EMAIL;
    const devAllowed =
      process.env.NODE_ENV === "development" ||
      process.env.ROSTER_ALLOW_DEV_TOOLS === "true";

    if (!isAdmin || !devAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Optional query param: ?minutes=N — schedule N minutes from now.
    // Default 1 minute → already inside the 15-min pre-join window,
    // so the Join Session button lights up immediately.
    const url = new URL(request.url);
    const minutesParam = Number(url.searchParams.get("minutes"));
    const offsetMinutes =
      Number.isFinite(minutesParam) && minutesParam >= -60 && minutesParam <= 120
        ? minutesParam
        : 1;

    const admin = createAdminClient();

    // ── 0. Look for a real expert row owned by this user ────────
    //
    // If the admin-user has already claimed their own expert profile
    // (via the normal onboarding flow), mirror its lowest-priced
    // session here so the test booking reflects real pricing rather
    // than a hardcoded fixture. Fall back to R800 if none exists.
    const { data: realExpert } = await admin
      .from("experts")
      .select("id, expert_sessions(duration_minutes, price, currency)")
      .eq("user_id", user.id)
      .not("name", "ilike", "[TEST]%")
      .limit(1)
      .maybeSingle();

    const realSessions = (realExpert?.expert_sessions ?? []) as Array<{
      duration_minutes: number;
      price: number;
      currency: string;
    }>;
    const cheapestSession = realSessions
      .slice()
      .sort((a, b) => a.price - b.price)[0];

    const mirrorDuration = cheapestSession?.duration_minutes ?? 30;
    const mirrorPrice = cheapestSession?.price ?? 800;
    const mirrorCurrency = cheapestSession?.currency ?? "ZAR";

    // ── 1. Upsert a test expert (user is both booker + expert) ───
    //
    // We re-use the same row across test bookings by looking up
    // the existing "[TEST] ROSTER Self Expert" row for this user.
    const TEST_EXPERT_NAME = "[TEST] ROSTER Self Expert";
    let expertId: string;

    const { data: existingExpert } = await admin
      .from("experts")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", TEST_EXPERT_NAME)
      .maybeSingle();

    if (existingExpert) {
      expertId = existingExpert.id;
      // Older rows may have been created with is_active=false — flip it
      // on so the bookings page (regular RLS client) can read the name.
      await admin
        .from("experts")
        .update({ is_active: true })
        .eq("id", expertId);
    } else {
      const { data: newExpert, error: expertError } = await admin
        .from("experts")
        .insert({
          user_id: user.id,
          name: TEST_EXPERT_NAME,
          bio: "Dev-only test expert — created by /api/dev/create-test-booking. You are both booker and expert on this booking for end-to-end testing.",
          specialty: "ROSTER Platform Testing",
          country: "South Africa",
          is_verified: false,
          // Must be is_active=true so the bookings page (regular client,
          // not admin) can read the expert name via RLS. The "[TEST]"
          // prefix in the name keeps it obvious in any list view.
          is_active: true,
        })
        .select("id")
        .single();

      if (expertError || !newExpert) {
        return NextResponse.json(
          { error: `Could not create test expert: ${expertError?.message}` },
          { status: 500 }
        );
      }
      expertId = newExpert.id;
    }

    // ── 2. Upsert a session type mirroring real pricing ──────
    let sessionId: string;

    const { data: existingSession } = await admin
      .from("expert_sessions")
      .select("id")
      .eq("expert_id", expertId)
      .eq("duration_minutes", mirrorDuration)
      .maybeSingle();

    if (existingSession) {
      sessionId = existingSession.id;
      // Keep the test session in sync with the user's real lowest-priced
      // session so repeat test bookings reflect current pricing.
      await admin
        .from("expert_sessions")
        .update({
          price: mirrorPrice,
          currency: mirrorCurrency,
          is_available: true,
        })
        .eq("id", sessionId);
    } else {
      const { data: newSession, error: sessionError } = await admin
        .from("expert_sessions")
        .insert({
          expert_id: expertId,
          duration_minutes: mirrorDuration,
          price: mirrorPrice,
          currency: mirrorCurrency,
          is_available: true,
        })
        .select("id")
        .single();

      if (sessionError || !newSession) {
        return NextResponse.json(
          { error: `Could not create test session: ${sessionError?.message}` },
          { status: 500 }
        );
      }
      sessionId = newSession.id;
    }

    // ── 3. Insert the booking ────────────────────────────────
    const bookingId = uuidv4();
    const scheduledAt = new Date(Date.now() + offsetMinutes * 60_000);
    const amount = mirrorPrice;
    const platformCommission = Math.round(amount * 0.2);
    const expertPayout = amount - platformCommission;

    const { error: bookingError } = await admin.from("bookings").insert({
      id: bookingId,
      user_id: user.id,
      expert_id: expertId,
      session_id: sessionId,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: mirrorDuration,
      amount,
      currency: mirrorCurrency,
      platform_commission: platformCommission,
      expert_payout: expertPayout,
      payment_status: "paid",
      booking_status: "confirmed",
      paid_at: new Date().toISOString(),
      notes: "Dev test booking — safe to delete.",
      tx_ref: `TEST-${bookingId.slice(0, 8)}-${Date.now()}`,
    });

    if (bookingError) {
      return NextResponse.json(
        { error: `Could not create booking: ${bookingError.message}` },
        { status: 500 }
      );
    }

    // ── 4. Provision a real Daily room ──────────────────────
    let roomName: string | null = null;
    let roomUrl: string | null = null;
    let roomError: string | null = null;

    try {
      const room = await createRoom({
        bookingId,
        scheduledAt,
        durationMinutes: mirrorDuration,
      });
      roomName = room.name;
      roomUrl = room.url;

      await admin
        .from("bookings")
        .update({
          meeting_room_name: roomName,
          meeting_url: roomUrl,
        })
        .eq("id", bookingId);
    } catch (e) {
      roomError =
        e instanceof Error ? e.message : "Unknown error creating Daily room";
      // Don't fail the whole request — user can still inspect the booking
      // and diagnose the Daily side.
    }

    return NextResponse.json({
      success: true,
      bookingId,
      expertId,
      sessionId,
      scheduledAt: scheduledAt.toISOString(),
      offsetMinutes,
      roomName,
      roomUrl,
      roomError,
      joinHref: `/meeting/${bookingId}`,
      bookingsHref: `/dashboard/bookings`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("[dev/create-test-booking]", {}, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
