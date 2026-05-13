export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/experts/paystack/resolve-account
// ------------------------------------------------------------
// Given { bank_code, account_number }, asks Paystack to return
// the account holder's name so the expert can visually confirm
// before committing to the subaccount. No DB writes here; this
// is a pre-flight check.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAccount } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
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

  // Paystack ZA bank accounts are typically 9–11 digits. Guard against
  // obviously bad input before spending a Paystack API call.
  if (!/^\d{6,20}$/.test(accountNumber)) {
    return NextResponse.json(
      { error: "That doesn't look like a valid account number." },
      { status: 400 }
    );
  }

  try {
    const resolved = await resolveAccount({ bankCode, accountNumber });
    return NextResponse.json({
      accountName: resolved.accountName,
      accountNumber: resolved.accountNumber,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not verify the account.";
    // Paystack returns "Could not resolve account name. Check parameters or try again."
    // for unknown accounts — surface that directly.
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
