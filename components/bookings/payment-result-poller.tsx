// ============================================================
// ROSTER — Payment result poller
// ------------------------------------------------------------
// Client-only helper for the /dashboard/payment-result pending
// state. Polls /api/bookings/[id]/status every 2s up to a cap.
// When the booking flips to paid, does a full page reload so the
// server component re-renders into its Success state (which also
// re-fetches the meeting URL and expert details).
//
// After the timeout we stop polling and the parent page stays on
// its "check your email" fallback copy.
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  bookingId: string;
  /** Poll interval in ms. Default 2000. */
  intervalMs?: number;
  /** Max total duration before giving up, in ms. Default 30s. */
  maxWaitMs?: number;
}

export function PaymentResultPoller({
  bookingId,
  intervalMs = 2000,
  maxWaitMs = 30_000,
}: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    async function tick() {
      if (cancelled) return;
      const now = Date.now() - start;
      setElapsed(now);

      if (now >= maxWaitMs) return; // stop polling, parent shows fallback copy

      try {
        const res = await fetch(`/api/bookings/${bookingId}/status`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.paymentStatus === "paid") {
            // Full reload so the server component re-renders the success
            // variant with freshly-joined expert + meeting room data.
            window.location.reload();
            return;
          }
        }
      } catch {
        // Network hiccup — just try again next tick.
      }

      setTimeout(tick, intervalMs);
    }

    // Kick off the first poll immediately — the redirect typically beats
    // the webhook by a couple hundred ms, but it can also arrive after.
    tick();

    return () => {
      cancelled = true;
    };
  }, [bookingId, intervalMs, maxWaitMs]);

  const timedOut = elapsed >= maxWaitMs;

  return (
    <div className="w-14 h-14 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-5">
      {timedOut ? (
        <Loader2 size={22} className="text-text-muted" />
      ) : (
        <Loader2 size={22} className="text-brand animate-spin" />
      )}
    </div>
  );
}
