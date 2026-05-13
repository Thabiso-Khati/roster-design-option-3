"use client";

// ============================================================
// ROSTER — Settings → Team section
// ------------------------------------------------------------
// Lets the workspace owner:
//   • View current team members and their roles
//   • Invite new members (email + role + permissions)
//   • Edit a member's role and per-area permissions
//   • Revoke access
//
// Only rendered when the user is the workspace owner.
// Team members see a read-only "Your access" panel instead.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Copy,
  ArrowUpRight,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
} from "lucide-react";
import { useWorkspace } from "@/context/workspace-context";
import { TIERS } from "@/lib/constants";
import type { WorkspacePermissions } from "@/lib/workspace/context";

// ── Types ─────────────────────────────────────────────────────

interface TeamMember {
  id:             string;
  email:          string;
  role:           "admin" | "editor" | "viewer";
  permissions:    WorkspacePermissions;
  status:         "pending" | "active" | "revoked";
  invite_code:    string;
  invited_at:     string;
  accepted_at:    string | null;
  member_user_id: string | null;
}

// ── Permission area labels ─────────────────────────────────────

const AREAS: { key: keyof WorkspacePermissions; label: string }[] = [
  { key: "artists",   label: "Artists"      },
  { key: "releases",  label: "Releases"     },
  { key: "reminders", label: "Reminders"    },
  { key: "bookings",  label: "Bookings"     },
  { key: "calendar",  label: "Calendar"     },
  { key: "vault",     label: "Vault"        },
  { key: "assistant", label: "AI Assistant" },
  { key: "analytics", label: "Analytics"   },
];

const DEFAULT_PERMISSIONS: WorkspacePermissions = {
  artists:   { view: true,  edit: false },
  releases:  { view: true,  edit: false },
  reminders: { view: true,  edit: false },
  bookings:  { view: true,  edit: false },
  vault:     { view: false, edit: false },
  assistant: { view: false, edit: false },
  analytics: { view: true,  edit: false },
  calendar:  { view: true,  edit: false },
};

