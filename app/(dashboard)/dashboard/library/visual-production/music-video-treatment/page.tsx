"use client";
import { Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#A855F7";
const STORAGE_KEY = "roster_mv_treatment_v1";

interface State {
  song: string; artist: string; director: string; date: string;
  logline: string; concept: string; theme: string; tone: string;
  storyArc: string; openingShot: string; keyShots: string; endingShot: string;
  setting: string; palette: string; wardrobe: string; cinemaRefs: string;
  artistPerformance: string; talentNeeds: string; specialRequirements: string;
  deliverables: string;
}

const empty: State = {
  song: "", artist: "", director: "", date: "",
  logline: "", concept: "", theme: "", tone: "",
  storyArc: "", openingShot: "", keyShots: "", endingShot: "",
  setting: "", palette: "", wardrobe: "", cinemaRefs: "",
  artistPerformance: "", talentNeeds: "", specialRequirements: "",
  deliverables: "1×16:9 master (4K), 1×9:16 vertical for shorts, 5×teaser cuts (15-30s), still gallery from EPK BTS",
};

const Field = ({ label, value, onChange, placeholder, rows }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {rows ? (
      <textarea className={inputClass} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    )}
  </div>
);

export default function MusicVideoTreatmentPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("music-video-treatment", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Per Video"
      title="Music Video Treatment"
      intro="The director's vision document. The thing managers commission directors with. Print before greenlight."
      toolbar={<><SaveButton toolSlug="music-video-treatment" storageKey={STORAGE_KEY} title={`Music Video Treatment — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Cover</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Song" value={s.song} onChange={set("song")} />
          <Field label="Artist" value={s.artist} onChange={set("artist")} />
          <Field label="Director" value={s.director} onChange={set("director")} />
          <Field label="Treatment date" value={s.date} onChange={set("date")} placeholder="YYYY-MM-DD" />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Concept</p>
        <div className="space-y-4">
          <Field label="Logline (one sentence)" value={s.logline} onChange={set("logline")} placeholder="A fearless reckoning with home, told through one continuous take." rows={2}/>
          <Field label="Concept" value={s.concept} onChange={set("concept")} rows={4}/>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Theme" value={s.theme} onChange={set("theme")} />
            <Field label="Tone" value={s.tone} onChange={set("tone")} placeholder="Cinematic · raw · joyful · brooding"/>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Story Arc</p>
        <Field label="Story arc — beginning to end" value={s.storyArc} onChange={set("storyArc")} rows={5}/>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Field label="Opening shot" value={s.openingShot} onChange={set("openingShot")} rows={3}/>
          <Field label="Key shots" value={s.keyShots} onChange={set("keyShots")} rows={3}/>
          <Field label="Ending shot" value={s.endingShot} onChange={set("endingShot")} rows={3}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Look</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Setting / locations" value={s.setting} onChange={set("setting")} rows={3}/>
          <Field label="Colour palette" value={s.palette} onChange={set("palette")} rows={3}/>
          <Field label="Wardrobe / styling" value={s.wardrobe} onChange={set("wardrobe")} rows={3}/>
          <Field label="Cinematic references (links / titles)" value={s.cinemaRefs} onChange={set("cinemaRefs")} rows={3}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Performance</p>
        <div className="space-y-4">
          <Field label="Artist performance brief" value={s.artistPerformance} onChange={set("artistPerformance")} rows={3}/>
          <Field label="Talent / extras needs" value={s.talentNeeds} onChange={set("talentNeeds")} rows={2}/>
          <Field label="Special requirements (stunts, animals, FX, drone, underwater)" value={s.specialRequirements} onChange={set("specialRequirements")} rows={2}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Deliverables</p>
        <Field label="Final deliverables" value={s.deliverables} onChange={set("deliverables")} rows={3}/>
      </section>
    </ResourcePage>
  );
}
