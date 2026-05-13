"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft, History, Sparkles, PenLine, Lock, Filter,
  RefreshCw, Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";

const COLOR = "#C9A84C";

interface UnifiedEvent {
  id: string;
  source: "workspace" | "signing" | "vault";
  action: string;
  artifactType: string;
  artifactLabel: string | null;
  artifactId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export default function AuditTrailPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<UnifiedEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<UnifiedEvent["source"] | "all">("all");

  type SourceMeta = Record<UnifiedEvent["source"], { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }> }>;
  const SOURCE_META: SourceMeta = {
    workspace: { label: t("dashboard.workspace"), color: "#3B82F6", icon: Sparkles },
    signing:   { label: t("nav.signingInbox"),    color: "#10B981", icon: PenLine },
    vault:     { label: t("nav.vault"),            color: "#475569", icon: Lock },
  };

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-trail?limit=50");
      const data = await res.json();
      if (res.ok) setEvents(data.events ?? []);
      else setEvents([]);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!events) return [];
    if (filter === "all") return events;
    return events.filter((e) => e.source === filter);
  }, [events, filter]);

  const counts = useMemo(() => {
    if (!events) return { all: 0, workspace: 0, signing: 0, vault: 0 };
    return {
      all:       events.length,
      workspace: events.filter((e) => e.source === "workspace").length,
      signing:   events.filter((e) => e.source === "signing").length,
      vault:     events.filter((e) => e.source === "vault").length,
    };
  }, [events]);

  // Group by day for visual timeline
  const grouped = useMemo(() => {
    const map = new Map<string, UnifiedEvent[]>();
    for (const e of filtered) {
      const day = new Date(e.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15} /> {t("compassPage.backToDash")}
      </Link>

      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${COLOR}15` }}>
            <History size={26} style={{ color: COLOR }} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: COLOR }}>{t("auditTrail.tagline")}</p>
            <h1 className="text-2xl font-black text-text-primary">{t("nav.auditTrail")}</h1>
            <p className="text-sm text-text-muted mt-0.5">{t("auditTrail.subtitle")}</p>
          </div>
          <button onClick={load} disabled={loading} className="flex-shrink-0 text-xs font-semibold inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-text-muted hover:text-text-primary disabled:opacity-50">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {t("action.refresh")}
          </button>
        </div>
      </div>

      {/* Source filter */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Pill label={t("auditTrail.allSources")}        count={counts.all}       active={filter === "all"}       onClick={() => setFilter("all")}       color={COLOR} />
        <Pill label={SOURCE_META.workspace.label}       count={counts.workspace} active={filter === "workspace"} onClick={() => setFilter("workspace")} color={SOURCE_META.workspace.color} />
        <Pill label={SOURCE_META.signing.label}         count={counts.signing}   active={filter === "signing"}   onClick={() => setFilter("signing")}   color={SOURCE_META.signing.color} />
        <Pill label={SOURCE_META.vault.label}           count={counts.vault}     active={filter === "vault"}     onClick={() => setFilter("vault")}     color={SOURCE_META.vault.color} />
      </div>

      {events === null ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Loader2 size={28} className="mx-auto mb-3 animate-spin text-text-muted" />
          <p className="text-sm text-text-muted">{t("signing.loading")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <History size={28} className="mx-auto mb-3 opacity-40" style={{ color: COLOR }} />
          <p className="font-bold text-text-primary mb-1">
            {filter !== "all"
              ? t("auditTrail.noEventsFilter").replace("{source}", filter)
              : t("auditTrail.noEvents")}
          </p>
          <p className="text-sm text-text-muted">{t("auditTrail.noEventsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, dayEvents]) => (
            <div key={day}>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-1.5 z-10">
                {day} <span className="text-text-muted/60">· {dayEvents.length}</span>
              </p>
              <div className="space-y-2">
                {dayEvents.map((e) => {
                  const meta = SOURCE_META[e.source];
                  const Icon = meta.icon;
                  return (
                    <div key={e.id} className="glass-card rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${meta.color}15` }}>
                          <Icon size={14} style={{ color: meta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-3 flex-wrap">
                            <p className="text-sm text-text-primary">
                              <span className="font-semibold">{e.action.replace(/_/g, " ")}</span>
                              {e.artifactLabel && (
                                <span className="text-text-muted"> — {e.artifactLabel}</span>
                              )}
                            </p>
                            <span className="text-[10px] text-text-muted tabular-nums flex-shrink-0">
                              {new Date(e.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            {meta.label} · {e.artifactType}
                            {e.artifactId && (
                              <span className="text-text-muted/60"> · {e.artifactId.slice(0, 8)}</span>
                            )}
                          </p>
                          {Object.keys(e.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-[10px] text-text-muted cursor-pointer hover:text-text-primary">{t("auditTrail.metadata")}</summary>
                              <pre className="mt-1 text-[10px] text-text-muted bg-surface-2 rounded p-2 overflow-x-auto">{JSON.stringify(e.metadata, null, 2)}</pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3"
        style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}06` }}
      >
        <Filter size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLOR }} />
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">{t("auditTrail.threeSourcesTitle")}</span> {t("auditTrail.threeSourcesDesc")}
        </p>
      </div>
    </div>
  );
}

function Pill({ label, count, active, onClick, color }: { label: string; count: number; active: boolean; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="glass-card rounded-xl p-4 text-left transition-all"
      style={active ? { borderColor: color, backgroundColor: `${color}10` } : undefined}
    >
      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
      <p className="text-2xl font-black text-text-primary">{count}</p>
    </button>
  );
}
