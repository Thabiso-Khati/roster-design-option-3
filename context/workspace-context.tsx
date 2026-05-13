"use client";

// ============================================================
// ROSTER — WorkspaceContext
// ------------------------------------------------------------
// Provides workspace ownership / role / permission data to all
// client components inside the dashboard layout.
//
// Usage:
//   const { ownerId, role, isOwner, can } = useWorkspace();
//   if (!can("artists", "edit")) { ... }
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  WorkspaceContext as WorkspaceCtx,
  WorkspacePermissions,
  WorkspaceRole,
} from "@/lib/workspace/context";

// ── Re-export types so consumers only import from this file ──

export type { WorkspaceRole, WorkspacePermissions };

// ── Context shape ─────────────────────────────────────────────

interface WorkspaceContextValue {
  /** true while the initial fetch is in flight */
  loading:   boolean;
  /** The logged-in user's own ID (null if not yet loaded) */
  userId:    string | null;
  /** Workspace owner's ID — queries should filter by this */
  ownerId:   string | null;
  /** Display name of the owner (null for owners themselves) */
  ownerName: string | null;
  /** true when the user owns their workspace */
  isOwner:   boolean;
  /** Role within the workspace */
  role:      WorkspaceRole | null;
  /**
   * Permission helper — returns true if the current role/permissions
   * allow the given action on the given area.
   * Owners and admins always return true.
   */
  can: (area: keyof WorkspacePermissions, action: "view" | "edit") => boolean;
}

// ── Default / loading state ───────────────────────────────────

// Locked by default — no permissions granted until auth confirms.
// Consumers should check `loading` to show skeletons; once loading
// is false the real role/permissions are in place.
const defaultValue: WorkspaceContextValue = {
  loading:   true,
  userId:    null,
  ownerId:   null,
  ownerName: null,
  isOwner:   false,   // locked until confirmed
  role:      null,
  can:       () => false, // deny while loading (fail-secure)
};

const WorkspaceContext = createContext<WorkspaceContextValue>(defaultValue);

// ── Provider ─────────────────────────────────────────────────

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceContextValue>(defaultValue);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/workspace/me")
      .then(r => r.ok ? r.json() : null)
      .then((data: WorkspaceCtx | null) => {
        if (cancelled || !data) return;

        setState({
          loading:   false,
          userId:    data.userId,
          ownerId:   data.ownerId,
          ownerName: data.ownerName,
          isOwner:   data.isOwner,
          role:      data.role,
          can: (area, action) => {
            if (data.role === "owner" || data.role === "admin") return true;
            return (data.permissions?.[area]?.[action]) ?? false;
          },
        });
      })
      .catch(() => {
        if (!cancelled) setState(prev => ({ ...prev, loading: false }));
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <WorkspaceContext.Provider value={state}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────

export function useWorkspace(): WorkspaceContextValue {
  return useContext(WorkspaceContext);
}
