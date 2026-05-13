// ============================================================
// ROSTER — Server-side workspace context
// ------------------------------------------------------------
// Determines whether the currently authenticated user is a
// workspace owner or an active team member, and returns all
// the information needed to scope data queries correctly.
//
// Usage in server components / API routes:
//   const ctx = await getWorkspaceContext();
//   if (!ctx) return; // not authenticated
//   const { ownerId, role, permissions } = ctx;
// ============================================================

import { createClient } from "@/lib/supabase/server";

// ── Types ────────────────────────────────────────────────────

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export interface AreaPermission {
  view: boolean;
  edit: boolean;
}

export interface WorkspacePermissions {
  artists:   AreaPermission;
  releases:  AreaPermission;
  reminders: AreaPermission;
  bookings:  AreaPermission;
  vault:     AreaPermission;
  assistant: AreaPermission;
  analytics: AreaPermission;
  calendar:  AreaPermission;
}

export interface WorkspaceContext {
  /** The logged-in user's own ID */
  userId: string;
  /** The workspace being accessed (owner's ID). Always equals userId for owners. */
  ownerId: string;
  /** Display name of the workspace owner (null if not set) */
  ownerName: string | null;
  /** true when userId === ownerId */
  isOwner: boolean;
  /** Role within the workspace */
  role: WorkspaceRole;
  /**
   * Permission map — null for owners and admin-role members (they have
   * full access to everything; no need to check per-area).
   */
  permissions: WorkspacePermissions | null;
}

// ── Default permissions (used as fallback + for new invites) ──

export const DEFAULT_PERMISSIONS: WorkspacePermissions = {
  artists:   { view: true,  edit: false },
  releases:  { view: true,  edit: false },
  reminders: { view: true,  edit: false },
  bookings:  { view: true,  edit: false },
  vault:     { view: false, edit: false },
  assistant: { view: false, edit: false },
  analytics: { view: true,  edit: false },
  calendar:  { view: true,  edit: false },
};

// ── Server function ───────────────────────────────────────────

/**
 * Returns the workspace context for the currently authenticated user.
 * Returns null when not authenticated or Supabase is not configured.
 */
export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if this user is an active team member of another workspace
    const { data: membership } = await supabase
      .from("team_members")
      .select(`
        workspace_owner_id,
        role,
        permissions,
        profiles:workspace_owner_id (full_name)
      `)
      .eq("member_user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      // This user owns their workspace
      return {
        userId:      user.id,
        ownerId:     user.id,
        ownerName:   null,
        isOwner:     true,
        role:        "owner",
        permissions: null,
      };
    }

    const ownerProfile = Array.isArray(membership.profiles)
      ? membership.profiles[0]
      : membership.profiles;

    return {
      userId:      user.id,
      ownerId:     membership.workspace_owner_id as string,
      ownerName:   (ownerProfile as { full_name?: string } | null)?.full_name ?? null,
      isOwner:     false,
      role:        membership.role as WorkspaceRole,
      permissions: (membership.permissions as WorkspacePermissions) ?? DEFAULT_PERMISSIONS,
    };
  } catch {
    return null;
  }
}

// ── Permission helpers ────────────────────────────────────────

/** Returns true if the context allows viewing a given area. */
export function canView(
  ctx: WorkspaceContext,
  area: keyof WorkspacePermissions,
): boolean {
  if (ctx.role === "owner" || ctx.role === "admin") return true;
  return ctx.permissions?.[area]?.view ?? false;
}

/** Returns true if the context allows editing a given area. */
export function canEdit(
  ctx: WorkspaceContext,
  area: keyof WorkspacePermissions,
): boolean {
  if (ctx.role === "owner" || ctx.role === "admin") return true;
  return ctx.permissions?.[area]?.edit ?? false;
}
