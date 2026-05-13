"use client";
import { Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#A855F7";
const STORAGE_KEY = "roster_mv_brief_v1";

interface State {
  artist: string; song: string; releaseDate: string; budgetEnvelope: string;
  whoIsThis: string; goal: string; audience: string; nonNegotiables: string;
  keyDates: string; deliverables: string; rights: string; approvers: string;
}

const empty: State = {
  artist: "", song: "", releaseDate: "", budgetEnvelope: "",
  whoIsThis: "", goal: "", audience: "", nonNegotiables: "",
  keyDates: "", deliverables: "1×16:9 master 4K, 1×9:16 vertical, 5×short cuts (15-30s), still gallery",
  rights: "Full IP assignment to commissioner. Director credit. No release of behind-the-scenes without prior approval.",
  approvers: "",
};

const Field = ({ label, value, onChange, placeholder, rows }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {rows ? <textarea className={inputClass} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
          : <input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
  </div>
);

export default function MusicVideoBriefPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("music-video-brief", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Brief"
      title="Music Video Production Brief"
      intro="The artist + label brief that goes to a director or production house. Tells them what to make, by when, for what budget."
      toolbar={<><SaveButton toolSlug="music-video-brief" storageKey={STORAGE_KEY} title={`Music Video Brief — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/visual-production/music-video-budget", label: "Music Video Budget" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Project</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Artist" value={s.artist} onChange={set("artist")} />
          <Field label="Song" value={s.song} onChange={set("song")} />
          <Field label="Release date" value={s.releaseDate} onChange={set("releaseDate")} placeholder="YYYY-MM-DD" />
          <Field label="Budget envelope" value={s.budgetEnvelope} onChange={set("budgetEnvelope")} placeholder="ZAR / NGN" />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Brief</p>
        <div className="space-y-4">
          <Field label="Who is this artist? (3–4 sentences)" value={s.whoIsThis} onChange={set("whoIsThis")} rows={3}/>
          <Field label="What does this video need to do?" value={s.goal} onChange={set("goal")} rows={2} placeholder="Crossover into UK / land on TikTok / set up the tour announcement"/>
          <Field label="Audience" value={s.audience} onChange={set("audience")} rows={2} placeholder="Primary + secondary, age + market"/>
          <Field label="Non-negotiables" value={s.nonNegotiables} onChange={set("nonNegotiables")} rows={3} placeholder="Must have: female DP, on-location SA, daylight only, etc."/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Logistics</p>
        <div className="space-y-4">
          <Field label="Key dates" value={s.keyDates} onChange={set("keyDates")} rows={4} placeholder="Treatment due / Shoot dates / Rough cut / Final delivery"/>
          <Field label="Deliverables" value={s.deliverables} onChange={set("deliverables")} rows={3}/>
          <Field label="Rights" value={s.rights} onChange={set("rights")} rows={2}/>
          <Field label="Decision-makers / approvers" value={s.approvers} onChange={set("approvers")} rows={2} placeholder="Whose sign-off is needed at each stage"/>
        </div>
      </section>
    </ResourcePage>
  );
}
