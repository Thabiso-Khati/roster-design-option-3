"use client";
import { Plus, Trash2, Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#10B981";
const STORAGE_KEY = "roster_vocal_comp_v1";

interface Phrase {
  id: string;
  bar: string;
  lyric: string;
  takeChosen: string;
  alternates: string;
  fxAssigned: string;
  notes: string;
}

const newPhrase = (): Phrase => ({
  id: Math.random().toString(36).slice(2, 8),
  bar: "", lyric: "", takeChosen: "", alternates: "", fxAssigned: "", notes: "",
});

interface State {
  artist: string; title: string; section: string;
  bpm: string; key: string;
  totalTakes: string;
  engineer: string; producer: string;
  phrases: Phrase[];
  globalNotes: string;
}

const empty: State = {
  artist: "", title: "", section: "Verse 1 / Chorus / Bridge / etc.",
  bpm: "", key: "",
  totalTakes: "",
  engineer: "", producer: "",
  phrases: [newPhrase()],
  globalNotes: "Tuning preference (pitch correction set / off / specific cents); breath edits; sibilance notes; reverb tail length; vocal-tag comping rules.",
};

const F = ({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {rows ? <textarea className={inputClass} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
          : <input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
  </div>
);

export default function VocalCompSheetPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("vocal-comp-sheet", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });
  const updatePhrase = (id: string, patch: Partial<Phrase>) => setS({ ...s, phrases: s.phrases.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const removePhrase = (id: string) => setS({ ...s, phrases: s.phrases.filter((p) => p.id !== id) });

  return (
    <ResourcePage
      parentHref="/dashboard/library/recording"
      parentLabel="Back to A&R, Recording & Production"
      color={COLOR}
      tag="Recording · Vocal Comp"
      title="Vocal Comp Sheet"
      intro="Phrase-by-phrase take selection. Document which take wins per phrase, alternates, FX assignments. The doc that prevents 'wait, which take did we use on bar 9?' four months later."
      toolbar={<><SaveButton toolSlug="vocal-comp-sheet" storageKey={STORAGE_KEY} title={`Vocal Comp Sheet — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/recording/daw-handoff", label: "DAW Project Handoff" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Header</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Artist" value={s.artist} onChange={set("artist")}/>
          <F label="Track title" value={s.title} onChange={set("title")}/>
          <F label="Section" value={s.section} onChange={set("section")}/>
          <F label="BPM" value={s.bpm} onChange={set("bpm")}/>
          <F label="Key" value={s.key} onChange={set("key")}/>
          <F label="Total takes recorded" value={s.totalTakes} onChange={set("totalTakes")}/>
          <F label="Engineer" value={s.engineer} onChange={set("engineer")}/>
          <F label="Producer" value={s.producer} onChange={set("producer")}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: COLOR }}>Phrase-by-phrase comp</p>
          <button onClick={() => setS({ ...s, phrases: [...s.phrases, newPhrase()] })} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: COLOR }}><Plus size={12}/> Add phrase</button>
        </div>
        <div className="space-y-3">
          {s.phrases.map((p) => (
            <div key={p.id} className="border border-border rounded-xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-2">
                <div><label className={labelClass}>Bar #</label><input className={inputClass} value={p.bar} onChange={(e) => updatePhrase(p.id, { bar: e.target.value })} placeholder="1-4 / 5-8"/></div>
                <div className="col-span-2"><label className={labelClass}>Lyric phrase</label><input className={inputClass} value={p.lyric} onChange={(e) => updatePhrase(p.id, { lyric: e.target.value })}/></div>
                <div><label className={labelClass}>Take chosen</label><input className={inputClass} value={p.takeChosen} onChange={(e) => updatePhrase(p.id, { takeChosen: e.target.value })} placeholder="T7 / Comp.A"/></div>
                <div><label className={labelClass}>Alt(s)</label><input className={inputClass} value={p.alternates} onChange={(e) => updatePhrase(p.id, { alternates: e.target.value })} placeholder="T3, T11"/></div>
                <div><label className={labelClass}>FX assigned</label><input className={inputClass} value={p.fxAssigned} onChange={(e) => updatePhrase(p.id, { fxAssigned: e.target.value })} placeholder="Reverb-A / Delay-B"/></div>
                <div className="col-span-2 sm:col-span-6">
                  <label className={labelClass}>Notes</label>
                  <textarea className={inputClass} rows={2} value={p.notes} onChange={(e) => updatePhrase(p.id, { notes: e.target.value })} placeholder="Pitch correction notes, breath edits, sibilance, vibrato preferences"/>
                </div>
              </div>
              <button onClick={() => removePhrase(p.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/> Remove phrase</button>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Global vocal direction</p>
        <F label="" value={s.globalNotes} onChange={set("globalNotes")} rows={4}/>
      </section>
    </ResourcePage>
  );
}
