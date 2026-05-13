// ============================================================
// ROSTER — useToolRestore
// ------------------------------------------------------------
// Restores a work tool's state on mount.
//   1. Checks localStorage first (instant, no network call).
//   2. Falls back to the server snapshot if localStorage is
//      empty (new device, cleared cache, incognito, etc.).
//   3. On server restore, writes back to localStorage so the
//      tool's own auto-save continues to work normally.
//
// Usage:
//   useToolRestore("personal-budget", STORAGE_KEY, setData);
// ============================================================
import { useEffect } from "react";

export function useToolRestore<T>(
  slug: string,
  storageKey: string,
  setData: (data: T) => void,
) {
  useEffect(() => {
    // ── 1. Try localStorage ──────────────────────────────────
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setData(JSON.parse(raw) as T);
        return; // localStorage hit — no network needed
      }
    } catch {
      // corrupted local data — fall through to server
    }

    // ── 2. Server fallback ───────────────────────────────────
    fetch(`/api/tools/save?slug=${slug}`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const data = snapshot.data as T;
        setData(data);
        // Seed localStorage so subsequent auto-saves work normally
        try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* quota */ }
      })
      .catch(() => {}); // network error — tool starts fresh, that's fine
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
