"use client";

// ============================================================
// ROSTER — Data & Privacy section (Settings page)
// ------------------------------------------------------------
// POPIA (South Africa) + GDPR (EU) compliance controls:
//
//   1. Export my data   — downloads a JSON archive of all
//      personal data held about the user.
//
//   2. Delete account   — permanently erases the account and
//      all associated data after email confirmation.
// ============================================================

import { useState } from "react";
import {
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  ShieldCheck,
} from "lucide-react";

interface DataPrivacySectionProps {
  userEmail: string;
}

// ─── Delete confirmation modal ────────────────────────────────

function DeleteModal({
  userEmail,
  onClose,
  onDeleted,
}: {
  userEmail: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Deletion failed. Please try again.");
        return;
      }
      onDeleted();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const matches =
    confirmEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl w-full max-w-md p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Delete account
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                This cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* What gets deleted */}
        <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-4 mb-5 space-y-1.5">
          <p className="text-xs font-semibold text-rose-300 mb-2">
            The following will be permanently deleted:
          </p>
          {[
            "Your profile and account credentials",
            "All artists and their stat history",
            "All releases, reminders, and bookings",
            "Your vault files and documents",
            "Your ROSTER AI conversation history",
            "Your subscription records",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-rose-400/60 flex-shrink-0" />
              <p className="text-xs text-rose-300/80">{item}</p>
            </div>
          ))}
        </div>

        {/* Email confirmation */}
        <div className="mb-5">
          <label className="text-[11px] uppercase tracking-wide text-text-muted font-medium block mb-1.5">
            Type your email to confirm:{" "}
            <span className="text-rose-400">{userEmail}</span>
          </label>
          <input
            autoFocus
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={userEmail}
            className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/40 focus:border-rose-500/50 outline-none"
          />
        </div>

        {error && (
          <div className="mb-4 bg-error/10 border border-error/20 rounded-lg px-3 py-2 text-xs text-error">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm text-text-muted hover:text-text-primary border border-white/10 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!matches || loading}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────

export function DataPrivacySection({ userEmail }: DataPrivacySectionProps) {
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleted, setDeleted] = useState(false);

  async function handleExport() {
    setExporting(true);
    setExportDone(false);
    try {
      const res = await fetch("/api/settings/export");
      if (!res.ok) {
        const json = await res.json();
        alert(json.error ?? "Export failed. Please try again.");
        return;
      }

      // Trigger download from the Response blob
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");

      // Use filename from Content-Disposition if present
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? "roster-data-export.json";
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);

      setExportDone(true);
      setTimeout(() => setExportDone(false), 4000);
    } catch {
      alert("Export failed — please check your connection and try again.");
    } finally {
      setExporting(false);
    }
  }

  function handleDeleted() {
    setDeleted(true);
    setShowDeleteModal(false);
    // Sign out + redirect to login
    setTimeout(() => {
      window.location.href = "/auth/login?deleted=1";
    }, 2500);
  }

  if (deleted) {
    return (
      <div className="glass-card rounded-2xl p-7 border border-emerald-500/20">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              Account deleted
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              All your data has been erased. Redirecting…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-2xl p-7">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={14} className="text-text-muted" />
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">
            Data &amp; Privacy
          </h2>
        </div>
        <p className="text-xs text-text-muted/70 mb-6 leading-relaxed">
          Your rights under POPIA (South Africa) and GDPR (EU). You can
          download a copy of everything ROSTER holds about you, or permanently
          erase your account.
        </p>

        <div className="space-y-4">
          {/* Export */}
          <div className="flex items-start justify-between gap-4 p-4 bg-surface/40 border border-white/5 rounded-xl">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                Export my data
              </p>
              <p className="text-xs text-text-muted mt-0.5 leading-snug">
                Download a JSON file containing your profile, artists,
                releases, bookings, vault metadata, and AI history.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-text-primary bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 whitespace-nowrap"
            >
              {exporting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : exportDone ? (
                <CheckCircle2 size={13} className="text-emerald-400" />
              ) : (
                <Download size={13} />
              )}
              {exporting
                ? "Preparing…"
                : exportDone
                  ? "Downloaded!"
                  : "Export JSON"}
            </button>
          </div>

          {/* Delete */}
          <div className="flex items-start justify-between gap-4 p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-rose-300">
                Delete my account
              </p>
              <p className="text-xs text-text-muted mt-0.5 leading-snug">
                Permanently erase your account and all associated data.
                This action is irreversible.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors flex-shrink-0 whitespace-nowrap"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>

        <p className="text-[10px] text-text-muted/50 mt-4 leading-relaxed">
          For questions about data processing, contact{" "}
          <a
            href="mailto:privacy@rosterapp.ai"
            className="text-brand/70 hover:text-brand underline"
          >
            privacy@rosterapp.ai
          </a>
        </p>
      </div>

      {showDeleteModal && (
        <DeleteModal
          userEmail={userEmail}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
