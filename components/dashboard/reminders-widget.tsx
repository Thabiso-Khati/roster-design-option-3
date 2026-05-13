"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ListChecks, Plus, X, Clock, ArrowUpRight } from "lucide-react";
import {
  type Reminder,
  type ReminderCategory,
  type ReminderPriority,
} from "@/lib/data/reminders";
import { createClient } from "@/lib/supabase/client";
import { useMounted } from "@/lib/hooks/use-mounted";
import { useWorkspace } from "@/context/workspace-context";
import type { WorkspaceEvent } from "@/lib/workspace/types";
import { useTranslation } from "@/lib/i18n/hooks";
import type { TranslationPath } from "@/lib/i18n";

const CATEGORY_COLORS: Record<ReminderCategory, string> = {
  legal: "#C9A84C",
  royalty: "#10B981",
  release: "#8B5CF6",
  finance: "#F59E0B",
  admin: "#64748B",
  marketing: "#EC4899",
  tour: "#3B82F6",
};

const CATEGORY_KEYS: Record<ReminderCategory, TranslationPath> = {
  legal:     "widget.catLegal",
  royalty:   "widget.catRoyalty",
  release:   "widget.catRelease",
  finance:   "widget.catFinance",
  admin:     "widget.catAdmin",
  marketing: "widget.catMarketing",
  tour:      "widget.catTour",
};

interface RemindersWidgetProps {
  initialReminders: Reminder[];
}

const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;
const IN_PROGRESS_AFTER_MS = 24 * 60 * 60 * 1000;

interface AutoItem {
  key: string;
  label: string;
  href: string;
  state: "stale" | "in-progress";
  completionPct: number | null;
  occurredAt: string;
}

function resumeHrefFor(e: WorkspaceEvent): string | null {
  if (e.artifactType === "tool" && e.artifactId === "tool:plan-a-release") return "/dashboard/releases/new";
  if (e.artifactType === "release") return "/dashboard";
  return null;
}

function deriveAutoItems(events: WorkspaceEvent[]): AutoItem[] {
  const now = Date.now();
  const items: AutoItem[] = [];
  for (const e of events) {
    if (e.eventType === "completed" || e.eventType === "dismissed") continue;
    const age = now - new Date(e.occurredAt).getTime();
    if (age < IN_PROGRESS_AFTER_MS) continue;
    const href = resumeHrefFor(e);
    if (!href) continue;
    items.push({
      key: `${e.artifactType}:${e.artifactId}`,
      label: e.artifactLabel ?? e.artifactId,
      href,
      state: age >= STALE_AFTER_MS ? "stale" : "in-progress",
      completionPct: e.completionPct,
      occurredAt: e.occurredAt,
    });
  }
  return items.sort((a, b) => {
    if (a.state !== b.state) return a.state === "stale" ? -1 : 1;
    return a.occurredAt.localeCompare(b.occurredAt);
  });
}

