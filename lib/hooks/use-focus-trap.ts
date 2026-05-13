/**
 * useFocusTrap
 *
 * Traps keyboard focus inside a container element while active.
 * Use in modals, drawers, and dialogs to prevent screen-reader users
 * from tabbing out into inert content behind the overlay.
 *
 * Usage:
 *   const trapRef = useFocusTrap(isOpen);
 *   <div ref={trapRef} role="dialog" aria-modal="true"> ... </div>
 *
 * Behaviour:
 *   - On activation, focuses the first focusable child (or the container itself).
 *   - Tab / Shift+Tab cycle is clamped within the container.
 *   - On deactivation, returns focus to the element that was active before
 *     the trap was engaged (e.g. the button that opened the modal).
 */
"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Remember where focus was before the trap opened
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the first focusable child, or the container itself
    const focusable = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusable[0] ?? containerRef.current;
    first.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !containerRef.current) return;

      const focusableNow = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (focusableNow.length === 0) { e.preventDefault(); return; }

      const firstEl = focusableNow[0];
      const lastEl  = focusableNow[focusableNow.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if focus is on the first element, wrap to last
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab: if focus is on the last element, wrap to first
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus when the trap deactivates
      previousFocusRef.current?.focus();
    };
  }, [active]);

  return containerRef;
}
