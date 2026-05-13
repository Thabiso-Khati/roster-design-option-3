"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Radio, CheckCircle2, XCircle, Clock, Send, Printer } from "lucide-react";
import { storageSave, storageLoad } from "@/lib/storage";
import { PrintDocument } from "@/components/tools/print-document";
import type { PrintSection } from "@/components/tools/print-document";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";
const STORAGE_KEY = "roster_dsp_pitching";

const DSPS = ["Spotify","Apple Music","Audiomack","Boomplay","YouTube Music","Deezer","Amazon Music","TikTok Music"];
const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "#F59E0B", icon: Clock },
  submitted: { label: "Submitted", color: "#8B5CF6", icon: Send },
  accepted:  { label: "Accepted",  color: "#10B981", icon: CheckCircle2 },
  declined:  { label: "Declined",  color: "#EF4444", icon: XCircle },
} as const;
type Status = keyof typeof STATUS_CONFIG;

interface Submission {
  id: string; dsp: string; trackTitle: string; releaseDate: string;
  genre: string; playlist: string; pitchDate: string; status: Status; notes: string;
}

const EMPTY: Omit<Submission,"id"> = {
  dsp: "Spotify", trackTitle: "", releaseDate: "", genre: "", playlist: "", pitchDate: new Date().toISOString().split("T")[0], status: "pending", notes: ""
};

const AFRICAN_PLAYLISTS: Record<string, string[]> = {
  "Spotify": ["New Music Friday Africa","Afrobeats Hits","Amapiano","African Heat","SA Hip Hop","Hot Hits South Africa","Afro House","Soulful House South Africa"],
  "Apple Music": ["Africa Now","Afrobeats Essential","Amapiano Hits","New in Africa"],
  "Audiomack": ["Made in Africa","Trending in South Africa","New Wave","Fresh Picks"],
  "Boomplay": ["Top 100 Africa","Afrobeats Banger","Naija Hits","SA Top 40","New Music Friday Africa"],
  "YouTube Music": ["African Hits","Amapiano Mix","New Music Friday"],
  "Deezer": ["Afrobeats","African Tracks","SA Music"],
  "Amazon Music": ["African Hits"],
  "TikTok Music": ["Viral Hits Africa","Trending SA"],
};

