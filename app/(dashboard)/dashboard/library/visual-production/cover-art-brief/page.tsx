"use client";
import { Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#A855F7";
const STORAGE_KEY = "roster_cover_art_brief_v1";

interface State {
  artist: string; releaseTitle: string; releaseDate: string; releaseFormat: string;
  budget: string; deliveryDate: string;
  conceptualBrief: string;
  visualReferences: string;
  paletteAndType: string;
  brandConsistency: string;
  technical: string;
  rightsAndCredits: string;
  approvers: string;
  notes: string;
}

const empty: State = {
  artist: "", releaseTitle: "", releaseDate: "", releaseFormat: "Single",
  budget: "ZAR 8,000-15,000",
  deliveryDate: "10 days from brief",
  conceptualBrief: "Sub-3-sentence description of the visual concept. Should connect to the song's themes / emotional core, not just illustrate the lyrics.",
  visualReferences: "3-5 reference images with notes — what's working, what's not. Image links or attached files.",
  paletteAndType: "Primary + secondary palette (HEX). Type direction (display + body). Mood: cinematic / minimalist / chaotic / monochrome / hyper-saturated etc.",
  brandConsistency: "Does it sit in a release series, a campaign, a body of work? Carry-overs from prior covers?",
  technical: "Final delivery: 3000×3000 RGB JPG or PNG, < 10 MB, 300 DPI minimum. No URLs, no DSP logos, no promotional overlays. Title + artist legible at 64×64 thumbnail.",
  rightsAndCredits: "Designer agrees to full IP assignment to commissioner (use Independent Contractor Agreement template). Credit substantially as 'Artwork by [Designer]'. Designer may include in portfolio post-release.",
  approvers: "Artist (final approval), manager (sequence approval), label A&R (where applicable).",
  notes: "",
};

const F = ({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {rows ? <textarea className={inputClass} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
          : <input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
  </div>
);

export default function CoverArtBriefPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("cover-art-brief", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Brief"
      title="Cover Art Brief"
      intro="The brief that goes to a designer or illustrator before they start. Pairs with the Cover Art QC checklist (post-design)."
      toolbar={<><SaveButton toolSlug="cover-art-brief" storageKey={STORAGE_KEY} title={`Cover Art Brief — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/visual-production/cover-art-qc", label: "Cover Art QC Checklist" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Project</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Artist" value={s.artist} onChange={set("artist")}/>
          <F label="Release title" value={s.releaseTitle} onChange={set("releaseTitle")}/>
          <F label="Format" value={s.releaseFormat} onChange={set("releaseFormat")}/>
          <F label="Release date" value={s.releaseDate} onChange={set("releaseDate")}/>
          <F label="Budget" value={s.budget} onChange={set("budget")}/>
          <F label="Delivery date" value={s.deliveryDate} onChange={set("deliveryDate")}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Concept</p>
        <div className="space-y-4">
          <F label="Conceptual brief (3 sentences)" value={s.conceptualBrief} onChange={set("conceptualBrief")} rows={3}/>
          <F label="Visual references" value={s.visualReferences} onChange={set("visualReferences")} rows={3}/>
          <F label="Palette & type direction" value={s.paletteAndType} onChange={set("paletteAndType")} rows={3}/>
          <F label="Brand consistency / series" value={s.brandConsistency} onChange={set("brandConsistency")} rows={2}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Specs & rights</p>
        <div className="space-y-4">
          <F label="Technical specifications" value={s.technical} onChange={set("technical")} rows={3}/>
          <F label="Rights & credits" value={s.rightsAndCredits} onChange={set("rightsAndCredits")} rows={3}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Process</p>
        <div className="space-y-4">
          <F label="Decision-makers / approvers" value={s.approvers} onChange={set("approvers")}/>
          <F label="Notes" value={s.notes} onChange={set("notes")} rows={3}/>
        </div>
      </section>
    </ResourcePage>
  );
}
