"use client";
import { Plus, Trash2, Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#06B6D4";
const STORAGE_KEY = "roster_cue_sheet_v1";

interface Cue {
  id: string;
  cueNo: string;
  title: string;
  composer: string;
  publisher: string;
  iswc: string;
  duration: string;
  useType: string;
  startTime: string;
  proAffiliation: string;
}

const newCue = (): Cue => ({
  id: Math.random().toString(36).slice(2, 8),
  cueNo: "",
  title: "",
  composer: "",
  publisher: "",
  iswc: "",
  duration: "",
  useType: "BG vocal",
  startTime: "",
  proAffiliation: "SAMRO",
});

interface State {
  productionTitle: string;
  productionType: string;
  episode: string;
  director: string;
  productionCompany: string;
  cues: Cue[];
  contact: string;
}

const empty: State = {
  productionTitle: "",
  productionType: "TV episodic",
  episode: "",
  director: "",
  productionCompany: "",
  cues: [],
  contact: "",
};

export default function CueSheetPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("cue-sheet", STORAGE_KEY, setS);
  const update = (id: string, patch: Partial<Cue>) =>
    setS({ ...s, cues: s.cues.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const remove = (id: string) => setS({ ...s, cues: s.cues.filter((c) => c.id !== id) });
  const add = () => setS({ ...s, cues: [...s.cues, newCue()] });

  return (
    <ResourcePage
      parentHref="/dashboard/library/publishing"
      parentLabel="Back to Publishing"
      color={COLOR}
      tag="Publishing · Form"
      title="Cue Sheet Template"
      intro="PRO-required document for film, TV and ad use of music. Lodge within 30 days of broadcast — drives all downstream PRO performance income. The single most-missed publishing income opportunity."
      toolbar={<><SaveButton toolSlug="cue-sheet" storageKey={STORAGE_KEY} title={`Cue Sheet — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/publishing/publisher-pitch-pager", label: "Publisher Pitch One-Pager" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Production</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Production title</label><input className={inputClass} value={s.productionTitle} onChange={(e) => setS({ ...s, productionTitle: e.target.value })}/></div>
          <div><label className={labelClass}>Production type</label><select className={inputClass} value={s.productionType} onChange={(e) => setS({ ...s, productionType: e.target.value })}>{["TV episodic","TV trailer","Film","Film trailer","Ad / commercial","Documentary","Game","Branded content"].map((o) => <option key={o}>{o}</option>)}</select></div>
          <div><label className={labelClass}>Episode / cut #</label><input className={inputClass} value={s.episode} onChange={(e) => setS({ ...s, episode: e.target.value })}/></div>
          <div><label className={labelClass}>Director</label><input className={inputClass} value={s.director} onChange={(e) => setS({ ...s, director: e.target.value })}/></div>
          <div><label className={labelClass}>Production company</label><input className={inputClass} value={s.productionCompany} onChange={(e) => setS({ ...s, productionCompany: e.target.value })}/></div>
          <div><label className={labelClass}>Submitter contact</label><input className={inputClass} value={s.contact} onChange={(e) => setS({ ...s, contact: e.target.value })} placeholder="Name + email"/></div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: COLOR }}>Cues</p>
          <button onClick={add} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}><Plus size={13}/> Add cue</button>
        </div>
        {s.cues.length === 0 && <p className="text-sm text-text-muted text-center py-8">No cues yet. Click <span className="font-semibold text-brand">Add cue</span> per use of music in the production.</p>}
        <div className="space-y-3">
          {s.cues.map((c) => (
            <div key={c.id} className="border border-border rounded-xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                <div><label className={labelClass}>Cue #</label><input className={inputClass} value={c.cueNo} onChange={(e) => update(c.id, { cueNo: e.target.value })} placeholder="1M1 / etc."/></div>
                <div className="col-span-2"><label className={labelClass}>Title</label><input className={inputClass} value={c.title} onChange={(e) => update(c.id, { title: e.target.value })}/></div>
                <div><label className={labelClass}>ISWC</label><input className={inputClass} value={c.iswc} onChange={(e) => update(c.id, { iswc: e.target.value })}/></div>
                <div className="col-span-2"><label className={labelClass}>Composer / Writer</label><input className={inputClass} value={c.composer} onChange={(e) => update(c.id, { composer: e.target.value })}/></div>
                <div><label className={labelClass}>Publisher</label><input className={inputClass} value={c.publisher} onChange={(e) => update(c.id, { publisher: e.target.value })}/></div>
                <div><label className={labelClass}>PRO</label><select className={inputClass} value={c.proAffiliation} onChange={(e) => update(c.id, { proAffiliation: e.target.value })}>{["SAMRO","CAPASSO","COSON","MCSN","MCSK","ASCAP","BMI","SESAC","PRS","GEMA","SACEM","SIAE","JASRAC"].map((o) => <option key={o}>{o}</option>)}</select></div>
                <div><label className={labelClass}>Use type</label><select className={inputClass} value={c.useType} onChange={(e) => update(c.id, { useType: e.target.value })}>{["BG instrumental","BG vocal","Visual vocal","Featured","End title","Source / on-camera","Trailer","Promo"].map((o) => <option key={o}>{o}</option>)}</select></div>
                <div><label className={labelClass}>Duration</label><input className={inputClass} value={c.duration} onChange={(e) => update(c.id, { duration: e.target.value })} placeholder="0:32"/></div>
                <div><label className={labelClass}>Start (timecode)</label><input className={inputClass} value={c.startTime} onChange={(e) => update(c.id, { startTime: e.target.value })} placeholder="00:14:23"/></div>
              </div>
              <button onClick={() => remove(c.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/> Remove</button>
            </div>
          ))}
        </div>
      </section>

      <div className="glass-card rounded-2xl p-5 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}08` }}>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Submission.</span> Lodge with each writer's PRO and (where applicable) the broadcaster's clearance department within 30 days of first broadcast. Late cue sheets miss royalty cycles and trigger black-box re-allocation.
        </p>
      </div>
    </ResourcePage>
  );
}
