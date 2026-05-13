import { NextRequest, NextResponse } from "next/server";
import { initSubscriptionPayment } from "@/lib/paystack";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { InitSubscriptionSchema, formatZodError } from "@/lib/validation/schemas";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001");

export async function POST(req: NextRequest) {
  try {
    // ── Auth: derive identity from session, never from request body ──────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Validate request body ────────────────────────────────────────────────
    const parsed = InitSubscriptionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { name, tierId, billing } = parsed.data;

    // ── Idempotency: don't create duplicate pending rows ─────────────────────
    const admin = createAdminClient();
    const { data: existingPending } = await admin
      .from("subscriptions")
      .select("tx_ref")
      .eq("user_id", user.id)
      .eq("plan", `${tierId}_${billing}`)
      .eq("status", "pending")
      .single();

    if (existingPending) {
      logger.info("[Paystack Init] Re-using existing pending subscription", { userId: user.id, tierId, billing });
    }

    const redirectUrl = `${APP_URL}/api/paystack/callback?tierId=${tierId}&billing=${billing}`;

    const { paymentLink, txRef } = await initSubscriptionPayment({
      email: user.email!,
      name,
      tierId,
      billing,
      redirectUrl,
    });

    // Record pending subscription via service role (bypasses RLS).
    // plan value = "{tierId}_{billing}" — matches the CHECK constraint.
    const { error: dbError } = await admin.from("subscriptions").insert({
      user_id: user.id,
      tx_ref: txRef,
      plan: `${tierId}_${billing}`,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      logger.error("[Paystack Init] Failed to create pending subscription", { userId: user.id }, dbError);
      return NextResponse.json({ error: "Failed to record subscription" }, { status: 500 });
    }

    return NextResponse.json({ paymentLink, txRef });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Paystack Init] Error", {}, message);
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
  }
}