export function RemindersWidget({ initialReminders }: RemindersWidgetProps) {
  const { t } = useTranslation();
  const { ownerId, can } = useWorkspace();
  const canAddReminders = can("reminders", "edit");
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [autoItems, setAutoItems] = useState<AutoItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/workspace/events", { credentials: "include" });
        if (!res.ok) return;
        const json = (await res.json()) as { events?: WorkspaceEvent[] };
        if (cancelled) return;
        setAutoItems(deriveAutoItems(json.events ?? []));
      } catch { /* soft fail */ }
    }
    void load();
    const onVis = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const active = reminders.filter(r => !r.done);
  const sorted = [...active].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  function toggle(id: string) {
    const previous = reminders;
    setReminders(prev => prev.map(r => (r.id === id ? { ...r, done: !r.done } : r)));
    startTransition(async () => {
      try {
        const supabase = createClient();
        const target = previous.find(r => r.id === id);
        if (!target) return;
        const { error } = await supabase.from("reminders").update({ done: !target.done }).eq("id", id);
        if (error) setReminders(previous);
      } catch { setReminders(previous); }
    });
  }

  async function add(input: { title: string; due_date: string; category: ReminderCategory; priority: ReminderPriority }) {
    const previous = reminders;
    const tempId = `temp-${Date.now()}`;
    const optimistic: Reminder = {
      id: tempId, user_id: "", artist_id: null, artist_name: null,
      title: input.title, notes: null, due_date: input.due_date,
      category: input.category, priority: input.priority,
      done: false, completed_at: null, href: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setReminders(prev => [...prev, optimistic]);
    setShowAdd(false);
    try {
      const supabase = createClient();
      // Use ownerId so reminders are always written into the workspace
      // owner's dataset regardless of who the logged-in user is.
      const targetUserId = ownerId ?? (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) return;
      const { data, error } = await supabase.from("reminders")
        .insert({ user_id: targetUserId, title: input.title, due_date: input.due_date, category: input.category, priority: input.priority })
        .select().single();
      if (error || !data) { setReminders(previous); return; }
      setReminders(prev => prev.map(r => (r.id === tempId ? (data as Reminder) : r)));
    } catch { setReminders(previous); }
  }

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
      <header className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-text-muted font-medium mb-1">
            <ListChecks size={12} />
            {t("widget.reminders")}
          </div>
          <h2 className="text-lg font-semibold text-text-primary">{t("widget.whatNeedsYou")}</h2>
        </div>
        {canAddReminders && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-light transition-colors px-3 py-1.5 rounded-lg border border-brand/20 hover:border-brand/40 hover:bg-brand/5"
          >
            <Plus size={14} />
            {t("action.add")}
          </button>
        )}
      </header>

      <div className="flex-1 space-y-1">
        {sorted.slice(0, 4).map(r => (
          <ReminderRow key={r.id} reminder={r} onToggle={toggle} />
        ))}
        {sorted.length === 0 && autoItems.length === 0 && (
          <div className="text-center py-10 text-text-muted text-sm">
            {t("widget.nothingOnPlate")}
          </div>
        )}

        {autoItems.length > 0 && (
          <>
            {sorted.length > 0 && <div className="pt-3 mt-2 border-t border-white/5" />}
            <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted/70 font-medium px-2.5 mb-1 mt-1">
              {t("widget.fromYourWork")}
            </p>
            {autoItems.slice(0, 3).map(item => (
              <AutoItemRow key={item.key} item={item} />
            ))}
          </>
        )}
      </div>

      <footer className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {t("widget.openDone", { open: active.length, done: reminders.length - active.length })}
        </span>
        <a href="/dashboard" className="text-xs text-text-muted hover:text-brand transition-colors">
          {t("widget.viewAll")} →
        </a>
      </footer>

      {showAdd && canAddReminders && <AddReminderModal onAdd={add} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function ReminderRow({ reminder, onToggle }: { reminder: Reminder; onToggle: (id: string) => void }) {
  const { t } = useTranslation();
  const mounted = useMounted();
  const isOverdue = mounted && new Date(reminder.due_date).getTime() < Date.now();
  const color = CATEGORY_COLORS[reminder.category] ?? "#64748B";
  const priorityIndicator =
    reminder.priority === "high" ? "bg-rose-400"
    : reminder.priority === "medium" ? "bg-amber-400"
    : "bg-text-muted";

  return (
    <button
      onClick={() => onToggle(reminder.id)}
      className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors text-left group"
    >
      <div
        className="w-4 h-4 rounded border border-white/20 hover:border-brand flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
        aria-label={t("action.markDone")}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${priorityIndicator} flex-shrink-0`} />
          <p className="text-sm text-text-primary truncate">{reminder.title}</p>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs">
          <span className="uppercase tracking-wider font-semibold text-[10px]" style={{ color }}>
            {t(CATEGORY_KEYS[reminder.category] ?? "widget.catAdmin")}
          </span>
          <span className="opacity-40 text-text-muted">·</span>
          <span className={isOverdue ? "text-rose-400" : "text-text-muted"}>
            {mounted ? formatDaysUntil(reminder.due_date, t) : "—"}
          </span>
          {reminder.artist_name && (
            <>
              <span className="opacity-40 text-text-muted">·</span>
              <span className="text-text-muted truncate">{reminder.artist_name}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

function AutoItemRow({ item }: { item: AutoItem }) {
  const { t } = useTranslation();
  const mounted = useMounted();
  const ageLabel = mounted ? formatAge(item.occurredAt) : "";
  const stale = item.state === "stale";
  return (
    <Link
      href={item.href}
      className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors text-left group"
    >
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${stale ? "bg-amber-500/15" : "bg-text-muted/10"}`} aria-hidden>
        <Clock size={10} className={stale ? "text-amber-400" : "text-text-muted"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-text-primary truncate">
            {stale ? t("widget.stalledLabel") : t("widget.inProgressLabel")}
            <span className="text-text-muted">{item.label}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
          {item.completionPct !== null && (
            <span className="tabular-nums">{Math.round(item.completionPct * 100)}%</span>
          )}
          {item.completionPct !== null && ageLabel && <span className="text-text-muted/40">·</span>}
          {ageLabel && <span>{ageLabel}</span>}
        </div>
      </div>
      <ArrowUpRight size={13} className="flex-shrink-0 text-text-muted group-hover:text-brand transition-colors mt-0.5" />
    </Link>
  );
}

function AddReminderModal({
  onAdd, onClose,
}: {
  onAdd: (r: { title: string; due_date: string; category: ReminderCategory; priority: ReminderPriority }) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [category, setCategory] = useState<ReminderCategory>("admin");
  const [priority, setPriority] = useState<ReminderPriority>("medium");

  const categories: { value: ReminderCategory; key: TranslationPath }[] = [
    { value: "legal",     key: "widget.catLegal" },
    { value: "royalty",   key: "widget.catRoyalty" },
    { value: "release",   key: "widget.catRelease" },
    { value: "finance",   key: "widget.catFinance" },
    { value: "admin",     key: "widget.catAdmin" },
    { value: "marketing", key: "widget.catMarketing" },
    { value: "tour",      key: "widget.catTour" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">{t("widget.addReminderTitle")}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </header>
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-medium block mb-1.5">
              {t("widget.whatNeedsDoing")}
            </label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Send split sheet for approval"
              className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-text-muted font-medium block mb-1.5">
                {t("widget.due")}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-text-muted font-medium block mb-1.5">
                {t("widget.category")}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ReminderCategory)}
                className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary"
              >
                {categories.map(({ value, key }) => (
                  <option key={value} value={value}>{t(key)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-medium block mb-1.5">
              {t("widget.priority")}
            </label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 px-3 py-2 text-xs uppercase tracking-wider font-semibold rounded-lg border transition-colors ${
                    priority === p ? "border-brand bg-brand/10 text-brand" : "border-white/10 text-text-muted hover:text-text-primary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <footer className="flex items-center justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">
            {t("action.cancel")}
          </button>
          <button
            onClick={() => title.trim() && onAdd({ title, due_date: dueDate, category, priority })}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm font-medium text-background bg-brand hover:bg-brand-light transition-colors rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("widget.addReminderBtn")}
          </button>
        </footer>
      </div>
    </div>
  );
}

function formatAge(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const hours = Math.round(ms / 3_600_000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}

type TFn = (path: TranslationPath, vars?: Record<string, string | number>) => string;

function formatDaysUntil(isoDate: string, t: TFn): string {
  const days = Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0)   return t("widget.daysAgo",  { count: Math.abs(days) });
  if (days === 0)  return t("widget.today");
  if (days === 1)  return t("widget.tomorrow");
  if (days < 14)   return t("widget.inDays",  { count: days });
  if (days < 60)   return t("widget.inWeeks", { count: Math.round(days / 7) });
  return               t("widget.inMonths",   { count: Math.round(days / 30) });
}
