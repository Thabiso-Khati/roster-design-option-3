// ============================================================
// ROSTER — DEV ONLY: Test booking trigger
// ------------------------------------------------------------
// Renders a small button that POSTs to /api/dev/create-test-booking
// and refreshes the page so the new booking appears. Only imported
// on /dashboard/bookings when NODE_ENV === 'development'.
//
// Callers must pass `enabled={process.env.NODE_ENV === 'development'}`
// from a server component so this never ships in production bundles.
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface Props {
  enabled: boolean;
}

export function TestBookingButton({ enabled }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<
    | null
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
  >(null);

  if (!enabled) return null;

  async function create(minutes = 1) {
    setBusy(true);
    setFlash(null);
    try {
      const res = await fetch(
        `/api/dev/create-test-booking?minutes=${minutes}`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!res.ok) {
        setFlash({ kind: "err", message: json.error || `Failed (${res.status})` });
      } else if (json.roomError) {
        setFlash({
          kind: "err",
          message: `Booking created but Daily room failed: ${json.roomError}`,
        });
      } else {
        setFlash({
          kind: "ok",
          message: `Test booking created (${minutes === 1 ? "joinable now" : `opens in ${minutes}m`}).`,
        });
        router.refresh();
      }
    } catch (e) {
      setFlash({
        kind: "err",
        message: e instanceof Error ? e.message : "Request failed",
      });
    } finally {
      setBusy(false);
      setTimeout(() => setFlash(null), 6000);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
          <FlaskConical size={14} />
          Dev tools
        </div>
        <div className="text-xs text-text-muted flex-1 min-w-[200px]">
          Generate a paid test booking + live Daily room so you can test the
          meeting flow without running payments.
        </div>
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => create(1)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <FlaskConical size={12} />}
            Join now
          </button>
          <button
            disabled={busy}
            onClick={() => create(30)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-text-primary transition-colors disabled:opacity-50"
            title="Schedule 30 min out so you can see the 'Opens in …' state"
          >
            +30 min
          </button>
        </div>
      </div>

      {flash && (
        <div
          className={`mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
            flash.kind === "ok"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              : "bg-red-500/10 border border-red-500/20 text-red-300"
          }`}
        >
          {flash.kind === "ok" ? (
            <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
          )}
          <span>{flash.message}</span>
        </div>
      )}
    </div>
  );
}
