"use client";
// ============================================================
// ROSTER — /dashboard/workspace
// The unified work-product hub. Stores all ROSTER-native
// outputs (campaign plans, release plans, AI drafts) and
// will host uploaded external documents in Phase 2.
// ============================================================
import { useState, useEffect, useMemo, useRef } from "react";
import {
  FolderOpen, Search, Lock, Globe, Users, Upload,
  Megaphone, CalendarDays, FileText, LayoutDashboard,
  Clock, ExternalLink, Filter, MoreVertical,
  Trash2, Archive, ArchiveRestore, AlertTriangle, Share2,
  CheckSquare, Square, X, Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────
interface WorkspaceDocument {
  id:               string;
  title:            string;
  doc_type:         string;
  source_type:      string | null;
  source_id:        string | null;
  privacy:          "private" | "workspace" | "custom";
  ai_summary:       string | null;
  ai_tags:          string[];
  extraction_status: string;
  file_name:        string | null;
  file_size_bytes:  number | null;
  created_at:       string;
  updated_at:       string;
  last_accessed_at: string | null;
}

interface TeamMember {
  id:             string;
  email:          string;
  role:           string;
  status:         string;
  member_user_id: string | null;
}

// ── Constants ─────────────────────────────────────────────────
const DOC_TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  campaign_plan:    { label: "Campaign Plan",    icon: Megaphone,      color: "#C9A84C" },
  release_plan:     { label: "Release Plan",     icon: CalendarDays,   color: "#8B5CF6" },
  ai_draft:         { label: "AI Draft",         icon: FileText,       color: "#10B981" },
  marketing_budget: { label: "Marketing Budget", icon: LayoutDashboard,color: "#4B9FE1" },
  // Tool snapshot categories
  tool_financial:   { label: "Finance Tool",     icon: LayoutDashboard,color: "#F59E0B" },
  tool_marketing:   { label: "Marketing Tool",   icon: Megaphone,      color: "#8B5CF6" },
  tool_touring:     { label: "Touring Tool",     icon: CalendarDays,   color: "#10B981" },
  tool_other:       { label: "Work Tool",        icon: FileText,       color: "#4B9FE1" },
  // Uploads (Phase 2)
  upload_pdf:       { label: "PDF",              icon: FileText,       color: "#E05C5C" },
  upload_docx:      { label: "Word Doc",         icon: FileText,       color: "#2B579A" },
  upload_xlsx:      { label: "Spreadsheet",      icon: FileText,       color: "#217346" },
  upload_pptx:      { label: "Presentation",     icon: FileText,       color: "#D04423" },
  upload_other:     { label: "File",             icon: FileText,       color: "#666666" },
};

const PRIVACY_META = {
  private:   { label: "Private",   icon: Lock,   color: "#666666" },
  workspace: { label: "Workspace", icon: Globe,  color: "#4B9FE1" },
  custom:    { label: "Shared",    icon: Users,  color: "#C9A84C" },
};

const VIEWS = ["all", "mine", "archived", "shared"] as const;
type ViewType = typeof VIEWS[number];

const TYPE_FILTERS = [
  { value: "",                 label: "All types" },
  { value: "campaign_plan",    label: "Campaign Plans" },
  { value: "release_plan",     label: "Release Plans" },
  { value: "ai_draft",         label: "AI Drafts" },
  { value: "tool_financial",   label: "Finance Tools" },
  { value: "tool_marketing",   label: "Marketing Tools" },
  { value: "tool_touring",     label: "Touring Tools" },
  { value: "tool_other",       label: "Other Work Tools" },
];

