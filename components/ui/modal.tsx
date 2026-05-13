"use client";
/**
 * Modal — ROSTER UI primitive
 *
 * Usage:
 *   <Modal open={open} onClose={() => setOpen(false)} title="Add Artist">
 *     <p>Content here</p>
 *   </Modal>
 *
 * Features:
 *   - Focus trap (uses useFocusTrap hook)
 *   - Escape key closes
 *   - Click-outside closes
 *   - Scroll-lock on body while open
 *   - Accessible: role="dialog", aria-modal, aria-labelledby
 *   - Animated: fade + slide-up entry
 */
import {
  useEffect,
  useId,
  useRef,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  open:        boolean;
  onClose:     () => void;
  title?:      string;
  description?: string;
  children:    ReactNode;
  footer?:     ReactNode;
  size?:       ModalSize;
  /** Prevent closing when clicking the backdrop */
  persistent?: boolean;
  className?:  string;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm:   "max-w-sm",
  md:   "max-w-lg",
  lg:   "max-w-2xl",
  xl:   "max-w-4xl",
  full: "max-w-[95vw] h-[90vh]",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  persistent = false,
  className,
}: ModalProps) {
  const panelRef  = useRef<HTMLDivElement>(null);
  const _id       = useId();
  const titleId   = `modal-title-${_id}`;
  const descId    = description ? `modal-desc-${_id}` : undefined;

  // ── Scroll lock ────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // ── Focus trap ─────────────────────────────────────────────
  useEffect(() => {
    if (!open || !panelRef.current) return;

    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    first?.focus();

    const trap = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    };

    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [open]);

  // ── Escape to close ────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape" && !persistent) onClose();
    },
    [onClose, persistent]
  );

  // ── Backdrop click ─────────────────────────────────────────
  const handleBackdropClick = useCallback(() => {
    if (!persistent) onClose();
  }, [onClose, persistent]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={descId}
        className={cn(
          "relative z-10 w-full bg-surface border border-border rounded-2xl shadow-2xl",
          "animate-slide-up flex flex-col",
          SIZE_CLASSES[size],
          size === "full" ? "overflow-hidden" : "max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        {/* Header */}
        {(title || !persistent) && (
          <div className="flex items-start justify-between gap-4 p-6 border-b border-border flex-shrink-0">
            <div>
              {title && (
                <h2 id={titleId} className="text-lg font-semibold text-text-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-1 text-sm text-text-muted">
                  {description}
                </p>
              )}
            </div>
            {!persistent && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
