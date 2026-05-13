"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";
import { formatCompactNumber } from "@/lib/mock/dashboard-data";
import type { LiveArtist } from "./types";
import { useState, useEffect, useCallback } from "react";
import { ScoreHistoryChart } from "./score-history-chart";

// ─── Diagnosis cache (24h localStorage) ──────────────────────

const DIAGNOSIS_TTL_MS = 24 * 60 * 60 * 1000;

function getCachedDiagnosis(artistId: string): string | null {
  try {
    const raw = localStorage.getItem(`roster_dx_${artistId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { text: string; ts: number };
    if (Date.now() - parsed.ts > DIAGNOSIS_TTL_MS) {
      localStorage.removeItem(`roster_dx_${artistId}`);
      return null;
    }
    return parsed.text;
  } catch {
    return null;
  }
}

function setCachedDiagnosis(artistId: string, text: string) {
  try {
    localStorage.setItem(
      `roster_dx_${artistId}`,
      JSON.stringify({ text, ts: Date.now() })
    );
  } catch {}
}

// ─── Styled signal breakdown tooltip ─────────────────────────

function SignalTooltip({
  label,
  score,
  signals,
  platformCount,
  colour,
}: {
  label: string;
  score: ReactNode;
  signals: Array<{ signal: string; contribution: number }> | undefined;
  platformCount?: number;
  colour?: string;
}) {
  const top3 = (signals ?? []).slice(0, 3);
  const maxContrib = Math.max(...top3.map(s => Math.abs(s.contribution)), 1);

  // Human-readable signal names
  const formatSignal = (raw: string) =>
    raw.replace(/\./g, " ").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span className="relative group/tooltip inline-block">
      {/* Score value */}
      <span
        className={`text-sm font-semibold tabular-nums cursor-default ${colour ?? "text-text-primary"}`}
      >
        {score}
      </span>

      {/* Hover card — appears above, right-aligned */}
      <span
        className="pointer-events-none absolute z-50 bottom-full right-0 mb-2 w-52
                   bg-surface border border-border rounded-xl shadow-xl
                   opacity-0 group-hover/tooltip:opacity-100
                   translate-y-1 group-hover/tooltip:translate-y-0
                   transition-all duration-150 ease-out"
      >
        {/* Header */}
        <span className="block px-3 pt-3 pb-2 border-b border-border/50">
          <span className="block text-[10px] font-black uppercase tracking-widest text-text-muted">
            {label}
          </span>
          {platformCount !== undefined && platformCount > 0 && (
            <span className="block text-[10px] text-text-muted mt-0.5">
              {platformCount} platform{platformCount === 1 ? "" : "s"} connected
            </span>
          )}
        </span>

        {/* Signal bars */}
        <span className="block px-3 py-2.5 space-y-2">
          {top3.length > 0 ? (
            top3.map((s, i) => {
              const pct = Math.round((Math.abs(s.contribution) / maxContrib) * 100);
              const positive = s.contribution >= 0;
              return (
                <span key={i} className="block">
                  <span className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-text-muted truncate max-w-[120px]">
                      {formatSignal(s.signal)}
                    </span>
                    <span
                      className="text-[10px] font-semibold ml-2 flex-shrink-0"
                      style={{ color: positive ? "#1DB954" : "#E05C5C" }}
                    >
                      {positive ? "+" : ""}{s.contribution.toFixed(1)}
                    </span>
                  </span>
                  <span className="block h-1 rounded-full bg-white/[0.06]">
                    <span
                      className="block h-1 rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: positive ? "#1DB954" : "#E05C5C",
                      }}
                    />
                  </span>
                </span>
              );
            })
          ) : (
            <span className="block text-[10px] text-text-muted italic">No signals yet</span>
          )}
        </span>
      </span>
    </span>
  );
}

export function ArtistRow({
  artist,
  onDelete,
  onEdit,
}: {
  artist: LiveArtist;
  onDelete: (id: string) => void;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const [diagnosis, setDiagnosis] = useState<string | null>(
    artist.rosterDiagnosis ?? null
  );
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isDbBacked = artist.id.length >= 32;
  const hasScores =
    (artist.scoreCoverage?.reachSignals ?? 0) > 0 ||
    (artist.scoreCoverage?.momentumSignals ?? 0) > 0 ||
    (artist.scoreCoverage?.engagementSignals ?? 0) > 0;

  // Lazy-load diagnosis once scores exist, cached 24h
  const fetchDiagnosis = useCallback(async () => {
    if (!isDbBacked || !hasScores || diagnosis !== null || diagnosisLoading) return;
    const cached = getCachedDiagnosis(artist.id);
    if (cached) { setDiagnosis(cached); return; }

    setDiagnosisLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "score-diagnosis",
          artistContext: {
            name: artist.name,
            genre: artist.genre,
            country: artist.country,
            followers: artist.followers,
            monthlyListeners: artist.monthlyListeners,
          },
          params: {
            reach: artist.reach,
            momentum: artist.momentum,
            engagement: artist.engagement,
            reachSignals: artist.scoreCoverage?.reachSignals ?? 0,
            momentumSignals: artist.scoreCoverage?.momentumSignals ?? 0,
            engagementSignals: artist.scoreCoverage?.engagementSignals ?? 0,
            platformCount: artist.scoreCoverage?.platformCount ?? 0,
            topReachSignals: (artist.scoreBreakdown?.reach ?? []).slice(0, 3),
            topEngagementSignals: (artist.scoreBreakdown?.engagement ?? []).slice(0, 3),
          },
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { result?: string };
        if (json.result) {
          setDiagnosis(json.result);
          setCachedDiagnosis(artist.id, json.result);
        }
      }
    } catch {}
    finally { setDiagnosisLoading(false); }
  }, [artist, isDbBacked, hasScores, diagnosis, diagnosisLoading]);

  useEffect(() => {
    // Small delay so the roster renders first — diagnosis is non-blocking
    const timer = setTimeout(fetchDiagnosis, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artist.id]);

  const { t: _t } = useTranslation();
  void _t;

  const TrendIcon =
    artist.trend === "up"
      ? TrendingUp
      : artist.trend === "down"
        ? TrendingDown
        : Minus;
  const trendColor =
    artist.trend === "up"
      ? "text-emerald-400"
      : artist.trend === "down"
        ? "text-rose-400"
        : "text-text-muted";

  const initials = artist.name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("");

  const hasMonthlyListeners =
    artist.monthlyListeners != null && artist.monthlyListeners > 0;
  const headlineValue = hasMonthlyListeners
    ? artist.monthlyListeners!
    : artist.followers;
  const headlineLabel = hasMonthlyListeners ? t("widget.monthly") : t("roster.followers");

  const avatar = (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 overflow-hidden bg-white/5">
      {artist.imageUrl ? (
        <Image
          src={artist.imageUrl}
          alt={artist.name}
          width={40}
          height={40}
          className="w-full h-full object-cover"
          unoptimized
        />
      ) : (
        <span className="text-brand">{initials || "?"}</span>
      )}
    </div>
  );

  const flagsToRender =
    artist.countryFlags && artist.countryFlags.length > 0
      ? artist.countryFlags
      : artist.countryFlag
        ? [artist.countryFlag]
        : [];

  const identity = (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-text-primary truncate">
          {artist.name}
        </p>
        <span
          className="text-xs"
          title={
            artist.countries && artist.countries.length > 0
              ? artist.countries.join(" · ")
              : artist.country ?? ""
          }
        >
          {flagsToRender.join("")}
        </span>
        {artist.spotifyUrl && artist.spotifyUrl !== "#" && (
          <a
            href={artist.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-brand"
            title="Open on Spotify"
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>
      <p className="text-xs text-text-muted truncate">{artist.genre}</p>
      {/* AI Diagnosis — one-liner below genre */}
      {diagnosis && (
        <p className="text-[10px] text-text-muted/70 italic mt-0.5 leading-snug flex items-start gap-1 truncate">
          <Sparkles size={9} className="text-brand/60 mt-0.5 flex-shrink-0" />
          <span className="truncate">{diagnosis}</span>
        </p>
      )}
      {diagnosisLoading && (
        <p className="text-[10px] text-text-muted/40 italic mt-0.5 animate-pulse">
          Analysing…
        </p>
      )}
    </div>
  );

  void trendColor;
  void TrendIcon;

  // ── Confidence level from signal count ──
  // 0 = no data · 1–2 = partial · 3–4 = good · 5+ = high
  const confLevel = (count: number): "none" | "low" | "medium" | "high" =>
    count === 0 ? "none" : count <= 2 ? "low" : count <= 4 ? "medium" : "high";

  const CONF_COLOR: Record<string, string> = {
    none:   "transparent",
    low:    "#F59E0B",   // amber
    medium: "#C9A84C",   // gold
    high:   "#1DB954",   // green
  };

  const CONF_LABEL: Record<string, string> = {
    none:   "No data yet",
    low:    "Low confidence — few signals",
    medium: "Moderate confidence",
    high:   "High confidence — well-covered",
  };

  // Small colored dot beside score
  const confDot = (count: number) => {
    const level = confLevel(count);
    if (level === "none") return null;
    return (
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ml-1 mb-px align-middle"
        style={{ backgroundColor: CONF_COLOR[level] }}
        title={`${CONF_LABEL[level]} (${count} signal${count === 1 ? "" : "s"})`}
      />
    );
  };

  const scoreChip = (
    value: number,
    coverage: number | undefined,
    label: string,
    signals: Array<{ signal: string; contribution: number }> | undefined,
    platformCount?: number
  ) => {
    const count = coverage ?? 0;
    if (count === 0) {
      return (
        <span
          className="text-sm text-text-muted/40 tabular-nums text-right block"
          title={`${label} — no data yet`}
        >
          —
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-end gap-0.5 w-full">
        <SignalTooltip
          label={label}
          score={value}
          signals={signals}
          platformCount={platformCount}
        />
        {confDot(count)}
      </span>
    );
  };

  const momentumChip = (() => {
    const coverage = artist.scoreCoverage?.momentumSignals ?? 0;
    if (coverage === 0) {
      return (
        <span
          className="text-sm text-text-muted/40 tabular-nums text-right block"
          title="ROSTER Momentum — need at least two sync cycles to compute velocity"
        >
          —
        </span>
      );
    }
    const m = artist.momentum;
    const colour =
      m > 2 ? "text-emerald-400" : m < -2 ? "text-rose-400" : "text-text-muted";
    const Arrow = m > 2 ? TrendingUp : m < -2 ? TrendingDown : Minus;
    const topSignals = (artist.scoreBreakdown?.momentum ?? []).slice(0, 3);
    const signalLine =
      topSignals.length > 0
        ? topSignals
            .map(
              (s) =>
                `${s.signal.replace(".", " ")} (${s.contribution > 0 ? "+" : ""}${s.contribution.toFixed(1)})`
            )
            .join(", ")
        : "No velocity signals yet";
    return (
      <span
        className={`flex items-center gap-1 justify-end text-sm font-semibold tabular-nums ${colour} cursor-default`}
        title={`ROSTER Momentum — ${coverage} signals — ${signalLine}`}
      >
        <Arrow size={12} />
        {m > 0 ? "+" : ""}
        {m}
        {confDot(coverage)}
      </span>
    );
  })();

  const actions = isDbBacked ? (
    <div className="flex items-center gap-1.5 justify-end">
      {/* Expand/collapse score history */}
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Hide score history" : "Show score history"}
        className="opacity-40 group-hover:opacity-80 hover:!opacity-100 transition-opacity text-text-muted hover:text-brand p-1"
        title={expanded ? "Hide score history" : "Show score history chart"}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <button
        onClick={onEdit}
        aria-label={`Edit stats for ${artist.name}`}
        className="opacity-40 group-hover:opacity-80 hover:!opacity-100 transition-opacity text-text-muted hover:text-brand p-1"
        title="Edit stats"
      >
        <Pencil size={14} aria-hidden="true" />
      </button>
      <button
        onClick={() => {
          if (confirm(t("roster.confirmRemoveStats", { name: artist.name }))) {
            onDelete(artist.id);
          }
        }}
        aria-label={`Remove ${artist.name} from roster`}
        className="opacity-40 group-hover:opacity-80 hover:!opacity-100 transition-opacity text-text-muted hover:text-rose-400 p-1"
        title="Remove artist"
      >
        <Trash2 size={14} aria-hidden="true" />
      </button>
    </div>
  ) : (
    <div />
  );

  return (
    <>
      {/* ── Compact layout (below lg) ── */}
      <div className="lg:hidden flex flex-col gap-2 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group">
        {/* Top row: avatar + identity + actions */}
        <div className="flex items-center gap-3">
          {avatar}
          <div className="flex-1 min-w-0">
            {identity}
            <div className="flex items-center gap-3 mt-0.5 text-[10px] text-text-muted/80 tabular-nums">
              {hasMonthlyListeners && (
                <span title="Monthly listeners">
                  {formatCompactNumber(headlineValue)} {headlineLabel}
                </span>
              )}
              {!hasMonthlyListeners && artist.followers > 0 && (
                <span title={t("roster.followers")}>
                  {formatCompactNumber(artist.followers)} {t("roster.followers").toLowerCase()}
                </span>
              )}
            </div>
          </div>
          {actions}
        </div>
        {/* Score bars */}
        <div className="flex flex-col gap-1.5 px-1">
          {(
            [
              { label: "Reach",    value: artist.reach,      signals: artist.scoreCoverage?.reachSignals ?? 0,      color: "#C9A84C" },
              { label: "Momentum", value: artist.momentum,   signals: artist.scoreCoverage?.momentumSignals ?? 0,   color: "#34D399" },
              { label: "Engage",   value: artist.engagement, signals: artist.scoreCoverage?.engagementSignals ?? 0, color: "#7C6FCD" },
            ] as { label: string; value: number; signals: number; color: string }[]
          ).map(({ label, value, signals, color }) => {
            const hasData = signals > 0;
            const pct = hasData ? Math.min(100, Math.max(0, value)) : 0;
            return (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted w-[42px] flex-shrink-0">{label}</span>
                <div className="flex-1 h-[3px] rounded-full bg-white/[0.06]">
                  {hasData && (
                    <div
                      className="h-[3px] rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  )}
                </div>
                <span
                  className="text-[10px] tabular-nums w-6 text-right flex-shrink-0"
                  style={{ color: hasData ? color : undefined }}
                >
                  {hasData ? value : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Expanded layout (lg+) ── */}
      <div
        className="hidden lg:grid items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors group"
        style={{
          gridTemplateColumns:
            "40px minmax(0,1fr) 7rem 4.5rem 4.5rem 4.5rem 5rem",
        }}
      >
        {avatar}
        {identity}
        <p className="text-sm font-semibold text-text-primary tabular-nums text-right">
          {artist.monthlyListeners != null && artist.monthlyListeners > 0
            ? formatCompactNumber(artist.monthlyListeners)
            : artist.followers > 0
              ? formatCompactNumber(artist.followers)
              : "—"}
        </p>
        {scoreChip(
          artist.reach,
          artist.scoreCoverage?.reachSignals,
          "ROSTER Reach — log-normalised audience size",
          artist.scoreBreakdown?.reach,
          artist.scoreCoverage?.platformCount
        )}
        {momentumChip}
        {scoreChip(
          artist.engagement,
          artist.scoreCoverage?.engagementSignals,
          "ROSTER Engagement — depth signals weighted by bot-resistance",
          artist.scoreBreakdown?.engagement
        )}
        {actions}
      </div>

      {/* ── Score history panel (expandable) ── */}
      {expanded && isDbBacked && (
        <div className="hidden lg:block px-3 pb-3">
          <ScoreHistoryChart artistId={artist.id} artistName={artist.name} />
        </div>
      )}
    </>
  );
}
