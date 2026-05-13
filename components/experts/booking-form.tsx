"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MessageSquare, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/hooks";

interface SessionType {
  id: string;
  duration_minutes: number;
  price: number;
  currency: string;
}

interface BookingFormProps {
  expertId: string;
  expertName: string;
  sessionTypes: SessionType[];
}

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "13:00", "13:30", "14:00",
  "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
];

function formatPrice(amount: number, currency: string) {
  return currency === "ZAR" ? `R${amount.toLocaleString()}` : `${currency} ${amount}`;
}

// Next 14 available days (excluding Sundays)
function getAvailableDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  let d = new Date(today);
  d.setDate(d.getDate() + 1);
  while (dates.length < 14) {
    if (d.getDay() !== 0) dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-ZA", { weekday: "short", month: "short", day: "numeric" });
}
function fmtDateValue(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function BookingForm({ expertId, expertName, sessionTypes }: BookingFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(
    sessionTypes[0] || null
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const availableDates = getAvailableDates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !selectedDate || !selectedTime) {
      setError(t("experts.errSelectAll"));
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertId,
          sessionId: selectedSession.id,
          durationMinutes: selectedSession.duration_minutes,
          amount: selectedSession.price,
          currency: selectedSession.currency,
          scheduledAt: `${selectedDate}T${selectedTime}:00.000Z`,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("experts.errCreateBooking"));
        setLoading(false);
        return;
      }

      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        router.push("/dashboard/bookings");
      }
    } catch {
      setError(t("experts.errGenericRetry"));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Session type */}
      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
          <Clock size={12} className="inline mr-1.5" />
          {t("experts.selectSessionLength")}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {sessionTypes.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => setSelectedSession(session)}
              className={`rounded-xl p-4 text-left border transition-all ${
                selectedSession?.id === session.id
                  ? "border-brand bg-brand/10 text-text-primary"
                  : "border-border bg-surface-2 text-text-muted hover:border-brand/40"
              }`}
            >
              <p className="font-bold text-sm">{session.duration_minutes} min</p>
              <p
                className={`text-sm font-semibold mt-0.5 ${
                  selectedSession?.id === session.id ? "text-brand" : "text-text-muted"
                }`}
              >
                {formatPrice(session.price, session.currency)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Date picker */}
      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
          <Calendar size={12} className="inline mr-1.5" />
          {t("experts.selectDate")}
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {availableDates.map((date) => {
            const val = fmtDateValue(date);
            const isSelected = selectedDate === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setSelectedDate(val)}
                className={`flex-shrink-0 rounded-xl px-3 py-2.5 text-center border transition-all min-w-[70px] ${
                  isSelected
                    ? "border-brand bg-brand/10 text-text-primary"
                    : "border-border bg-surface-2 text-text-muted hover:border-brand/40"
                }`}
              >
                <p className="text-xs font-semibold">{fmtDate(date).split(" ")[0]}</p>
                <p className={`text-sm font-bold ${isSelected ? "text-brand" : ""}`}>
                  {fmtDate(date).split(" ")[2]}
                </p>
                <p className="text-xs text-text-muted">{fmtDate(date).split(" ")[1]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
            <Clock size={12} className="inline mr-1.5" />
            {t("experts.selectTime")}
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {TIME_SLOTS.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`rounded-lg py-2 text-xs font-semibold border transition-all ${
                  selectedTime === time
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border bg-surface-2 text-text-muted hover:border-brand/40"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
          <MessageSquare size={12} className="inline mr-1.5" />
          {t("experts.sessionNotesOptional")}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("experts.sessionNotesPlaceholder").replace("{name}", expertName.split(" ")[0])}
          rows={3}
          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none transition-all"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Summary + CTA */}
      {selectedSession && selectedDate && selectedTime && (
        <div className="glass-card rounded-xl p-4 border-brand/20">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
            {t("experts.bookingSummary")}
          </p>
          <p className="text-sm text-text-primary font-semibold">
            {t("experts.bookingWith").replace("{min}", String(selectedSession.duration_minutes)).replace("{name}", expertName)}
          </p>
          <p className="text-sm text-text-muted">
            {t("experts.bookingAt").replace("{date}", fmtDate(new Date(selectedDate))).replace("{time}", selectedTime)}
          </p>
          <p className="text-lg font-black text-brand mt-2">
            {formatPrice(selectedSession.price, selectedSession.currency)}
          </p>
        </div>
      )}

      <Button
        type="submit"
        loading={loading}
        size="lg"
        className="w-full"
        disabled={!selectedSession || !selectedDate || !selectedTime}
      >
        <CreditCard size={16} className="mr-2" />
        {t("experts.confirmPay")}
      </Button>

      <p className="text-center text-xs text-text-muted">
        {t("experts.paystackNote")}
      </p>
    </form>
  );
}
