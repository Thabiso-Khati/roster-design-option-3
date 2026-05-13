"use client";

/**
 * ScoreHistoryChart — expandable panel under an ArtistRow
 * ─────────────────────────────────────────────────────────
 * Fetches weekly ROSTER score snapshots from
 * /api/artists/[id]/score-history and renders three lines
 * (Reach, Momentum, Engagement) as a native SVG chart — no
 * external charting library needed.
 */

import { useEffect, useState, useRef } from "react";

interface ScorePoint {
  week: string;
  reach: number | null;
  momentum: number | null;
  engagement: number | null;
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

const CHART_W = 560;
const CHART_H = 90;
const PAD_L = 28;
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 20;
const INNER_W = CHART_W - PAD_L - PAD_R;
const INNER_H = CHART_H - PAD_T - PAD_B;

const SCORE_MIN = -100;
const SCORE_MAX = 100;

function toX(index: number, total: number): number {
  if (total <= 1) return PAD_L + INNER_W / 2;
  return PAD_L + (index / (total - 1)) * INNER_W;
}

function toY(value: number): number {
  const pct = (value - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
  return PAD_T + INNER_H - pct * INNER_H;
}

function buildPath(
  points: ScorePoint[],
  key: keyof Omit<ScorePoint, "week">
): string {
  const segments: string[] = [];
  let penDown = false;

  for (let i = 0; i < points.length; i++) {
    const v = points[i][key];
    if (v == null) {
      penDown = false;
      continue;
    }
    const x = toX(i, points.length);
    const y = toY(v);
    if (!penDown) {
      segments.push(`M${x.toFixed(1)},${y.toFixed(1)}`);
      penDown = true;
    } else {
      segments.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
    }
  }

  return segments.join(" ");
}

function SvgChart({ data }: { data: ScorePoint[] }) {
  const zeroY = toY(0);
  const yTicks = [-100, -50, 0, 50, 100];

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="w-full"
      style={{ height: CHART_H }}
      aria-label="Score history chart"
    >
      {/* Grid lines */}
      {yTicks.map((tick) => {
        const y = toY(tick);
        return (
          <g key={tick}>
            <line
              x1={PAD_L}
              y1={y}
              x2={CHART_W - PAD_R}
              y2={y}
              stroke="currentColor"
              strokeOpacity={tick === 0 ? 0.2 : 0.07}
              strokeWidth={tick === 0 ? 1 : 0.5}
              strokeDasharray={tick === 0 ? "3 3" : undefined}
            />
            <text
              x={PAD_L - 4}
              y={y + 3.5}
              fontSize={7}
              fill="currentColor"
              fillOpacity={0.35}
              textAnchor="end"
            >
              {tick}
            </text>
          </g>
        );
      })}

      {/* Score lines */}
      <path
        d={buildPath(data, "reach")}
        fill="none"
        stroke="#60a5fa"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={buildPath(data, "momentum")}
        fill="none"
        stroke="#a78bfa"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={buildPath(data, "engagement")}
        fill="none"
        stroke="#34d399"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* X axis labels */}
      {data.map((point, i) => {
        // Only label every other point to avoid crowding
        if (data.length > 6 && i % 2 !== 0 && i !== data.length - 1) return null;
        return (
          <text
            key={i}
            x={toX(i, data.length)}
            y={CHART_H - 4}
            fontSize={7}
            fill="currentColor"
            fillOpacity={0.4}
            textAnchor="middle"
          >
            {point.week}
          </text>
        );
      })}

      {/* Zero reference dot at last point if momentum data */}
      <line
        x1={PAD_L}
        y1={zeroY}
        x2={CHART_W - PAD_R}
        y2={zeroY}
        stroke="#a78bfa"
        strokeOpacity={0}
      />
    </svg>
  );
}

// ─── Tooltip overlay — hover state ───────────────────────────────────────────

function HoverTooltip({
  data,
  containerRef,
}: {
  data: ScorePoint[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [tooltip, setTooltip] = useState<{
    point: ScorePoint;
    x: number;
    y: number;
  } | null>(null);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || data.length < 2) return;

    // Fraction across chart width
    const svgScale = CHART_W / rect.width;
    const localX = (e.clientX - rect.left) * svgScale;
    const fraction = Math.max(
      0,
      Math.min(1, (localX - PAD_L) / INNER_W)
    );
    const idx = Math.round(fraction * (data.length - 1));
    const point = data[Math.max(0, Math.min(idx, data.length - 1))];

    setTooltip({ point, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <>
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="absolute inset-0 w-full"
        style={{ height: CHART_H }}
        onMouseMove={handleMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {tooltip && (() => {
          const point = tooltip.point;
          const idx = data.indexOf(point);
          const cx = toX(idx, data.length);
          return (
            <line
              x1={cx} y1={PAD_T}
              x2={cx} y2={CHART_H - PAD_B}
              stroke="currentColor"
              strokeOpacity={0.2}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          );
        })()}
      </svg>

      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none bg-bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs shadow-xl"
          style={{
            left: Math.min(tooltip.x + 8, (containerRef.current?.offsetWidth ?? 200) - 120),
            top: 0,
          }}
        >
          <p className="text-text-muted text-[10px] font-medium mb-0.5">{tooltip.point.week}</p>
          {tooltip.point.reach != null && (
            <p className="tabular-nums" style={{ color: "#60a5fa" }}>
              Reach: <span className="font-semibold">{tooltip.point.reach}</span>
            </p>
          )}
          {tooltip.point.momentum != null && (
            <p className="tabular-nums" style={{ color: "#a78bfa" }}>
              Momentum:{" "}
              <span className="font-semibold">
                {tooltip.point.momentum > 0 ? "+" : ""}
                {tooltip.point.momentum}
              </span>
            </p>
          )}
          {tooltip.point.engagement != null && (
            <p className="tabular-nums" style={{ color: "#34d399" }}>
              Engagement: <span className="font-semibold">{tooltip.point.engagement}</span>
            </p>
          )}
        </div>
      )}
    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function ScoreHistoryChart({
  artistId,
  artistName,
}: {
  artistId: string;
  artistName: string;
}) {
  const [data, setData] = useState<ScorePoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/artists/${artistId}/score-history`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ history: ScorePoint[] }>;
      })
      .then((json) => {
        if (!cancelled) setData(json.history ?? []);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [artistId]);

  if (loading) {
    return (
      <div className="h-24 flex items-center justify-center">
        <p className="text-[11px] text-text-muted/50 animate-pulse">
          Loading score history…
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-[11px] text-text-muted/40 py-2">
        Score history unavailable
      </p>
    );
  }

  if (data.length < 2) {
    return (
      <p className="text-[11px] text-text-muted/40 py-2">
        Not enough data yet — scores will appear after the second sync cycle
      </p>
    );
  }

  return (
    <div className="mt-1">
      <p className="text-[10px] text-text-muted/50 mb-1 font-medium uppercase tracking-wider">
        Score history · {artistName}
      </p>
      <div ref={containerRef} className="relative text-text-primary">
        <SvgChart data={data} />
        <HoverTooltip data={data} containerRef={containerRef} />
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-1 justify-end">
        {(
          [
            { label: "Reach", color: "#60a5fa" },
            { label: "Momentum", color: "#a78bfa" },
            { label: "Engagement", color: "#34d399" },
          ] as const
        ).map(({ label, color }) => (
          <span
            key={label}
            className="flex items-center gap-1 text-[9px] text-text-muted/60"
          >
            <span
              className="inline-block w-3 h-0.5 rounded-full"
              style={{ background: color }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
