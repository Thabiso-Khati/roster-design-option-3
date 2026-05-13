"use client";
import { Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#10B981";
const STORAGE_KEY = "roster_atmos_brief_v1";

interface State {
  artist: string; title: string; isrc: string;
  stereoLufs: string; atmosLufs: string;
  format: string; deliverFormat: string;
  approverPM: string; approverArtist: string;
  bedTracks: string; objects: string; binaural: string;
  rendererTarget: string; rendererSettings: string;
  qcChecks: string;
  notes: string;
}

const empty: State = {
  artist: "", title: "", isrc: "",
  stereoLufs: "−14 LUFS integrated, −1 dBTP true peak",
  atmosLufs: "−18 to −16 LUFS integrated (Apple Atmos guideline)",
  format: "Dolby Atmos (.atmos / ADM BWF)",
  deliverFormat: "ADM BWF master + binaural reference render + renderer report",
  approverPM: "", approverArtist: "",
  bedTracks: "7.1.2 bed: drums, bass, low-keys, master bus elements that benefit from rear placement",
  objects: "Lead vocal as object (centred, slight Z); BVs as objects (rotating/static); ad-libs, FX, percussion as moving objects; foley / atmospheric textures as objects with elevation",
  binaural: "Binaural render mode set per object: 'Mid' or 'Far' for non-vocal elements; 'Off' for lead vocal centre presence",
  rendererTarget: "Apple Music Spatial Audio (Dolby Atmos)",
  rendererSettings: "Dolby Atmos Renderer 5+ / Pro Tools Atmos integration / Logic Pro 11.1+ Atmos workflow",
  qcChecks: "(1) Object positioning checked at every section; (2) Binaural reference matches stereo intent; (3) No over-3D effect on lead vocal — keep central; (4) Loudness within Apple −18 to −16 LUFS spec; (5) Renderer report attached to delivery; (6) afclip pass on encoded MFiT",
  notes: "Atmos = additional master, not replacement. Stereo master remains primary deliverable. Atmos paid as bonus pool by Apple/Tidal.",
};

const F = ({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {rows ? <textarea className={inputClass} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
          : <input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
  </div>
);

export default function AtmosSpatialBriefPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("atmos-spatial-brief", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  return (
    <ResourcePage
      parentHref="/dashboard/library/recording"
      parentLabel="Back to A&R, Recording & Production"
      color={COLOR}
      tag="Recording · Atmos / Spatial"
      title="Dolby Atmos / Spatial Audio Brief"
      intro="Brief for the Atmos mix engineer. Apple and Tidal pay premium pool rates for Spatial Audio masters; this is the doc that makes them deliverable."
      toolbar={<><SaveButton toolSlug="atmos-spatial-brief" storageKey={STORAGE_KEY} title={`Atmos Spatial Brief — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/recording/vocal-comp-sheet", label: "Vocal Comp Sheet" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Identity</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Artist" value={s.artist} onChange={set("artist")}/>
          <F label="Track title" value={s.title} onChange={set("title")}/>
          <F label="ISRC" value={s.isrc} onChange={set("isrc")} placeholder="Required for Atmos delivery"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Loudness targets</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Stereo (reference)" value={s.stereoLufs} onChange={set("stereoLufs")}/>
          <F label="Atmos integrated" value={s.atmosLufs} onChange={set("atmosLufs")}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Bed + Objects</p>
        <div className="space-y-4">
          <F label="Bed tracks (7.1.2)" value={s.bedTracks} onChange={set("bedTracks")} rows={3}/>
          <F label="Objects (lead vocal, BVs, FX, percussion, foley)" value={s.objects} onChange={set("objects")} rows={4}/>
          <F label="Binaural render mode notes" value={s.binaural} onChange={set("binaural")} rows={2}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Renderer + Format</p>
        <div className="space-y-4">
          <F label="Renderer target" value={s.rendererTarget} onChange={set("rendererTarget")}/>
          <F label="Renderer settings / DAW" value={s.rendererSettings} onChange={set("rendererSettings")}/>
          <F label="Format" value={s.format} onChange={set("format")}/>
          <F label="Final delivery format" value={s.deliverFormat} onChange={set("deliverFormat")} rows={2}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>QC checks pre-delivery</p>
        <F label="" value={s.qcChecks} onChange={set("qcChecks")} rows={6}/>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Approvers</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="PM / Engineer approval" value={s.approverPM} onChange={set("approverPM")}/>
          <F label="Artist approval" value={s.approverArtist} onChange={set("approverArtist")}/>
        </div>
        <div className="mt-4">
          <F label="Notes" value={s.notes} onChange={set("notes")} rows={3}/>
        </div>
      </section>
    </ResourcePage>
  );
}