export default function DSPPitchingTool() {
  const handleExportPDF = () => { window.print(); };
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeDSP, setActiveDSP] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({...EMPTY});
  const [saved, setSaved] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    try { const d = storageLoad<Submission[]>("roster_dsp_pitching"); if (d) setSubmissions(d); } catch {}
  }, []);

  const save = (data: Submission[]) => {
    storageSave("roster_dsp_pitching", data);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const addSubmission = () => {
    if (!form.trackTitle || !form.dsp) return;
    const newSubs = [...submissions, { ...form, id: Date.now().toString() }];
    setSubmissions(newSubs); save(newSubs);
    setForm({...EMPTY}); setShowForm(false);
  };

  const updateStatus = (id: string, status: Status) => {
    const next = submissions.map(s => s.id === id ? {...s, status} : s);
    setSubmissions(next); save(next);
  };

  const remove = (id: string) => {
    const next = submissions.filter(s => s.id !== id);
    setSubmissions(next); save(next);
  };

  const filtered = activeDSP === "All" ? submissions : submissions.filter(s => s.dsp === activeDSP);

  const stats = DSPS.reduce((acc, dsp) => {
    const dspsubs = submissions.filter(s => s.dsp === dsp);
    acc[dsp] = {
      total: dspsubs.length,
      accepted: dspsubs.filter(s => s.status === "accepted").length,
      pending: dspsubs.filter(s => s.status === "pending" || s.status === "submitted").length,
      declined: dspsubs.filter(s => s.status === "declined").length,
    };
    return acc;
  }, {} as Record<string, { total:number; accepted:number; pending:number; declined:number }>);

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio size={18} className="text-brand"/>
            <h1 className="text-xl font-black text-text-primary">DSP Pitching Tracker</h1>
          </div>
          <p className="text-sm text-text-muted">Track every pitch to Spotify, Apple Music, Audiomack, Boomplay and more.</p>
        </div>
        <button onClick={() => setShowPrint(true)} data-no-print
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-brand hover:bg-brand/10 transition-all">
          <Printer size={13}/>Export PDF
        </button>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand/20 text-brand hover:bg-brand/30 transition-all flex-shrink-0">
          <Plus size={13}/>{showForm ? "Cancel" : "Add Pitch"}
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(["submitted","accepted","pending","declined"] as Status[]).map(st => {
          const cfg = STATUS_CONFIG[st];
          const count = submissions.filter(s => s.status === st).length;
          return (
            <div key={st} className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-black mb-0.5" style={{ color: cfg.color }}>{count}</p>
              <p className="text-xs text-text-muted font-semibold">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Add pitch form */}
      {showForm && (
        <div className="glass-card rounded-xl p-5 mb-6 border-brand/20">
          <p className="text-xs font-black uppercase tracking-widest text-brand mb-4">New Pitch Submission</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              { label: "Track Title *", key: "trackTitle", type: "text", placeholder: "e.g. Thandeka" },
              { label: "Pitch Date", key: "pitchDate", type: "date", placeholder: "" },
              { label: "Release Date", key: "releaseDate", type: "date", placeholder: "" },
              { label: "Genre", key: "genre", type: "text", placeholder: "e.g. Amapiano" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-text-muted mb-1">{f.label}</label>
                <input type={f.type} value={(form as Record<string,string>)[f.key]} placeholder={f.placeholder}
                  onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand transition-colors"/>
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">DSP *</label>
              <select value={form.dsp} onChange={e => setForm(p => ({...p, dsp: e.target.value, playlist: ""}))}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand transition-colors">
                {DSPS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Target Playlist</label>
              <select value={form.playlist} onChange={e => setForm(p => ({...p, playlist: e.target.value}))}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand transition-colors">
                <option value="">Select playlist...</option>
                {(AFRICAN_PLAYLISTS[form.dsp] ?? []).map(pl => <option key={pl} value={pl}>{pl}</option>)}
                <option value="__custom__">Other / Independent curator</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-muted mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))}
              placeholder="Any context, curator details, follow-up required..."
              rows={2} className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand transition-colors resize-none"/>
          </div>
          <button onClick={addSubmission}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-brand text-bg hover:opacity-90 transition-all">
            <Save size={14}/>Log This Pitch
          </button>
        </div>
      )}

      {/* DSP filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {["All", ...DSPS].map(d => (
          <button key={d} onClick={() => setActiveDSP(d)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeDSP === d ? "bg-brand text-bg" : "bg-surface-2 text-text-muted hover:text-text-primary"}`}>
            {d} {d !== "All" && stats[d]?.total > 0 && <span className="ml-1 opacity-60">{stats[d].total}</span>}
          </button>
        ))}
      </div>

      {/* Submissions list */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-bold text-text-primary mb-1">No pitches logged yet</p>
          <p className="text-sm text-text-muted">Add your first pitch submission to start tracking.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(sub => {
            const cfg = STATUS_CONFIG[sub.status];
            const Icon = cfg.icon;
            return (
              <div key={sub.id} className="glass-card rounded-xl p-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cfg.color}15` }}>
                  <Icon size={16} style={{ color: cfg.color }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-bold text-text-primary">{sub.trackTitle}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}>{cfg.label}</span>
                    <span className="text-xs text-text-muted">{sub.dsp}</span>
                  </div>
                  {sub.playlist && <p className="text-xs text-text-muted mb-0.5">→ {sub.playlist}</p>}
                  {sub.notes && <p className="text-xs text-text-muted italic">{sub.notes}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    {sub.releaseDate && <span className="text-[10px] text-text-muted">Release: {sub.releaseDate}</span>}
                    {sub.pitchDate && <span className="text-[10px] text-text-muted">Pitched: {sub.pitchDate}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <select value={sub.status} onChange={e => updateStatus(sub.id, e.target.value as Status)}
                    className="text-xs bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-text-primary outline-none focus:border-brand cursor-pointer">
                    {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <button onClick={() => remove(sub.id)} className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-all">
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DSP success rate breakdown */}
      {submissions.length > 0 && (
        <div className="glass-card rounded-xl p-5 mt-6">
          <p className="text-xs font-black uppercase tracking-widest text-brand mb-4">Success Rate by DSP</p>
          <div className="space-y-2">
            {DSPS.filter(d => stats[d]?.total > 0).map(dsp => {
              const s = stats[dsp];
              const rate = s.total > 0 ? Math.round((s.accepted / s.total) * 100) : 0;
              return (
                <div key={dsp} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-text-primary w-28 flex-shrink-0">{dsp}</span>
                  <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${rate}%` }}/>
                  </div>
                  <span className="text-xs text-text-muted w-16 text-right">{s.accepted}/{s.total} accepted</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <p className="text-xs text-text-muted mt-4 text-center">All pitch data saves automatically to this device for 90 days.</p>

      {showPrint && (() => {
        const sections: PrintSection[] = [
          { heading: "Pitch Summary", stats: DSPS.map(d => ({ label: d, value: `${submissions.filter(s=>s.dsp===d&&s.status==="accepted").length}/${submissions.filter(s=>s.dsp===d).length} accepted` })).filter(s => !s.value.startsWith("0/0")) },
          { heading: "All Submissions", color: "#EC4899",
            tables: [{ headers: ["Track","DSP","Playlist","Pitched","Release Date","Status","Notes"],
              rows: submissions.map(s => [s.trackTitle, s.dsp, s.playlist, s.pitchDate, s.releaseDate, s.status.toUpperCase(), s.notes]) }] },
        ];
        return <PrintDocument toolName="DSP Pitching Tracker" subtitle={`${submissions.length} total submissions across ${DSPS.filter(d=>submissions.some(s=>s.dsp===d)).length} platforms`} sections={sections} onClose={() => setShowPrint(false)}/>;
      })()}
    </div>
  );
}
