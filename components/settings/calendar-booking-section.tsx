"use client";

import { useState, useEffect } from "react";
import {
  Link2, Copy, Check, Loader2, Plus, Trash2,
  ExternalLink, ToggleLeft, ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

// ── Types ────────────────────────────────────────────────────

interface AvailabilityWindow { day: number; from: string; to: string; }

interface BookingLinkConfig {
  slug:           string;
  display_name:   string;
  bio?:           string | null;
  availability:   AvailabilityWindow[];
  buffer_minutes: number;
  notice_hours:   number;
  durations:      number[];
  rate_cents:     number;
  currency:       string;
  active:         boolean;
}

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// All 7 days, 8am–10pm — wide enough for any timezone, not absurdly open
const DEFAULT_AVAILABILITY: AvailabilityWindow[] = [
  { day: 0, from: "08:00", to: "22:00" },
  { day: 1, from: "08:00", to: "22:00" },
  { day: 2, from: "08:00", to: "22:00" },
  { day: 3, from: "08:00", to: "22:00" },
  { day: 4, from: "08:00", to: "22:00" },
  { day: 5, from: "08:00", to: "22:00" },
  { day: 6, from: "08:00", to: "22:00" },
];

const DEFAULT_DURATIONS = [15, 30, 45, 60];

// ── Component ────────────────────────────────────────────────

export function CalendarBookingSection() {
  const [config,    setConfig]    = useState<BookingLinkConfig | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");
  const [copied,    setCopied]    = useState(false);

  // Form state
  const [slug,        setSlug]        = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio,         setBio]         = useState("");
  const [availability,setAvailability]= useState<AvailabilityWindow[]>(DEFAULT_AVAILABILITY);
  const [buffer,      setBuffer]      = useState(15);
  const [notice,      setNotice]      = useState(24);
  const [durations,   setDurations]   = useState<number[]>(DEFAULT_DURATIONS);
  const [newDuration, setNewDuration] = useState("");
  const [rateCents,   setRateCents]   = useState(0);
  const [currency,    setCurrency]    = useState("ZAR");
  const [active,      setActive]      = useState(true);

  const appUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? "");

  // ── Load existing config ──────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/calendar/booking-link");
        const json = await res.json();
        if (json.bookingLink) {
          const bl = json.bookingLink as BookingLinkConfig;
          setConfig(bl);
          setSlug(bl.slug);
          setDisplayName(bl.display_name);
          setBio(bl.bio ?? "");
          setAvailability(bl.availability ?? DEFAULT_AVAILABILITY);
          setBuffer(bl.buffer_minutes);
          setNotice(bl.notice_hours);
          setDurations(bl.durations);
          setRateCents(bl.rate_cents);
          setCurrency(bl.currency);
          setActive(bl.active);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  // ── Availability helpers ──────────────────────────────────

  function slotsForDay(day: number) {
    return availability.filter(w => w.day === day);
  }

  function toggleDay(day: number) {
    setAvailability(prev => {
      const has = prev.some(w => w.day === day);
      if (has) return prev.filter(w => w.day !== day);
      return [...prev, { day, from: "08:00", to: "22:00" }]
        .sort((a, b) => a.day !== b.day ? a.day - b.day : a.from.localeCompare(b.from));
    });
  }

  function addSlot(day: number) {
    setAvailability(prev =>
      [...prev, { day, from: "08:00", to: "22:00" }]
        .sort((a, b) => a.day !== b.day ? a.day - b.day : a.from.localeCompare(b.from))
    );
  }

  function removeSlot(day: number, slotIdx: number) {
    setAvailability(prev => {
      const daySlots = prev.filter(w => w.day === day);
      const rest     = prev.filter(w => w.day !== day);
      daySlots.splice(slotIdx, 1);
      return [...rest, ...daySlots]
        .sort((a, b) => a.day !== b.day ? a.day - b.day : a.from.localeCompare(b.from));
    });
  }

  function updateSlot(day: number, slotIdx: number, field: "from" | "to", value: string) {
    setAvailability(prev => {
      const daySlots = prev.filter(w => w.day === day).map((s, i) =>
        i === slotIdx ? { ...s, [field]: value } : s
      );
      return [...prev.filter(w => w.day !== day), ...daySlots]
        .sort((a, b) => a.day !== b.day ? a.day - b.day : a.from.localeCompare(b.from));
    });
  }

  function addDuration() {
    const mins = parseInt(newDuration, 10);
    if (!isNaN(mins) && mins > 0 && !durations.includes(mins)) {
      setDurations(prev => [...prev, mins].sort((a,b) => a - b));
    }
    setNewDuration("");
  }

  // ── Save ─────────────────────────────────────────────────

  async function handleSave() {
    if (!slug.trim() || !displayName.trim()) {
      setError("Slug and display name are required.");
      return;
    }
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/calendar/booking-link", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug:           slug.trim().toLowerCase(),
          display_name:   displayName.trim(),
          bio:            bio.trim() || undefined,
          availability,
          buffer_minutes: buffer,
          notice_hours:   notice,
          durations,
          rate_cents:     rateCents,
          currency,
          active,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Save failed."); return; }
      setConfig(json.bookingLink);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  function copyLink() {
    const url = `${appUrl}/book/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-text-muted text-sm">
        <Loader2 size={14} className="animate-spin" />Loading booking settings…
      </div>
    );
  }

  const publicUrl = `${appUrl}/book/${slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Link2 size={16} />
            Booking link
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Share your link so others can book time with you.
          </p>
        </div>
        <button
          onClick={() => setActive(a => !a)}
          className={cn("flex items-center gap-1.5 text-xs font-medium transition-colors",
            active ? "text-emerald-500" : "text-text-muted")}
        >
          {active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          {active ? "Active" : "Inactive"}
        </button>
      </div>

      {/* Slug */}
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Your booking URL</label>
        <div className="flex items-center gap-2">
          <div className="flex items-center flex-1 bg-surface-2 border border-border rounded-xl overflow-hidden">
            <span className="px-3 py-2.5 text-xs text-text-muted border-r border-border whitespace-nowrap">
              {appUrl}/book/
            </span>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="your-name"
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-text-primary focus:outline-none"
            />
          </div>
          {slug && config?.slug === slug && (
            <>
              <button onClick={copyLink} title="Copy link"
                className="p-2.5 rounded-xl bg-surface-2 border border-border text-text-muted hover:text-text-primary transition-all">
                {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
              </button>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-surface-2 border border-border text-text-muted hover:text-text-primary transition-all">
                <ExternalLink size={15} />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Display name + bio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Display name *</label>
          <input
            value={displayName} onChange={e => setDisplayName(e.target.value)}
            placeholder="Thabiso Khati"
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Short bio (optional)</label>
          <input
            value={bio} onChange={e => setBio(e.target.value)}
            placeholder="Founder, JO:LA Labs"
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
          />
        </div>
      </div>

      {/* Availability */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <label className="block text-xs font-medium text-text-muted">Availability</label>
          <span className="text-[11px] text-text-muted/50">Toggle a day off to block it · Add slots for split availability</span>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 7 }, (_, i) => i).map(day => {
            const slots = slotsForDay(day);
            const isOn  = slots.length > 0;
            return (
              <div key={day} className="flex gap-3">
                {/* Day toggle */}
                <button
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "w-14 h-7 flex-shrink-0 text-xs font-semibold rounded-lg transition-all border self-start mt-0.5",
                    isOn
                      ? "bg-brand/10 text-brand border-brand/30"
                      : "bg-surface-2 text-text-muted border-transparent"
                  )}
                >
                  {DAY_SHORT[day]}
                </button>

                {/* Slots */}
                {isOn ? (
                  <div className="flex-1 space-y-1.5">
                    {slots.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="time" value={slot.from}
                          onChange={e => updateSlot(day, idx, "from", e.target.value)}
                          className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand/50"
                        />
                        <span className="text-xs text-text-muted">to</span>
                        <input
                          type="time" value={slot.to}
                          onChange={e => updateSlot(day, idx, "to", e.target.value)}
                          className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand/50"
                        />
                        {slots.length > 1 && (
                          <button
                            onClick={() => removeSlot(day, idx)}
                            className="p-1 rounded text-text-muted/40 hover:text-error transition-colors"
                            title="Remove this slot"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                    {/* Add another slot */}
                    <button
                      onClick={() => addSlot(day)}
                      className="flex items-center gap-1 text-[11px] text-text-muted/50 hover:text-brand transition-colors mt-0.5"
                    >
                      <Plus size={11} />
                      Add time slot
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-text-muted/30 self-center">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Meeting durations */}
      <div>
        <label className="block text-xs font-medium text-text-muted mb-2">Meeting durations (minutes)</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {durations.map(d => (
            <div key={d} className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-2 border border-border text-xs font-medium text-text-primary">
              {d} min
              <button onClick={() => setDurations(prev => prev.filter(x => x !== d))} className="ml-1 text-text-muted hover:text-error transition-colors">
                <Trash2 size={10} />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="number" value={newDuration}
              onChange={e => setNewDuration(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addDuration(); }}
              placeholder="45"
              className="w-14 bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand/50 text-center"
            />
            <button onClick={addDuration} className="p-1 rounded-lg bg-surface-2 border border-border text-text-muted hover:text-text-primary">
              <Plus size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Buffer + notice */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Buffer between meetings</label>
          <select
            value={buffer} onChange={e => setBuffer(parseInt(e.target.value))}
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50"
          >
            {[0,5,10,15,30,60].map(m => <option key={m} value={m}>{m === 0 ? "No buffer" : `${m} min`}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Minimum notice</label>
          <select
            value={notice} onChange={e => setNotice(parseInt(e.target.value))}
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50"
          >
            {[0,1,2,4,8,24,48,72].map(h => <option key={h} value={h}>{h === 0 ? "Instant" : `${h}h notice`}</option>)}
          </select>
        </div>
      </div>

      {/* Rate */}
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Rate (0 = free)</label>
        <div className="flex items-center gap-2">
          <select
            value={currency} onChange={e => setCurrency(e.target.value)}
            className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50"
          >
            {["ZAR","USD","EUR","GBP"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="number" value={rateCents / 100}
            onChange={e => setRateCents(Math.round(parseFloat(e.target.value || "0") * 100))}
            placeholder="0"
            min={0}
            className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50"
          />
        </div>
        <p className="text-[11px] text-text-muted mt-1">
          {rateCents > 0 ? `Guests will pay ${(rateCents / 100).toFixed(2)} ${currency} via Paystack.` : "Free — no payment required."}
        </p>
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-black text-sm font-semibold hover:bg-brand/90 transition-all disabled:opacity-70"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saved ? <><Check size={14} />Saved!</> : "Save booking settings"}
      </button>
    </div>
  );
}
