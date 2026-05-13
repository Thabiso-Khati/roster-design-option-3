"use client";

// ============================================================
// ROSTER — DraftWithAI primitive (Phase 3 Tier A)
// ------------------------------------------------------------
// A reusable button + modal that any tool/form can drop in to
// give users a "Draft with AI" affordance. The actual prompt
// engineering happens server-side in /api/ai — this component
// just collects context, fires the call, and renders the draft
// for the user to edit + copy.
//
// Design rules (from /docs/phase-3-agentic-ai.md § 7):
//   • Always show what will be sent to the AI (the "Reviewing N
//     sources: …" line)
//   • Edit-before-accept default — user copies the result, AI
//     never directly mutates user-visible data
//   • Budget-exhausted state shows resetAt date
//   • "Why this draft?" affordance (TODO Wave 2 — not in MVP)
// ============================================================

import { useState } from "react";
import { Sparkles, Loader2, Copy, RefreshCw, Check, X } from "lucide-react";
import type { ArtistContext } from "@/lib/artist-context";

interface DraftWithAIProps {
  /** The /api/ai tool key — e.g. "outreach-email", "pitch-generate". */
  tool: string;
  /** Human label for the button — e.g. "Draft outreach with AI". */
  label?: string;
  /** Subtitle in the modal explaining what this surface drafts. */
  modalSubtitle?: string;
  /** Artist context to send to the AI. Required. */
  artistContext: ArtistContext;
  /** Tool-specific params (recipient, intent, etc.). */
  params: Record<string, unknown>;
  /** Short list of context source descriptors shown on the modal —
   *  "Reviewing 3 sources: [artist], [contact], [release]". */
  contextSources?: string[];
  /** Optional className for the trigger button. */
  className?: string;
}

interface DraftState {
  status: "idle" | "loading" | "ready" | "error";
  text: string;
  error: string | null;
  budgetExhausted?: { resetAt: string };
}

export function DraftWithAI({
  tool,
  label = "Draft with AI",
  modalSubtitle,
  artistContext,
  params,
  contextSources = [],
  className = "",
}: DraftWithAIProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftState>({
    status: "idle",
    text: "",
    error: null,
  });
  const [copied, setCopied] = useState(false);

  async function generate() {
    setDraft({ status: "loading", text: "", error: null });
    setCopied(false);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, artistContext, params }),
      });
      const json = await res.json();
      if (res.status === 429 && json?.code === "BUDGET_EXHAUSTED") {
        setDraft({
          status: "error",
          text: "",
          error: json.error,
          budgetExhausted: { resetAt: json.resetAt },
        });
        return;
      }
      if (!res.ok) {
        setDraft({
          status: "error",
          text: "",
          error: json?.error || `Request failed (${res.status})`,
        });
        return;
      }
      setDraft({
        status: "ready",
        text: typeof json.result === "string" ? json.result : "",
        error: null,
      });
    } catch (err) {
      setDraft({
        status: "error",
        text: "",
        error: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  async function copy() {
    if (!draft.text) return;
    try {
      await navigator.clipboard.writeText(draft.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Soft fail — Safari may block clipboard in some contexts.
    }
  }

  function close() {
    setOpen(false);
    // Reset state so a re-open starts clean.
    setDraft({ status: "idle", text: "", error: null });
    setCopied(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          // Auto-generate on open — user opted in by clicking.
          void generate();
        }}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-brand/20 hover:border-brand/40 hover:bg-brand/5 text-brand transition-colors ${className}`}
      >
        <Sparkles size={12} />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={close}
        >
          <div
            className="glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-brand" />
                  <h3 className="text-lg font-semibold">{label}</h3>
                </div>
                {modalSubtitle && (
                  <p className="text-xs text-text-muted">{modalSubtitle}</p>
                )}
                {contextSources.length > 0 && (
                  <p className="text-[11px] text-text-muted/70 mt-2">
                    Reviewing {contextSources.length}{" "}
                    {contextSources.length === 1 ? "source" : "sources"}:{" "}
                    {contextSources.join(", ")}
                  </p>
                )}
              </div>
              <button
                onClick={close}
                className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </header>

            <div className="px-6 py-4 overflow-y-auto flex-1">
              {draft.status === "loading" && (
                <div className="flex items-center justify-center py-16">
                  <Loader2
                    size={20}
                    className="animate-spin text-brand mr-2"
                  />
                  <span className="text-sm text-text-muted">
                    Drafting…
                  </span>
                </div>
              )}

              {draft.status === "error" && (
                <div className="space-y-3">
                  <div className="bg-error/10 border border-error/20 rounded-lg px-3 py-2 text-xs text-error">
                    {draft.error}
                  </div>
                  {draft.budgetExhausted && (
                    <p className="text-[11px] text-text-muted">
                      Quota resets{" "}
                      {new Date(draft.budgetExhausted.resetAt)
                        .toISOString()
                        .slice(0, 10)}
                      . You can keep using ROSTER's manual tools without limits.
                    </p>
                  )}
                </div>
              )}

              {draft.status === "ready" && (
                <textarea
                  value={draft.text}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, text: e.target.value }))
                  }
                  className="w-full min-h-[260px] bg-surface/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-brand outline-none font-mono leading-relaxed"
                  spellCheck
                />
              )}

              <p className="text-[10px] text-text-muted/60 mt-3 leading-snug">
                AI drafts are starting points, not finished copy. Edit before
                you send. ROSTER never sends on your behalf.
              </p>
            </div>

            <footer className="flex items-center justify-between gap-2 px-6 py-4 flex-shrink-0 border-t border-white/5 bg-surface/30">
              <button
                onClick={generate}
                disabled={draft.status === "loading"}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw size={12} />
                Regenerate
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={close}
                  className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={copy}
                  disabled={draft.status !== "ready" || !draft.text}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-background bg-brand hover:bg-brand-light transition-colors rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
