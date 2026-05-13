// ============================================================
// ROSTER — useWorkspaceTracking (Phase 2 client hook)
// ------------------------------------------------------------
// Drop-in tracking for any tool/form/checklist that wants to
// emit lifecycle events to the dashboard's state-surfacing
// system. Designed to be cheap to add — one hook call per tool.
//
// Behaviour:
//   1. On mount: emits 'opened' once (deduped 60s — re-renders
//      and brief navigations don't spam events).
//   2. On every change to `dependencies`: debounces 5s, then
//      emits 'edited' with the current completion percentage.
//      Local typing → 5s of inactivity → one event. No
//      per-keystroke spam.
//   3. Returns markCompleted/markDismissed/markReopened so the
//      tool can call them on its "done" / "archive" / "revise"
//      conditions explicitly.
//
// Failures are silent (logged to console) — the workspace events
// table is a state-tracking convenience, not a hard dependency.
// A failed event must NEVER break the user's actual tool flow.
// See /docs/phase-2-state-surfacing.md § 4 for the full design.
// ============================================================

"use client";

import { useEffect, useRef } from "react";
import type {
  ArtifactType,
  EventType,
  WorkspaceEventPayload,
} from "@/lib/workspace/types";

interface UseWorkspaceTrackingOptions {
  /** What kind of artifact this is — see ArtifactType union. */
  artifactType: ArtifactType;
  /** Stable identifier for this artifact within its type.
   *  Single-instance tools: e.g. "tool:album-budget".
   *  Multi-instance tools: e.g. "tool:tour-budget:cape-town-tour". */
  artifactId: string;
  /** Human label shown on dashboard cards. */
  artifactLabel: string;
  /** Function that returns 0..1 completion at the moment it's called. */
  computeCompletion: () => number;
  /** Reactive deps that should trigger an `edited` event when they
   *  change. Pass the same shape you'd pass to useEffect deps. */
  dependencies: ReadonlyArray<unknown>;
  /** Set false to disable tracking entirely (e.g. preview mode). */
  enabled?: boolean;
}

interface UseWorkspaceTrackingReturn {
  markCompleted: () => void;
  markDismissed: (snoozeUntil?: string) => void;
  markReopened: () => void;
}

const OPENED_DEDUP_MS = 60_000; // don't double-emit 'opened' within a minute
const EDITED_DEBOUNCE_MS = 5_000; // 5s of inactivity → one 'edited' event

export function useWorkspaceTracking(
  opts: UseWorkspaceTrackingOptions
): UseWorkspaceTrackingReturn {
  const {
    artifactType,
    artifactId,
    artifactLabel,
    computeCompletion,
    dependencies,
    enabled = true,
  } = opts;

  // Refs hold mutable state that mustn't trigger re-renders.
  const lastOpenedAtRef = useRef<number>(0);
  const editedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRunRef = useRef(true);
  const computeCompletionRef = useRef(computeCompletion);
  computeCompletionRef.current = computeCompletion; // always latest

  // ── 'opened' on mount ────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastOpenedAtRef.current < OPENED_DEDUP_MS) return;
    lastOpenedAtRef.current = now;
    void emit({
      artifactType,
      artifactId,
      artifactLabel,
      eventType: "opened",
      completionPct: safeCompute(computeCompletionRef.current),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifactType, artifactId, artifactLabel, enabled]);

  // ── 'edited' on dependency change (debounced) ────────────
  useEffect(() => {
    if (!enabled) return;
    // Skip the first run — that's the same render cycle as 'opened'.
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }

    if (editedTimerRef.current) clearTimeout(editedTimerRef.current);
    editedTimerRef.current = setTimeout(() => {
      void emit({
        artifactType,
        artifactId,
        artifactLabel,
        eventType: "edited",
        completionPct: safeCompute(computeCompletionRef.current),
      });
    }, EDITED_DEBOUNCE_MS);

    return () => {
      if (editedTimerRef.current) clearTimeout(editedTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, artifactType, artifactId, artifactLabel, enabled]);

  return {
    markCompleted: () => {
      void emit({
        artifactType,
        artifactId,
        artifactLabel,
        eventType: "completed",
        completionPct: 1,
      });
    },
    markDismissed: (snoozeUntil) => {
      void emit({
        artifactType,
        artifactId,
        artifactLabel,
        eventType: "dismissed",
        completionPct: safeCompute(computeCompletionRef.current),
        metadata: snoozeUntil ? { snooze_until: snoozeUntil } : null,
      });
    },
    markReopened: () => {
      void emit({
        artifactType,
        artifactId,
        artifactLabel,
        eventType: "reopened",
        completionPct: safeCompute(computeCompletionRef.current),
      });
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────

function safeCompute(fn: () => number): number | null {
  try {
    const v = fn();
    if (!Number.isFinite(v)) return null;
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  } catch {
    return null;
  }
}

async function emit(payload: WorkspaceEventPayload): Promise<void> {
  try {
    await fetch("/api/workspace/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Tracking failures must never block the user's flow.
      keepalive: true,
    });
  } catch (err) {
    // Soft fail — don't surface to the user.
    if (typeof console !== "undefined") {
      console.warn("[useWorkspaceTracking] emit failed:", err);
    }
  }
}
