"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Calendar, CheckCircle2, Circle, Plus, Trash2, ChevronDown, ChevronRight,
  ArrowLeft, Loader2, RefreshCw, AlertTriangle, Clock, Sparkles, ChevronUp, X
} from "lucide-react";
import { RosterAIBadge } from "@/components/ui/roster-ai-badge";
import type { Release } from "@/lib/data/releases";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "pre_8w"|"pre_6w"|"pre_4w"|"pre_2w"|"pre_1w"|"release"|"post_1w"|"post_1m";

interface ReleaseTask {
  id: string;
  phase: Phase;
  text: string;
  due_date: string | null;
  done: boolean;
  sort_order: number;
  source?: string;
}

// ─── Phase metadata ───────────────────────────────────────────────────────────
const PHASES: Array<{ id: Phase; label: string; color: string; offsetDays: number }> = [
  { id: "pre_8w",  label: "8 Weeks Before",  color: "#8B5CF6", offsetDays: -56 },
  { id: "pre_6w",  label: "6 Weeks Before",  color: "#A78BFA", offsetDays: -42 },
  { id: "pre_4w",  label: "4 Weeks Before",  color: "#EC4899", offsetDays: -28 },
  { id: "pre_2w",  label: "2 Weeks Before",  color: "#F59E0B", offsetDays: -14 },
  { id: "pre_1w",  label: "1 Week Before",   color: "#EF4444", offsetDays: -7  },
  { id: "release", label: "Release Day",     color: "#10B981", offsetDays:  0  },
  { id: "post_1w", label: "Week After",      color: "#06B6D4", offsetDays: +7  },
  { id: "post_1m", label: "Month After",     color: "#C9A84C", offsetDays: +30 },
];

// ─── Default task seeds (same quality as single-release-plan, extended) ───────
const DEFAULT_TASKS: Record<Phase, string[]> = {
  pre_8w: [
    "Finalise track — mixing and mastering complete",
    "Register with collecting societies (PRO / mechanical / neighbouring rights)",
    "Obtain ISRC and UPC codes from distributor",
    "Begin artwork brief with designer",
    "Draft artist bio and press release",
    "Lock in release title and tracklisting",
  ],
  pre_6w: [
    "Submit artwork and metadata to distributor",
    "Create Spotify Canvas and editorial pitch assets",
    "Pitch to Spotify editorial (minimum 7 days before delivery)",
    "Brief sync licensing contacts with rough mix",
    "Draft email newsletter copy for subscribers",
  ],
  pre_4w: [
    "Submit to distributor (DistroKid / Amuse / TuneCore / FUGA / Africori)",
    "Pitch to DSP editorial — Apple Music, Audiomack, Boomplay, Deezer",
    "Launch pre-save / pre-add campaign",
    "Book radio campaign (community, college, commercial)",
    "Brief social team on rollout content plan and posting schedule",
    "Commission YouTube video or lyric video if applicable",
  ],
  pre_2w: [
    "Announce release date across all social platforms",
    "Upload music video to YouTube (set as premiere)",
    "Send press release to media contacts",
    "Launch paid social campaign (Meta Ads + TikTok Ads)",
    "Confirm playlist pitches, follow up with curators",
    "Set up smart link (Linkfire / Toneden / Feature.fm)",
  ],
  pre_1w: [
    "Activate countdown content on TikTok, IG Stories, Facebook",
    "Send WhatsApp broadcast to fan list",
    "Brief photographers / videographers for release day",
    "Confirm streaming link is live and shareable via smart link",
    "Pin release content across all platforms",
    "Send advance streams to media for reviews",
  ],
  release: [
    "Post the release on TikTok, Instagram, YouTube, Facebook, X",
    "Go live on Instagram or TikTok — celebrate with fans",
    "Post YouTube video / music video premiere",
    "Send email newsletter to mailing list",
    "Send WhatsApp blast with release day message",
    "Thank collaborators and crew publicly",
  ],
  post_1w: [
    "Review first-week streams and social performance data",
    "Submit to remaining playlist curators (second round)",
    "Post behind-the-scenes and release day reaction content",
    "Thank media, curators and supporters publicly",
    "Boost top-performing organic content with paid ads",
    "Send performance data to radio pluggers for follow-up",
  ],
  post_1m: [
    "Pull full analytics report (streams, saves, follower growth, comments)",
    "Evaluate advertising ROI — which channels performed?",
    "Plan next release or content moment",
    "Collect and repurpose fan reactions and UGC content",
    "Submit for awards consideration (SAMA, Channel O, Headies) if eligible",
    "Reconcile release budget — actual vs planned spend",
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dueDateFor(releaseDate: string | null, offsetDays: number): string | null {
  if (!releaseDate) return null;
  const d = new Date(releaseDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });
}

function isOverdue(isoDate: string | null, done: boolean): boolean {
  if (!isoDate || done) return false;
  return new Date(isoDate + "T23:59:59Z").getTime() < Date.now();
}

function daysUntilRelease(isoDate: string | null): string {
  if (!isoDate) return "TBC";
  const days = Math.ceil((new Date(isoDate + "T00:00:00Z").getTime() - Date.now()) / 86_400_000);
  if (days < 0)  return `${Math.abs(days)}d ago`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14)  return `${days} days`;
  if (days < 60)  return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}

