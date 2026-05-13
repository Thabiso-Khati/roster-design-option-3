"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X, Loader2,
  Clock, MapPin, AlignLeft, Tag, Palette,
  Bell, Mail, MessageSquare, Users, Pencil, Trash2,
  CalendarDays, LayoutGrid, List, AlignJustify, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarBookingSection } from "@/components/settings/calendar-booking-section";
import { ICalFeedSection } from "@/components/settings/ical-feed-section";

// ── Types ────────────────────────────────────────────────────

type EventType =
  | "expert_booking" | "release_date"     | "tour_date"
  | "studio_session" | "press_interview"  | "radio_appearance"
  | "sync_deadline"  | "royalty_due"      | "contract_deadline"
  | "meeting"        | "focus_time"       | "custom";

interface CalendarEvent {
  id:                 string;
  title:              string;
  description?:       string | null;
  location?:          string | null;
  start_at:           string;
  end_at:             string;
  all_day:            boolean;
  event_type:         EventType;
  source_type:        string;
  artist_id?:         string | null;
  reminder_email:     boolean;
  reminder_whatsapp:  boolean;
  reminder_minutes:   number[];
  privacy:            "private" | "team";
  color?:             string | null;
}

type ViewMode = "month" | "week" | "day" | "agenda";

// ── Event type config ────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bg: string; border: string }> = {
  expert_booking:    { label: "Expert Booking",     color: "#3B82F6", bg: "bg-blue-500/15",   border: "border-blue-500/40" },
  release_date:      { label: "Release Date",       color: "#C9A84C", bg: "bg-yellow-500/15", border: "border-yellow-500/40" },
  tour_date:         { label: "Tour Date",          color: "#10B981", bg: "bg-emerald-500/15",border: "border-emerald-500/40" },
  studio_session:    { label: "Studio Session",     color: "#8B5CF6", bg: "bg-violet-500/15", border: "border-violet-500/40" },
  press_interview:   { label: "Press / Interview",  color: "#F59E0B", bg: "bg-amber-500/15",  border: "border-amber-500/40" },
  radio_appearance:  { label: "Radio Appearance",   color: "#06B6D4", bg: "bg-cyan-500/15",   border: "border-cyan-500/40" },
  sync_deadline:     { label: "Sync Deadline",      color: "#EF4444", bg: "bg-red-500/15",    border: "border-red-500/40" },
  royalty_due:       { label: "Royalty Due",        color: "#14B8A6", bg: "bg-teal-500/15",   border: "border-teal-500/40" },
  contract_deadline: { label: "Contract Deadline",  color: "#EC4899", bg: "bg-pink-500/15",   border: "border-pink-500/40" },
  meeting:           { label: "Meeting",            color: "#6366F1", bg: "bg-indigo-500/15", border: "border-indigo-500/40" },
  focus_time:        { label: "Focus Time",         color: "#64748B", bg: "bg-slate-500/15",  border: "border-slate-500/40" },
  custom:            { label: "Custom",             color: "#94A3B8", bg: "bg-slate-400/15",  border: "border-slate-400/40" },
};

