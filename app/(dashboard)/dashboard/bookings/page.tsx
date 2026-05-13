"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  Video, Trash2, Loader2,
} from "lucide-react";
import { bookingWaLink } from "@/lib/whatsapp";
import { CURRENCY_SYMBOLS } from "@/lib/locale";

// ── Types ────────────────────────────────────────────────────
interface Expert { name: string; specialty?: string | null; }
interface Booking {
  id: string;
  booking_status: string;
  payment_status: string;
  scheduled_at: string;
  duration_minutes: number;
  amount: number;
  currency: string;
  notes?: string | null;
  experts: Expert | null;
}

// ── Helpers ──────────────────────────────────────────────────
function formatScheduled(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }) + " at " + d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_CFG = {
  confirmed: { label: "Active",    Icon: CheckCircle2, color: "#10B981" },
  completed: { label: "Completed", Icon: CheckCircle2, color: "#64748B" },
  cancelled: { label: "Cancelled", Icon: XCircle,      color: "#EF4444" },
  pending:   { label: "Pending",   Icon: AlertCircle,  color: "#F59E0B" },
} as const;

const PAYMENT_CFG = {
  paid:     { label: "Active",    color: "#10B981" },
  pending:  { label: "Pending",   color: "#F59E0B" },
  refunded: { label: "Refunded",  color: "#64748B" },
} as const;

// Is the session joinable? Within 15 min before → 90 min after scheduled time.
function isJoinable(scheduledAt: string, durationMinutes: number): boolean {
  const start = new Date(scheduledAt).getTime();
  const now   = Date.now();
  return now >= start - 15 * 60_000 && now <= start + (durationMinutes + 90) * 60_000;
}

function isUpcoming(scheduledAt: string): boolean {
  return new Date(scheduledAt).getTime() > Date.now();
}

// ── BookingCard ───────────────────────────────────────────────
function BookingCard({
  booking,
  onDeleted,
}: {
  booking: Booking;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  const statusCfg  = STATUS_CFG[booking.booking_status  as keyof typeof STATUS_CFG]  ?? STATUS_CFG.pending;
  const paymentCfg = PAYMENT_CFG[booking.payment_status as keyof typeof PAYMENT_CFG] ?? PAYMENT_CFG.pending;
  const { Icon: StatusIcon } = statusCfg;
  const sym       = CURRENCY_SYMBOLS[booking.currency] ?? booking.currency;
  const amountStr = `${sym} ${booking.amount?.toLocaleString() ?? "–"}`;

  const isConfirmedPaid = booking.booking_status === "confirmed" && booking.payment_status === "paid";
  const joinable        = isConfirmedPaid && isJoinable(booking.scheduled_at, booking.duration_minutes);
  const upcoming        = isUpcoming(booking.scheduled_at);

  // Deletable: past, cancelled, completed, or pending unpaid
  const isDeletable =
    booking.booking_status === "cancelled"  ||
    booking.booking_status === "completed"  ||
    booking.payment_status === "pending"    ||
    !upcoming;

  const handleDelete = async () => {
    if (!window.confirm("Remove this booking from your list?")) return;
    setDeleting(true);
    setDeleteErr("");
    try {
      const r = await fetch(`/api/bookings/${booking.id}`, { method: "DELETE" });
      if (r.ok) {
        onDeleted(booking.id);
      } else {
        const j = await r.json().catch(() => ({}));
        setDeleteErr(j.error || "Could not delete booking.");
        setDeleting(false);
      }
    } catch {
      setDeleteErr("Network error. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left — booking info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-text-primary">
              {booking.experts?.name ?? "Expert Session"}
            </h3>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ color: statusCfg.color, backgroundColor: `${statusCfg.color}15` }}
            >
              <StatusIcon size={10} className="inline mr-1" />
              {statusCfg.label}
            </span>
          </div>
          {booking.experts?.specialty && (
            <p className="text-sm text-brand mb-2">{booking.experts.specialty}</p>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatScheduled(booking.scheduled_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {booking.duration_minutes} minutes
            </span>
          </div>
        </div>

        {/* Right — amount + payment status */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-lg font-black text-text-primary">{amountStr}</span>
          <span className="text-xs font-semibold" style={{ color: paymentCfg.color }}>
            {paymentCfg.label}
          </span>
        </div>
      </div>

      {/* Actions row */}
      <div className="mt-4 pt-4 border-t border-border flex items-center gap-3 flex-wrap">
        {/* Notes */}
        {booking.notes && (
          <p className="text-xs text-text-muted italic flex-1 min-w-0 truncate">
            &ldquo;{booking.notes}&rdquo;
          </p>
        )}

        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {/* Join Meeting — shown for confirmed+paid within the time window */}
          {isConfirmedPaid && (
            <Link
              href={`/meeting/${booking.id}`}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                joinable
                  ? "text-white"
                  : "text-text-muted opacity-50 pointer-events-none"
              }`}
              style={joinable ? {
                background: "linear-gradient(135deg,#C9A84C,#a8872e)",
                boxShadow: "0 0 12px rgba(201,168,76,0.3)",
              } : {
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              aria-disabled={!joinable}
              title={joinable ? "Join your session" : "Available 15 min before scheduled time"}
            >
              <Video size={12} />
              {joinable ? "Join Meeting" : upcoming ? "Join (upcoming)" : "Session ended"}
            </Link>
          )}

          {/* WhatsApp share — confirmed + paid */}
          {isConfirmedPaid && (
            <a
              href={bookingWaLink({
                expertName: booking.experts?.name ?? "Expert",
                durationMinutes: booking.duration_minutes,
                scheduledAt: booking.scheduled_at,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "#25D366", backgroundColor: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.851L.057 23.5l5.799-1.522A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.893 0-3.674-.498-5.218-1.369l-.374-.222-3.44.902.919-3.352-.243-.387A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              Share WhatsApp
            </a>
          )}

          {/* Delete — past / cancelled / pending-unpaid */}
          {isDeletable && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "#EF4444", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
              title="Remove booking from list"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {deleting ? "Removing…" : "Delete"}
            </button>
          )}
        </div>
      </div>

      {deleteErr && (
        <p className="text-xs text-red-400 mt-2">{deleteErr}</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/bookings/list")
      .then(r => r.json())
      .then(j => { setBookings(j.bookings ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-text-primary">My Bookings</h1>
        <p className="text-text-muted mt-2">Upcoming &amp; past</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-5">
            <Calendar size={24} className="text-text-muted" />
          </div>
          <h3 className="font-bold text-text-primary mb-2">No bookings yet</h3>
          <p className="text-text-muted text-sm mb-6 max-w-xs mx-auto">
            Book a session with an industry expert to get started.
          </p>
          <Link
            href="/dashboard/experts"
            className="inline-flex items-center gap-2 bg-gold-gradient text-background font-bold text-sm px-5 py-2.5 rounded-lg"
          >
            Find an Expert
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <BookingCard key={b.id} booking={b} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
