"use client";
import { useMemo } from "react";
import { Plus, Trash2, Target, TrendingUp, Calendar, Music, Users, DollarSign, BarChart3 } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#C9A84C";

interface Goal {
  id: string;
  artistName: string;
  metric: string;
  customMetric: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: "Active" | "Hit" | "At risk" | "Missed";
  notes: string;
}

const METRIC_PRESETS = [
  { id: "spotify_monthly", label: "Spotify monthly listeners", icon: Music, unit: "listeners" },
  { id: "spotify_followers", label: "Spotify followers", icon: Music, unit: "followers" },
  { id: "youtube_subs", label: "YouTube subscribers", icon: Users, unit: "subs" },
  { id: "youtube_views", label: "YouTube total views", icon: BarChart3, unit: "views" },
  { id: "tiktok_followers", label: "TikTok followers", icon: Users, unit: "followers" },
  { id: "instagram_followers", label: "Instagram followers", icon: Users, unit: "followers" },
  { id: "audiomack_plays", label: "Audiomack plays", icon: Music, unit: "plays" },
  { id: "boomplay_plays", label: "Boomplay plays", icon: Music, unit: "plays" },
  { id: "tour_revenue", label: "Tour revenue", icon: DollarSign, unit: "currency" },
  { id: "sync_revenue", label: "Sync revenue", icon: DollarSign, unit: "currency" },
  { id: "merch_revenue", label: "Merch revenue", icon: DollarSign, unit: "currency" },
  { id: "email_list", label: "Email list size", icon: Users, unit: "subscribers" },
  { id: "shows_booked", label: "Shows booked (next 6mo)", icon: Calendar, unit: "shows" },
  { id: "press_features", label: "Press features", icon: BarChart3, unit: "features" },
  { id: "custom", label: "Custom metric", icon: Target, unit: "" },
];

const blankGoal = (): Goal => ({
  id: crypto.randomUUID(),
  artistName: "",
  metric: "spotify_monthly",
  customMetric: "",
  startValue: 0,
  targetValue: 0,
  currentValue: 0,
  unit: "listeners",
  startDate: new Date().toISOString().slice(0, 10),
  targetDate: "",
  status: "Active",
  notes: "",
});

const STATUS_COLORS: Record<Goal["status"], string> = {
  Active: "#3B82F6",
  Hit: "#10B981",
  "At risk": "#F59E0B",
  Missed: "#EF4444",
};

function smartProgress(g: Goal): { pct: number; gap: number; daysLeft: number; daysElapsed: number; expectedPct: number; status: "ahead" | "ontrack" | "behind" | "complete" } {
  const totalToGo = g.targetValue - g.startValue;
  const progressed = g.currentValue - g.startValue;
  const pct = totalToGo === 0 ? 0 : Math.max(0, Math.min(100, (progressed / totalToGo) * 100));

  const start = g.startDate ? new Date(g.startDate).getTime() : Date.now();
  const end = g.targetDate ? new Date(g.targetDate).getTime() : Date.now();
  const now = Date.now();
  const totalMs = Math.max(1, end - start);
  const elapsedMs = Math.max(0, now - start);
  const remainingMs = Math.max(0, end - now);
  const daysElapsed = Math.round(elapsedMs / 86_400_000);
  const daysLeft = Math.round(remainingMs / 86_400_000);
  const expectedPct = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));

  const gap = pct - expectedPct;
  let status: "ahead" | "ontrack" | "behind" | "complete" = "ontrack";
  if (pct >= 100) status = "complete";
  else if (gap >= 5) status = "ahead";
  else if (gap < -10) status = "behind";

  return { pct, gap, daysLeft, daysElapsed, expectedPct, status };
}

