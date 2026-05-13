// ============================================================
// ROSTER — /api/experts/paystack/banks
// ------------------------------------------------------------
// Thin proxy for Paystack's /bank list. We don't expose the
// Paystack secret key to the browser, so the expert dashboard
// calls this route to populate the bank dropdown. Results are
// cached for an hour (banks don't change often).
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listBanks } from "@/lib/paystack";
import { logger } from "@/lib/logger";

export const revalidate = 3600; // 1 hour

export async function GET() {
  // Only authenticated users can hit this. Experts use it during payout
  // setup; no reason for anonymous callers to have it.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const banks = await listBanks("south africa");
    // Shrink payload to what the dropdown needs
    const slim = banks.map((b) => ({
      code: b.code,
      name: b.name,
      slug: b.slug,
    }));
    return NextResponse.json({ banks: slim });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load banks";
    logger.error("[paystack/banks]", {}, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
