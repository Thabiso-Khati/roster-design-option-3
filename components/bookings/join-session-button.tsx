// ============================================================
// ROSTER — Join Session button
// ------------------------------------------------------------
// Live-gated "Join Session" CTA for a booked expert meeting.
//
// Three visual states driven by current time vs scheduled_at:
//   • "Opens in 2h 14m"     — before join window, disabled
//   • "Join session"        — inside join window, primary CTA
//   • "Session ended"       — after join window, disabled
//
// The component ticks every 30 seconds so the label stays fresh
// without needing a page refresh. No server round-trip — the
// server enforces the same window on the token endpoint, this
// is just UX.
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, Clock, Lock } from "lucide-react";

const JOIN_BEFORE_MS = 15 * 60 * 1000;      // open 15 min before start
const JOIN_AFTER_MS = 30 * 60 * 1000;       // stay open 30 min past end

interface JoinSessionButtonProps {
  bookingId: string;
  scheduledAt: string;       // ISO
  durationMinutes: number;
  meetingReady: boolean;     // true when booking has a meeting_room_name
}

export function JoinSessionButton({
  bookingId,
  scheduledAt,
  durationMinutes,
  meetingReady,
}: JoinSessionButtonProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const scheduledMs = new Date(scheduledAt).getTime();
  const windowStart = scheduledMs - JOIN_BEFORE_MS;
  const windowEnd = scheduledMs + durationMinutes * 60_000 + JOIN_AFTER_MS;

  // Room missing — the Paystack webhook should have created it at
  // payment time. If not, show a support-friendly disabled state.
  if (!meetingReady) {
    return (
      <div className="flex items-center gap-2 text-xs text-text-muted px-3 py-2 rounded-lg border border-white/5 bg-white/5">
        <Lock size={12} />
        Meeting room pending — contact support if this persists
      </div>
    );
  }

  if (now < windowStart) {
    const countdown = formatCountdown(windowStart - now);
    return (
      <button
        disabled
        title={`Opens at ${new Date(windowStart).toLocaleTimeString()}`}
        className="flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-text-muted cursor-not-allowed"
      >
        <Clock size={13} />
        Opens in {countdown}
      </button>
    );
  }

  if (now > windowEnd) {
    return (
      <div className="flex items-center gap-2 text-xs text-text-muted px-3 py-2 rounded-lg border border-white/5 bg-white/5">
        <Clock size={12} />
        Session ended
      </div>
    );
  }

  // Inside join window — live CTA
  return (
    <Link
      href={`/meeting/${bookingId}`}
      className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-background transition-colors animate-pulse-subtle"
    >
      <Video size={14} />
      Join session
    </Link>
  );
}

function formatCountdown(ms: number): string {
  const totalMins = Math.ceil(ms / 60_000);
  if (totalMins < 60) return `${totalMins}m`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}
