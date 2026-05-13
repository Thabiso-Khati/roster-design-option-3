"use client";
// ============================================================
// ROSTER — SaveButton
// ------------------------------------------------------------
// Reusable Save button used across all 68 work tools.
// States: idle → saving → saved (resets to idle after 3s)
//         error (resets to idle after 3s)
// On first successful save shows a "Saved to Workspace" tooltip.
//
// Two usage modes:
//   1. storageKey — reads tool state from localStorage at save
//      time. Use for tools that auto-save to localStorage.
//   2. getData    — calls a function to get current state.
//      Use for generator/AI tools with no localStorage.
// ============================================================
import { useState, useRef } from "react";
import { Check, Loader2, Save, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export interface SaveButtonProps {
  /** URL slug of the tool, e.g. "personal-budget" */
  toolSlug: string;
  /** localStorage key to read data from (for localStorage tools) */
  storageKey?: string;
  /** Alternative: callable that returns current tool state */
  getData?: () => unknown;
  /** Title shown in Workspace */
  title: string;
  /** Extra class names */
  className?: string;
  /** Called after a successful save */
  onSaved?: (id: string) => void;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function SaveButton({
  toolSlug,
  storageKey,
  getData,
  title,
  className,
  onSaved,
}: SaveButtonProps) {
  const [state,        setState]        = useState<SaveState>("idle");
  const [showTooltip,  setShowTooltip]  = useState(false);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const resetTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useToast();

  const handleSave = async () => {
    if (state === "saving") return;
    setState("saving");

    try {
      // Resolve data: storageKey → read localStorage, getData → call fn
      let data: unknown = {};
      if (storageKey) {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            // Handle both legacy bare format and { data, savedAt } wrapper
            data = parsed && typeof parsed === "object" && "savedAt" in parsed
              ? parsed.data
              : parsed;
          }
        } catch { /* ignore parse errors */ }
      } else if (getData) {
        data = getData();
      }

      const res = await fetch("/api/tools/save", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tool_slug: toolSlug, title, data }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Save failed (${res.status})`);
      }

      const { snapshot } = await res.json();
      setState("saved");
      onSaved?.(snapshot?.id);

      // Show "Saved to Workspace" tooltip on first save only
      if (!hasSavedOnce) {
        setHasSavedOnce(true);
        setShowTooltip(true);
        if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
        tooltipTimer.current = setTimeout(() => setShowTooltip(false), 3500);
      }

      // Reset to idle after 3s
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed. Please try again.";
      console.error("[SaveButton]", message);
      toast(message, "error");
      setState("error");
      // Reset error state after 3s
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setState("idle"), 3000);
    }
  };

  const label =
    state === "saving" ? "Saving…"     :
    state === "saved"  ? "Saved"       :
    state === "error"  ? "Save failed" :
    "Save";

  const Icon =
    state === "saving" ? Loader2      :
    state === "saved"  ? Check        :
    state === "error"  ? AlertCircle  :
    Save;

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleSave}
        disabled={state === "saving"}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
          state === "saved"
            ? "bg-green-500/15 text-green-400 border border-green-500/30"
            : state === "saving"
            ? "bg-brand/10 text-brand/60 border border-brand/20 cursor-wait"
            : state === "error"
            ? "bg-red-500/15 text-red-400 border border-red-500/30"
            : "bg-brand text-black hover:bg-brand/90 border border-transparent",
          className
        )}
      >
        <Icon
          size={14}
          className={state === "saving" ? "animate-spin" : undefined}
        />
        {label}
      </button>

      {/* First-save tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text-primary whitespace-nowrap shadow-lg z-50 animate-fade-in pointer-events-none">
          Saved to your Workspace
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
        </div>
      )}
    </div>
  );
}
