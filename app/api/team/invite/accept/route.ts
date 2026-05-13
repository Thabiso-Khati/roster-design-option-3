export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — POST /api/team/invite/accept
// ------------------------------------------------------------
// Accepts a team invite via either:
//   • token — magic-link token from the invite email
//   • code  — short alphanumeric code shared manually
//
// The caller must be authenticated. On success, the
// team_members row is updated:
//   member_user_id = auth.uid()
//   status         = 'active'
//   accepted_at    = now()
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { token, code } = body as { token?: string; code?: string };

    if (!token && !code) {
      return NextResponse.json(
        { error: "Provide either an invite token or invite code." },
        { status: 422 }
      );
    }

    // Look up the invite
    const query = supabase
      .from("team_members")
      .select("id, workspace_owner_id, email, role, status, member_user_id")
      .eq("status", "pending");

    const { data: invite, error: findError } = token
      ? await query.eq("invite_token", token).maybeSingle()
      : await query.eq("invite_code", (code ?? "").toUpperCase().trim()).maybeSingle();

    if (findError) {
      logger.error("[invite/accept] lookup failed", {}, findError);
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found or already used. Ask the workspace owner to re-send." },
        { status: 404 }
      );
    }

    // Ensure the authenticated user's email matches the invite email
    // (not strictly required for codes, but prevents workspace hijacking)
    if (
      invite.email &&
      user.email &&
      invite.email.toLowerCase() !== user.email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: `This invite was sent to ${invite.email}. Please sign in with that email address.` },
        { status: 403 }
      );
    }

    // Prevent the workspace owner from accepting their own invite
    if (invite.workspace_owner_id === user.id) {
      return NextResponse.json(
        { error: "You cannot join your own workspace as a team member." },
        { status: 422 }
      );
    }

    // Accept the invite
    const { error: updateError } = await supabase
      .from("team_members")
      .update({
        member_user_id: user.id,
        status:         "active",
        accepted_at:    new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (updateError) {
      logger.error("[invite/accept] accept failed", { inviteId: invite.id }, updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    logger.info("[invite/accept] invite accepted", {
      inviteId:  invite.id,
      memberId:  user.id,
      ownerId:   invite.workspace_owner_id,
    });

    return NextResponse.json({
      ok:                true,
      workspace_owner_id: invite.workspace_owner_id,
    });
  } catch (err) {
    logger.error("[invite/accept] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