export default function GoalSetterPage() {
  const [goals, setGoals] = useLocalState<Goal[]>("roster_goals_v1", []);
  useToolRestore("goal-setter", "roster_goals_v1", setGoals);

  const summary = useMemo(() => {
    const active = goals.filter((g) => g.status === "Active");
    const hit = goals.filter((g) => g.status === "Hit").length;
    const atRisk = goals.filter((g) => g.status === "At risk").length;
    return { total: goals.length, active: active.length, hit, atRisk };
  }, [goals]);

  function addGoal() {
    setGoals((prev) => [blankGoal(), ...prev]);
  }

  function updateGoal(id: string, patch: Partial<Goal>) {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const next = { ...g, ...patch };
        // Sync unit when metric preset changes
        if (patch.metric !== undefined) {
          const preset = METRIC_PRESETS.find((m) => m.id === patch.metric);
          if (preset && preset.id !== "custom") next.unit = preset.unit;
        }
        return next;
      }),
    );
  }

  function removeGoal(id: string) {
    if (!confirm("Delete this goal?")) return;
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <ResourcePage
      parentHref="/dashboard/library/startup"
      parentLabel="Back to Onboarding"
      color={COLOR}
      tag="Onboarding · Goal-Setter"
      title="Artist Goal-Setter"
      intro="Set SMART goals per artist (specific, measurable, achievable, relevant, time-bound). Track progress against target. Pair with the scoring engine for live attainment metrics."
      toolbar={<><SaveButton toolSlug="goal-setter" storageKey={"roster_goals_v1"} title={`Goal Setter — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <button
          onClick={addGoal}
          className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg"
          style={{ backgroundColor: COLOR, color: "white" }}
        >
          <Plus size={14} /> New goal
        </button>
            </>
      }
      next={{ href: "/dashboard/library/startup/competitor-set", label: "Competitor Set Tracker" }}
    >
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryStat label="Total goals" value={summary.total.toString()} color={COLOR} />
        <SummaryStat label="Active"      value={summary.active.toString()} color="#3B82F6" />
        <SummaryStat label="Hit"         value={summary.hit.toString()}    color="#10B981" />
        <SummaryStat label="At risk"     value={summary.atRisk.toString()} color="#F59E0B" />
      </div>

      {goals.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Target size={28} className="mx-auto mb-3 opacity-40" style={{ color: COLOR }} />
          <p className="font-bold text-text-primary mb-1">No goals yet</p>
          <p className="text-sm text-text-muted mb-4">Set your first SMART goal — e.g. "Reach 1M Spotify monthly listeners by 31 Dec".</p>
          <button
            onClick={addGoal}
            className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg"
            style={{ backgroundColor: COLOR, color: "white" }}
          >
            <Plus size={14} /> Set first goal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const preset = METRIC_PRESETS.find((m) => m.id === g.metric);
            const Icon = preset?.icon ?? Target;
            const metricLabel = g.metric === "custom" ? g.customMetric || "Custom metric" : preset?.label ?? "";
            const progress = smartProgress(g);
            return (
              <div key={g.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${COLOR}15` }}>
                      <Icon size={16} style={{ color: COLOR }} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text-primary">
                        {g.artistName || "(unnamed artist)"} <span className="text-text-muted font-normal">· {metricLabel}</span>
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {g.startValue.toLocaleString()} → {g.targetValue.toLocaleString()} {g.unit} by {g.targetDate || "(no date)"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded" style={{ color: STATUS_COLORS[g.status], backgroundColor: `${STATUS_COLORS[g.status]}15` }}>{g.status}</span>
                    <button onClick={() => removeGoal(g.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5 text-xs flex-wrap gap-2">
                    <span className="text-text-primary font-bold">{g.currentValue.toLocaleString()} / {g.targetValue.toLocaleString()} {g.unit}</span>
                    <span style={{ color: progressColor(progress.status) }} className="font-bold">
                      {progress.pct.toFixed(1)}% complete
                      <span className="text-text-muted font-normal ml-2">{progress.daysLeft >= 0 ? `· ${progress.daysLeft} days left` : `· ${Math.abs(progress.daysLeft)} days overdue`}</span>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden bg-surface-2 relative">
                    <div className="h-full transition-all" style={{ width: `${progress.pct}%`, backgroundColor: progressColor(progress.status) }} />
                    {/* Expected progress marker */}
                    <div className="absolute top-0 h-full border-l-2 border-text-muted/40" style={{ left: `${progress.expectedPct}%` }} title={`Expected: ${progress.expectedPct.toFixed(0)}%`} />
                  </div>
                  <p className="text-[10px] text-text-muted mt-1">
                    {progress.status === "complete" && "✅ Target hit. Mark as 'Hit' to close."}
                    {progress.status === "ahead" && `Ahead of pace by ${progress.gap.toFixed(0)} percentage points. Keep going.`}
                    {progress.status === "ontrack" && "On track."}
                    {progress.status === "behind" && `Behind by ${Math.abs(progress.gap).toFixed(0)} percentage points. Adjust strategy or extend timeline.`}
                  </p>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Artist</label>
                    <input className={inputClass} value={g.artistName} onChange={(e) => updateGoal(g.id, { artistName: e.target.value })} placeholder="Artist name" />
                  </div>
                  <div>
                    <label className={labelClass}>Metric</label>
                    <select className={inputClass} value={g.metric} onChange={(e) => updateGoal(g.id, { metric: e.target.value })}>
                      {METRIC_PRESETS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                  </div>
                  {g.metric === "custom" && (
                    <div>
                      <label className={labelClass}>Custom metric name</label>
                      <input className={inputClass} value={g.customMetric} onChange={(e) => updateGoal(g.id, { customMetric: e.target.value })} placeholder="e.g. Brand deals signed" />
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Unit</label>
                    <input className={inputClass} value={g.unit} onChange={(e) => updateGoal(g.id, { unit: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Start value</label>
                    <input type="number" className={inputClass} value={g.startValue || ""} onChange={(e) => updateGoal(g.id, { startValue: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className={labelClass}>Target value</label>
                    <input type="number" className={inputClass} value={g.targetValue || ""} onChange={(e) => updateGoal(g.id, { targetValue: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className={labelClass}>Current value</label>
                    <input type="number" className={inputClass} value={g.currentValue || ""} onChange={(e) => updateGoal(g.id, { currentValue: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className={labelClass}>Start date</label>
                    <input type="date" className={inputClass} value={g.startDate} onChange={(e) => updateGoal(g.id, { startDate: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Target date</label>
                    <input type="date" className={inputClass} value={g.targetDate} onChange={(e) => updateGoal(g.id, { targetDate: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select className={inputClass} value={g.status} onChange={(e) => updateGoal(g.id, { status: e.target.value as Goal["status"] })}>
                      <option>Active</option>
                      <option>Hit</option>
                      <option>At risk</option>
                      <option>Missed</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className={labelClass}>Strategy / notes</label>
                    <input className={inputClass} value={g.notes} onChange={(e) => updateGoal(g.id, { notes: e.target.value })} placeholder="What's the plan? What blockers exist?" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3"
        style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}06` }}
      >
        <TrendingUp size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLOR }} />
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">SMART check.</span> A good goal is <span className="font-semibold text-text-primary">specific</span> (named metric + named artist), <span className="font-semibold text-text-primary">measurable</span> (numerical target), <span className="font-semibold text-text-primary">achievable</span> (informed by current trajectory), <span className="font-semibold text-text-primary">relevant</span> (ties to a release or business outcome), and <span className="font-semibold text-text-primary">time-bound</span> (has a deadline). The progress bar shows the dotted line where you should be today vs. where you actually are.
        </p>
      </div>
    </ResourcePage>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
      <p className="text-2xl font-black text-text-primary">{value}</p>
    </div>
  );
}

function progressColor(s: "ahead" | "ontrack" | "behind" | "complete"): string {
  switch (s) {
    case "complete": return "#10B981";
    case "ahead": return "#10B981";
    case "ontrack": return "#3B82F6";
    case "behind": return "#F59E0B";
  }
}