const REMINDER_OPTIONS = [
  { value: 10,   label: "10 minutes before" },
  { value: 30,   label: "30 minutes before" },
  { value: 60,   label: "1 hour before" },
  { value: 180,  label: "3 hours before" },
  { value: 1440, label: "1 day before" },
  { value: 10080,label: "1 week before" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ── Date helpers ─────────────────────────────────────────────

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function startOfWeek(d: Date)  { const r = new Date(d); r.setDate(d.getDate() - d.getDay()); r.setHours(0,0,0,0); return r; }
function endOfWeek(d: Date)    { const r = new Date(d); r.setDate(d.getDate() + (6 - d.getDay())); r.setHours(23,59,59,999); return r; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(d.getDate() + n); return r; }
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function toDateInput(d: Date) {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function toTimeInput(d: Date) {
  return d.toTimeString().slice(0, 5);
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
}
function formatDateHeader(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function buildISO(dateStr: string, timeStr: string) {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

function getEventColor(event: CalendarEvent) {
  return event.color ?? EVENT_TYPE_CONFIG[event.event_type]?.color ?? "#94A3B8";
}

// ── EventPill ────────────────────────────────────────────────

function EventPill({ event, onClick, compact = false }: {
  event: CalendarEvent;
  onClick: (e: CalendarEvent) => void;
  compact?: boolean;
}) {
  const color  = getEventColor(event);
  const isAuto = event.source_type !== "manual";

  return (
    <button
      onClick={(ev) => { ev.stopPropagation(); onClick(event); }}
      className={cn(
        "w-full text-left rounded px-1.5 text-[11px] font-medium truncate transition-opacity hover:opacity-80",
        compact ? "py-0.5 leading-4" : "py-1 leading-[1.3]"
      )}
      style={{ backgroundColor: color + "28", color, borderLeft: `2px solid ${color}` }}
    >
      {compact ? "" : (isAuto ? "● " : "")}
      {event.title}
    </button>
  );
}

// ── EventModal (create / view / edit) ────────────────────────

interface ModalState {
  mode:             "create" | "view" | "edit";
  event?:           CalendarEvent;
  defaultDate?:     string;
  defaultEventType?: EventType;
}

function EventModal({
  state, onClose, onSaved, onDeleted,
}: {
  state:     ModalState;
  onClose:   () => void;
  onSaved:   (e: CalendarEvent) => void;
  onDeleted: (id: string) => void;
}) {
  const isView   = state.mode === "view";
  const isEdit   = state.mode === "edit";
  const isCreate = state.mode === "create";
  const isAuto   = state.event?.source_type && state.event.source_type !== "manual";

  const today      = new Date();
  const defaultDt  = state.defaultDate ?? toDateInput(today);
  const defaultTm  = toTimeInput(today);

  const [title,       setTitle]       = useState(state.event?.title       ?? "");
  const [description, setDescription] = useState(state.event?.description ?? "");
  const [location,    setLocation]    = useState(state.event?.location    ?? "");
  const [startDate,   setStartDate]   = useState(state.event ? toDateInput(new Date(state.event.start_at)) : defaultDt);
  const [startTime,   setStartTime]   = useState(state.event ? toTimeInput(new Date(state.event.start_at)) : defaultTm);
  const [endDate,     setEndDate]     = useState(state.event ? toDateInput(new Date(state.event.end_at))   : defaultDt);
  const [endTime,     setEndTime]     = useState(state.event ? toTimeInput(new Date(state.event.end_at))   : toTimeInput(new Date(today.getTime() + 60 * 60_000)));
  const [allDay,      setAllDay]      = useState(state.event?.all_day     ?? false);
  const [eventType,   setEventType]   = useState<EventType>(state.defaultEventType ?? state.event?.event_type ?? "custom");
  const [remEmail,    setRemEmail]    = useState(state.event?.reminder_email     ?? false);
  const [remWa,       setRemWa]       = useState(state.event?.reminder_whatsapp  ?? false);
  const [remMins,     setRemMins]     = useState<number[]>(state.event?.reminder_minutes ?? []);
  const [privacy,     setPrivacy]     = useState<"private"|"team">(state.event?.privacy ?? "private");
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [error,       setError]       = useState("");

  function toggleReminderMin(val: number) {
    setRemMins(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  async function handleSave() {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        title: title.trim(), description: description || undefined,
        location: location || undefined,
        start_at: buildISO(startDate, allDay ? "00:00" : startTime),
        end_at:   buildISO(endDate,   allDay ? "23:59" : endTime),
        all_day:  allDay, event_type: eventType,
        reminder_email: remEmail, reminder_whatsapp: remWa,
        reminder_minutes: remMins, privacy,
      };

      const isEditing = isEdit && state.event;
      const res = await fetch("/api/calendar/events", {
        method:  isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(isEditing ? { ...payload, id: state.event!.id } : payload),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Something went wrong."); return; }
      onSaved(json.event);
      onClose();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!state.event) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/calendar/events?id=${state.event.id}`, { method: "DELETE" });
      if (!res.ok) { setError("Could not delete event."); return; }
      onDeleted(state.event.id);
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setDeleting(false);
    }
  }

  const cfg = EVENT_TYPE_CONFIG[eventType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
            <h2 className="text-base font-semibold text-text-primary">
              {isCreate ? "New Event" : isEdit ? "Edit Event" : state.event?.title}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {isView && !isAuto && state.event && (
              <>
                <button
                  onClick={() => { /* switch to edit mode handled by parent */ onClose(); }}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all"
                  title="Delete"
                >
                  {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* View mode — summary */}
          {isView && state.event && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Clock size={14} className="flex-shrink-0" />
                <span>
                  {state.event.all_day
                    ? formatFullDate(state.event.start_at)
                    : `${formatFullDate(state.event.start_at)}, ${formatTime(state.event.start_at)} – ${formatTime(state.event.end_at)}`
                  }
                </span>
              </div>
              {state.event.location && (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <MapPin size={14} className="flex-shrink-0" />
                  <span>{state.event.location}</span>
                </div>
              )}
              {state.event.description && (
                <div className="flex items-start gap-2 text-sm text-text-muted">
                  <AlignLeft size={14} className="flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{state.event.description}</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Tag size={14} className="flex-shrink-0" />
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: cfg.color + "28", color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
              {isAuto && (
                <p className="text-xs text-text-muted italic">Auto-populated — edit from the source record.</p>
              )}
              {!isAuto && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { onClose(); }}
                    className="flex-1 py-2 rounded-lg text-sm font-medium border border-border text-text-muted hover:bg-surface-2 transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Create / Edit mode */}
          {(isCreate || isEdit) && (
            <>
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Title *</label>
                <input
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="What's happening?"
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>

              {/* Event type */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  <Tag size={11} className="inline mr-1" />Event type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, typeof EVENT_TYPE_CONFIG[EventType]][]).map(([type, c]) => (
                    <button
                      key={type}
                      onClick={() => setEventType(type)}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[11px] font-medium text-left transition-all border",
                        eventType === type ? `${c.bg} ${c.border}` : "border-transparent bg-surface-2 text-text-muted hover:bg-surface-2/80"
                      )}
                      style={eventType === type ? { color: c.color } : undefined}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* All day toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAllDay(!allDay)}
                  className={cn(
                    "relative w-9 h-5 rounded-full transition-colors",
                    allDay ? "bg-brand" : "bg-surface-2 border border-border"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                    allDay ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
                <span className="text-sm text-text-muted">All day</span>
              </div>

              {/* Date / time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Start date</label>
                  <input
                    type="date" value={startDate} onChange={e => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value); }}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">End date</label>
                  <input
                    type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
                  />
                </div>
                {!allDay && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Start time</label>
                      <input
                        type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">End time</label>
                      <input
                        type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  <MapPin size={11} className="inline mr-1" />Location (optional)
                </label>
                <input
                  value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="Studio, venue, link..."
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  <AlignLeft size={11} className="inline mr-1" />Notes (optional)
                </label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Any details..."
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-brand/50 transition-colors resize-none"
                />
              </div>

              {/* Reminders */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-2">
                  <Bell size={11} className="inline mr-1" />Reminders
                </label>
                <div className="flex gap-3 mb-2">
                  <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                    <input type="checkbox" checked={remEmail} onChange={e => setRemEmail(e.target.checked)} className="accent-brand" />
                    <Mail size={13} />Email
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                    <input type="checkbox" checked={remWa} onChange={e => setRemWa(e.target.checked)} className="accent-brand" />
                    <MessageSquare size={13} />WhatsApp
                  </label>
                </div>
                {remWa && (
                  <p className="text-[11px] text-amber-500/80 mb-2 leading-relaxed">
                    WhatsApp reminders use the phone number saved in{" "}
                    <a href="/dashboard/settings" className="underline hover:text-amber-400">Settings</a>.
                    Make sure it&#39;s set before saving.
                  </p>
                )}
                {(remEmail || remWa) && (
                  <div className="grid grid-cols-2 gap-1">
                    {REMINDER_OPTIONS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 text-[11px] text-text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={remMins.includes(opt.value)}
                          onChange={() => toggleReminderMin(opt.value)}
                          className="accent-brand"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  <Users size={11} className="inline mr-1" />Visibility
                </label>
                <div className="flex gap-2">
                  {(["private", "team"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPrivacy(p)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize",
                        privacy === p
                          ? "bg-brand/10 text-brand border-brand/30"
                          : "bg-surface-2 text-text-muted border-transparent hover:bg-surface-2/80"
                      )}
                    >
                      {p === "private" ? "Only me" : "Team"}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-error">{error}</p>}

              <div className="flex gap-2 pt-1">
                {isEdit && state.event && !isAuto && (
                  <button
                    onClick={handleDelete} disabled={deleting}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-error border border-error/30 hover:bg-error/10 transition-all flex items-center gap-1.5"
                  >
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Delete
                  </button>
                )}
                <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-medium border border-border text-text-muted hover:bg-surface-2 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleSave} disabled={saving}
                  className="flex-1 py-2 rounded-lg text-sm font-medium bg-brand text-black hover:bg-brand/90 transition-all flex items-center justify-center gap-1.5"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {isEdit ? "Save changes" : "Create event"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Month View ───────────────────────────────────────────────

function MonthView({ date, events, onDayClick, onEventClick }: {
  date:         Date;
  events:       CalendarEvent[];
  onDayClick:   (d: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const today     = new Date();
  const monthStart = startOfMonth(date);
  const monthEnd   = endOfMonth(date);
  const gridStart  = startOfWeek(monthStart);

  // Build 6 weeks grid
  const weeks: Date[][] = [];
  let cursor = new Date(gridStart);
  while (cursor <= monthEnd || weeks.length < 4) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
    if (weeks.length >= 6) break;
  }

  function eventsOnDay(day: Date) {
    return events.filter(ev => {
      const s = new Date(ev.start_at);
      const e = new Date(ev.end_at);
      return isSameDay(day, s) || (day >= s && day <= e && ev.all_day);
    });
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      {/* Weeks */}
      <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((day, di) => {
              const isToday    = isSameDay(day, today);
              const isThisMonth = day.getMonth() === date.getMonth();
              const dayEvents  = eventsOnDay(day);
              const visible    = dayEvents.slice(0, 3);
              const overflow   = dayEvents.length - 3;

              return (
                <div
                  key={di}
                  onClick={() => onDayClick(day)}
                  className={cn(
                    "border-r border-border last:border-r-0 p-1 cursor-pointer transition-colors min-h-[90px]",
                    isThisMonth ? "hover:bg-surface-2/50" : "bg-surface/50 hover:bg-surface-2/30",
                  )}
                >
                  <div className="flex items-center justify-center mb-1">
                    <span className={cn(
                      "w-6 h-6 text-xs font-semibold flex items-center justify-center rounded-full",
                      isToday ? "bg-brand text-black" : isThisMonth ? "text-text-primary" : "text-text-muted/40"
                    )}>
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {visible.map(ev => (
                      <EventPill key={ev.id} event={ev} onClick={onEventClick} compact />
                    ))}
                    {overflow > 0 && (
                      <p className="text-[10px] text-text-muted px-1">+{overflow} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Week View ────────────────────────────────────────────────

function WeekView({ date, events, onSlotClick, onEventClick }: {
  date:         Date;
  events:       CalendarEvent[];
  onSlotClick:  (d: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const today    = new Date();
  const weekStart = startOfWeek(date);
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours     = Array.from({ length: 24 }, (_, i) => i);

  function eventsOnDay(day: Date) {
    return events.filter(ev => isSameDay(new Date(ev.start_at), day) && !ev.all_day);
  }
  function allDayOnDay(day: Date) {
    return events.filter(ev => ev.all_day && isSameDay(new Date(ev.start_at), day));
  }

  function eventStyle(ev: CalendarEvent): React.CSSProperties {
    const s = new Date(ev.start_at);
    const e = new Date(ev.end_at);
    const top  = (s.getHours() + s.getMinutes() / 60) * 60; // px
    const height = Math.max(20, ((e.getTime() - s.getTime()) / 3_600_000) * 60);
    return { top: `${top}px`, height: `${height}px`, position: "absolute", left: "2px", right: "2px" };
  }

  const nowH = today.getHours() + today.getMinutes() / 60;
  const nowPx = nowH * 60;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* All-day row */}
      <div className="grid border-b border-border" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div className="p-1 text-[10px] text-text-muted/50 text-right pr-2 pt-2">all day</div>
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className="border-l border-border p-1 min-h-[36px]">
              <div className={cn(
                "text-center text-xs font-semibold mb-0.5 pb-0.5 border-b border-border",
                isToday ? "text-brand" : "text-text-muted"
              )}>
                {DAYS[day.getDay()]} {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {allDayOnDay(day).map(ev => (
                  <EventPill key={ev.id} event={ev} onClick={onEventClick} compact />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", display: "grid" }}>
          {/* Hour labels */}
          <div className="sticky left-0 bg-surface z-10">
            {hours.map(h => (
              <div key={h} className="h-[60px] border-b border-border/50 flex items-start justify-end pr-2 pt-1">
                <span className="text-[10px] text-text-muted/50">
                  {h === 0 ? "" : `${h % 12 || 12}${h < 12 ? "am" : "pm"}`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, di) => {
            const isToday   = isSameDay(day, today);
            const dayEvents = eventsOnDay(day);

            return (
              <div
                key={di}
                className="border-l border-border relative"
                style={{ height: `${24 * 60}px` }}
              >
                {/* Hour grid lines */}
                {hours.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-b border-border/30 cursor-pointer hover:bg-brand/5 transition-colors"
                    style={{ top: `${h * 60}px`, height: "60px" }}
                    onClick={() => {
                      const d = new Date(day);
                      d.setHours(h, 0, 0, 0);
                      onSlotClick(d);
                    }}
                  />
                ))}

                {/* Current time line */}
                {isToday && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${nowPx}px` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                      <div className="flex-1 h-px bg-red-500" />
                    </div>
                  </div>
                )}

                {/* Events */}
                {dayEvents.map(ev => (
                  <button
                    key={ev.id}
                    onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                    className="z-10 rounded text-[11px] font-medium px-1.5 py-0.5 text-left overflow-hidden hover:opacity-80 transition-opacity"
                    style={{
                      ...eventStyle(ev),
                      backgroundColor: getEventColor(ev) + "30",
                      color: getEventColor(ev),
                      borderLeft: `3px solid ${getEventColor(ev)}`,
                    }}
                  >
                    <p className="font-semibold truncate">{ev.title}</p>
                    <p className="opacity-70">{formatTime(ev.start_at)}</p>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Agenda View ──────────────────────────────────────────────

function AgendaView({ events, onEventClick }: {
  events:       CalendarEvent[];
  onEventClick: (e: CalendarEvent) => void;
}) {
  const today = new Date();

  // Group upcoming events by date
  const upcoming = events
    .filter(ev => new Date(ev.end_at) >= today)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const grouped: Record<string, CalendarEvent[]> = {};
  for (const ev of upcoming) {
    const key = toDateInput(new Date(ev.start_at));
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  }

  if (upcoming.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
        No upcoming events. Click the + button to add one.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {Object.entries(grouped).map(([dateKey, dayEvents]) => {
        const d = new Date(dateKey + "T00:00:00");
        const isToday = isSameDay(d, today);
        return (
          <div key={dateKey} className="border-b border-border last:border-b-0">
            <div className={cn(
              "sticky top-0 px-5 py-2 text-xs font-semibold tracking-wider uppercase bg-surface border-b border-border",
              isToday ? "text-brand" : "text-text-muted"
            )}>
              {isToday ? "Today · " : ""}
              {d.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div className="divide-y divide-border">
              {dayEvents.map(ev => {
                const cfg = EVENT_TYPE_CONFIG[ev.event_type];
                return (
                  <button
                    key={ev.id}
                    onClick={() => onEventClick(ev)}
                    className="w-full flex items-start gap-3 px-5 py-3 hover:bg-surface-2/50 transition-colors text-left"
                  >
                    <div className="w-1 self-stretch rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: getEventColor(ev) }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{ev.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {ev.all_day ? "All day" : `${formatTime(ev.start_at)} – ${formatTime(ev.end_at)}`}
                        {ev.location ? ` · ${ev.location}` : ""}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cfg.color + "20", color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── WeeklyCapacity ───────────────────────────────────────────

const CAPACITY_HOURS = 40;
const FOCUS_TYPES    = new Set<EventType>(["focus_time"]);
const BUSY_TYPES     = new Set<EventType>([
  "expert_booking", "meeting", "studio_session",
  "press_interview", "radio_appearance", "tour_date",
]);

function WeeklyCapacity({ events, currentDate }: {
  events:      CalendarEvent[];
  currentDate: Date;
}) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd   = endOfWeek(currentDate);

  let focusMinutes = 0;
  let busyMinutes  = 0;

  for (const ev of events) {
    const s = new Date(ev.start_at);
    const e = new Date(ev.end_at);
    if (s < weekStart || s > weekEnd) continue;
    const mins = Math.max(0, (e.getTime() - s.getTime()) / 60_000);
    if (FOCUS_TYPES.has(ev.event_type)) focusMinutes += mins;
    else if (BUSY_TYPES.has(ev.event_type)) busyMinutes += mins;
  }

  const totalMins    = focusMinutes + busyMinutes;
  const totalHours   = totalMins / 60;
  const capacityPct  = Math.min(100, (totalHours / CAPACITY_HOURS) * 100);
  const focusPct     = Math.min(100, (focusMinutes / (CAPACITY_HOURS * 60)) * 100);

  const barColor =
    capacityPct >= 90 ? "bg-rose-500" :
    capacityPct >= 70 ? "bg-amber-500" :
    "bg-brand";

  return (
    <div className="mx-3 my-2 p-3 rounded-xl bg-surface-2 border border-border">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">This week</p>
        <p className="text-[11px] font-bold text-text-primary">
          {totalHours < 1 ? `${Math.round(totalMins)}m` : `${totalHours.toFixed(1)}h`}
          <span className="text-text-muted font-normal"> / {CAPACITY_HOURS}h</span>
        </p>
      </div>

      {/* Stacked bar: focus (brand) + busy (surface-3) */}
      <div className="h-1.5 rounded-full bg-surface overflow-hidden flex">
        <div
          className={cn("h-full rounded-l-full transition-all duration-500", barColor)}
          style={{ width: `${capacityPct}%` }}
        />
        {focusPct > 0 && (
          <div
            className="h-full bg-slate-500/60 transition-all duration-500"
            style={{ width: `${focusPct}%`, marginLeft: `-${focusPct}%` }}
          />
        )}
      </div>

      <div className="flex items-center gap-3 mt-1.5">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500/70" />
          <span className="text-[10px] text-text-muted">
            {(focusMinutes / 60).toFixed(1)}h focus
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-brand/70" />
          <span className="text-[10px] text-text-muted">
            {(busyMinutes / 60).toFixed(1)}h meetings
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Legend ───────────────────────────────────────────────────

function Legend() {
  return (
    <div className="px-4 py-3 border-t border-border">
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Event types</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, typeof EVENT_TYPE_CONFIG[EventType]][]).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
            <span className="text-[11px] text-text-muted">{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mini Calendar (sidebar) ───────────────────────────────────

function MiniCalendar({ selected, events, onChange }: {
  selected: Date;
  events:   CalendarEvent[];
  onChange: (d: Date) => void;
}) {
  const [mini, setMini] = useState(new Date(selected));
  const today = new Date();
  const monthStart = startOfMonth(mini);
  const gridStart  = startOfWeek(monthStart);

  const weeks: Date[][] = [];
  let cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) { week.push(new Date(cursor)); cursor = addDays(cursor, 1); }
    weeks.push(week);
    if (cursor > endOfMonth(mini) && w >= 3) break;
  }

  function hasEvent(d: Date) {
    return events.some(ev => isSameDay(new Date(ev.start_at), d));
  }

  return (
    <div className="px-3 py-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setMini(m => new Date(m.getFullYear(), m.getMonth() - 1))} className="p-0.5 rounded text-text-muted hover:text-text-primary">
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-semibold text-text-primary">{MONTHS[mini.getMonth()].slice(0, 3)} {mini.getFullYear()}</span>
        <button onClick={() => setMini(m => new Date(m.getFullYear(), m.getMonth() + 1))} className="p-0.5 rounded text-text-muted hover:text-text-primary">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["S","M","T","W","T","F","S"].map((d,i) => (
          <div key={i} className="text-[10px] text-center text-text-muted/50 font-semibold">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((day, di) => {
            const isToday = isSameDay(day, today);
            const isSel   = isSameDay(day, selected);
            const inMonth = day.getMonth() === mini.getMonth();
            const hasEv   = hasEvent(day);
            return (
              <button
                key={di}
                onClick={() => { onChange(day); }}
                className={cn(
                  "w-7 h-7 text-[11px] font-medium rounded-full flex items-center justify-center relative transition-all mx-auto",
                  isSel   ? "bg-brand text-black" :
                  isToday ? "bg-brand/20 text-brand" :
                  inMonth ? "text-text-primary hover:bg-surface-2" :
                            "text-text-muted/30 hover:bg-surface-2/50"
                )}
              >
                {day.getDate()}
                {hasEv && !isSel && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand/60" />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function CalendarPage() {
  const [view,        setView]        = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events,      setEvents]      = useState<CalendarEvent[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState<ModalState | null>(null);
  const hasSynced = useRef(false);

  // ── One-time backfill: pull existing bookings + tasks into calendar ─

  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;
    // Fire-and-forget — non-fatal, result refreshes via fetchEvents
    void fetch("/api/calendar/sync", { method: "POST" });
  }, []);

  // ── Fetch events for current visible range ────────────────

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let from: Date, to: Date;
      if (view === "month") {
        from = startOfWeek(startOfMonth(currentDate));
        to   = addDays(endOfMonth(currentDate), 7);
      } else if (view === "week") {
        from = startOfWeek(currentDate);
        to   = endOfWeek(currentDate);
      } else if (view === "day") {
        from = new Date(currentDate); from.setHours(0,0,0,0);
        to   = new Date(currentDate); to.setHours(23,59,59,999);
      } else {
        // agenda — next 90 days
        from = new Date();
        to   = addDays(from, 90);
      }

      const params = new URLSearchParams({
        from: from.toISOString(),
        to:   to.toISOString(),
      });

      const res  = await fetch(`/api/calendar/events?${params}`);
      const json = await res.json();
      if (res.ok) setEvents(json.events ?? []);
    } catch {
      // silently fail on network error
    } finally {
      setLoading(false);
    }
  }, [view, currentDate]);

  useEffect(() => { void fetchEvents(); }, [fetchEvents]);

  // ── Navigation ────────────────────────────────────────────

  function navigate(dir: -1 | 1) {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === "month") return new Date(d.getFullYear(), d.getMonth() + dir, 1);
      if (view === "week")  return addDays(d, dir * 7);
      if (view === "day")   return addDays(d, dir);
      return addDays(d, dir * 30);
    });
  }

  function goToday() { setCurrentDate(new Date()); }

  // ── Modal helpers ─────────────────────────────────────────

  function openCreate(defaultDate?: Date, defaultEventType?: EventType) {
    setModal({
      mode:             "create",
      defaultDate:      defaultDate ? toDateInput(defaultDate) : undefined,
      defaultEventType,
    });
  }

  function openView(event: CalendarEvent) {
    setModal({ mode: "view", event });
  }

  function onSaved(event: CalendarEvent) {
    setEvents(prev => {
      const idx = prev.findIndex(e => e.id === event.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = event; return next; }
      return [...prev, event];
    });
  }

  function onDeleted(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  // ── Header title ──────────────────────────────────────────

  function headerTitle() {
    if (view === "month") return formatDateHeader(currentDate);
    if (view === "week") {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      if (ws.getMonth() === we.getMonth()) return `${MONTHS[ws.getMonth()]} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`;
      return `${MONTHS[ws.getMonth()]} ${ws.getDate()} – ${MONTHS[we.getMonth()]} ${we.getDate()}, ${ws.getFullYear()}`;
    }
    if (view === "day") return currentDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    return "Upcoming";
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Left sidebar ─────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 border-r border-border flex flex-col bg-surface hidden lg:flex">
        {/* New event */}
        <div className="px-3 pt-4 pb-1 space-y-2">
          <button
            onClick={() => openCreate()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand text-black text-sm font-semibold hover:bg-brand/90 transition-all"
          >
            <Plus size={16} />
            New event
          </button>
          <button
            onClick={() => openCreate(undefined, "focus_time")}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-surface-2 border border-border text-text-muted text-xs font-medium hover:text-text-primary hover:border-brand/40 transition-all"
          >
            <Zap size={13} />
            Block focus time
          </button>
        </div>

        {/* Mini calendar */}
        <MiniCalendar
          selected={currentDate}
          events={events}
          onChange={d => setCurrentDate(d)}
        />

        {/* Weekly capacity */}
        <WeeklyCapacity events={events} currentDate={currentDate} />

        {/* Legend */}
        <div className="flex-1" />
        <Legend />
      </aside>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Calendar viewport — full screen height, shrinks no further */}
        <div className="h-screen flex-shrink-0 flex flex-col">
        {/* Toolbar */}
        <header className="flex items-center gap-3 px-5 py-3 border-b border-border flex-shrink-0 bg-surface">
          {/* Mobile new event */}
          <button
            onClick={() => openCreate()}
            className="lg:hidden p-2 rounded-lg bg-brand text-black hover:bg-brand/90 transition-all flex-shrink-0"
          >
            <Plus size={16} />
          </button>

          {/* Nav */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all">
              <ChevronLeft size={18} />
            </button>
            <button onClick={goToday} className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all">
              Today
            </button>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Title */}
          <h1 className="flex-1 text-lg font-bold text-text-primary truncate">
            {headerTitle()}
          </h1>

          {loading && <Loader2 size={16} className="animate-spin text-text-muted flex-shrink-0" />}

          {/* View switcher */}
          <div className="flex items-center gap-0.5 bg-surface-2 rounded-lg p-1">
            {([
              { v: "month",  Icon: LayoutGrid,    label: "Month"  },
              { v: "week",   Icon: CalendarDays,  label: "Week"   },
              { v: "day",    Icon: AlignJustify,  label: "Day"    },
              { v: "agenda", Icon: List,          label: "Agenda" },
            ] as { v: ViewMode; Icon: typeof LayoutGrid; label: string }[]).map(({ v, Icon, label }) => (
              <button
                key={v}
                onClick={() => setView(v)}
                title={label}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  view === v
                    ? "bg-surface text-brand shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </header>

        {/* Calendar body */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {view === "month" && (
            <MonthView
              date={currentDate}
              events={events}
              onDayClick={d => openCreate(d)}
              onEventClick={openView}
            />
          )}
          {view === "week" && (
            <WeekView
              date={currentDate}
              events={events}
              onSlotClick={d => openCreate(d)}
              onEventClick={openView}
            />
          )}
          {view === "agenda" && (
            <AgendaView
              events={events}
              onEventClick={openView}
            />
          )}
          {view === "day" && (
            <WeekView
              date={currentDate}
              events={events.filter(ev => isSameDay(new Date(ev.start_at), currentDate))}
              onSlotClick={d => openCreate(d)}
              onEventClick={openView}
            />
          )}
        </div>
        </div>{/* end calendar viewport */}

        {/* ── Below-calendar sections ────────────────────────── */}
        <div className="border-t border-border px-6 py-8 space-y-6 bg-background">
          {/* Booking link */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <CalendarBookingSection />
          </div>

          {/* iCal feed */}
          <ICalFeedSection />
        </div>
      </div>

      {/* ── Event modal ───────────────────────────────────────── */}
      {modal && (
        <EventModal
          state={modal}
          onClose={() => setModal(null)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
}
