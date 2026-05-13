// ============================================================
// ROSTER — /api/team
// ------------------------------------------------------------
// GET  — list all team members for the authenticated owner
// POST — invite a new team member (email + role)
//
// Seat limits (from TIERS):
//   free           → 1 seat  (owner only — invites blocked)
//   pro            → 1 seat  (owner only — invites blocked)
//   agency         → 3 seats (owner + 2)
//   enterprise     → 10 seats
//   enterprise_max → 30 seats
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTier } from "@/lib/vault/get-user-tier";
import { TIERS } from "@/lib/constants";
import { DEFAULT_PERMISSIONS } from "@/lib/workspace/context";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

// ── Seat limit lookup ─────────────────────────────────────────

function getSeatLimit(tierId: string): number {
  const tier = TIERS.find(t => t.id === tierId);
  return tier?.seats ?? 1;
}

// ── GET — list team members ───────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { data, error } = await supabase
      .from("team_members")
      .select("id, email, role, permissions, status, invite_code, invited_at, accepted_at, member_user_id")
      .eq("workspace_owner_id", user.id)
      .neq("status", "revoked")
      .order("invited_at", { ascending: false });

    if (error) {
      logger.error("[team GET] query failed", {}, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members: data ?? [] });
  } catch (err) {
    logger.error("[team GET] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST — invite a team member ───────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { email, role, permissions } = body as {
      email?: string;
      role?: string;
      permissions?: Record<string, { view: boolean; edit: boolean }>;
    };

    // Validate inputs
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 422 });
    }

    if (!role || !["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Role must be admin, editor, or viewer." }, { status: 422 });
    }

    if (email.toLowerCase() === user.email?.toLowerCase()) {
      return NextResponse.json({ error: "You cannot invite yourself." }, { status: 422 });
    }

    // Check seat limit
    const tierId    = await getUserTier(supabase, user.id);
    const tier      = TIERS.find(t => t.id === tierId);
    const seatLimit = getSeatLimit(tierId);

    const { count: activeCount } = await supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("workspace_owner_id", user.id)
      .in("status", ["active", "pending"]);

    // seatLimit includes the owner, so available seats = seatLimit - 1.
    // -1 means unlimited (no tier currently uses this, but guard for safety).
    const usedSeats = (activeCount ?? 0) + 1; // +1 for the owner
    if (seatLimit !== -1 && usedSeats >= seatLimit) {
      const tierName = tier?.name ?? tierId;
      return NextResponse.json(
        {
          error: `Your ${tierName} plan includes ${seatLimit} seat${seatLimit === 1 ? "" : "s"}. Upgrade to add more team members.`,
          code:  "SEAT_LIMIT_REACHED",
        },
        { status: 402 }
      );
    }

    // Build permissions (use defaults + any overrides provided)
    const resolvedPermissions = {
      ...DEFAULT_PERMISSIONS,
      ...(permissions ?? {}),
    };

    // Upsert invite (handle re-invite gracefully)
    const { data: member, error: upsertError } = await supabase
      .from("team_members")
      .upsert(
        {
          workspace_owner_id: user.id,
          email:              email.toLowerCase().trim(),
          role,
          permissions:        resolvedPermissions,
          status:             "pending",
          invited_at:         new Date().toISOString(),
          accepted_at:        null,
          member_user_id:     null,
        },
        { onConflict: "workspace_owner_id,email" }
      )
      .select("id, email, role, permissions, status, invite_token, invite_code, invited_at")
      .single();

    if (upsertError) {
      logger.error("[team POST] upsert failed", {}, upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // Send invite email via Supabase admin (best-effort)
    try {
      const admin = createAdminClient();
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/invite/${member.invite_token}`;

      await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteUrl,
        data: {
          invited_by:    user.email,
          workspace_id:  user.id,
          invite_token:  member.invite_token,
        },
      });
    } catch (emailErr) {
      // Email failure is non-fatal — the code can be shared manually
      logger.warn("[team POST] invite email failed — code available", { email });
    }

    logger.info("[team POST] member invited", { ownerId: user.id, email, role });

    return NextResponse.json({
      ok:     true,
      member: {
        id:          member.id,
        email:       member.email,
        role:        member.role,
        permissions: member.permissions,
        status:      member.status,
        invite_code: member.invite_code,
        invited_at:  member.invited_at,
      },
    });
  } catch (err) {
    logger.error("[team POST] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
