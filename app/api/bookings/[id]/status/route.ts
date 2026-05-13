// ============================================================
// ROSTER — /api/bookings/[id]/status
// ------------------------------------------------------------
// Lightweight read endpoint for the payment-result poller. After
// Paystack redirects the user back to us, the result page polls
// this until the booking flips to paid (or a timeout hits and we
// tell them to check their email).
//
// Scoped to the authenticated user — an expert shouldn't be able
// to use this to probe someone else's booking state.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, payment_status, booking_status, meeting_url, paid_at, tx_ref"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    bookingId: booking.id,
    paymentStatus: booking.payment_status as string,
    bookingStatus: booking.booking_status as string,
    meetingUrl: (booking.meeting_url as string | null) ?? null,
    paidAt: (booking.paid_at as string | null) ?? null,
    txRef: (booking.tx_ref as string | null) ?? null,
  });
}
