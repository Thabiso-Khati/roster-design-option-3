export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";
import { logger } from "@/lib/logger";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001");

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // Paystack sends `reference` and `trxref` (both identical) as query params.
  // NOTE: userId is intentionally NOT read from query params — user identity is
  // derived from the subscription row in the database (set by the initialise
  // route using the server session) to prevent spoofing.
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const tierId  = searchParams.get("tierId")  || "pro";
  const billing = (searchParams.get("billing") || "monthly") as "monthly" | "annual";

  if (!reference) {
    return NextResponse.redirect(new URL(`/auth/signup?error=payment_failed`, APP_URL));
  }

  const adminSupabase = createAdminClient();

  // ── Idempotency: already processed? ─────────────────────────────
  const { data: existingRow } = await adminSupabase
    .from("subscriptions")
    .select("status, user_id")
    .eq("tx_ref", reference)
    .single();

  if (existingRow?.status === "active") {
    // Payment already confirmed (e.g. duplicate callback redirect) — safe no-op
    logger.info("[Paystack Callback] Transaction already activated, skipping", { reference });
    return NextResponse.redirect(new URL("/dashboard?welcome=1", APP_URL));
  }

  // ── Verify with Paystack ─────────────────────────────────────────
  const { verified, data: txData } = await verifyTransaction(reference);
  if (!verified) {
    return NextResponse.redirect(new URL(`/auth/signup?error=verification_failed`, APP_URL));
  }

  // ── Activate subscription in DB ──────────────────────────────────
  const { error: updateError, data: updatedRows } = await adminSupabase
    .from("subscriptions")
    .update({
      status: "active",
      paystack_transaction_id: reference,
      activated_at: new Date().toISOString(),
      plan_data: txData,
    })
    .eq("tx_ref", reference)
    .select("user_id");

  if (updateError) {
    logger.error("[Paystack Callback] Subscription update error", {}, updateError);
    return NextResponse.redirect(new URL(`/auth/signup?error=activation_failed`, APP_URL));
  }

  if (!updatedRows || updatedRows.length === 0) {
    logger.error(`[Paystack Callback] No subscription row found for tx_ref=${reference}.`);
    return NextResponse.redirect(new URL(`/auth/signup?error=subscription_missing`, APP_URL));
  }

  // ── Send welcome email ───────────────────────────────────────────
  // Derive the user from the subscription row — never from query params.
  const userId = updatedRows[0].user_id as string | undefined;
  if (userId) {
    try {
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      const { data: authUser } = await adminSupabase.auth.admin.getUserById(userId);
      const email = authUser?.user?.email;

      if (email && profile) {
        const { subject, html } = welcomeEmail({
          name: profile.full_name || "Manager",
          tierId,
          billing,
          dashboardUrl: `${APP_URL}/dashboard`,
        });
        await sendEmail({ to: email, subject, html });
      }
    } catch (emailErr) {
      // Non-fatal — subscription is already activated; log and continue
      logger.error("[Paystack Callback] Failed to send welcome email", { userId }, emailErr);
    }
  }

  // All good — redirect to dashboard
  return NextResponse.redirect(new URL("/dashboard?welcome=1", APP_URL));
}
