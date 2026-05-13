"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays, ArrowUpRight, Mic2, Briefcase, Radio, Megaphone,
  Music2, FileWarning, DollarSign, FileText, Users, Clock, Zap, Star,
} from "lucide-react";
import type { DashboardCalendarEvent, DashboardEventType } from "@/lib/data/calendar";

// ── Type config ───────────────────────────────────────────────

interface TypeConfig {
  label: string;
  icon:  React.ElementType;
  color: string;
}

const TYPE_CONFIG: Record<DashboardEventType, TypeConfig> = {
  expert_booking:   { label: "Session",   icon: Mic2,        color: "#C9FF4E" },
  release_date:     { label: "Release",   icon: Music2,      color: "#8B5CF6" },
  tour_date:        { label: "Tour",      icon: Star,        color: "#3B82F6" },
  studio_session:   { label: "Studio",    icon: Mic2,        color: "#10B981" },
  press_interview:  { label: "Press",     icon: Megaphone,   color: "#F59E0B" },
  radio_appearance: { label: "Radio",     icon: Radio,       color: "#EC4899" },
  sync_deadline:    { label: "Sync",      icon: FileWarning, color: "#EF4444" },
  royalty_due:      { label: "Royalty",   icon: DollarSign,  color: "#10B981" },
  contract_deadline:{ label: "Contract",  icon: FileText,    color: "#C9A84C" },
  meeting:          { label: "Meeting",   icon: Briefcase,   color: "#64748B" },
  focus_time:       { label: "Focus",     icon: Zap,         color: "#6366F1" },
  custom:           { label: "Event",     icon: Clock,       color: "#64748B" },
};

// ── Helpers ────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowStr(): string {
  return new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
}

function groupByDay(events: DashboardCalendarEvent[]): Map<string, DashboardCalendarEvent[]> {
  const map = new Map<string, DashboardCalendarEvent[]>();
  for (const ev of events) {
    const day = ev.start_at.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(ev);
  }
  return map;
}

function dayLabel(dateStr: string): string {
  const today    = todayStr();
  const tomorrow = tomorrowStr();
  if (dateStr === today)    return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-ZA", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function timeLabel(ev: DashboardCalendarEvent): string {
  if (ev.all_day) return "All day";
  const d = new Date(ev.start_at);
  return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

// ── Component ─────────────────────────────────────────────────

interface CalendarWidgetProps {
  initialEvents: DashboardCalendarEvent[];
}

export function CalendarWidget({ initialEvents }: CalendarWidgetProps) {
  const [events, setEvents] = useState<DashboardCalendarEvent[]>(initialEvents);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Refresh on tab focus
  useEffect(() => {
    async function load() {
      try {
        const now   = new Date();
        const from  = now.toISOString();
        const to    = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
        const res   = await fetch(
          `/api/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const json = await res.json() as { events?: DashboardCalendarEvent[] };
        setEvents(json.events ?? []);
      } catch { /* soft fail */ }
    }

    const onVis = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Filter to today + next 7 days, exclude past-today events
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  const upcoming = events.filter(ev => new Date(ev.start_at) >= cutoff);
  const grouped  = groupByDay(upcoming);

  // Take first 4 days that have events
  const days = Array.from(grouped.keys()).slice(0, 4);

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
      <header className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-text-muted font-medium mb-1">
            <CalendarDays size={12} />
            Calendar
          </div>
          <h2 className="text-lg font-semibold text-text-primary">What&apos;s coming up</h2>
        </div>
        <Link
          href="/dashboard/calendar"
          className="flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-light transition-colors"
        >
          Open <ArrowUpRight size={13} />
        </Link>
      </header>

      <div className="flex-1 space-y-4 min-h-0">
        {days.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-text-muted mb-3">Nothing on the calendar for the next week.</p>
            <Link
              href="/dashboard/calendar"
              className="text-xs text-brand hover:text-brand-light transition-colors font-medium"
            >
              Add an event →
            </Link>
          </div>
        ) : (
          days.map(day => {
            const dayEvents = grouped.get(day)!;
            return (
              <div key={day}>
                <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted/70 font-semibold mb-1.5">
                  {mounted ? dayLabel(day) : day}
                </p>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(ev => {
                    const cfg = TYPE_CONFIG[ev.event_type] ?? TYPE_CONFIG.custom;
                    const Icon = cfg.icon;
                    return (
                      <Link
                        key={ev.id}
                        href="/dashboard/calendar"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors group"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}
                        >
                          <Icon size={12} style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary truncate leading-tight">{ev.title}</p>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            {mounted ? timeLabel(ev) : ""}
                            {ev.location && (
                              <span className="text-text-muted/50"> · {ev.location}</span>
                            )}
                          </p>
                        </div>
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ color: cfg.color, background: `${cfg.color}15` }}
                        >
                          {cfg.label}
                        </span>
                      </Link>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <p className="text-[11px] text-text-muted pl-10">
                      +{dayEvents.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <footer className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {upcoming.length} event{upcoming.length !== 1 ? "s" : ""} in the next 2 weeks
        </span>
        <Link href="/dashboard/calendar" className="text-xs text-text-muted hover:text-brand transition-colors">
          Full calendar →
        </Link>
      </footer>
    </div>
  );
}
