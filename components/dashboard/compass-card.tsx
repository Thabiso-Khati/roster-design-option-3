"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, TrendingUp, Calendar, Clock, DollarSign, ChevronRight, X, MoreHorizontal, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";
import type { TranslationPath } from "@/lib/i18n";

interface Suggestion {
  id: string;
  artistId: string | null;
  ruleCategory: "anomaly_driven" | "recoupment" | "stalled_workspace_event" | "calendar_driven" | "opportunity";
  ruleId: string;
  priority: "low" | "medium" | "high" | "urgent";
  title: string;
  body: string | null;
  actionLabel: string | null;
  actionHref: string | null;
  expiresAt: string | null;
  createdAt: string;
}

type CatMeta = { icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; color: string; labelKey: TranslationPath };

const CATEGORY_META: Record<Suggestion["ruleCategory"], CatMeta> = {
  anomaly_driven:           { icon: TrendingUp,  color: "#F59E0B", labelKey: "widget.catAnomaly" },
  recoupment:               { icon: DollarSign,  color: "#10B981", labelKey: "widget.catRecoupment" },
  stalled_workspace_event:  { icon: Clock,       color: "#3B82F6", labelKey: "widget.catStalled" },
  calendar_driven:          { icon: Calendar,    color: "#8B5CF6", labelKey: "widget.catCalendar" },
  opportunity:              { icon: Sparkles,    color: "#EC4899", labelKey: "widget.catOpportunity" },
};

const PRIORITY_META: Record<Suggestion["priority"], { ring: string; pulse?: boolean }> = {
  urgent: { ring: "#EF4444", pulse: true },
  high:   { ring: "#F59E0B" },
  medium: { ring: "#3B82F6" },
  low:    { ring: "#94A3B8" },
};

export function CompassCard({ limit = 3 }: { limit?: number }) {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [totalOpen, setTotalOpen] = useState(0);
  const [actingOn, setActingOn] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/suggestions?limit=${limit}`);
      if (!res.ok) { setSuggestions([]); return; }
      const json = await res.json();
      setSuggestions(json.suggestions ?? []);
      setTotalOpen(json.totalOpen ?? 0);
    } catch { setSuggestions([]); }
  }

  useEffect(() => { load(); }, []);

  async function patch(id: string, status: "acted" | "snoozed" | "dismissed", snoozedUntil?: string) {
    setActingOn(id);
    try {
      await fetch("/api/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, snoozedUntil }),
      });
      setSuggestions(prev => (prev ?? []).filter(s => s.id !== id));
      setTotalOpen(n => Math.max(0, n - 1));
    } finally { setActingOn(null); }
  }

  if (suggestions === null) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Compass size={16} className="text-text-muted" />
          <p className="font-bold text-sm text-text-primary">{t("widget.compass")}</p>
        </div>
        <p className="text-xs text-text-muted">{t("widget.compassLoading")}</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Compass size={16} style={{ color: "#C9A84C" }} />
          <p className="font-bold text-sm text-text-primary">{t("widget.compass")}</p>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">{t("widget.compassAllClear")}</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass size={16} style={{ color: "#C9A84C" }} />
          <p className="font-bold text-sm text-text-primary">{t("widget.compass")}</p>
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            {t("widget.compassOpen", { count: totalOpen })}
          </span>
        </div>
        {totalOpen > limit && (
          <Link href="/dashboard/compass" className="text-[11px] text-text-muted hover:text-text-primary inline-flex items-center gap-1">
            {t("widget.viewAll")} <ChevronRight size={11} />
          </Link>
        )}
      </div>

      <div className="space-y-2.5">
        {suggestions.map(s => {
          const cat = CATEGORY_META[s.ruleCategory];
          const Icon = cat.icon;
          const pri = PRIORITY_META[s.priority];
          return (
            <div
              key={s.id}
              className="border border-border rounded-xl p-3.5 transition-colors hover:border-text-muted"
              style={{ borderLeftColor: pri.ring, borderLeftWidth: 3 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${cat.color}15` }}>
                  <Icon size={14} style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-sm text-text-primary leading-snug">{s.title}</p>
                    <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: cat.color, backgroundColor: `${cat.color}15` }}>
                      {t(cat.labelKey)}
                    </span>
                  </div>
                  {s.body && <p className="text-xs text-text-muted leading-relaxed mb-2">{s.body}</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    {s.actionHref && s.actionLabel && (
                      <Link href={s.actionHref} onClick={() => patch(s.id, "acted")}
                        className="text-xs font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-md"
                        style={{ backgroundColor: cat.color, color: "white" }}>
                        {s.actionLabel} <ChevronRight size={11} />
                      </Link>
                    )}
                    <button
                      onClick={() => { const tomorrow = new Date(Date.now() + 86400_000).toISOString(); patch(s.id, "snoozed", tomorrow); }}
                      disabled={actingOn === s.id}
                      className="text-[11px] text-text-muted hover:text-text-primary inline-flex items-center gap-1 px-2 py-1"
                      aria-label={t("widget.snooze")}
                    >
                      <MoreHorizontal size={11} /> {t("widget.snooze")}
                    </button>
                    <button
                      onClick={() => patch(s.id, "dismissed")}
                      disabled={actingOn === s.id}
                      className="text-[11px] text-text-muted hover:text-red-400 inline-flex items-center gap-1 px-2 py-1"
                      aria-label={t("widget.dismiss")}
                    >
                      <X size={11} /> {t("widget.dismiss")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
