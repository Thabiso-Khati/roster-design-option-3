"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Calendar, CheckCircle2, Circle, ChevronDown, ChevronRight, Printer } from "lucide-react";
import { storageSave, storageLoad } from "@/lib/storage";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { PrintDocument } from "@/components/tools/print-document";
import type { PrintSection } from "@/components/tools/print-document";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";
const STORAGE_KEY = "roster_release_plan";

const PHASES = [
  { id: "pre_8w", label: "8 Weeks Before", color: "#8B5CF6" },
  { id: "pre_4w", label: "4 Weeks Before", color: "#EC4899" },
  { id: "pre_2w", label: "2 Weeks Before", color: "#F59E0B" },
  { id: "pre_1w", label: "1 Week Before", color: "#EF4444" },
  { id: "release", label: "Release Day", color: "#10B981" },
  { id: "post_1w", label: "Week After", color: "#06B6D4" },
  { id: "post_1m", label: "Month After", color: "#C9A84C" },
];

const DEFAULT_TASKS: Record<string, string[]> = {
  pre_8w: ["Finalise track / EP, mixing and mastering complete","Register your work with your collecting societies (PRO / mechanical / neighbouring rights)","Obtain ISRC and UPC codes from distributor","Begin album artwork brief with designer","Draft artist bio and press release"],
  pre_4w: ["Submit to distributor (DistroKid / Amuse / TuneCore / FUGA)","Pitch to DSP editorial, Spotify (7 days min), Apple Music, Audiomack, Boomplay","Launch pre-save campaign","Book radio campaign (community, college, commercial)","Brief social team on rollout content plan"],
  pre_2w: ["Announce release date across all social platforms","Upload music video to YouTube (set as premiere)","Send press release to media contacts","Launch paid social campaign (Meta + TikTok Ads)","Confirm playlist pitches, follow up with curators"],
  pre_1w: ["Activate countdown content on TikTok, IG Stories","Send WhatsApp broadcast to fan list","Brief photographers / videographers for release day","Confirm streaming link is live and shareable","Pin release content across all platforms"],
  release: ["Post the release, TikTok, Instagram, YouTube, Facebook, X","Go live on Instagram or TikTok, celebrate with fans","Post YouTube video / music video premiere","Send email newsletter to mailing list","Send WhatsApp blast, release day message"],
  post_1w: ["Review first-week streams and social performance","Submit to remaining playlist curators (second round)","Post behind-the-scenes release day content","Thank media, curators and supporters publicly","Boost top-performing organic content with paid ads"],
  post_1m: ["Pull a full analytics report, streams, saves, growth, comments","Evaluate advertising ROI, which channels performed?","Plan next release or content moment","Collect and repurpose fan reactions, UGC content","Submit for awards consideration (SAMA, Channel O, etc.) if eligible"],
};

const BUDGET_CATEGORIES = [
  "Recording (session fees)","Studio hire","Mixing","Mastering",
  "Music video / visuals","Photography","Graphic design / artwork",
  "Distribution fee","Paid advertising (Meta, TikTok, Google)",
  "Radio promotion / plugging","PR / publicist","Playlist pitching service",
  "Merchandise","Other",
];

interface Task { id: string; phase: string; text: string; done: boolean; }
interface BudgetRow { category: string; budget: string; actual: string; notes: string; }
interface ReleaseDetails { title:string; artist:string; type:string; streetDate:string; distributor:string; label:string; }

function initTasks(): Task[] {
  return Object.entries(DEFAULT_TASKS).flatMap(([phase, tasks]) =>
    tasks.map(text => ({ id: `${phase}_${Math.random().toString(36).slice(2)}`, phase, text, done: false }))
  );
}
function initBudget(): BudgetRow[] {
  return BUDGET_CATEGORIES.map(c => ({ category: c, budget: "", actual: "", notes: "" }));
}

type Tab = "overview" | "tasks" | "budget";

