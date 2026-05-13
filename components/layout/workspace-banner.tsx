"use client";

// ============================================================
// ROSTER — WorkspaceBanner
// ------------------------------------------------------------
// Shown only to team members (not owners). Displays a slim
// top bar: "Viewing [Owner Name]'s workspace · [Role]"
// so team members always know whose data they're looking at.
// ============================================================

import { useWorkspace } from "@/context/workspace-context";
import { Users } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  admin:  "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const ROLE_COLOR: Record<string, string> = {
  admin:  "text-brand bg-brand/10 border-brand/20",
  editor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  viewer: "text-text-muted bg-white/5 border-white/10",
};

export function WorkspaceBanner() {
  const { isOwner, loading, ownerName, role } = useWorkspace();

  // Hide for owners and while loading
  if (loading || isOwner || !role || role === "owner") return null;

  const displayName = ownerName ? `${ownerName}'s workspace` : "another workspace";
  const roleBadge   = ROLE_LABEL[role] ?? role;
  const roleColors  = ROLE_COLOR[role] ?? ROLE_COLOR.viewer;

  return (
    <div className="w-full bg-surface-2 border-b border-border px-4 sm:px-6 py-2 flex items-center gap-3">
      <Users size={13} className="text-text-muted flex-shrink-0" />
      <p className="text-xs text-text-muted flex-1 min-w-0 truncate">
        Viewing{" "}
        <span className="text-text-primary font-medium">{displayName}</span>
      </p>
      <span className={`text-[10px] font-bold uppercase tracking-widest border rounded-full px-2.5 py-0.5 flex-shrink-0 ${roleColors}`}>
        {roleBadge}
      </span>
    </div>
  );
}
