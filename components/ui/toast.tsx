"use client";
import { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastState { toasts: Toast[] }
type ToastAction =
  | { type: "ADD"; toast: Toast }
  | { type: "REMOVE"; id: string };

// ── Context ────────────────────────────────────────────────────
const ToastContext = createContext<{
  toast: (message: string, type?: ToastType, duration?: number) => void;
} | null>(null);

// ── Reducer ────────────────────────────────────────────────────
function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD":
      return { toasts: [...state.toasts.slice(-3), action.toast] }; // max 4 at once
    case "REMOVE":
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}

// ── Config ─────────────────────────────────────────────────────
const TOAST_CONFIG: Record<ToastType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle2, color: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  error:   { icon: XCircle,      color: "#EF4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)"  },
  warning: { icon: AlertCircle,  color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  info:    { icon: Info,         color: "#C9A84C", bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.2)" },
};

// ── Single Toast ───────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const { icon: Icon, color, bg, border } = TOAST_CONFIG[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-xl animate-slide-up max-w-sm w-full"
      style={{ background: bg, border: `1px solid ${border}`, backdropFilter: "blur(12px)" }}
    >
      <Icon size={16} style={{ color }} className="mt-0.5 flex-shrink-0" />
      <p className="text-sm text-text-primary flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── Provider ───────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      dispatch({ type: "ADD", toast: { id, message, type, duration } });
    },
    []
  );

  const remove = useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — top-right on desktop, top-centre on mobile */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {state.toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full sm:w-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}

// ── Convenience exports ────────────────────────────────────────
export const toast = {
  success: (msg: string) => { /* used via hook in components */ void msg; },
  error:   (msg: string) => { void msg; },
  warning: (msg: string) => { void msg; },
  info:    (msg: string) => { void msg; },
};