// ── Helpers ───────────────────────────────────────────────────
function getDocHref(doc: WorkspaceDocument): string {
  if (doc.doc_type === "campaign_plan" && doc.source_id) {
    return `/dashboard/campaign-builder/${doc.source_id}`;
  }
  if (doc.doc_type === "release_plan" && doc.source_id) {
    return `/dashboard/releases/${doc.source_id}/plan`;
  }
  // Tool snapshots — source_id holds the tool slug
  if (doc.source_type === "tool_snapshots" && doc.source_id) {
    const libraryTools: Record<string, string> = {
      // Marketing library
      "brand-studio":              "/dashboard/library/marketing/brand-studio",
      "one-sheet":                 "/dashboard/library/marketing/one-sheet",
      "routine-checklist":         "/dashboard/library/marketing/routine-checklist",
      "epk-builder":               "/dashboard/library/marketing/epk-builder",
      "pre-save-builder":          "/dashboard/library/marketing/pre-save-builder",
      "meta-ads-brief":            "/dashboard/library/marketing/meta-ads-brief",
      "tour-sponsorship-deck":     "/dashboard/library/marketing/tour-sponsorship-deck",
      // PR / Press
      "awards-bio-pack":           "/dashboard/library/pr-press/awards-bio-pack",
      "awards-tracker":            "/dashboard/library/pr-press/awards-tracker",
      "press-release-templates":   "/dashboard/library/pr-press/press-release-templates",
      "quotes-library":            "/dashboard/library/pr-press/quotes-library",
      // Publishing
      "co-writing-splits":         "/dashboard/library/publishing/co-writing-splits",
      "cover-mech-license":        "/dashboard/library/publishing/cover-mech-license",
      "cue-sheet":                 "/dashboard/library/publishing/cue-sheet",
      "lyric-sheet":               "/dashboard/library/publishing/lyric-sheet",
      "mlc-tracker":               "/dashboard/library/publishing/mlc-tracker",
      "pro-membership-tracker":    "/dashboard/library/publishing/pro-membership-tracker",
      "publisher-pitch-pager":     "/dashboard/library/publishing/publisher-pitch-pager",
      "royalty-calculator":        "/dashboard/library/publishing/royalty-calculator",
      "soundexchange-guide":       "/dashboard/library/publishing/soundexchange-guide",
      // Recording
      "label-copy":                "/dashboard/library/recording/label-copy",
      "producer-agreement":        "/dashboard/library/recording/producer-agreement",
      "release-checklist":         "/dashboard/library/recording/release-checklist",
      "sample-clearance":          "/dashboard/library/recording/sample-clearance",
      "session-song-form":         "/dashboard/library/recording/session-song-form",
      "atmos-spatial-brief":       "/dashboard/library/recording/atmos-spatial-brief",
      "daw-handoff":               "/dashboard/library/recording/daw-handoff",
      "master-delivery-specs":     "/dashboard/library/recording/master-delivery-specs",
      "vocal-comp-sheet":          "/dashboard/library/recording/vocal-comp-sheet",
      // Royalties
      "advance-recoupment-tracker":        "/dashboard/library/royalties/advance-recoupment-tracker",
      "recoupable-cost-tracker":           "/dashboard/library/royalties/recoupable-cost-tracker",
      "royalty-statement-reconciliation":  "/dashboard/library/royalties/royalty-statement-reconciliation",
      "streaming-income-reconciliation":   "/dashboard/library/royalties/streaming-income-reconciliation",
      // A&R / Startup
      "checklist":                 "/dashboard/library/startup/checklist",
      "competitor-set":            "/dashboard/library/startup/competitor-set",
      "ar-pipeline":               "/dashboard/library/startup/ar-pipeline",
      "artist-scorecard":          "/dashboard/library/startup/artist-scorecard",
      "chart-performance":         "/dashboard/library/startup/chart-performance",
      "goal-setter":               "/dashboard/library/startup/goal-setter",
      "service-provider-onboarding": "/dashboard/library/startup/service-provider-onboarding",
      "songwriter-camp-hold-letter": "/dashboard/library/startup/songwriter-camp-hold-letter",
      "songwriter-camp":           "/dashboard/library/startup/songwriter-camp",
      // Touring
      "personnel-record":          "/dashboard/library/touring/personnel-record",
      "promoter-agreement":        "/dashboard/library/touring/promoter-agreement",
      "dj-set-submission":         "/dashboard/library/touring/dj-set-submission",
      "festival-application-pack": "/dashboard/library/touring/festival-application-pack",
      "hospitality-rider":         "/dashboard/library/touring/hospitality-rider",
      "performance-rider":         "/dashboard/library/touring/performance-rider",
      "show-settlement-sheet":     "/dashboard/library/touring/show-settlement-sheet",
      "tour-settlement-master":    "/dashboard/library/touring/tour-settlement-master",
      "visa-travel-checklist":     "/dashboard/library/touring/visa-travel-checklist",
      // Merchandise
      "bandcamp-day-strategy":     "/dashboard/library/merchandise/bandcamp-day-strategy",
      "drop-capacity-planner":     "/dashboard/library/merchandise/drop-capacity-planner",
      "shopify-setup":             "/dashboard/library/merchandise/shopify-setup",
      "tour-merch-inventory":      "/dashboard/library/merchandise/tour-merch-inventory",
      "tour-merch-settlement":     "/dashboard/library/merchandise/tour-merch-settlement",
      // Sync
      "sync-pitch-one-sheet":      "/dashboard/library/sync/sync-pitch-one-sheet",
      "sync-pitch-tracker":        "/dashboard/library/sync/sync-pitch-tracker",
      "sync-quote-calculator":     "/dashboard/library/sync/sync-quote-calculator",
      "sync-quote-letter":         "/dashboard/library/sync/sync-quote-letter",
      // Visual Production
      "cover-art-brief":           "/dashboard/library/visual-production/cover-art-brief",
      "cover-art-qc":              "/dashboard/library/visual-production/cover-art-qc",
      "music-video-brief":         "/dashboard/library/visual-production/music-video-brief",
      "music-video-budget":        "/dashboard/library/visual-production/music-video-budget",
      "music-video-call-sheet":    "/dashboard/library/visual-production/music-video-call-sheet",
      "music-video-treatment":     "/dashboard/library/visual-production/music-video-treatment",
      "vendor-database":           "/dashboard/library/visual-production/vendor-database",
      // Distribution
      "pitch-audit":               "/dashboard/library/distribution/pitch-audit",
      "pre-release-metadata-qc":   "/dashboard/library/distribution/pre-release-metadata-qc",
      // Fan CRM
      "email-marketing-calendar":  "/dashboard/library/fan-crm/email-marketing-calendar",
      // Legal
      "copyright-tracker":         "/dashboard/library/legal/copyright-tracker",
      "trademark-tracker":         "/dashboard/library/legal/trademark-tracker",
      // AI tools
      "ai-social-captions":        "/dashboard/library/marketing/ai-social-captions",
      "ai-press-release-drafter":  "/dashboard/library/pr-press/ai-press-release-drafter",
      "ai-sync-pitch-drafter":     "/dashboard/library/sync/ai-sync-pitch-drafter",
      "ai-whatsapp-drafter":       "/dashboard/library/fan-crm/ai-whatsapp-drafter",
      // /tools/ overrides
      "dsp-pitching":              "/dashboard/tools/dsp-pitching",
      "marketing-forecast":        "/dashboard/tools/marketing-forecast",
      "single-release-plan":       "/dashboard/tools/single-release-plan",
      "social-media-calendar":     "/dashboard/tools/social-media-calendar",
      "invoice":                   "/dashboard/tools/invoice",
    };
    const libraryHref = libraryTools[doc.source_id];
    if (libraryHref) return libraryHref;
    return `/dashboard/tools/${doc.source_id}`;
  }
  return `/dashboard/workspace/${doc.id}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days < 7)    return `${days}d ago`;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Share Modal ───────────────────────────────────────────────
function ShareModal({
  doc,
  onClose,
  onShared,
}: {
  doc: WorkspaceDocument;
  onClose: () => void;
  onShared: (docId: string, privacy: "private" | "workspace" | "custom") => void;
}) {
  const [members,        setMembers]        = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [shareWithAll,   setShareWithAll]   = useState(doc.privacy === "workspace");
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [sharing,        setSharing]        = useState(false);
  const [unsharing,      setUnsharing]      = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const isCurrentlyShared = doc.privacy !== "private";

  // Load team members
  useEffect(() => {
    fetch("/api/team")
      .then(r => r.json())
      .then(({ members: m }) => {
        const active = (m ?? []).filter(
          (tm: TeamMember) => tm.status === "accepted" && tm.member_user_id
        );
        setMembers(active);
      })
      .catch(() => setError("Could not load team members"))
      .finally(() => setLoadingMembers(false));
  }, []);

  const toggleMember = (uid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleShare = async () => {
    if (!shareWithAll && selectedIds.size === 0) {
      setError("Select at least one team member or choose 'Entire workspace'.");
      return;
    }
    setError(null);
    setSharing(true);
    try {
      const res = await fetch("/api/tools/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug:               doc.source_id,
          shareWithWorkspace: shareWithAll,
          sharedWithUserIds:  shareWithAll ? [] : Array.from(selectedIds),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Share failed"); return; }
      onShared(doc.id, json.privacy as "workspace" | "custom");
      onClose();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async () => {
    setError(null);
    setUnsharing(true);
    try {
      const res = await fetch(`/api/tools/share?slug=${encodeURIComponent(doc.source_id ?? "")}`, {
        method: "DELETE",
      });
      if (!res.ok) { setError("Could not unshare"); return; }
      onShared(doc.id, "private");
      onClose();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setUnsharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#4B9FE115" }}>
              <Share2 size={16} style={{ color: "#4B9FE1" }} />
            </div>
            <div>
              <h3 className="font-black text-text-primary text-sm">Share with team</h3>
              <p className="text-xs text-text-muted truncate max-w-[220px]">{doc.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Share with entire workspace toggle */}
        <button
          onClick={() => { setShareWithAll(v => !v); setSelectedIds(new Set()); }}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl border transition-all mb-3",
            shareWithAll
              ? "border-brand/40 bg-brand/8"
              : "border-border hover:border-border/80 bg-surface-2"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors",
            shareWithAll ? "text-brand" : "text-text-muted"
          )}>
            {shareWithAll ? <CheckSquare size={16} /> : <Square size={16} />}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-text-primary">Entire workspace</p>
            <p className="text-xs text-text-muted">All current and future team members can view</p>
          </div>
        </button>

        {/* Individual members */}
        {!shareWithAll && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Or choose team members
            </p>
            {loadingMembers ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={18} className="animate-spin text-text-muted" />
              </div>
            ) : members.length === 0 ? (
              <div className="py-4 text-center text-xs text-text-muted rounded-xl border border-border bg-surface-2">
                No active team members yet.{" "}
                <Link href="/dashboard/settings/team" className="text-brand hover:underline">
                  Invite someone
                </Link>
              </div>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {members.map(m => {
                  const uid = m.member_user_id!;
                  const checked = selectedIds.has(uid);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleMember(uid)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all",
                        checked
                          ? "border-brand/40 bg-brand/8"
                          : "border-transparent hover:border-border hover:bg-surface-2"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                        checked ? "text-brand" : "text-text-muted"
                      )}>
                        {checked ? <CheckSquare size={15} /> : <Square size={15} />}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm text-text-primary truncate">{m.email}</p>
                        <p className="text-[10px] text-text-muted capitalize">{m.role}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 mb-3 px-1">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isCurrentlyShared && (
            <button
              onClick={handleUnshare}
              disabled={unsharing || sharing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border text-text-muted hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-50"
            >
              {unsharing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
              Unshare
            </button>
          )}
          <button
            onClick={onClose}
            disabled={sharing || unsharing}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={sharing || unsharing || loadingMembers}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black transition-all disabled:opacity-50"
            style={{ backgroundColor: "#C9A84C" }}
          >
            {sharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
            {sharing ? "Sharing…" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Action Menu ───────────────────────────────────────────────
function DocActionMenu({
  doc,
  isArchived,
  onArchive,
  onDelete,
  onShare,
}: {
  doc: WorkspaceDocument;
  isArchived: boolean;
  onArchive: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Only tool snapshots support archive/delete/share for now
  const isToolSnapshot = doc.source_type === "tool_snapshots";
  if (!isToolSnapshot) return null;

  return (
    <div ref={ref} className="relative flex-shrink-0" onClick={e => e.preventDefault()}>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
        title="More actions"
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-48 rounded-xl border border-border bg-surface shadow-xl py-1">
          {/* Share */}
          {!isArchived && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(false); onShare(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-surface-2 transition-colors"
            >
              <Share2 size={14} className="text-brand" />
              {doc.privacy !== "private" ? "Manage sharing" : "Share with team"}
            </button>
          )}

          {/* Archive / Restore */}
          {isArchived ? (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(false); onArchive(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-surface-2 transition-colors"
            >
              <ArchiveRestore size={14} className="text-brand" />
              Restore to Workspace
            </button>
          ) : (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(false); onArchive(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-surface-2 transition-colors"
            >
              <Archive size={14} className="text-text-muted" />
              Archive
            </button>
          )}

          <div className="my-1 border-t border-border" />
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
            Delete permanently
          </button>
        </div>
      )}
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────
function DeleteConfirmModal({
  doc,
  onConfirm,
  onCancel,
}: {
  doc: WorkspaceDocument;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EF444415" }}>
            <AlertTriangle size={18} style={{ color: "#EF4444" }} />
          </div>
          <h3 className="font-black text-text-primary">Delete permanently?</h3>
        </div>
        <p className="text-sm text-text-muted mb-1">
          This will permanently delete <span className="font-semibold text-text-primary">{doc.title}</span> and all saved data inside it.
        </p>
        <p className="text-xs text-text-muted mb-6">This cannot be undone. Consider archiving instead.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ backgroundColor: "#EF4444" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Doc Card ──────────────────────────────────────────────────
function DocCard({
  doc,
  isArchived = false,
  onArchive,
  onDelete,
  onShare,
}: {
  doc: WorkspaceDocument;
  isArchived?: boolean;
  onArchive: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const meta    = DOC_TYPE_META[doc.doc_type] ?? DOC_TYPE_META.upload_other;
  const privacy = PRIVACY_META[doc.privacy];
  const Icon    = meta.icon;
  const PrivacyIcon = privacy.icon;
  const href    = getDocHref(doc);

  return (
    <Link href={href} className="group block">
      <div className={cn(
        "glass-card rounded-2xl p-5 hover:border-brand/30 transition-all hover:shadow-lg cursor-pointer h-full flex flex-col",
        isArchived && "opacity-60"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${meta.color}18` }}
          >
            <Icon size={18} style={{ color: meta.color }} />
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
              style={{ color: privacy.color, borderColor: `${privacy.color}30`, backgroundColor: `${privacy.color}10` }}
            >
              <PrivacyIcon size={10} />
              {privacy.label}
            </div>
            <DocActionMenu
              doc={doc}
              isArchived={isArchived}
              onArchive={onArchive}
              onDelete={onDelete}
              onShare={onShare}
            />
          </div>
        </div>

        {/* Type badge */}
        <div className="mb-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{ color: meta.color, backgroundColor: `${meta.color}15` }}
          >
            {meta.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-text-primary leading-snug mb-2 flex-1 group-hover:text-brand transition-colors">
          {doc.title}
        </h3>

        {/* AI summary — Phase 2 uploads */}
        {doc.ai_summary && (
          <p className="text-xs text-text-muted leading-relaxed mb-3 line-clamp-2">
            {doc.ai_summary}
          </p>
        )}

        {/* Tags — Phase 2 */}
        {doc.ai_tags && doc.ai_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {doc.ai_tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 text-text-muted border border-border">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Clock size={11} />
            {formatDate(doc.updated_at)}
          </div>
          <ExternalLink size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  );
}

// ── Empty State ───────────────────────────────────────────────
const TYPE_EMPTY_STATE: Record<string, {
  heading: string; body: string;
  cta?: { label: string; href: string; icon: React.ElementType; primary?: boolean }[];
}> = {
  campaign_plan: {
    heading: "No campaign plans yet",
    body: "Use Campaign Builder to generate a full AI-powered marketing campaign. It'll appear here automatically.",
    cta: [{ label: "Build a campaign", href: "/dashboard/campaign-builder/new", icon: Megaphone, primary: true }],
  },
  release_plan: {
    heading: "No release plans yet",
    body: "Plan a release and your plan will be saved here — timeline, tasks, and all.",
    cta: [{ label: "Plan a release", href: "/dashboard/releases", icon: CalendarDays }],
  },
  ai_draft: {
    heading: "No AI drafts yet",
    body: "AI-generated content like outreach emails and bio drafts will be saved here as you use ROSTER AI tools.",
    cta: [{ label: "Open ROSTER AI", href: "/dashboard/assistant", icon: FileText }],
  },
  tool_financial: {
    heading: "No finance tools saved yet",
    body: "Budget planners, cashflow forecasts, P&Ls — save any Finance & Tax tool and it appears here.",
    cta: [{ label: "Open Finance & Tax", href: "/dashboard/library/money", icon: LayoutDashboard }],
  },
  tool_marketing: {
    heading: "No marketing tools saved yet",
    body: "Brand studio, one-sheets, content calendars — save any Marketing tool and it appears here.",
    cta: [{ label: "Open Marketing", href: "/dashboard/library/marketing", icon: Megaphone }],
  },
  tool_touring: {
    heading: "No touring tools saved yet",
    body: "Tour budgets, itineraries, run sheets — save any Touring tool and it appears here.",
    cta: [{ label: "Open Touring", href: "/dashboard/library/touring", icon: CalendarDays }],
  },
  tool_other: {
    heading: "No work tools saved yet",
    body: "Save any work tool on ROSTER and it will appear here for quick access.",
    cta: [{ label: "Browse Tools", href: "/dashboard/library", icon: FileText }],
  },
};

function EmptyState({ view, typeFilter }: { view: ViewType; typeFilter: string }) {
  if (view === "shared") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ backgroundColor: "#C9A84C12" }}>
          <FolderOpen size={36} style={{ color: "#C9A84C" }} />
        </div>
        <h3 className="text-xl font-black text-text-primary mb-2">Nothing shared with you yet</h3>
        <p className="text-sm text-text-muted max-w-sm leading-relaxed">
          When a team member shares a document with you, it will appear here.
        </p>
      </div>
    );
  }

  if (view === "archived") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ backgroundColor: "#C9A84C12" }}>
          <Archive size={36} style={{ color: "#C9A84C" }} />
        </div>
        <h3 className="text-xl font-black text-text-primary mb-2">Nothing archived yet</h3>
        <p className="text-sm text-text-muted max-w-sm leading-relaxed">
          Archive a work tool from the Workspace to store it here. Archived items are preserved and can be restored at any time.
        </p>
      </div>
    );
  }

  const typed = typeFilter ? TYPE_EMPTY_STATE[typeFilter] : null;
  const heading = typed?.heading ?? "This is your Workspace";
  const body    = typed?.body    ?? "Every campaign plan, release plan, and budget you create or co-create with ROSTER AI is automatically saved here. Generate something to get started.";
  const ctas    = typed?.cta ?? [];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ backgroundColor: "#C9A84C12" }}>
        <FolderOpen size={36} style={{ color: "#C9A84C" }} />
      </div>
      <h3 className="text-xl font-black text-text-primary mb-2">{heading}</h3>
      <p className="text-sm text-text-muted max-w-sm leading-relaxed mb-6">{body}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {ctas.map(({ label, href, icon: Icon, primary }) => (
          <Link
            key={href}
            href={href}
            className={
              primary
                ? "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                : "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-border text-text-muted hover:text-text-primary transition-all"
            }
            style={primary ? { backgroundColor: "#C9A84C", color: "#000" } : undefined}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function WorkspacePage() {
  const [view,       setView]       = useState<ViewType>("all");
  const [docs,       setDocs]       = useState<WorkspaceDocument[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceDocument | null>(null);
  const [shareTarget,  setShareTarget]  = useState<WorkspaceDocument | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // slug being actioned

  // Load documents
  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    const params = new URLSearchParams({ view });
    if (typeFilter) params.set("type", typeFilter);
    fetch(`/api/workspace/documents?${params}`)
      .then(async r => {
        const d = await r.json();
        if (!r.ok) {
          setFetchError(d.error ?? `Server error ${r.status}`);
          setDocs(d.documents ?? []);
        } else {
          setDocs(d.documents ?? []);
        }
      })
      .catch(e => {
        setFetchError(e instanceof Error ? e.message : "Network error");
        setDocs([]);
      })
      .finally(() => setLoading(false));
  }, [view, typeFilter]);

  // ── Archive handler ─────────────────────────────────────────
  const handleArchive = async (doc: WorkspaceDocument, archive: boolean) => {
    const slug = doc.source_id;
    if (!slug) return;
    setActionLoading(slug);
    try {
      const res = await fetch("/api/tools/save", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, archived: archive }),
      });
      if (res.ok) {
        // Remove from current view optimistically
        setDocs(prev => prev.filter(d => d.id !== doc.id));
      }
    } finally {
      setActionLoading(null);
    }
  };

  // ── Delete handler ──────────────────────────────────────────
  const handleDelete = async (doc: WorkspaceDocument) => {
    const slug = doc.source_id;
    if (!slug) return;
    setDeleteTarget(null);
    setActionLoading(slug);
    try {
      const res = await fetch(`/api/tools/save?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocs(prev => prev.filter(d => d.id !== doc.id));
        // Clear localStorage for this tool
        try {
          const keysToTry = [
            `roster_${slug.replace(/-/g, "_")}`,
            `roster_${slug.replace(/-/g, "_")}_v1`,
            `roster_${slug.replace(/-/g, "_")}_v2`,
          ];
          keysToTry.forEach(k => localStorage.removeItem(k));
        } catch { /* ignore */ }
      }
    } finally {
      setActionLoading(null);
    }
  };

  // ── Share callback ──────────────────────────────────────────
  const handleShared = (docId: string, privacy: "private" | "workspace" | "custom") => {
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, privacy } : d));
  };

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.ai_summary?.toLowerCase().includes(q) ||
      d.ai_tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [docs, search]);

  const isArchived = view === "archived";

  return (
    <div className="animate-fade-in">
      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          doc={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Share modal */}
      {shareTarget && (
        <ShareModal
          doc={shareTarget}
          onClose={() => setShareTarget(null)}
          onShared={handleShared}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#C9A84C15" }}>
              <FolderOpen size={20} style={{ color: "#C9A84C" }} />
            </div>
            <h1 className="text-2xl font-black text-text-primary">Workspace</h1>
          </div>
          <p className="text-sm text-text-muted ml-13 pl-0.5">
            All your ROSTER work, in one place.
          </p>
        </div>
        {/* Phase 2: Upload button */}
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border text-text-muted opacity-40 cursor-not-allowed"
          title="File uploads coming in Phase 2"
        >
          <Upload size={15} />
          Upload file
        </button>
      </div>

      {/* View tabs + search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-2 border border-border">
          {VIEWS.map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                view === v
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {v === "all" ? "All" : v === "mine" ? "Mine" : v === "archived" ? "Archived" : "Shared with me"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search documents…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/40 transition-colors"
          />
        </div>

        {/* Type filter */}
        <div className="relative flex items-center gap-2">
          <Filter size={14} className="text-text-muted flex-shrink-0" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="pl-2 pr-8 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-brand/40 transition-colors appearance-none"
          >
            {TYPE_FILTERS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Archived banner */}
      {isArchived && (
        <div className="mb-5 p-4 rounded-xl border flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.25)", backgroundColor: "rgba(201,168,76,0.06)" }}>
          <Archive size={16} style={{ color: "#C9A84C" }} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm text-text-muted leading-relaxed">
            <span className="font-semibold text-text-primary">Archived items</span> — all saved data is preserved. Use the menu on any card to restore to Workspace or delete permanently.
          </p>
        </div>
      )}

      {/* Error banner */}
      {fetchError && (
        <div className="mb-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
          <p className="font-bold mb-1">Workspace unavailable</p>
          <p className="text-xs font-mono opacity-80">{fetchError}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-surface-2 mb-3" />
              <div className="h-3 w-20 bg-surface-2 rounded mb-2" />
              <div className="h-4 w-3/4 bg-surface-2 rounded mb-2" />
              <div className="h-3 w-full bg-surface-2 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState view={view} typeFilter={typeFilter} />
      ) : (
        <>
          <p className="text-xs text-text-muted mb-4">
            {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(doc => (
              <div key={doc.id} className={actionLoading === doc.source_id ? "opacity-50 pointer-events-none" : ""}>
                <DocCard
                  doc={doc}
                  isArchived={isArchived}
                  onArchive={() => handleArchive(doc, !isArchived)}
                  onDelete={() => setDeleteTarget(doc)}
                  onShare={() => setShareTarget(doc)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
