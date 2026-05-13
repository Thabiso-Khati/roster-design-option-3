"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Sparkles, Newspaper, Zap, X, Radio } from "lucide-react";
import { MOCK_TICKER, formatDaysUntil, type TickerEvent } from "@/lib/mock/dashboard-data";
import { useMounted } from "@/lib/hooks/use-mounted";
import { useTranslation } from "@/lib/i18n/hooks";
import type { TranslationPath } from "@/lib/i18n";

type TypeMeta = { icon: typeof AlertCircle; labelKey: TranslationPath; color: string };

const TYPE_META: Record<TickerEvent["type"], TypeMeta> = {
  deadline:       { icon: AlertCircle, labelKey: "widget.tickerDeadline",     color: "#F59E0B" },
  opportunity:    { icon: Sparkles,    labelKey: "widget.tickerOpportunity",  color: "#10B981" },
  news:           { icon: Newspaper,   labelKey: "widget.tickerNews",         color: "#64748B" },
  "new-on-roster":{ icon: Zap,         labelKey: "widget.tickerNewOnRoster",  color: "#C9A84C" },
};

export function IndustryTicker() {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<TickerEvent | null>(null);
  const [liveEvents, setLiveEvents] = useState<TickerEvent[]>(MOCK_TICKER);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const items = [...liveEvents, ...liveEvents];

  // Fetch live data on mount; fall back to mock if unavailable
  useEffect(() => {
    fetch("/api/ticker")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.events?.length) setLiveEvents(json.events);
      })
      .catch(() => {/* keep mock data */});
  }, []);

  useEffect(() => {
    if (paused) return;
    const el = scrollerRef.current;
    if (!el) return;
    let rafId: number;
    let pos = el.scrollLeft;
    const step = () => {
      pos += 0.5;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [paused]);

  return (
    <section className="mb-6">
      <header className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-text-muted font-medium">
            <Radio size={12} className="text-brand animate-pulse" />
            {t("widget.industryPulse")}
          </div>
          <span className="text-[10px] text-text-muted/60">·</span>
          <span className="text-[10px] text-text-muted/60">{t("widget.filteredByRoster")}</span>
        </div>
        <button
          onClick={() => setPaused(!paused)}
          className="text-[10px] uppercase tracking-wider text-text-muted hover:text-brand transition-colors"
        >
          {paused ? t("widget.resumeTicker") : t("widget.pauseTicker")}
        </button>
      </header>

      <div
        ref={scrollerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative overflow-x-hidden rounded-xl border border-white/5 bg-surface/30 backdrop-blur-md"
        style={{
          scrollBehavior: "auto",
          maskImage: "linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%)",
        }}
      >
        <div className="flex gap-2 py-3 px-2" style={{ width: "max-content" }}>
          {items.map((event, i) => (
            <TickerItem key={`${event.id}-${i}`} event={event} onClick={() => setSelected(event)} />
          ))}
        </div>
      </div>

      {selected && <EventDrawer event={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function TickerItem({ event, onClick }: { event: TickerEvent; onClick: () => void }) {
  const { t } = useTranslation();
  const mounted = useMounted();
  const meta = TYPE_META[event.type];
  const Icon = meta.icon;
  const isCritical = event.priority === "critical";

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all group"
    >
      <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${meta.color}15` }}>
        <Icon size={12} style={{ color: meta.color }} />
      </span>
      <div className="text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: meta.color }}>
            {t(meta.labelKey)}
          </span>
          {isCritical && <span className="w-1 h-1 rounded-full bg-rose-400 animate-pulse" />}
          {event.country && (
            <span className="text-[10px] text-text-muted/60 uppercase tracking-wider">· {event.country}</span>
          )}
        </div>
        <p className="text-xs text-text-primary font-medium whitespace-nowrap group-hover:text-brand transition-colors">
          {event.headline}
        </p>
      </div>
      {event.endsAt && (
        <span className="text-[10px] text-text-muted tabular-nums pl-2 border-l border-white/5">
          {mounted ? formatDaysUntil(event.endsAt) : "—"}
        </span>
      )}
    </button>
  );
}

function EventDrawer({ event, onClose }: { event: TickerEvent; onClose: () => void }) {
  const { t } = useTranslation();
  const mounted = useMounted();
  const meta = TYPE_META[event.type];
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 md:p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <header className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${meta.color}15` }}>
              <Icon size={18} style={{ color: meta.color }} />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: meta.color }}>
                {t(meta.labelKey)}{event.country && ` · ${event.country}`}
              </p>
              <h3 className="text-lg font-semibold text-text-primary tracking-tight">{event.headline}</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </header>

        <p className="text-sm text-text-muted leading-relaxed mb-5">{event.detail}</p>

        {event.endsAt && (
          <div className="rounded-lg bg-surface/40 border border-white/5 p-3 mb-5 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-text-muted">{t("widget.closes")}</span>
            <div className="text-right">
              <p className="text-sm font-semibold text-text-primary">{mounted ? formatDaysUntil(event.endsAt) : "—"}</p>
              <p className="text-[10px] text-text-muted">
                {mounted ? new Date(event.endsAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : ""}
              </p>
            </div>
          </div>
        )}

        <footer className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">
            {t("widget.dismiss")}
          </button>
          {event.href && (
            <a href={event.href} className="px-4 py-2 text-sm font-medium text-background bg-brand hover:bg-brand-light transition-colors rounded-lg">
              {t("widget.open")}
            </a>
          )}
        </footer>
      </div>
    </div>
  );
}
