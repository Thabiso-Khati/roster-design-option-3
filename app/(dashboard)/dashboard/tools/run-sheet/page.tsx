"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, RotateCcw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_run_sheet_v1";
const COLOR = "#8B5CF6";

type CueType = "load-in" | "soundcheck" | "doors" | "support" | "change" | "headline" | "interval" | "load-out" | "admin" | "other";
type ViewTab = "simple" | "detailed";

interface SimpleCue {
  id: string;
  time: string;
  duration: string;
  type: CueType;
  activity: string;
  owner: string;
  done: boolean;
  notes: string;
}

interface DetailedCue {
  id: string;
  time: string;
  activity: string;
  audience: string;
  technical: string;
  artist: string;
  crew: string;
  owner: string;
  done: boolean;
}

const CUE_TYPES: { id: CueType; label: string; color: string }[] = [
  { id: "load-in", label: "Load-in", color: "#F59E0B" },
  { id: "soundcheck", label: "Soundcheck", color: "#06B6D4" },
  { id: "doors", label: "Doors", color: "#10B981" },
  { id: "support", label: "Support Act", color: "#8B5CF6" },
  { id: "change", label: "Change / Break", color: "#6B7280" },
  { id: "headline", label: "Headline Set", color: "#EF4444" },
  { id: "interval", label: "Interval", color: "#C9A84C" },
  { id: "load-out", label: "Load-out", color: "#F59E0B" },
  { id: "admin", label: "Admin / Settlement", color: "#10B981" },
  { id: "other", label: "Other", color: "#6B7280" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const defaultSimple = (): SimpleCue[] => [
  { id: uid(), time: "14:00", duration: "60", type: "load-in", activity: "Load-in begins", owner: "Production", done: false, notes: "" },
  { id: uid(), time: "15:30", duration: "30", type: "soundcheck", activity: "Support soundcheck", owner: "Sound Engineer", done: false, notes: "" },
  { id: uid(), time: "16:30", duration: "60", type: "soundcheck", activity: "Headline soundcheck", owner: "Sound Engineer", done: false, notes: "" },
  { id: uid(), time: "18:00", duration: "0", type: "admin", activity: "Crew dinner / break", owner: "Tour Manager", done: false, notes: "" },
  { id: uid(), time: "19:00", duration: "0", type: "doors", activity: "Doors open", owner: "Venue", done: false, notes: "" },
  { id: uid(), time: "20:00", duration: "30", type: "support", activity: "Support set", owner: "Stage Manager", done: false, notes: "" },
  { id: uid(), time: "20:45", duration: "15", type: "change", activity: "Stage change", owner: "Production", done: false, notes: "" },
  { id: uid(), time: "21:00", duration: "75", type: "headline", activity: "Headline set", owner: "Stage Manager", done: false, notes: "" },
  { id: uid(), time: "22:30", duration: "30", type: "admin", activity: "Settlement with promoter", owner: "Tour Manager", done: false, notes: "" },
  { id: uid(), time: "23:00", duration: "60", type: "load-out", activity: "Load-out begins", owner: "Production", done: false, notes: "" },
];

const defaultDetailed = (): DetailedCue[] => [
  { id: uid(), time: "19:00", activity: "Doors open", audience: "Doors open, ushers active", technical: "House music at 70%", artist: "Backstage", crew: "All positions", owner: "Stage Manager", done: false },
  { id: uid(), time: "20:00", activity: "Support set begins", audience: "Announce support", technical: "Support mix active", artist: "Watching from side", crew: "Stage clear", owner: "Stage Manager", done: false },
  { id: uid(), time: "20:30", activity: "Support set ends", audience: "Hold for changeover", technical: "House music back", artist: "Headline prep", crew: "Quick change", owner: "Production", done: false },
  { id: uid(), time: "21:00", activity: "Headline set begins", audience: "Intro announcement", technical: "Show mix active, lights go", artist: "Walk on stage", crew: "All clear", owner: "Stage Manager", done: false },
  { id: uid(), time: "22:15", activity: "Encore", audience: "Encore reaction", technical: "Dim lights", artist: "Off stage", crew: "Hold positions", owner: "Stage Manager", done: false },
];

export default function RunSheetPage() {
  const handleExportPDF = () => { window.print(); };
  const [tab, setTab] = useState<ViewTab>("simple");
  const [simple, setSimple] = useState<SimpleCue[]>(defaultSimple());
  const [detailed, setDetailed] = useState<DetailedCue[]>(defaultDetailed());
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    type Saved = { simple?: SimpleCue[]; detailed?: DetailedCue[]; eventName?: string; venue?: string; date?: string };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d: Saved = JSON.parse(raw);
        if (d.simple) setSimple(d.simple);
        if (d.detailed) setDetailed(d.detailed);
        if (d.eventName) setEventName(d.eventName);
        if (d.venue) setVenue(d.venue);
        if (d.date) setDate(d.date);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=run-sheet`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as Saved;
        if (d.simple) setSimple(d.simple);
        if (d.detailed) setDetailed(d.detailed);
        if (d.eventName) setEventName(d.eventName);
        if (d.venue) setVenue(d.venue);
        if (d.date) setDate(d.date);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback((s: SimpleCue[], d: DetailedCue[], e: string, v: string, dt: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ simple: s, detailed: d, eventName: e, venue: v, date: dt }));
  }, []);

  const updateSimple = (id: string, key: keyof SimpleCue, val: string | boolean) => {
    setSimple(prev => {
      const next = prev.map(c => c.id === id ? { ...c, [key]: val } : c);
      save(next, detailed, eventName, venue, date);
      return next;
    });
  };

  const updateDetailed = (id: string, key: keyof DetailedCue, val: string | boolean) => {
    setDetailed(prev => {
      const next = prev.map(c => c.id === id ? { ...c, [key]: val } : c);
      save(simple, next, eventName, venue, date);
      return next;
    });
  };

  const addSimple = () => {
    setSimple(prev => {
      const next = [...prev, { id: uid(), time: "", duration: "", type: "other" as CueType, activity: "", owner: "", done: false, notes: "" }];
      save(next, detailed, eventName, venue, date);
      return next;
    });
  };

  const addDetailed = () => {
    setDetailed(prev => {
      const next = [...prev, { id: uid(), time: "", activity: "", audience: "", technical: "", artist: "", crew: "", owner: "", done: false }];
      save(simple, next, eventName, venue, date);
      return next;
    });
  };

  const inputCls = "bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5";
  const completedCount = tab === "simple" ? simple.filter(c => c.done).length : detailed.filter(c => c.done).length;
  const totalCount = tab === "simple" ? simple.length : detailed.length;

  return (
    <div className="animate-fade-in max-w-5xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="run-sheet" storageKey={STORAGE_KEY} title={`Run Sheet — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Run Sheet</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Live Tool · Auto-Saved · Simple & Detailed Views</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Run Sheet</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Minute-by-minute show timeline from load-in to load-out.</p>
        <p className="text-sm text-text-muted">Every cue, every crew member's role, every stage transition tracked in one place. Simple view for club shows; Detailed view for headline productions. Distribute at least 24 hours before doors.</p>
      </div>

      {/* Event details */}
      <div className="glass-card rounded-xl p-5 mb-5" style={{ borderColor: `${COLOR}20` }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Event / Show Name", val: eventName, set: (v: string) => { setEventName(v); save(simple, detailed, v, venue, date); } },
            { label: "Venue", val: venue, set: (v: string) => { setVenue(v); save(simple, detailed, eventName, v, date); } },
            { label: "Date", val: date, set: (v: string) => { setDate(v); save(simple, detailed, eventName, venue, v); } },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1">{f.label}</label>
              <input type="text" value={f.val} onChange={e => f.set(e.target.value)}
                placeholder={f.label}
                className="bg-transparent border-b border-border focus:border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full py-1"/>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-5 border-b border-border">
        {([["simple", "Simple View"], ["detailed", "Detailed View"]] as [ViewTab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${tab === id ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`, backgroundColor: COLOR }}/>
        </div>
        <span className="text-xs font-black" style={{ color: COLOR }}>{completedCount} / {totalCount} cues done</span>
      </div>

      {/* Simple View */}
      {tab === "simple" && (
        <div className="glass-card rounded-xl overflow-hidden mb-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="px-3 py-2.5 text-center font-black uppercase tracking-wider text-text-muted text-[10px] w-8">✓</th>
                  {["Time", "Duration (min)", "Type", "Activity / Cue", "Owner / Responsible", "Notes", ""].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-text-muted text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {simple.map((cue, i) => {
                  const typeInfo = CUE_TYPES.find(t => t.id === cue.type) || CUE_TYPES[9];
                  return (
                    <tr key={cue.id} className={`border-b border-border last:border-0 group ${cue.done ? "opacity-50" : ""}`}
                      style={{ borderLeft: `3px solid ${typeInfo.color}` }}>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={cue.done} onChange={e => updateSimple(cue.id, "done", e.target.checked)}
                          className="cursor-pointer accent-brand"/>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={cue.time} onChange={e => updateSimple(cue.id, "time", e.target.value)}
                          placeholder="00:00" className={inputCls} style={{ width: 50 }}/>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={cue.duration} onChange={e => updateSimple(cue.id, "duration", e.target.value)}
                          placeholder="0" min="0" className={inputCls} style={{ width: 55 }}/>
                      </td>
                      <td className="px-3 py-2">
                        <select value={cue.type} onChange={e => updateSimple(cue.id, "type", e.target.value)}
                          className="bg-transparent text-xs focus:outline-none py-0.5 cursor-pointer"
                          style={{ color: typeInfo.color }}>
                          {CUE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={cue.activity} onChange={e => updateSimple(cue.id, "activity", e.target.value)}
                          placeholder="Cue description..." className={inputCls} style={{ minWidth: 160 }}/>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={cue.owner} onChange={e => updateSimple(cue.id, "owner", e.target.value)}
                          placeholder="Who's responsible" className={inputCls} style={{ minWidth: 110 }}/>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={cue.notes} onChange={e => updateSimple(cue.id, "notes", e.target.value)}
                          placeholder="Notes" className={inputCls} style={{ minWidth: 100 }}/>
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => setSimple(prev => { const n = prev.filter(c => c.id !== cue.id); save(n, detailed, eventName, venue, date); return n; })}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-red-400 transition-all">
                          <Trash2 size={12}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <button onClick={addSimple} className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: COLOR }}>
              <Plus size={13}/>Add cue
            </button>
          </div>
        </div>
      )}

      {/* Detailed View */}
      {tab === "detailed" && (
        <div className="glass-card rounded-xl overflow-hidden mb-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="px-3 py-2.5 text-center font-black uppercase tracking-wider text-text-muted text-[10px] w-8">✓</th>
                  {["Time", "Cue / Activity", "Audience", "Technical", "Artist", "Crew", "Owner", ""].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-text-muted text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailed.map((cue, i) => (
                  <tr key={cue.id} className={`border-b border-border last:border-0 group ${cue.done ? "opacity-50" : ""} ${i % 2 === 1 ? "bg-surface-2/50" : ""}`}>
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" checked={cue.done} onChange={e => updateDetailed(cue.id, "done", e.target.checked)}
                        className="cursor-pointer accent-brand"/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={cue.time} onChange={e => updateDetailed(cue.id, "time", e.target.value)}
                        placeholder="00:00" className={inputCls} style={{ width: 50 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={cue.activity} onChange={e => updateDetailed(cue.id, "activity", e.target.value)}
                        placeholder="Cue..." className={inputCls} style={{ minWidth: 130 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={cue.audience} onChange={e => updateDetailed(cue.id, "audience", e.target.value)}
                        placeholder="Audience view..." className={inputCls} style={{ minWidth: 110 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={cue.technical} onChange={e => updateDetailed(cue.id, "technical", e.target.value)}
                        placeholder="Technical action..." className={inputCls} style={{ minWidth: 120 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={cue.artist} onChange={e => updateDetailed(cue.id, "artist", e.target.value)}
                        placeholder="Artist action..." className={inputCls} style={{ minWidth: 110 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={cue.crew} onChange={e => updateDetailed(cue.id, "crew", e.target.value)}
                        placeholder="Crew action..." className={inputCls} style={{ minWidth: 110 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={cue.owner} onChange={e => updateDetailed(cue.id, "owner", e.target.value)}
                        placeholder="Owner" className={inputCls} style={{ width: 80 }}/>
                    </td>
                    <td className="px-2 py-2">
                      <button onClick={() => setDetailed(prev => { const n = prev.filter(c => c.id !== cue.id); save(simple, n, eventName, venue, date); return n; })}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-red-400 transition-all">
                        <Trash2 size={12}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <button onClick={addDetailed} className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: COLOR }}>
              <Plus size={13}/>Add cue
            </button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Distribute via WhatsApp at least 24 hours before doors. Print 2 hard copies, load shedding is real.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <button onClick={() => { if (confirm("Reset run sheet? This cannot be undone.")) { setSimple(defaultSimple()); setDetailed(defaultDetailed()); setEventName(""); setVenue(""); setDate(""); localStorage.removeItem(STORAGE_KEY); } }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset
        </button>
      </div>
    </div>
  );
}