// ── Role badge ─────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin:  "text-brand bg-brand/10 border-brand/20",
    editor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    viewer: "text-text-muted bg-white/5 border-white/10",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest border rounded-full px-2.5 py-0.5 ${styles[role] ?? styles.viewer}`}>
      {role}
    </span>
  );
}

// ── Permission toggles ────────────────────────────────────────

function PermissionGrid({
  permissions,
  role,
  onChange,
  disabled,
}: {
  permissions: WorkspacePermissions;
  role: string;
  onChange: (perms: WorkspacePermissions) => void;
  disabled: boolean;
}) {
  const isAdmin = role === "admin";

  function toggle(area: keyof WorkspacePermissions, action: "view" | "edit") {
    const updated = {
      ...permissions,
      [area]: {
        ...permissions[area],
        [action]: !permissions[area][action],
        // Disabling view also disables edit
        ...(action === "view" && permissions[area].view
          ? { view: false, edit: false }
          : {}),
      },
    };
    onChange(updated);
  }

  return (
    <div className="mt-4 border border-white/5 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_72px_72px] text-[10px] uppercase tracking-widest text-text-muted font-semibold px-4 py-2 bg-white/3 border-b border-white/5">
        <span>Area</span>
        <span className="text-center">View</span>
        <span className="text-center">Edit</span>
      </div>

      {AREAS.map(({ key, label }) => (
        <div
          key={key}
          className="grid grid-cols-[1fr_72px_72px] items-center px-4 py-2.5 border-b border-white/5 last:border-0"
        >
          <span className="text-xs text-text-primary">{label}</span>

          {/* View */}
          <div className="flex justify-center">
            <button
              type="button"
              disabled={disabled || isAdmin}
              onClick={() => toggle(key, "view")}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                isAdmin || permissions[key].view
                  ? "bg-brand/20 border-brand/40"
                  : "bg-white/5 border-white/15"
              } disabled:opacity-40 disabled:cursor-default`}
              aria-label={`${permissions[key].view ? "Revoke" : "Grant"} view access to ${label}`}
            >
              {(isAdmin || permissions[key].view) && (
                <Check size={9} className="text-brand" />
              )}
            </button>
          </div>

          {/* Edit */}
          <div className="flex justify-center">
            <button
              type="button"
              disabled={disabled || isAdmin || !permissions[key].view}
              onClick={() => toggle(key, "edit")}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                isAdmin || permissions[key].edit
                  ? "bg-amber-400/20 border-amber-400/40"
                  : "bg-white/5 border-white/15"
              } disabled:opacity-40 disabled:cursor-default`}
              aria-label={`${permissions[key].edit ? "Revoke" : "Grant"} edit access to ${label}`}
            >
              {(isAdmin || permissions[key].edit) && (
                <Check size={9} className="text-amber-400" />
              )}
            </button>
          </div>
        </div>
      ))}

      {isAdmin && (
        <p className="text-[10px] text-text-muted/60 px-4 py-2 bg-white/2">
          Admin has full access to all areas.
        </p>
      )}
    </div>
  );
}

// ── Member row ────────────────────────────────────────────────

function MemberRow({
  member,
  onUpdate,
  onRevoke,
}: {
  member: TeamMember;
  onUpdate: (id: string, role: string, perms: WorkspacePermissions) => Promise<void>;
  onRevoke: (id: string) => Promise<void>;
}) {
  const [expanded,    setExpanded]    = useState(false);
  const [role,        setRole]        = useState(member.role);
  const [permissions, setPermissions] = useState<WorkspacePermissions>(member.permissions ?? DEFAULT_PERMISSIONS);
  const [saving,      setSaving]      = useState(false);
  const [revoking,    setRevoking]    = useState(false);
  const [copied,      setCopied]      = useState(false);

  async function handleSave() {
    setSaving(true);
    await onUpdate(member.id, role, permissions);
    setSaving(false);
    setExpanded(false);
  }

  async function handleRevoke() {
    if (!confirm(`Remove ${member.email} from the workspace?`)) return;
    setRevoking(true);
    await onRevoke(member.id);
    setRevoking(false);
  }

  function copyCode() {
    navigator.clipboard.writeText(member.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isPending = member.status === "pending";

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      {/* Row summary */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-text-muted uppercase">
            {member.email[0]}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary truncate">{member.email}</p>
          <p className="text-xs text-text-muted">
            {isPending ? "Invite pending" : "Active"}
          </p>
        </div>

        <RoleBadge role={member.role} />

        {/* Invite code copy (pending only) */}
        {isPending && (
          <button
            type="button"
            onClick={copyCode}
            title="Copy invite code"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span className="font-mono">{member.invite_code}</span>
          </button>
        )}

        {/* Expand / revoke */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors"
            aria-label={expanded ? "Collapse" : "Edit member"}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={handleRevoke}
            disabled={revoking}
            className="p-1.5 text-text-muted hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors disabled:opacity-40"
            aria-label="Revoke access"
          >
            {revoking ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded edit panel */}
      {expanded && (
        <div className="border-t border-white/5 px-4 py-4 bg-white/2">
          {/* Role selector */}
          <div className="mb-4">
            <label className="text-[10px] uppercase tracking-widest text-text-muted font-semibold block mb-2">
              Role
            </label>
            <div className="flex gap-2">
              {(["admin", "editor", "viewer"] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors capitalize ${
                    role === r
                      ? "bg-brand/10 border-brand/30 text-brand"
                      : "bg-white/3 border-white/10 text-text-muted hover:border-white/20"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Permission grid */}
          <PermissionGrid
            permissions={permissions}
            role={role}
            onChange={setPermissions}
            disabled={saving}
          />

          {/* Save */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="flex-1 py-2 text-sm text-text-muted border border-white/10 rounded-xl hover:border-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-light rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Invite modal ──────────────────────────────────────────────

function InviteModal({
  onClose,
  onInvited,
}: {
  onClose:   () => void;
  onInvited: (member: TeamMember) => void;
}) {
  const [email,       setEmail]       = useState("");
  const [role,        setRole]        = useState<"admin" | "editor" | "viewer">("editor");
  const [permissions, setPermissions] = useState<WorkspacePermissions>(DEFAULT_PERMISSIONS);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [seatLimitHit, setSeatLimitHit] = useState(false);
  const [sent,         setSent]         = useState<TeamMember | null>(null);
  const [copied,       setCopied]       = useState(false);

  async function handleInvite() {
    setLoading(true);
    setError("");
    setSeatLimitHit(false);
    try {
      const res  = await fetch("/api/team", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, role, permissions }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "SEAT_LIMIT_REACHED") {
          setSeatLimitHit(true);
          setError(json.error ?? "Seat limit reached.");
        } else {
          setError(json.error ?? "Invite failed.");
        }
      } else {
        setSent(json.member);
        onInvited(json.member);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!sent) return;
    navigator.clipboard.writeText(sent.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-text-primary mb-5">Invite team member</h3>

        {!sent ? (
          <>
            {/* Email */}
            <div className="mb-4">
              <label className="text-[10px] uppercase tracking-widest text-text-muted font-semibold block mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  autoFocus
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full bg-surface/60 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/40 focus:border-brand/50 outline-none"
                />
              </div>
            </div>

            {/* Role */}
            <div className="mb-4">
              <label className="text-[10px] uppercase tracking-widest text-text-muted font-semibold block mb-1.5">
                Role
              </label>
              <div className="flex gap-2">
                {(["admin", "editor", "viewer"] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors capitalize ${
                      role === r
                        ? "bg-brand/10 border-brand/30 text-brand"
                        : "bg-white/3 border-white/10 text-text-muted hover:border-white/20"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-text-muted/60 mt-1.5">
                {role === "admin"  && "Full access + can manage the team."}
                {role === "editor" && "Can view and edit areas you allow."}
                {role === "viewer" && "Read-only access to areas you allow."}
              </p>
            </div>

            {/* Permissions (skip for admin) */}
            {role !== "admin" && (
              <div className="mb-5">
                <label className="text-[10px] uppercase tracking-widest text-text-muted font-semibold block mb-1">
                  Area access
                </label>
                <PermissionGrid
                  permissions={permissions}
                  role={role}
                  onChange={setPermissions}
                  disabled={loading}
                />
              </div>
            )}

            {seatLimitHit ? (
              <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300 leading-snug">{error}</p>
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  View upgrade options <ArrowUpRight size={11} />
                </Link>
              </div>
            ) : error ? (
              <div className="mb-4 flex items-start gap-2 bg-error/10 border border-error/20 rounded-lg px-3 py-2.5 text-xs text-error">
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-sm text-text-muted border border-white/10 rounded-xl hover:border-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInvite}
                disabled={loading || !email}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-light rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                {loading ? "Sending…" : "Send invite"}
              </button>
            </div>
          </>
        ) : (
          /* Success state */
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Check size={20} className="text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-text-primary mb-1">Invite sent!</h4>
            <p className="text-xs text-text-muted mb-5">
              An email has been sent to <span className="text-text-primary">{sent.email}</span>.
              They can also join using the code below.
            </p>

            {/* Invite code */}
            <div className="flex items-center gap-2 bg-surface/60 border border-white/10 rounded-xl px-4 py-3 mb-5">
              <code className="flex-1 text-sm font-mono font-bold text-brand tracking-widest text-center">
                {sent.invite_code}
              </code>
              <button
                type="button"
                onClick={copyCode}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Copy invite code"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-text-muted" />}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-light rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────

export function TeamSection() {
  const { isOwner, role: workspaceRole, loading: ctxLoading } = useWorkspace();

  const [members,     setMembers]     = useState<TeamMember[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showInvite,  setShowInvite]  = useState(false);
  const [error,       setError]       = useState("");

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/team");
      const json = await res.json();
      if (res.ok) setMembers(json.members ?? []);
      else setError(json.error ?? "Failed to load team.");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ctxLoading && isOwner) fetchMembers();
    else if (!ctxLoading) setLoading(false);
  }, [ctxLoading, isOwner, fetchMembers]);

  async function handleUpdate(
    id: string,
    role: string,
    permissions: WorkspacePermissions,
  ) {
    const res  = await fetch(`/api/team/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ role, permissions }),
    });
    const json = await res.json();
    if (res.ok) {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, role: json.member.role, permissions: json.member.permissions } : m));
    }
  }

  async function handleRevoke(id: string) {
    const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
    if (res.ok) setMembers(prev => prev.filter(m => m.id !== id));
  }

  // ── Team member view (read-only "your access" panel) ──────
  if (!ctxLoading && !isOwner) {
    return (
      <div className="glass-card rounded-2xl p-7 mt-8">
        <div className="flex items-center gap-2 mb-1">
          <Lock size={14} className="text-text-muted" />
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">
            Your access
          </h2>
        </div>
        <p className="text-xs text-text-muted/70 mb-0 leading-relaxed">
          You are a team member on this workspace.{" "}
          {workspaceRole && <RoleBadge role={workspaceRole} />}
          {" "}Access is managed by the workspace owner.
        </p>
      </div>
    );
  }

  // ── Owner view ────────────────────────────────────────────
  return (
    <>
      <div className="glass-card rounded-2xl p-7 mt-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-text-muted" />
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">
              Team
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-light transition-colors"
          >
            <UserPlus size={13} />
            Invite member
          </button>
        </div>
        <p className="text-xs text-text-muted/70 mb-5 leading-relaxed">
          Invite team members to your workspace. Seat availability is based on your plan.
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-error/10 border border-error/20 rounded-lg px-3 py-2.5 text-xs text-error">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-text-muted" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
            <Users size={24} className="text-text-muted/40 mx-auto mb-2" />
            <p className="text-xs text-text-muted/60">No team members yet.</p>
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="mt-3 text-xs text-brand underline"
            >
              Invite your first member
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(m => (
              <MemberRow
                key={m.id}
                member={m}
                onUpdate={handleUpdate}
                onRevoke={handleRevoke}
              />
            ))}
          </div>
        )}
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={member => {
            setMembers(prev => [member as TeamMember, ...prev]);
            setShowInvite(false);
          }}
        />
      )}
    </>
  );
}
