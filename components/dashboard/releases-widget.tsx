"use client";

import Link from "next/link";
import { Disc3, Circle, CheckCircle2, Plus, ChevronRight } from "lucide-react";
import { type Release } from "@/lib/data/releases";
import { useMounted } from "@/lib/hooks/use-mounted";
import { useTranslation } from "@/lib/i18n/hooks";
import type { TranslationPath } from "@/lib/i18n";

interface ReleasesWidgetProps {
  initialReleases: Release[];
}

export function ReleasesWidget({ initialReleases }: ReleasesWidgetProps) {
  const { t } = useTranslation();
  const releases = initialReleases;
  const next = releases[0];
  const rest = releases.slice(1);

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
      <header className="mb-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-text-muted font-medium mb-1">
          <Disc3 size={12} />
          {t("widget.pipeline")}
        </div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t("widget.nextReleases")}
        </h2>
      </header>

      {next ? <NextReleaseCard release={next} /> : <EmptyReleaseState />}

      {rest.length > 0 && (
        <div className="mt-6 space-y-0">
          <p className="text-xs uppercase tracking-[0.15em] text-text-muted/60 font-medium mb-3">
            {t("widget.afterThat")}
          </p>
          <div className="relative">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/10" />
            {rest.map((r, i) => (
              <TimelineItem key={r.id} release={r} isLast={i === rest.length - 1} />
            ))}
          </div>
        </div>
      )}

      <footer className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {releases.length === 0
            ? t("widget.noReleasesScheduled")
            : t("widget.plannedThisQuarter", { count: releases.length })}
        </span>
        <Link href="/dashboard/releases/new" className="text-xs text-text-muted hover:text-brand transition-colors">
          {t("widget.planRelease")}
        </Link>
      </footer>
    </div>
  );
}

function NextReleaseCard({ release }: { release: Release }) {
  const { t } = useTranslation();
  const mounted = useMounted();
  const statusBadge = getStatusBadge(release.status, t);
  const artistLabel = release.artist_name ?? t("widget.untitledArtist");

  return (
    <div className="rounded-xl p-5 bg-gradient-to-br from-brand/10 to-transparent border border-brand/15">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium mb-1">
            {artistLabel} · {release.type}
          </p>
          <h3 className="text-xl font-semibold text-text-primary tracking-tight">{release.title}</h3>
        </div>
        <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md border ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
      </div>

      <div className="flex items-baseline gap-3 mt-4">
        <span className="text-3xl font-black text-brand tabular-nums leading-none">
          {!mounted ? "—" : release.release_date ? formatDaysUntil(release.release_date, t) : t("widget.tbc")}
        </span>
        <span className="text-xs text-text-muted">
          {mounted && release.release_date
            ? `· ${new Date(release.release_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`
            : mounted ? `· ${t("widget.dateToBeConfirmed")}` : ""}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(release.dsps ?? []).slice(0, 3).map(dsp => (
            <span key={dsp} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-muted">{dsp}</span>
          ))}
          {(release.dsps?.length ?? 0) > 3 && (
            <span className="text-[10px] text-text-muted">+{(release.dsps?.length ?? 0) - 3}</span>
          )}
        </div>
        {release.distributor && (
          <span className="text-[10px] text-text-muted">
            {t("widget.viaDistributor", { distributor: release.distributor })}
          </span>
        )}
        <Link href={`/dashboard/releases/${release.id}/plan`}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-light transition-colors">
          View Plan <ChevronRight size={11} />
        </Link>
      </div>
    </div>
  );
}

function TimelineItem({ release, isLast }: { release: Release; isLast: boolean }) {
  const { t } = useTranslation();
  const mounted = useMounted();
  const Icon = release.status === "live" || release.status === "delivered" ? CheckCircle2 : Circle;
  return (
    <div className={`flex gap-4 ${isLast ? "" : "pb-3"}`}>
      <div className="relative flex-shrink-0 pt-0.5">
        <Icon size={14} className="relative z-10 bg-background rounded-full text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{release.title}</p>
        <p className="text-xs text-text-muted truncate">
          {release.artist_name ?? t("widget.untitledArtist")} · {release.type}
          {mounted && ` · ${release.release_date ? formatDaysUntil(release.release_date, t) : t("widget.tbc")}`}
        </p>
      </div>
      <Link href={`/dashboard/releases/${release.id}/plan`}
        className="flex-shrink-0 text-[10px] text-text-muted hover:text-brand transition-colors">
        Plan →
      </Link>
    </div>
  );
}

function EmptyReleaseState() {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl p-6 border border-dashed border-white/10 text-center">
      <p className="text-sm text-text-muted mb-3">{t("widget.noReleasesYet")}</p>
      <Link
        href="/dashboard/releases/new"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-light transition-colors px-3 py-1.5 rounded-lg border border-brand/20 hover:border-brand/40 hover:bg-brand/5"
      >
        <Plus size={14} />
        {t("widget.planARelease")}
      </Link>
    </div>
  );
}

type TFn = (path: TranslationPath, vars?: Record<string, string | number>) => string;

function getStatusBadge(status: Release["status"], t: TFn): { label: string; className: string } {
  const map: Record<Release["status"], { key: TranslationPath; cls: string }> = {
    planned:     { key: "widget.statusPlanned",    cls: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
    in_progress: { key: "widget.statusInProgress", cls: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
    delivered:   { key: "widget.statusDelivered",  cls: "bg-sky-500/10 text-sky-300 border-sky-500/20" },
    live:        { key: "widget.statusLive",       cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
    cancelled:   { key: "widget.statusCancelled",  cls: "bg-rose-500/10 text-rose-300 border-rose-500/20" },
  };
  const entry = map[status] ?? map.planned;
  return { label: t(entry.key), className: entry.cls };
}

function formatDaysUntil(isoDate: string, t: TFn): string {
  const days = Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0)   return t("widget.daysAgo",  { count: Math.abs(days) });
  if (days === 0)  return t("widget.today");
  if (days === 1)  return t("widget.tomorrow");
  if (days < 14)   return t("widget.inDays",  { count: days });
  if (days < 60)   return t("widget.inWeeks", { count: Math.round(days / 7) });
  return               t("widget.inMonths",   { count: Math.round(days / 30) });
}
