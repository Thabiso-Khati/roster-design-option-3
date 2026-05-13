"use client";
import { Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#F59E0B";
const STORAGE_KEY = "roster_performance_rider_v1";

interface State {
  artist: string; act: string; managerEmail: string; productionEmail: string;
  pa: string; foh: string; monitors: string; mics: string; di: string; backline: string;
  power: string; stageSize: string; lighting: string; videoLED: string; smokeHaze: string;
  setupTime: string; soundcheckTime: string; doorsTime: string; setStart: string; setLength: string;
  inputList: string; patchSheet: string; specialEffects: string;
  notes: string;
}

const empty: State = {
  artist: "", act: "Live band — 5-piece", managerEmail: "", productionEmail: "",
  pa: "Promoter to provide L-Acoustics K-series, dV-DOSC, KARA, KIVA or equivalent line-array system, capable of 110 dB SPL at FOH for the venue capacity.",
  foh: "Digital console: DiGiCo SD-series, Yamaha CL/QL, Allen & Heath dLive, Avid S6L. Min 32 inputs / 8 outputs.",
  monitors: "Min 6× wedges (Clair 12AM, L-Acoustics X12, d&b M2). Stereo IEM mix for vocalist on Sennheiser G3 or equivalent. Drum sub.",
  mics: "Lead vocal: Shure SM58 Beta or Sennheiser e945 + spare. Backing vox ×2 same. Drum kit: Beta 52 (kick), 57 (snare top/bottom), Beta 98 ×3 (toms), C414 ×2 (overheads), KSM137 (hi-hat). Bass DI + mic.",
  di: "Active DI ×4 (Radial JDI / Countryman 85), passive DI ×2.",
  backline: "Drum kit: 22\" kick, 14\" snare, 10/12/16 toms, hi-hat + 2 crash + ride. Bass amp: Ampeg SVT-CL + 8×10 cabinet. Guitar amp: Fender Twin Reverb + 2×12 cab.",
  power: "Stage power: minimum 32A 3-phase + 2× 16A single-phase clean circuits. UPS for FOH desk.",
  stageSize: "Min 8m × 6m × 1.2m height. Risers for drums (2m × 2m × 0.6m) and percussion.",
  lighting: "Front wash, key light on vocalist, side wash, back wash, 4× moving heads, 4× LED PAR cans. Programmer + operator for the set.",
  videoLED: "If specified: P3 or finer LED wall, min 6m × 3m, with media server (Resolume / disguise) and operator.",
  smokeHaze: "Hazer (Look Solutions Unique 2.1) running before set; smoke for last song optional.",
  setupTime: "Load-in: 4 hours before doors. Soundcheck: 90 min. Line check: 30 min before doors.",
  soundcheckTime: "All band members on stage 90 min before doors.",
  doorsTime: "",
  setStart: "",
  setLength: "75 minutes (10 song set + 1 encore)",
  inputList: "Available on request — 32 channels typical for 5-piece live act.",
  patchSheet: "Monitor mixes: Vocal (stereo IEM), Drum (wedge + sub), Bass (wedge), Guitar (wedge), Keys (wedge), Percussion (wedge).",
  specialEffects: "Confetti drop end of show: 2× cannons, FOH-triggered, biodegradable confetti.",
  notes: "Promoter must provide credentialed backline tech and FOH/monitor engineers. Artist's TM may operate FOH if mutually agreed.",
};

const F = ({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {rows ? <textarea className={inputClass} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
          : <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />}
  </div>
);

export default function PerformanceRiderPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("performance-rider", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  return (
    <ResourcePage
      parentHref="/dashboard/library/touring"
      parentLabel="Back to Live, Touring & Festivals"
      color={COLOR}
      tag="Live · Rider"
      title="Performance / Technical Rider"
      intro="The technical specification you send promoters with every confirmation. Edit once per act, version per tour."
      toolbar={<><SaveButton toolSlug="performance-rider" storageKey={STORAGE_KEY} title={`Performance Rider — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/touring/hospitality-rider", label: "Hospitality Rider" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Identity</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Artist" value={s.artist} onChange={set("artist")} />
          <F label="Act configuration" value={s.act} onChange={set("act")} />
          <F label="Manager / TM email" value={s.managerEmail} onChange={set("managerEmail")} />
          <F label="Production email" value={s.productionEmail} onChange={set("productionEmail")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Audio</p>
        <div className="space-y-4">
          <F label="PA system" value={s.pa} onChange={set("pa")} rows={2}/>
          <F label="FOH console" value={s.foh} onChange={set("foh")} rows={2}/>
          <F label="Monitor system" value={s.monitors} onChange={set("monitors")} rows={2}/>
          <F label="Microphones" value={s.mics} onChange={set("mics")} rows={3}/>
          <F label="DIs" value={s.di} onChange={set("di")} />
          <F label="Backline" value={s.backline} onChange={set("backline")} rows={3}/>
          <F label="Input list" value={s.inputList} onChange={set("inputList")} rows={2}/>
          <F label="Patch sheet" value={s.patchSheet} onChange={set("patchSheet")} rows={3}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Stage</p>
        <div className="space-y-4">
          <F label="Power" value={s.power} onChange={set("power")} />
          <F label="Stage dimensions" value={s.stageSize} onChange={set("stageSize")} />
          <F label="Lighting" value={s.lighting} onChange={set("lighting")} rows={2}/>
          <F label="Video / LED" value={s.videoLED} onChange={set("videoLED")} />
          <F label="Smoke / haze" value={s.smokeHaze} onChange={set("smokeHaze")} />
          <F label="Special effects" value={s.specialEffects} onChange={set("specialEffects")} rows={2}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Timing</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Load-in / setup" value={s.setupTime} onChange={set("setupTime")} />
          <F label="Soundcheck" value={s.soundcheckTime} onChange={set("soundcheckTime")} />
          <F label="Doors" value={s.doorsTime} onChange={set("doorsTime")} />
          <F label="Set start" value={s.setStart} onChange={set("setStart")} />
          <F label="Set length" value={s.setLength} onChange={set("setLength")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Notes</p>
        <textarea className={inputClass} rows={4} value={s.notes} onChange={(e) => setS({ ...s, notes: e.target.value })}/>
      </section>
    </ResourcePage>
  );
}
