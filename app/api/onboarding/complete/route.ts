// ============================================================
// ROSTER — PATCH /api/onboarding/complete
// ------------------------------------------------------------
// Marks the current user's onboarding as complete and optionally
// saves their self-reported role. Called on the final step of
// the onboarding wizard before redirecting to /dashboard.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const role = typeof body.role === "string" ? body.role.trim() : null;

    const validRoles = ["manager", "artist", "label", "agency"];

    const patch: Record<string, unknown> = {
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    };

    if (role && validRoles.includes(role)) {
      patch.role = role;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...patch });

    if (error) {
      logger.error("[onboarding/complete] upsert failed", { userId: user.id }, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[onboarding/complete] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