function buildSeedTasks(releaseDate: string | null): Omit<ReleaseTask, "id">[] {
  return PHASES.flatMap((ph, _phIdx) =>
    (DEFAULT_TASKS[ph.id] ?? []).map((text, i) => ({
      phase: ph.id,
      text,
      due_date: dueDateFor(releaseDate, ph.offsetDays),
      done: false,
      sort_order: i,
    }))
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { release: Release; initialTasks: ReleaseTask[]; }

export function ReleasePlanBoard({ release, initialTasks }: Props) {
  const [tasks, setTasks] = useState<ReleaseTask[]>(initialTasks);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [newText, setNewText] = useState<Record<Phase, string>>({} as Record<Phase, string>);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const totalDone = tasks.filter(t => t.done).length;
  const totalTasks = tasks.length;
  const pct = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;

  // ─── Toggle task done ──────────────────────────────────────────────────────
  async function toggleTask(task: ReleaseTask) {
    const next = !task.done;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: next } : t));
    setSaving(s => ({ ...s, [task.id]: true }));
    await fetch(`/api/releases/${release.id}/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, done: next }),
    });
    setSaving(s => ({ ...s, [task.id]: false }));
  }

  // ─── Delete task ───────────────────────────────────────────────────────────
  async function deleteTask(taskId: string) {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await fetch(`/api/releases/${release.id}/tasks`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    });
  }

  // ─── Add task ──────────────────────────────────────────────────────────────
  async function addTask(phase: Phase) {
    const text = (newText[phase] ?? "").trim();
    if (!text) return;
    const phMeta = PHASES.find(p => p.id === phase)!;
    const optimisticId = `opt_${Date.now()}`;
    const newTask: ReleaseTask = {
      id: optimisticId,
      phase,
      text,
      due_date: dueDateFor(release.release_date, phMeta.offsetDays),
      done: false,
      sort_order: tasks.filter(t => t.phase === phase).length,
    };
    setTasks(prev => [...prev, newTask]);
    setNewText(p => ({ ...p, [phase]: "" }));

    const res = await fetch(`/api/releases/${release.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: [{ phase, text, due_date: newTask.due_date, sort_order: newTask.sort_order }] }),
    });
    const json = await res.json();
    if (json.tasks?.[0]) {
      setTasks(prev => prev.map(t => t.id === optimisticId ? { ...t, id: json.tasks[0].id } : t));
    }
  }

  // ─── Seed default tasks ────────────────────────────────────────────────────
  async function seedTasks() {
    setSeeding(true);
    const seeds = buildSeedTasks(release.release_date);
    const res = await fetch(`/api/releases/${release.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: seeds }),
    });
    const json = await res.json();
    if (json.tasks) setTasks(json.tasks as ReleaseTask[]);
    setSeeding(false);
  }


  // ─── ROSTER AI state ──────────────────────────────────────────────────────
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(false);

  function buildReleaseParams() {
    const now = Date.now();
    const days = release.release_date
      ? Math.ceil((new Date(release.release_date + "T00:00:00Z").getTime() - now) / 86_400_000)
      : null;
    const daysUntil = days === null ? "TBC" : days < 0 ? `${Math.abs(days)}d ago` : `${days} days`;
    return {
      releaseTitle: release.title,
      releaseType: release.type,
      releaseDate: release.release_date,
      daysUntil,
      dsps: release.dsps ?? [],
      distributor: release.distributor,
      country: null as string | null, // country not on Release type; extend if needed
      artistName: release.artist_name ?? "the artist",
    };
  }

  async function generateWithAI() {
    setAiGenerating(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "release-plan-generate",
          artistContext: { artistName: release.artist_name ?? "", genre: "", country: "" },
          params: buildReleaseParams(),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setAiError(json.error ?? "AI generation failed"); return; }

      // Parse the JSON task list from the AI result string
      let aiTasks: Array<{ phase: string; text: string; priority?: string }> = [];
      try {
        const raw = json.result as string;
        // Strip any markdown fences the model might sneak in
        const cleaned = raw.replace(/^```(?:json)?\n?|```$/gm, "").trim();
        aiTasks = JSON.parse(cleaned);
      } catch {
        setAiError("AI returned malformed JSON. Try again.");
        return;
      }

      const validPhases = new Set(["pre_8w","pre_6w","pre_4w","pre_2w","pre_1w","release","post_1w","post_1m"]);
      const seeds = aiTasks
        .filter(t => t.text && validPhases.has(t.phase))
        .map((t, i) => {
          const phMeta = PHASES.find(p => p.id === t.phase)!;
          return {
            phase: t.phase as Phase,
            text: t.text,
            due_date: dueDateFor(release.release_date, phMeta.offsetDays),
            sort_order: i,
            source: "roster_ai" as const,
          };
        });

      const postRes = await fetch(`/api/releases/${release.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: seeds }),
      });
      const postJson = await postRes.json();
      if (postJson.tasks) setTasks(postJson.tasks as ReleaseTask[]);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setAiGenerating(false);
    }
  }

  async function loadStrategy() {
    if (strategy) { setStrategyOpen(o => !o); return; }
    setStrategyLoading(true);
    setStrategyOpen(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "release-plan-strategy",
          artistContext: { artistName: release.artist_name ?? "", genre: "", country: "" },
          params: buildReleaseParams(),
        }),
      });
      const json = await res.json();
      setStrategy(res.ok ? json.result : (json.error ?? "Could not load strategy."));
    } catch { setStrategy("Could not load strategy."); }
    finally { setStrategyLoading(false); }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary mb-3 transition-colors">
            <ArrowLeft size={12} /> Dashboard
          </Link>
          <div className="flex items-center gap-2 mb-0.5">
            <Calendar size={16} className="text-brand" />
            <h1 className="text-xl font-black text-text-primary">{release.title}</h1>
          </div>
          <p className="text-sm text-text-muted">
            {release.artist_name && <span>{release.artist_name} · </span>}
            <span className="capitalize">{release.type}</span>
            {release.distributor && <span> · {release.distributor}</span>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="text-3xl font-black text-brand tabular-nums leading-none">
              {daysUntilRelease(release.release_date)}
            </p>
            {release.release_date && (
              <p className="text-xs text-text-muted mt-0.5">{formatDate(release.release_date)}</p>
            )}
          </div>
          <button onClick={loadStrategy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ color: "#C9A84C", backgroundColor: "rgba(201,168,76,0.12)" }}>
            <RosterAIBadge size="sm" />
            {strategyLoading ? "Thinking…" : strategy ? (strategyOpen ? "Hide brief" : "Show brief") : "Strategic brief"}
          </button>
        </div>
      </div>

      {/* ROSTER AI strategy panel */}
      {strategyOpen && (
        <div className="mb-5 rounded-xl border p-4" style={{ borderColor: "rgba(201,168,76,0.25)", backgroundColor: "rgba(201,168,76,0.06)" }}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <RosterAIBadge size="sm" />
            <button onClick={() => setStrategyOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
              <X size={13} />
            </button>
          </div>
          {strategyLoading
            ? <div className="flex items-center gap-2 text-xs text-text-muted"><Loader2 size={12} className="animate-spin" /> Generating strategic brief…</div>
            : <p className="text-sm text-text-primary leading-relaxed">{strategy}</p>
          }
        </div>
      )}

      {/* Progress bar */}
      <div className="glass-card rounded-xl p-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-text-muted">Release Progress</p>
            <p className="text-xs font-bold text-brand">{totalDone}/{totalTasks} tasks · {pct}%</p>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Empty state — seed prompt */}
      {tasks.length === 0 && (
        <div className="glass-card rounded-xl p-8 text-center mb-6">
          <Calendar size={32} className="mx-auto text-text-muted mb-3 opacity-40" />
          <p className="text-sm font-semibold text-text-primary mb-1">No tasks yet</p>
          <p className="text-xs text-text-muted mb-4 max-w-xs mx-auto">
            {release.release_date
              ? "Generate a full backwards-planned task board from your release date, or add tasks manually."
              : "Add a release date to your pipeline entry first, then seed tasks with auto-calculated deadlines."}
          </p>
          {release.release_date && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button onClick={generateWithAI} disabled={aiGenerating || seeding}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                style={{ color: "#C9A84C", backgroundColor: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)" }}>
                {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <RosterAIBadge size="sm" />}
                {aiGenerating ? "Generating…" : "Generate with ROSTER AI"}
              </button>
              <button onClick={seedTasks} disabled={seeding || aiGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-surface-2 text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-colors disabled:opacity-50">
                {seeding ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {seeding ? "Loading…" : "Use default template"}
              </button>
            </div>
          )}
          {aiError && <p className="text-xs text-red-400 mt-2">{aiError}</p>}
        </div>
      )}

      {/* DSP chips */}
      {(release.dsps ?? []).length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-5">
          <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold mr-1">DSPs</span>
          {(release.dsps ?? []).map(dsp => (
            <span key={dsp} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-text-muted border border-white/8">{dsp}</span>
          ))}
        </div>
      )}

      {/* Phase task groups */}
      <div className="space-y-3">
        {PHASES.map(ph => {
          const phaseTasks = tasks.filter(t => t.phase === ph.id);
          const donePh = phaseTasks.filter(t => t.done).length;
          const phDueDate = dueDateFor(release.release_date, ph.offsetDays);
          const isCollapsed = collapsed[ph.id];
          const overdueTasks = phaseTasks.filter(t => isOverdue(t.due_date, t.done)).length;

          return (
            <div key={ph.id} className="glass-card rounded-xl overflow-hidden">
              {/* Phase header */}
              <button
                onClick={() => setCollapsed(p => ({ ...p, [ph.id]: !p[ph.id] }))}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2/60 transition-colors"
                style={{ borderLeft: `3px solid ${ph.color}` }}
              >
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold text-text-primary flex-shrink-0">{ph.label}</span>
                  {phDueDate && (
                    <span className="text-[10px] text-text-muted flex-shrink-0">{formatDate(phDueDate)}</span>
                  )}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0"
                    style={{ color: ph.color, backgroundColor: `${ph.color}15` }}>
                    {donePh}/{phaseTasks.length}
                  </span>
                  {overdueTasks > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 flex-shrink-0">
                      <AlertTriangle size={10} /> {overdueTasks} overdue
                    </span>
                  )}
                  {donePh === phaseTasks.length && phaseTasks.length > 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold flex-shrink-0">✓ Complete</span>
                  )}
                </div>
                {isCollapsed ? <ChevronRight size={14} className="text-text-muted flex-shrink-0" />
                             : <ChevronDown  size={14} className="text-text-muted flex-shrink-0" />}
              </button>

              {/* Task rows */}
              {!isCollapsed && (
                <div className="divide-y divide-border">
                  {phaseTasks.map(task => {
                    const overdue = isOverdue(task.due_date, task.done);
                    return (
                      <div key={task.id}
                        className="flex items-start gap-3 px-5 py-3 group hover:bg-surface-2/40 transition-colors">
                        <button
                          onClick={() => toggleTask(task)}
                          disabled={!!saving[task.id]}
                          className="flex-shrink-0 mt-0.5 transition-all disabled:opacity-40"
                        >
                          {saving[task.id]
                            ? <Loader2 size={16} className="animate-spin text-text-muted" />
                            : task.done
                              ? <CheckCircle2 size={16} style={{ color: ph.color }} />
                              : <Circle size={16} className={overdue ? "text-red-400" : "text-text-muted group-hover:text-text-primary transition-colors"} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 flex-wrap">
                            <p className={`text-sm transition-colors flex-1 ${task.done ? "line-through text-text-muted" : overdue ? "text-red-300" : "text-text-primary"}`}>
                              {task.text}
                            </p>
                            {task.source === "roster_ai" && !task.done && (
                              <span className="flex-shrink-0 mt-0.5"><RosterAIBadge size="sm" /></span>
                            )}
                          </div>
                          {task.due_date && (
                            <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${overdue && !task.done ? "text-red-400" : "text-text-muted"}`}>
                              <Clock size={9} />
                              {overdue && !task.done ? "Overdue · " : ""}{formatDate(task.due_date)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-red-400 transition-all flex-shrink-0">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Inline add */}
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-surface-2/20">
                    <Plus size={13} className="text-text-muted flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Add a task…"
                      value={newText[ph.id] ?? ""}
                      onChange={e => setNewText(p => ({ ...p, [ph.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") addTask(ph.id); }}
                      className="flex-1 bg-transparent text-xs text-text-muted outline-none placeholder:text-text-muted/40 focus:text-text-primary"
                    />
                    {(newText[ph.id] ?? "").trim() && (
                      <button onClick={() => addTask(ph.id)}
                        className="text-[10px] font-semibold text-brand hover:text-brand-light px-2 py-0.5 rounded bg-brand/10 transition-colors">
                        Add
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Re-generate / hint bar when tasks exist */}
      {tasks.length > 0 && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
          <p className="text-xs text-text-muted">Tasks save automatically · Tick each item as you go.</p>
          {release.release_date && (
            <button onClick={generateWithAI} disabled={aiGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              style={{ color: "#C9A84C", backgroundColor: "rgba(201,168,76,0.10)" }}>
              {aiGenerating ? <Loader2 size={11} className="animate-spin" /> : <RosterAIBadge size="sm" />}
              {aiGenerating ? "Generating…" : "Re-generate with AI"}
            </button>
          )}
          {aiError && <p className="text-xs text-red-400 ml-3">{aiError}</p>}
        </div>
      )}
    </div>
  );
}
