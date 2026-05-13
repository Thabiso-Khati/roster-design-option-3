// ============================================================
// ROSTER — /api/experts/paystack/subaccount
// ------------------------------------------------------------
// POST   → creates a Paystack subaccount for the authenticated
//          expert and stores the code + display metadata on the
//          experts row. Required before an expert can accept
//          bookings (see Go Live gating in /dashboard/expert and
//          /api/bookings/create).
// DELETE → disconnects: deactivates the subaccount on Paystack
//          (best-effort) and nulls the local columns so the
//          expert can reconnect with a different bank.
//
// We re-resolve the account via Paystack at creation time so we
// never persist a user-supplied name — everything we save comes
// back from Paystack's canonical source.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createExpertSubaccount,
  deactivateSubaccount,
  resolveAccount,
  listBanks,
} from "@/lib/paystack";
import { logger } from "@/lib/logger";

// Expert's share of each booking (Paystack splits the rest to the platform).
// This mirrors BOOKING_COMMISSION = 0.2 (platform takes 20%).
const EXPERT_SHARE_PERCENT = 80;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const bankCode = (body?.bank_code as string)?.trim();
  const accountNumber = (body?.account_number as string)?.trim();

  if (!bankCode || !accountNumber) {
    return NextResponse.json(
      { error: "Bank and account number are both required." },
      { status: 400 }
    );
  }

  // Fetch the expert row owned by this user.
  const { data: expert, error: expertError } = await supabase
    .from("experts")
    .select("id, name, paystack_subaccount_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (expertError || !expert) {
    return NextResponse.json(
      { error: "No expert profile found for this account." },
      { status: 404 }
    );
  }

  if (expert.paystack_subaccount_code) {
    return NextResponse.json(
      {
        error:
          "You already have a Paystack account connected. Disconnect first to switch banks.",
      },
      { status: 409 }
    );
  }

  try {
    // Re-resolve to get the canonical account name + look up the bank's
    // display name in parallel. We don't trust the user-supplied account
    // name — whatever Paystack returns is the source of truth.
    const [resolved, banks] = await Promise.all([
      resolveAccount({ bankCode, accountNumber }),
      listBanks("south africa"),
    ]);
    const bank = banks.find((b) => b.code === bankCode);
    if (!bank) {
      return NextResponse.json(
        { error: "That bank isn't supported." },
        { status: 400 }
      );
    }

    // Create the subaccount on Paystack
    const created = await createExpertSubaccount({
      businessName: resolved.accountName || expert.name,
      businessEmail: user.email,
      country: "south africa",
      bankCode,
      accountNumber: resolved.accountNumber,
      splitValue: EXPERT_SHARE_PERCENT,
    });

    // Persist to experts row. Admin client bypasses RLS so this works
    // even if the expert row is is_active=false (mid-onboarding).
    const admin = createAdminClient();
    const last4 = resolved.accountNumber.slice(-4);
    const { error: updateError } = await admin
      .from("experts")
      .update({
        paystack_subaccount_code: created.subaccountCode,
        paystack_subaccount_id: created.subaccountId,
        paystack_bank_name: bank.name,
        paystack_bank_code: bankCode,
        paystack_account_last4: last4,
        paystack_account_name: resolved.accountName,
        paystack_connected_at: new Date().toISOString(),
      })
      .eq("id", expert.id);

    if (updateError) {
      logger.error("[paystack/subaccount] Paystack returned OK but DB update failed", {}, updateError);
      return NextResponse.json(
        {
          error:
            "Your bank was verified by Paystack, but we couldn't save it. Try again — if the problem persists, contact support.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bankName: bank.name,
      accountLast4: last4,
      accountName: resolved.accountName,
      subaccountCode: created.subaccountCode,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not connect Paystack.";
    logger.error("[paystack/subaccount] Connect failed", {}, message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: expert } = await supabase
    .from("experts")
    .select("id, paystack_subaccount_code, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!expert) {
    return NextResponse.json({ error: "No expert profile found." }, { status: 404 });
  }

  if (!expert.paystack_subaccount_code) {
    return NextResponse.json({ success: true }); // idempotent no-op
  }

  // Disconnecting implicitly takes the expert off the market — can't
  // accept bookings without a subaccount. Flip is_active=false at the
  // same time so the public directory stays in sync.
  const admin = createAdminClient();

  // Best-effort deactivate on Paystack's side. We proceed regardless.
  await deactivateSubaccount(expert.paystack_subaccount_code);

  const { error: updateError } = await admin
    .from("experts")
    .update({
      paystack_subaccount_code: null,
      paystack_subaccount_id: null,
      paystack_bank_name: null,
      paystack_bank_code: null,
      paystack_account_last4: null,
      paystack_account_name: null,
      paystack_connected_at: null,
      is_active: false,
    })
    .eq("id", expert.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Could not disconnect. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
