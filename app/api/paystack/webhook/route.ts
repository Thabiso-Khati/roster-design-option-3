export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction, verifyWebhookSignature } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

// App Router route handlers receive the raw body via req.text() natively —
// no bodyParser config needed (that was a Pages Router pattern).
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";
  const secretKey = process.env.PAYSTACK_SECRET_KEY || "";

  if (!verifyWebhookSignature(rawBody, signature, secretKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { event: string; data: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, data } = payload;
  // Service-role client — webhooks run outside a user session, and the mutations
  // here (subscription/booking state flips) are server-trusted.
  const supabase = createAdminClient();

  // ── Successful charge ──────────────────────────────────────────────
  if (event === "charge.success") {
    const reference = data.reference as string;
    const status = data.status as string;

    if (status !== "success") {
      return NextResponse.json({ received: true });
    }

    // Double-verify with Paystack
    const { verified, data: verifiedData } = await verifyTransaction(reference);
    if (!verified) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    if (reference.startsWith("SUB-")) {
      // Subscription payment — idempotency: skip if already active
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("tx_ref", reference)
        .single();

      if (existing?.status === "active") {
        // Already processed — acknowledge and return without re-writing
        return NextResponse.json({ received: true });
      }

      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          paystack_transaction_id: reference,
          activated_at: new Date().toISOString(),
          plan_data: verifiedData,
        })
        .eq("tx_ref", reference);
      if (error) {
        logger.error("[webhook] subscription update failed", { reference }, error);
        // Return 503 so Paystack retries — do NOT swallow this
        return NextResponse.json({ error: "DB update failed" }, { status: 503 });
      }
    } else if (reference.startsWith("BOOK-")) {
      // Booking payment — idempotency: skip if already paid
      const bookingId = (verifiedData?.metadata as Record<string, unknown>)
        ?.booking_id as string | undefined;
      if (bookingId) {
        const { data: existingBooking } = await supabase
          .from("bookings")
          .select("payment_status")
          .eq("id", bookingId)
          .single();

        if (existingBooking?.payment_status === "paid") {
          return NextResponse.json({ received: true });
        }

        const { error } = await supabase
          .from("bookings")
          .update({
            payment_status: "paid",
            paystack_transaction_id: reference,
            paid_at: new Date().toISOString(),
          })
          .eq("id", bookingId);
        if (error) {
          logger.error("[webhook] booking update failed", { reference, bookingId }, error);
          return NextResponse.json({ error: "DB update failed" }, { status: 503 });
        }
      }
    }
  }

  // ── Subscription cancelled / disabled ─────────────────────────────
  if (event === "subscription.disable") {
    const planCode = (data.plan as Record<string, unknown>)
      ?.plan_code as string | undefined;
    if (planCode) {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("paystack_plan_code", planCode);
      if (error) {
        logger.error("[webhook] subscription cancellation failed", { planCode }, error);
        return NextResponse.json({ error: "DB update failed" }, { status: 503 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
