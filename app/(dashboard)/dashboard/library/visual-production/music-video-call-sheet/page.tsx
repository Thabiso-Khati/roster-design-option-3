"use client";
import { Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#A855F7";
const STORAGE_KEY = "roster_mv_callsheet_v1";

interface Person { name: string; role: string; call: string; phone: string; }
interface Scene { time: string; sceneNo: string; description: string; location: string; cast: string; }

interface Sheet {
  project: string; date: string; dayOf: string; weather: string;
  generalCall: string; sunrise: string; sunset: string; firstShot: string; wrap: string;
  productionTitle: string;
  hospital: string; emergency: string;
  locations: string;
  crew: Person[];
  talent: Person[];
  schedule: Scene[];
  notes: string;
}

const seed = (): Sheet => ({
  project: "", date: "", dayOf: "Day 1 of 1", weather: "",
  generalCall: "", sunrise: "", sunset: "", firstShot: "", wrap: "",
  productionTitle: "",
  hospital: "Nearest A&E + address + phone",
  emergency: "ER 10111 (SA) / 112 (NG) — confirm local",
  locations: "",
  crew: [
    { name: "", role: "Director", call: "", phone: "" },
    { name: "", role: "Producer", call: "", phone: "" },
    { name: "", role: "DP", call: "", phone: "" },
    { name: "", role: "Sound", call: "", phone: "" },
  ],
  talent: [{ name: "", role: "Artist", call: "", phone: "" }],
  schedule: [{ time: "", sceneNo: "", description: "", location: "", cast: "" }],
  notes: "",
});

export default function MusicVideoCallSheetPage() {
  const [s, setS] = useLocalState<Sheet>(STORAGE_KEY, seed());
  useToolRestore("music-video-call-sheet", STORAGE_KEY, setS);

  const upsertCrew = (i: number, patch: Partial<Person>) => setS({ ...s, crew: s.crew.map((c, ix) => ix === i ? { ...c, ...patch } : c) });
  const upsertTalent = (i: number, patch: Partial<Person>) => setS({ ...s, talent: s.talent.map((c, ix) => ix === i ? { ...c, ...patch } : c) });
  const upsertScene = (i: number, patch: Partial<Scene>) => setS({ ...s, schedule: s.schedule.map((c, ix) => ix === i ? { ...c, ...patch } : c) });

  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Per Shoot Day"
      title="Music Video Call Sheet"
      intro="The single document the crew lives by on shoot day. Print and circulate the night before."
      toolbar={<><SaveButton toolSlug="music-video-call-sheet" storageKey={STORAGE_KEY} title={`Music Video Call Sheet — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(seed())} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/visual-production/cover-art-brief", label: "Cover Art Brief" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Header</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Project</label><input className={inputClass} value={s.project} onChange={(e) => setS({ ...s, project: e.target.value })} /></div>
          <div><label className={labelClass}>Production title</label><input className={inputClass} value={s.productionTitle} onChange={(e) => setS({ ...s, productionTitle: e.target.value })} /></div>
          <div><label className={labelClass}>Date</label><input type="date" className={inputClass} value={s.date} onChange={(e) => setS({ ...s, date: e.target.value })} /></div>
          <div><label className={labelClass}>Day of</label><input className={inputClass} value={s.dayOf} onChange={(e) => setS({ ...s, dayOf: e.target.value })} /></div>
          <div><label className={labelClass}>Weather</label><input className={inputClass} value={s.weather} onChange={(e) => setS({ ...s, weather: e.target.value })} placeholder="22°C, partly cloudy"/></div>
          <div><label className={labelClass}>Sunrise / sunset</label><input className={inputClass} value={`${s.sunrise} / ${s.sunset}`} onChange={(e) => { const [a, b] = e.target.value.split("/"); setS({ ...s, sunrise: a?.trim() || "", sunset: b?.trim() || "" }); }} placeholder="06:30 / 18:15"/></div>
          <div><label className={labelClass}>General call</label><input className={inputClass} value={s.generalCall} onChange={(e) => setS({ ...s, generalCall: e.target.value })} placeholder="07:00"/></div>
          <div><label className={labelClass}>First shot / wrap</label><input className={inputClass} value={`${s.firstShot} / ${s.wrap}`} onChange={(e) => { const [a, b] = e.target.value.split("/"); setS({ ...s, firstShot: a?.trim() || "", wrap: b?.trim() || "" }); }} placeholder="08:30 / 19:00"/></div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Locations</p>
        <textarea className={inputClass} rows={3} value={s.locations} onChange={(e) => setS({ ...s, locations: e.target.value })} placeholder="Loc 1: address / parking notes / what to film here"/>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Schedule</p>
        <div className="space-y-2">
          {s.schedule.map((sc, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <input className={`${inputClass} col-span-2`} placeholder="Time" value={sc.time} onChange={(e) => upsertScene(i, { time: e.target.value })}/>
              <input className={`${inputClass} col-span-1`} placeholder="Sc#" value={sc.sceneNo} onChange={(e) => upsertScene(i, { sceneNo: e.target.value })}/>
              <input className={`${inputClass} col-span-5`} placeholder="Description" value={sc.description} onChange={(e) => upsertScene(i, { description: e.target.value })}/>
              <input className={`${inputClass} col-span-2`} placeholder="Location" value={sc.location} onChange={(e) => upsertScene(i, { location: e.target.value })}/>
              <input className={`${inputClass} col-span-2`} placeholder="Cast" value={sc.cast} onChange={(e) => upsertScene(i, { cast: e.target.value })}/>
            </div>
          ))}
          <button onClick={() => setS({ ...s, schedule: [...s.schedule, { time: "", sceneNo: "", description: "", location: "", cast: "" }] })} className="text-xs font-semibold mt-2" style={{ color: COLOR }}>+ Add row</button>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Crew</p>
        <div className="space-y-2">
          {s.crew.map((c, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <input className={`${inputClass} col-span-3`} placeholder="Name" value={c.name} onChange={(e) => upsertCrew(i, { name: e.target.value })}/>
              <input className={`${inputClass} col-span-3`} placeholder="Role" value={c.role} onChange={(e) => upsertCrew(i, { role: e.target.value })}/>
              <input className={`${inputClass} col-span-3`} placeholder="Call time" value={c.call} onChange={(e) => upsertCrew(i, { call: e.target.value })}/>
              <input className={`${inputClass} col-span-3`} placeholder="Phone" value={c.phone} onChange={(e) => upsertCrew(i, { phone: e.target.value })}/>
            </div>
          ))}
          <button onClick={() => setS({ ...s, crew: [...s.crew, { name: "", role: "", call: "", phone: "" }] })} className="text-xs font-semibold mt-2" style={{ color: COLOR }}>+ Add crew</button>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Talent</p>
        <div className="space-y-2">
          {s.talent.map((c, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <input className={`${inputClass} col-span-3`} placeholder="Name" value={c.name} onChange={(e) => upsertTalent(i, { name: e.target.value })}/>
              <input className={`${inputClass} col-span-3`} placeholder="Role" value={c.role} onChange={(e) => upsertTalent(i, { role: e.target.value })}/>
              <input className={`${inputClass} col-span-3`} placeholder="Call time" value={c.call} onChange={(e) => upsertTalent(i, { call: e.target.value })}/>
              <input className={`${inputClass} col-span-3`} placeholder="Phone" value={c.phone} onChange={(e) => upsertTalent(i, { phone: e.target.value })}/>
            </div>
          ))}
          <button onClick={() => setS({ ...s, talent: [...s.talent, { name: "", role: "", call: "", phone: "" }] })} className="text-xs font-semibold mt-2" style={{ color: COLOR }}>+ Add talent</button>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Safety & Notes</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className={labelClass}>Nearest hospital / A&E</label><input className={inputClass} value={s.hospital} onChange={(e) => setS({ ...s, hospital: e.target.value })}/></div>
          <div><label className={labelClass}>Emergency numbers</label><input className={inputClass} value={s.emergency} onChange={(e) => setS({ ...s, emergency: e.target.value })}/></div>
        </div>
        <textarea className={inputClass} rows={3} value={s.notes} onChange={(e) => setS({ ...s, notes: e.target.value })} placeholder="Special notes, hazards, COVID protocols, weather plan B"/>
      </section>
    </ResourcePage>
  );
}
