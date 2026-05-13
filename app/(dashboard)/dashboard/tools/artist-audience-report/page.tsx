"use client";
import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus, Save, RotateCcw, Users, Printer } from "lucide-react";
import { storageSave, storageLoad, storageClear } from "@/lib/storage";
import { PrintDocument } from "@/components/tools/print-document";
import type { PrintSection } from "@/components/tools/print-document";

const MONTHS = ["April","May","June","July","August","September","October","November","December","January","February","March"];

const SOCIAL_METRICS = [
  "TikTok, Followers",
  "Instagram, Followers",
  "YouTube, Subscribers",
  "Facebook, Page Likes",
  "Twitter / X, Followers",
  "WhatsApp Broadcast List",
];
const STREAMING_METRICS = [
  "Spotify, Monthly Listeners",
  "Spotify, Total Streams",
  "Apple Music, Monthly Listeners",
  "Audiomack, Monthly Plays",
  "Boomplay, Monthly Streams",
  "YouTube Music, Views",
];
const OTHER_METRICS = [
  "Email Newsletter Subscribers",
  "Website, Monthly Visits",
  "Press Mentions (count)",
];
const ALL_METRICS = [...SOCIAL_METRICS, ...STREAMING_METRICS, ...OTHER_METRICS];

const WEEKS = ["start","w1","w2","w3","w4"] as const;
type WeekKey = typeof WEEKS[number];

type MonthData = Record<string, Record<WeekKey, string>>;
type AllData = Record<string, MonthData>;

function makeEmptyMonth(): MonthData {
  const m: MonthData = {};
  ALL_METRICS.forEach(metric => {
    m[metric] = { start: "", w1: "", w2: "", w3: "", w4: "" };
  });
  return m;
}

function calcGrowth(a: string, b: string): number | null {
  const n1 = parseFloat(a.replace(/,/g, ""));
  const n2 = parseFloat(b.replace(/,/g, ""));
  if (isNaN(n1) || isNaN(n2) || n1 === 0) return null;
  return ((n2 - n1) / n1) * 100;
}

function GrowthBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-text-muted text-xs">, </span>;
  const pos = pct > 0;
  const neg = pct < 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${pos ? "text-emerald-400 bg-emerald-400/10" : neg ? "text-red-400 bg-red-400/10" : "text-text-muted bg-surface-2"}`}>
      {pos ? <TrendingUp size={10}/> : neg ? <TrendingDown size={10}/> : <Minus size={10}/>}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default function ArtistAudienceReport() {
  const [activeMonth, setActiveMonth] = useState(0);
  const [data, setData] = useState<AllData>({});
  const [saved, setSaved] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    try {
      const d = storageLoad<AllData>("roster_audience_report");
      if (d) setData(d);
    } catch {}
  }, []);

  const getMonth = useCallback((idx: number): MonthData => {
    return data[MONTHS[idx]] ?? makeEmptyMonth();
  }, [data]);

  const update = (month: string, metric: string, week: WeekKey, val: string) => {
    setData(prev => ({
      ...prev,
      [month]: {
        ...(prev[month] ?? makeEmptyMonth()),
        [metric]: { ...(prev[month]?.[metric] ?? { start:"",w1:"",w2:"",w3:"",w4:"" }), [week]: val },
      },
    }));
    setSaved(false);
  };

  const save = () => {
    storageSave("roster_audience_report", data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    if (!confirm("Clear all data for this month?")) return;
    const month = MONTHS[activeMonth];
    setData(prev => { const next = {...prev}; delete next[month]; return next; });
    storageClear("roster_audience_report");
  };

  const month = MONTHS[activeMonth];
  const mData = getMonth(activeMonth);

  const sections = [
    { label: "Social Media Followers", metrics: SOCIAL_METRICS, color: "#8B5CF6" },
    { label: "Streaming Performance", metrics: STREAMING_METRICS, color: "#EC4899" },
    { label: "Other Metrics", metrics: OTHER_METRICS, color: "#F59E0B" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} className="text-brand"/>
            <h1 className="text-xl font-black text-text-primary">Artist Audience Report</h1>
          </div>
          <p className="text-sm text-text-muted">Track your monthly growth across every platform. Data auto-saves to this device.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-error hover:bg-error/5 transition-all">
            <RotateCcw size={13}/>Reset month
          </button>
          <button onClick={() => setShowPrint(true)} data-no-print
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-brand hover:bg-brand/10 transition-all">
          <Printer size={13}/>Export PDF
        </button>
        <button onClick={save}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${saved ? "bg-emerald-500/20 text-emerald-400" : "bg-brand/20 text-brand hover:bg-brand/30"}`}>
            <Save size={13}/>{saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Month tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {MONTHS.map((m, i) => (
          <button key={m} onClick={() => setActiveMonth(i)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeMonth === i ? "bg-brand text-bg" : "bg-surface-2 text-text-muted hover:text-text-primary"}`}>
            {m}
          </button>
        ))}
      </div>

      {/* Month header */}
      <div className="glass-card rounded-xl p-4 mb-5 flex items-center justify-between">
        <p className="text-sm font-bold text-text-primary">Reporting Period: <span className="text-brand">{month} 2026</span></p>
        <p className="text-xs text-text-muted">Fill in each week, growth % auto-calculates</p>
      </div>

      {/* Tables per section */}
      <div className="space-y-6">
        {sections.map(sec => (
          <div key={sec.label}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sec.color }}/>
              <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: sec.color }}>{sec.label}</h3>
            </div>
            <div className="glass-card rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_repeat(9,1fr)] gap-0 border-b border-border bg-surface-2 text-[10px] font-bold uppercase text-text-muted">
                <div className="px-4 py-2.5">Metric</div>
                <div className="px-2 py-2.5 text-center col-span-1">Start</div>
                <div className="px-2 py-2.5 text-center col-span-1">Wk 1</div>
                <div className="px-2 py-2.5 text-center col-span-1">%</div>
                <div className="px-2 py-2.5 text-center col-span-1">Wk 2</div>
                <div className="px-2 py-2.5 text-center col-span-1">%</div>
                <div className="px-2 py-2.5 text-center col-span-1">Wk 3</div>
                <div className="px-2 py-2.5 text-center col-span-1">%</div>
                <div className="px-2 py-2.5 text-center col-span-1">Wk 4</div>
                <div className="px-2 py-2.5 text-center col-span-1">%</div>
              </div>
              {sec.metrics.map((metric, mi) => {
                const row = mData[metric] ?? { start:"",w1:"",w2:"",w3:"",w4:"" };
                return (
                  <div key={metric} className={`grid grid-cols-[2fr_repeat(9,1fr)] gap-0 border-b last:border-b-0 border-border ${mi % 2 === 0 ? "" : "bg-surface-2/30"}`}>
                    <div className="px-4 py-2.5 flex items-center">
                      <span className="text-xs text-text-primary font-medium truncate">{metric}</span>
                    </div>
                    {(["start","w1","w2","w3","w4"] as WeekKey[]).map((wk, wi) => [
                      <div key={wk} className="px-1 py-1.5 flex items-center justify-center">
                        <input
                          type="text" value={row[wk]}
                          onChange={e => update(month, metric, wk, e.target.value)}
                          placeholder="0"
                          className="w-full text-center text-xs bg-transparent border border-transparent hover:border-brand/30 focus:border-brand focus:bg-surface-2 rounded px-1 py-1 outline-none transition-all text-text-primary placeholder:text-text-muted/40"
                        />
                      </div>,
                      wi < 4 && (
                        <div key={`${wk}_pct`} className="px-1 py-1.5 flex items-center justify-center">
                          <GrowthBadge pct={wk === "start" ? null : calcGrowth(row.start, row[wk])}/>
                        </div>
                      ),
                    ])}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted mt-4 text-center">Data is saved to this device for 90 days. Export as PDF to keep a permanent copy.</p>

      {showPrint && (() => {
        const mData = getMonth(activeMonth);
        const sections: PrintSection[] = [
          { heading: "Report Period", stats: [{ label: "Month", value: `${MONTHS[activeMonth]} 2026` }, { label: "Metrics Tracked", value: String(ALL_METRICS.length) }] },
          { heading: "Social Media Followers", color: "#8B5CF6",
            tables: [{ headers: ["Metric","Start","Week 1","Week 2","Week 3","Week 4"],
              rows: SOCIAL_METRICS.map(m => { const r = mData[m] ?? {start:"",w1:"",w2:"",w3:"",w4:""}; return [m, r.start||", ", r.w1||", ", r.w2||", ", r.w3||", ", r.w4||", "]; }) }] },
          { heading: "Streaming Performance", color: "#EC4899",
            tables: [{ headers: ["Metric","Start","Week 1","Week 2","Week 3","Week 4"],
              rows: STREAMING_METRICS.map(m => { const r = mData[m] ?? {start:"",w1:"",w2:"",w3:"",w4:""}; return [m, r.start||", ", r.w1||", ", r.w2||", ", r.w3||", ", r.w4||", "]; }) }] },
          { heading: "Other Metrics", color: "#F59E0B",
            tables: [{ headers: ["Metric","Start","Week 1","Week 2","Week 3","Week 4"],
              rows: OTHER_METRICS.map(m => { const r = mData[m] ?? {start:"",w1:"",w2:"",w3:"",w4:""}; return [m, r.start||", ", r.w1||", ", r.w2||", ", r.w3||", ", r.w4||", "]; }) }] },
        ];
        return <PrintDocument toolName="Artist Audience Report" subtitle={`${MONTHS[activeMonth]} 2026 · Monthly Platform Performance`} sections={sections} onClose={() => setShowPrint(false)}/>;
      })()}
    </div>
  );
}
