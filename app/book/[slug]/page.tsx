"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Calendar, Clock, ChevronLeft, ChevronRight,
  Check, Loader2, AlertCircle, User, Mail, Phone, AlignLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

// ── Types ────────────────────────────────────────────────────

interface BookingConfig {
  display_name: string;
  bio?:         string | null;
  durations:    number[];
  rate_cents:   number;
  currency:     string;
  active:       boolean;
}

type Step = "date" | "time" | "details" | "confirm" | "done";

const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Helpers ──────────────────────────────────────────────────

function toDateKey(d: Date) {
  // Use local date components — toISOString() converts to UTC first and
  // rolls back by one day for UTC+ users (e.g. SAST = UTC+2)
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(d.getDate() + n); return r;
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function startOfWeek(d: Date)  { const r = new Date(d); r.setDate(d.getDate() - d.getDay()); return r; }

function formatCurrency(cents: number, currency: string) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency, minimumFractionDigits: 0 }).format(cents / 100);
}
function formatDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Booking page ─────────────────────────────────────────────

export default function BookingPage() {
  const params      = useParams<{ slug: string }>();
  const slug        = params.slug;

  const [config,     setConfig]     = useState<BookingConfig | null>(null);
  const [configErr,  setConfigErr]  = useState("");
  const [step,       setStep]       = useState<Step>("date");

  // Selections
  const [duration,   setDuration]   = useState<number>(0);
  const [viewMonth,  setViewMonth]  = useState(new Date());
  const [selectedDate, setDate]     = useState<Date | null>(null);
  const [slots,      setSlots]      = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setTime]     = useState<string>("");

  // Month availability — which dates have at least one open slot
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [monthLoading,   setMonthLoading]   = useState(false);

  // Form
  const [guestName,  setGuestName]  = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes,      setNotes]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState("");
  const [payLink,    setPayLink]    = useState<string | null>(null);

  // ── Load config ───────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const res  = await fetch(`/api/calendar/availability?slug=${slug}&date=${toDateKey(new Date())}`);
      if (res.status === 404) { setConfigErr("This booking link doesn't exist or has been disabled."); return; }
      // Load display config separately
      const cfgRes  = await fetch(`/api/book-config?slug=${slug}`);
      if (cfgRes.ok) {
        const j = await cfgRes.json();
        setConfig(j.config);
        if (j.config?.durations?.length > 0) setDuration(j.config.durations[0]);
      }
    }
    void load();
  }, [slug]);

  // ── Load month availability when month/slug changes ──────

  useEffect(() => {
    async function loadMonth() {
      setMonthLoading(true);
      try {
        const year  = viewMonth.getFullYear();
        const month = viewMonth.getMonth() + 1; // 1-based
        const res   = await fetch(`/api/calendar/availability/month?slug=${slug}&year=${year}&month=${month}`);
        if (res.ok) {
          const json = await res.json();
          setAvailableDates(new Set(json.availableDates ?? []));
        }
      } finally {
        setMonthLoading(false);
      }
    }
    void loadMonth();
  }, [slug, viewMonth]);

  // ── Load slots when date/duration changes ─────────────────

  const loadSlots = useCallback(async (date: Date, dur: number) => {
    setSlotsLoading(true);
    setSlots([]);
    try {
      const res  = await fetch(`/api/calendar/availability?slug=${slug}&date=${toDateKey(date)}&duration=${dur}`);
      const json = await res.json();
      if (res.ok) {
        setSlots(json.slots ?? []);
        if (!config) {
          setConfig({
            display_name: "Host",
            durations:    json.durations,
            rate_cents:   json.rate_cents,
            currency:     json.currency,
            active:       true,
          });
          setDuration(json.durations?.[0] ?? dur);
        }
      }
    } finally {
      setSlotsLoading(false);
    }
  }, [slug, config]);

  useEffect(() => {
    if (selectedDate) void loadSlots(selectedDate, duration);
  }, [selectedDate, duration, loadSlots]);

  // ── Calendar grid ─────────────────────────────────────────

  const today      = new Date(); today.setHours(0,0,0,0);
  const monthStart = startOfMonth(viewMonth);
  const monthEnd   = endOfMonth(viewMonth);
  const gridStart  = startOfWeek(monthStart);

  const weeks: Date[][] = [];
  let cursor = new Date(gridStart);
  while (cursor <= monthEnd || weeks.length < 4) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) { week.push(new Date(cursor)); cursor = addDays(cursor, 1); }
    weeks.push(week);
    if (weeks.length >= 6) break;
  }

  // ── Handlers ──────────────────────────────────────────────

  function selectDate(d: Date) {
    setDate(d);
    setTime("");
    setStep("time");
  }

  function selectTime(t: string) {
    setTime(t);
    setStep("details");
  }

  async function handleSubmit() {
    if (!guestName.trim() || !guestEmail.trim() || !selectedDate || !selectedTime) {
      setSubmitErr("Please fill in all required fields.");
      return;
    }
    setSubmitting(true); setSubmitErr("");
    try {
      const res = await fetch("/api/calendar/book", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, duration,
          date:        toDateKey(selectedDate),
          time:        selectedTime,
          guest_name:  guestName.trim(),
          guest_email: guestEmail.trim(),
          guest_phone: guestPhone.trim() || undefined,
          notes:       notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setSubmitErr(json.error ?? "Something went wrong."); return; }
      if (json.paymentLink) {
        setPayLink(json.paymentLink);
        setStep("confirm");
      } else {
        setStep("done");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Error state ────────────────────────────────────────────

  if (configErr) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-sm">
          <AlertCircle size={40} className="text-error mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-text-primary mb-2">Link unavailable</h1>
          <p className="text-sm text-text-muted">{configErr}</p>
        </div>
      </div>
    );
  }

  // ── Done state ─────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">You&#39;re booked!</h1>
          <p className="text-sm text-text-muted mb-1">
            {selectedDate?.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
            {" at "}{selectedTime}
          </p>
          <p className="text-sm text-text-muted">
            A confirmation will be sent to <strong>{guestEmail}</strong>.
          </p>

          {/* Marketing CTA */}
          <div className="mt-10 pt-8 border-t border-border">
            <p className="text-xs text-text-muted mb-3">
              This booking was powered by{" "}
              <strong className="text-text-primary">{APP_NAME}</strong>'s Smart Calendar —
              the platform built for artists and creatives.
            </p>
            <a
              href="https://www.rosterapp.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-black text-sm font-bold hover:bg-brand/90 transition-all"
            >
              Get your own booking link →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment redirect state ─────────────────────────────────

  if (step === "confirm" && payLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-text-primary">Complete payment</h1>
          <p className="text-sm text-text-muted">
            Your slot is reserved for 10 minutes. Complete payment to confirm your booking.
          </p>
          <a
            href={payLink}
            className="block w-full py-3 rounded-xl bg-brand text-black font-semibold text-sm hover:bg-brand/90 transition-all"
          >
            Pay {config ? formatCurrency(config.rate_cents, config.currency) : ""} →
          </a>
          <button onClick={() => { setStep("details"); setPayLink(null); }} className="text-xs text-text-muted hover:text-text-primary">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── Main layout ────────────────────────────────────────────

  const hostName   = config?.display_name ?? "…";
  const isPaid     = (config?.rate_cents ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10 px-4">
      {/* Header */}
      <div className="w-full max-w-2xl mb-6 text-center">
        <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Powered by {APP_NAME}</p>
        <h1 className="text-2xl font-bold text-text-primary">{hostName}</h1>
        {config?.bio && <p className="text-sm text-text-muted mt-1 max-w-md mx-auto">{config.bio}</p>}
      </div>

      <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-lg overflow-hidden">
        {/* Step indicator */}
        <div className="flex border-b border-border">
          {(["date","time","details"] as Step[]).map((s, i) => (
            <button
              key={s}
              disabled={
                (s === "time" && !selectedDate) ||
                (s === "details" && (!selectedDate || !selectedTime))
              }
              onClick={() => {
                if (s === "date") setStep("date");
                if (s === "time" && selectedDate) setStep("time");
                if (s === "details" && selectedDate && selectedTime) setStep("details");
              }}
              className={cn(
                "flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2",
                step === s
                  ? "text-brand border-brand"
                  : "text-text-muted border-transparent hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
              )}
            >
              {i + 1}. {s === "date" ? "Pick a date" : s === "time" ? "Pick a time" : "Your details"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Duration picker — always visible */}
          {config && config.durations.length > 1 && (
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="text-xs text-text-muted font-medium">Duration:</span>
              {config.durations.map(d => (
                <button
                  key={d}
                  onClick={() => { setDuration(d); setTime(""); if (selectedDate) void loadSlots(selectedDate, d); }}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                    duration === d
                      ? "bg-brand/10 text-brand border-brand/30"
                      : "bg-surface-2 text-text-muted border-transparent hover:border-border"
                  )}
                >
                  {formatDuration(d)}
                  {isPaid && config.rate_cents > 0 && ` · ${formatCurrency(config.rate_cents, config.currency)}`}
                </button>
              ))}
            </div>
          )}

          {/* ── STEP: Date ──────────────────────────────────── */}
          {step === "date" && (
            <div>
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
                  disabled={viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() === today.getMonth()}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">
                    {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                  </span>
                  {monthLoading && <Loader2 size={13} className="animate-spin text-text-muted" />}
                </div>
                <button
                  onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs text-text-muted font-semibold py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7">
                  {week.map((day, di) => {
                    const dk          = toDateKey(day);
                    const isThisMonth = day.getMonth() === viewMonth.getMonth();
                    const isPast      = day < today;
                    const isSelected  = selectedDate && dk === toDateKey(selectedDate);
                    const hasSlots    = availableDates.has(dk);
                    const isDisabled  = isPast || !isThisMonth || (!monthLoading && !hasSlots);

                    return (
                      <div key={di} className="flex flex-col items-center my-0.5">
                        <button
                          disabled={isDisabled}
                          onClick={() => selectDate(day)}
                          className={cn(
                            "w-10 h-10 rounded-full text-sm font-medium transition-all relative",
                            isSelected
                              ? "bg-brand text-black"
                              : isDisabled
                              ? "text-text-muted/20 cursor-not-allowed"
                              : "hover:bg-brand/15 hover:text-brand text-text-primary cursor-pointer"
                          )}
                        >
                          {day.getDate()}
                          {/* Green dot for available, visible only when not loading and in this month */}
                          {isThisMonth && !isPast && !isSelected && (
                            <span className={cn(
                              "absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all",
                              monthLoading
                                ? "bg-text-muted/20"
                                : hasSlots
                                ? "bg-brand"
                                : "bg-transparent"
                            )} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Legend */}
              {!monthLoading && (
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border justify-center">
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <span className="w-2 h-2 rounded-full bg-brand inline-block" />
                    Available
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <span className="w-2 h-2 rounded-full bg-text-muted/20 inline-block" />
                    No slots
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: Time ──────────────────────────────────── */}
          {step === "time" && selectedDate && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <button onClick={() => setStep("date")} className="p-1 rounded text-text-muted hover:text-text-primary">
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <Calendar size={15} />
                  {selectedDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
                </div>
              </div>

              {slotsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-text-muted" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-10">
                  <Clock size={28} className="mx-auto text-text-muted mb-2" />
                  <p className="text-sm text-text-muted">No available slots on this day.</p>
                  <button onClick={() => setStep("date")} className="mt-3 text-xs text-brand hover:underline">
                    Choose another date
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => selectTime(slot)}
                      className={cn(
                        "py-2.5 rounded-xl text-sm font-semibold border transition-all",
                        selectedTime === slot
                          ? "bg-brand text-black border-brand"
                          : "bg-surface-2 text-text-primary border-border hover:border-brand/40 hover:bg-brand/5"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}

              {selectedTime && (
                <button
                  onClick={() => setStep("details")}
                  className="mt-5 w-full py-3 rounded-xl bg-brand text-black font-semibold text-sm hover:bg-brand/90 transition-all"
                >
                  Continue →
                </button>
              )}
            </div>
          )}

          {/* ── STEP: Details ───────────────────────────────── */}
          {step === "details" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 text-sm">
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Calendar size={14} />
                  {selectedDate?.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                </div>
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Clock size={14} />
                  {selectedTime} · {formatDuration(duration)}
                </div>
                {isPaid && (
                  <div className="ml-auto font-semibold text-brand">
                    {formatCurrency(config!.rate_cents, config!.currency)}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  <User size={11} className="inline mr-1" />Full name *
                </label>
                <input
                  autoFocus value={guestName} onChange={e => setGuestName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  <Mail size={11} className="inline mr-1" />Email address *
                </label>
                <input
                  type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  <Phone size={11} className="inline mr-1" />WhatsApp number (optional)
                </label>
                <input
                  type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                  placeholder="+27 82 000 0000"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  <AlignLeft size={11} className="inline mr-1" />What&#39;s this meeting about? (optional)
                </label>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)}
                  rows={3} placeholder="Share anything useful before the meeting..."
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-brand/50 transition-colors resize-none"
                />
              </div>

              {submitErr && (
                <p className="text-xs text-error flex items-center gap-1.5">
                  <AlertCircle size={12} />{submitErr}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-brand text-black font-semibold text-sm hover:bg-brand/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {isPaid ? `Pay & confirm booking` : "Confirm booking"}
              </button>

              <button onClick={() => setStep("time")} className="w-full text-xs text-text-muted hover:text-text-primary text-center">
                ← Back to times
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
