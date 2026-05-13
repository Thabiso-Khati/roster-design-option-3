export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/experts/claim
// ------------------------------------------------------------
// Binds an approved expert row to the authenticated auth user.
//
// Security model: the caller must be signed in AND their email
// must match the `application_email` stored on the expert row
// when the admin approved them. The caller must also hold a valid
// `claim_token` that hasn't expired. Once linked, the token is
// nulled so it can't be replayed.
//
// Returns { expertId } on success. The client redirects to
// /dashboard/expert.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "You need to sign in with the email your expert application was approved under." },
        { status: 401 }
      );
    }

    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing claim token." }, { status: 400 });
    }

    // Look up the expert row by token. The row has RLS "anyone can
    // view active experts" only for is_active=true rows — but we
    // insert claim-pending rows with is_active=false, so we need
    // to bypass RLS with a service-role client for this lookup.
    //
    // We can't use `createAdminClient` here without a service-role
    // key on the caller side; instead, we rely on the fact that
    // the caller IS the target user and we're looking up by token
    // (which is only known to the intended recipient). Open an RLS
    // escape via a dedicated policy in the migration is also an
    // option, but the admin client is cleaner.
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();

    const { data: expert, error: lookupError } = await admin
      .from("experts")
      .select("id, user_id, application_email, claim_token, claim_token_expires_at")
      .eq("claim_token", token)
      .maybeSingle();

    if (lookupError) {
      logger.error("[claim] Lookup error", {}, lookupError);
      return NextResponse.json({ error: "Could not verify claim link." }, { status: 500 });
    }

    if (!expert) {
      return NextResponse.json(
        { error: "This claim link is invalid, already used, or has been revoked." },
        { status: 404 }
      );
    }

    if (expert.user_id) {
      // Defensive — token should have been cleared when user_id was set.
      return NextResponse.json(
        { error: "This expert account has already been claimed." },
        { status: 409 }
      );
    }

    if (
      expert.claim_token_expires_at &&
      new Date(expert.claim_token_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: "This claim link has expired. Email experts@rosterapp.ai to reissue." },
        { status: 410 }
      );
    }

    // Email match check — prevents someone with the token from claiming
    // under a different auth identity.
    const callerEmail = user.email.toLowerCase().trim();
    const appEmail = (expert.application_email || "").toLowerCase().trim();
    if (!appEmail || callerEmail !== appEmail) {
      return NextResponse.json(
        {
          error: `This link was issued to ${appEmail || "a different address"}. Sign in with that email to claim.`,
        },
        { status: 403 }
      );
    }

    // Bind. Clear the token so it can't be replayed.
    const { error: updateError } = await admin
      .from("experts")
      .update({
        user_id: user.id,
        claim_token: null,
        claim_token_expires_at: null,
      })
      .eq("id", expert.id);

    if (updateError) {
      logger.error("[claim] Update error", {}, updateError);
      return NextResponse.json(
        { error: "Could not complete the claim. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, expertId: expert.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("[claim]", {}, message);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
