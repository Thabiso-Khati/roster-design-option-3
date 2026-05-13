export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/bookings/[id]
// DELETE — remove a booking (user's own records only)
// Only past, cancelled, or pending-unpaid bookings may be deleted.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Fetch the booking first to verify ownership + deletability
  const { data: booking, error: fetchErr } = await admin
    .from("bookings")
    .select("id, user_id, booking_status, payment_status, scheduled_at")
    .eq("id", id)
    .single();

  if (fetchErr || !booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Only allow deletion of non-active bookings:
  // past confirmed, completed, cancelled, or pending-unpaid
  const now = new Date();
  const scheduledAt = new Date(booking.scheduled_at);
  const isPast = scheduledAt < now;
  const isDeletable =
    booking.booking_status === "cancelled" ||
    booking.booking_status === "completed" ||
    booking.payment_status === "pending" ||
    isPast;

  if (!isDeletable) {
    return NextResponse.json(
      { error: "Active upcoming bookings cannot be deleted. Cancel first." },
      { status: 409 }
    );
  }

  const { error: deleteErr } = await admin
    .from("bookings")
    .delete()
    .eq("id", id);

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
