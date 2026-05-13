// ============================================================
// ROSTER — /api/team/[id]
// ------------------------------------------------------------
// PATCH  — update role and/or permissions for a team member
// DELETE — revoke a team member's access
//
// Only the workspace owner can call these routes.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

// ── PATCH — update role / permissions ────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { role, permissions } = body as {
      role?: string;
      permissions?: Record<string, { view: boolean; edit: boolean }>;
    };

    if (
      role !== undefined &&
      !["admin", "editor", "viewer"].includes(role)
    ) {
      return NextResponse.json(
        { error: "Role must be admin, editor, or viewer." },
        { status: 422 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (role !== undefined)        updates.role        = role;
    if (permissions !== undefined) updates.permissions = permissions;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 422 });
    }

    const { data, error } = await supabase
      .from("team_members")
      .update(updates)
      .eq("id", id)
      .eq("workspace_owner_id", user.id)   // owner-scope guard
      .select("id, email, role, permissions, status")
      .single();

    if (error) {
      logger.error("[team PATCH] update failed", { memberId: id }, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    logger.info("[team PATCH] member updated", { ownerId: user.id, memberId: id });
    return NextResponse.json({ ok: true, member: data });
  } catch (err) {
    logger.error("[team PATCH] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE — revoke access ────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { error } = await supabase
      .from("team_members")
      .update({ status: "revoked", member_user_id: null })
      .eq("id", id)
      .eq("workspace_owner_id", user.id);   // owner-scope guard

    if (error) {
      logger.error("[team DELETE] revoke failed", { memberId: id }, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info("[team DELETE] member revoked", { ownerId: user.id, memberId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[team DELETE] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