export default function SingleReleasePlan() {
  const handleExportPDF = () => { window.print(); };
  const { sym, locale, currency, country } = useLocale();
  const res = getCountryResources(country);
  const proAbbr = res.performanceRights.abbr;
  const [tab, setTab] = useState<Tab>("overview");
  const [details, setDetails] = useState<ReleaseDetails>({ title:"", artist:"", type:"Single", streetDate:"", distributor:"", label:"" });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budget, setBudget] = useState<BudgetRow[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string,boolean>>({});
  const [newTaskPhase, setNewTaskPhase] = useState("pre_8w");
  const [newTaskText, setNewTaskText] = useState("");
  const [saved, setSaved] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    type Saved = { details?: ReleaseDetails; tasks?: Task[]; budget?: BudgetRow[] };
    try {
      const d = storageLoad<Saved>(STORAGE_KEY);
      if (d) {
        if (d.details) setDetails(d.details);
        setTasks(d.tasks ?? initTasks());
        setBudget(d.budget ?? initBudget());
        return;
      }
    } catch {}
    setTasks(initTasks());
    setBudget(initBudget());
    fetch(`/api/tools/save?slug=single-release-plan`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as Saved;
        if (d.details) setDetails(d.details);
        if (d.tasks) setTasks(d.tasks);
        if (d.budget) setBudget(d.budget);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    storageSave("roster_release_plan", { details, tasks, budget });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const toggleTask = (id: string) => setTasks(prev => prev.map(t => t.id === id ? {...t, done: !t.done} : t));
  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));
  const addTask = () => {
    if (!newTaskText.trim()) return;
    setTasks(prev => [...prev, { id: Date.now().toString(), phase: newTaskPhase, text: newTaskText, done: false }]);
    setNewTaskText("");
  };

  const totalBudget = budget.reduce((a,r) => a + (parseFloat(r.budget)||0), 0);
  const totalActual = budget.reduce((a,r) => a + (parseFloat(r.actual)||0), 0);
  const completedTasks = tasks.filter(t => t.done).length;

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Release Overview" },
    { id: "tasks", label: `Tasks (${completedTasks}/${tasks.length})` },
    { id: "budget", label: `Release Budget (${currency})` },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={18} className="text-brand"/>
            <h1 className="text-xl font-black text-text-primary">Single Release Planner</h1>
          </div>
          <p className="text-sm text-text-muted">Map every task from recording to release day. {country} edition.</p>
        </div>
        <ExportButton onPDF={handleExportPDF} />
        <SaveButton toolSlug="single-release-plan" storageKey={STORAGE_KEY} title={`Single Release Plan — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
      </div>

      {/* Progress bar */}
      <div className="glass-card rounded-xl p-4 mb-5 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-text-muted">Release Progress</p>
            <p className="text-xs font-bold text-brand">{completedTasks}/{tasks.length} tasks complete</p>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${tasks.length ? (completedTasks/tasks.length)*100 : 0}%` }}/>
          </div>
        </div>
        {details.streetDate && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-text-muted">Street Date</p>
            <p className="text-sm font-bold text-text-primary">{details.streetDate}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px ${tab===t.id ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="glass-card rounded-xl p-6">
          <p className="text-xs font-black uppercase tracking-widest text-brand mb-5">Release Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label:"Release Title", key:"title", placeholder:"e.g. Thandeka" },
              { label:"Artist Name", key:"artist", placeholder:"e.g. IMARA" },
              { label:"Street Date", key:"streetDate", type:"date" },
              { label:"Distribution Partner", key:"distributor", placeholder:"e.g. DistroKid, Amuse, TuneCore" },
              { label:"Record Label / Imprint", key:"label", placeholder:"Independent / Label Name" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-text-muted mb-1">{f.label}</label>
                <input type={f.type ?? "text"} value={(details as unknown as Record<string,string>)[f.key]} placeholder={f.placeholder}
                  onChange={e => setDetails(p => ({...p, [f.key]: e.target.value}))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand transition-colors"/>
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Release Type</label>
              <select value={details.type} onChange={e => setDetails(p => ({...p, type: e.target.value}))}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand transition-colors">
                {["Single","EP","Album","Remix Package","Compilation"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tasks tab */}
      {tab === "tasks" && (
        <div className="space-y-4">
          {PHASES.map(phase => {
            const phaseTasks = tasks.filter(t => t.phase === phase.id);
            const done = phaseTasks.filter(t => t.done).length;
            const isCollapsed = collapsed[phase.id];
            return (
              <div key={phase.id} className="glass-card rounded-xl overflow-hidden">
                <button onClick={() => setCollapsed(p => ({...p, [phase.id]: !p[phase.id]}))}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 transition-colors"
                  style={{ borderLeft: `3px solid ${phase.color}` }}>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-sm font-bold text-text-primary">{phase.label}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: phase.color, backgroundColor: `${phase.color}15` }}>{done}/{phaseTasks.length}</span>
                    {done === phaseTasks.length && phaseTasks.length > 0 && <span className="text-xs text-emerald-400 font-bold">✓ Complete</span>}
                  </div>
                  {isCollapsed ? <ChevronRight size={14} className="text-text-muted"/> : <ChevronDown size={14} className="text-text-muted"/>}
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-border">
                    {phaseTasks.map(task => (
                      <div key={task.id} className="flex items-start gap-3 px-5 py-3 group hover:bg-surface-2/50 transition-colors">
                        <button onClick={() => toggleTask(task.id)} className="flex-shrink-0 mt-0.5 transition-all">
                          {task.done
                            ? <CheckCircle2 size={16} style={{ color: phase.color }}/>
                            : <Circle size={16} className="text-text-muted group-hover:text-text-primary transition-colors"/>}
                        </button>
                        <p className={`flex-1 text-sm transition-colors ${task.done ? "line-through text-text-muted" : "text-text-primary"}`}>{task.text}</p>
                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-error transition-all">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    ))}
                    {/* Add task inline */}
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-surface-2/30">
                      <Plus size={13} className="text-text-muted flex-shrink-0"/>
                      <input type="text" placeholder="Add a task..." value={newTaskPhase === phase.id ? newTaskText : ""}
                        onFocus={() => setNewTaskPhase(phase.id)}
                        onChange={e => { setNewTaskPhase(phase.id); setNewTaskText(e.target.value); }}
                        onKeyDown={e => { if (e.key === "Enter" && newTaskPhase === phase.id) addTask(); }}
                        className="flex-1 bg-transparent text-xs text-text-muted outline-none placeholder:text-text-muted/50 focus:text-text-primary"/>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Budget tab */}
      {tab === "budget" && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {[
              { label:`Total Budget (${currency})`, value:`${sym} ${totalBudget.toLocaleString(locale)}`, color:"#8B5CF6" },
              { label:`Total Spent (${currency})`, value:`${sym} ${totalActual.toLocaleString(locale)}`, color: totalActual > totalBudget ? "#EF4444" : "#10B981" },
              { label:"Variance", value:`${sym} ${(totalBudget-totalActual).toLocaleString(locale)}`, color: totalActual > totalBudget ? "#EF4444" : "#C9A84C" },
            ].map(s => (
              <div key={s.label} className="glass-card rounded-xl p-4 text-center">
                <p className="text-lg font-black mb-0.5" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_2fr] border-b border-border bg-surface-2 text-[10px] font-bold uppercase text-text-muted">
              {["Category",`Budget (${currency})`,`Actual (${currency})`,"Notes"].map(h => <div key={h} className="px-4 py-2.5">{h}</div>)}
            </div>
            {budget.map((row, i) => (
              <div key={row.category} className={`grid grid-cols-[2fr_1fr_1fr_2fr] border-b last:border-0 border-border ${i%2===0?"":"bg-surface-2/20"}`}>
                <div className="px-4 py-2.5 flex items-center">
                  <span className="text-xs text-text-primary font-medium">{row.category}</span>
                </div>
                {(["budget","actual","notes"] as const).map(field => (
                  <div key={field} className="px-2 py-1.5">
                    <input type="text" value={row[field]} placeholder={field === "notes" ? ", " : "0"}
                      onChange={e => setBudget(prev => prev.map((r,ri) => ri===i ? {...r,[field]:e.target.value} : r))}
                      className="w-full bg-transparent border border-transparent hover:border-brand/30 focus:border-brand focus:bg-surface-2 rounded px-2 py-1 text-xs text-text-primary outline-none transition-all placeholder:text-text-muted/40"/>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-text-muted mt-4 text-center">Press Save to keep your data between sessions (stored 90 days).</p>

      {showPrint && (() => {
        const sections: PrintSection[] = [
          { heading: "Release Details", stats: [
              { label: "Title",        value: details.title       || ", " },
              { label: "Artist",       value: details.artist      || ", " },
              { label: "Type",         value: details.type        || ", " },
              { label: "Street Date",  value: details.streetDate  || ", " },
              { label: "Distributor",  value: details.distributor || ", " },
              { label: "Label",        value: details.label       || ", " },
            ] },
          { heading: `Task Progress, ${completedTasks} of ${tasks.length} complete`, color: "#8B5CF6",
            tables: PHASES.map(ph => ({
              title: ph.label,
              headers: ["Task","Status"],
              rows: tasks.filter(t=>t.phase===ph.id).map(t => [t.text, t.done ? "✓ Done" : "○ To do"]),
            })).filter(t => t.rows.length > 0) },
          { heading: `Release Budget (${currency})`, color: "#10B981",
            stats: [
              { label: "Total Budget", value: `${sym} ${totalBudget.toLocaleString(locale)}` },
              { label: "Total Spent",  value: `${sym} ${totalActual.toLocaleString(locale)}` },
              { label: "Variance",     value: `${sym} ${(totalBudget-totalActual).toLocaleString(locale)}` },
            ],
            tables: [{ headers: ["Category",`Budget (${currency})`,`Actual (${currency})`,"Notes"],
              rows: budget.filter(r=>r.budget||r.actual||r.notes).map(r=>[r.category,r.budget?`${sym} ${r.budget}`:", ",r.actual?`${sym} ${r.actual}`:", ",r.notes||", "]) }] },
        ];
        return <PrintDocument toolName="Single Release Plan" subtitle={details.title ? `${details.title} · ${details.artist}` : "Release Plan"} sections={sections} onClose={() => setShowPrint(false)}/>;
      })()}
    </div>
  );
}
