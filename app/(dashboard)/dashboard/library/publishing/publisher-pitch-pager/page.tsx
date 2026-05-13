"use client";
import { Printer, RotateCcw, Plus, Trash2 } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#06B6D4";
const STORAGE_KEY = "roster_pub_pitch_pager_v1";

interface CatalogueHighlight { id: string; songTitle: string; artist: string; cuts: string; iswc: string; mood: string; }

interface State {
  catalogueName: string;
  publisher: string;
  contact: string;
  pitchTo: string;
  positioning: string;
  numberOfWorks: number;
  topGenres: string;
  topMarkets: string;
  recentWins: string;
  highlights: CatalogueHighlight[];
  syncCleared: string;
  contactBlock: string;
  meetingDate: string;
}

const newHighlight = (): CatalogueHighlight => ({
  id: Math.random().toString(36).slice(2, 8),
  songTitle: "", artist: "", cuts: "", iswc: "", mood: "",
});

const empty: State = {
  catalogueName: "", publisher: "", contact: "",
  pitchTo: "",
  positioning: "",
  numberOfWorks: 0,
  topGenres: "", topMarkets: "",
  recentWins: "",
  highlights: [newHighlight()],
  syncCleared: "All works one-stop except where flagged",
  contactBlock: "",
  meetingDate: "",
};

export default function PublisherPitchPagerPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("publisher-pitch-pager", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });
  const updateH = (id: string, patch: Partial<CatalogueHighlight>) =>
    setS({ ...s, highlights: s.highlights.map((h) => (h.id === id ? { ...h, ...patch } : h)) });
  const removeH = (id: string) => setS({ ...s, highlights: s.highlights.filter((h) => h.id !== id) });

  return (
    <ResourcePage
      parentHref="/dashboard/library/publishing"
      parentLabel="Back to Publishing"
      color={COLOR}
      tag="Publishing · Pitch"
      title="Publisher Pitch One-Pager"
      intro="Catalogue pitch document for sub-publishing meetings, sync agency partnerships, or label-publisher M&A conversations. One page, fact-dense."
      toolbar={<><SaveButton toolSlug="publisher-pitch-pager" storageKey={STORAGE_KEY} title={`Publisher Pitch Pager — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/publishing/pro-membership-tracker", label: "PRO / MRO Membership Tracker" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Header</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Catalogue name</label><input className={inputClass} value={s.catalogueName} onChange={(e) => set("catalogueName")(e.target.value)} placeholder="e.g. JO:LA Catalogue 2026"/></div>
          <div><label className={labelClass}>Publisher entity</label><input className={inputClass} value={s.publisher} onChange={(e) => set("publisher")(e.target.value)}/></div>
          <div><label className={labelClass}>Pitch to</label><input className={inputClass} value={s.pitchTo} onChange={(e) => set("pitchTo")(e.target.value)} placeholder="Sub-publisher / sync agency / label"/></div>
          <div><label className={labelClass}>Meeting date</label><input className={inputClass} value={s.meetingDate} onChange={(e) => set("meetingDate")(e.target.value)} placeholder="2026-04-27"/></div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Positioning</p>
        <div className="space-y-4">
          <div><label className={labelClass}>One-line positioning</label><input className={inputClass} value={s.positioning} onChange={(e) => set("positioning")(e.target.value)} placeholder="Africa's premier amapiano + Afrobeats publishing catalogue, optimised for global sync."/></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelClass}>Total works</label><input type="number" className={inputClass} value={s.numberOfWorks} onChange={(e) => setS({ ...s, numberOfWorks: Number(e.target.value) || 0 })}/></div>
            <div><label className={labelClass}>Top genres</label><input className={inputClass} value={s.topGenres} onChange={(e) => set("topGenres")(e.target.value)}/></div>
            <div><label className={labelClass}>Top markets</label><input className={inputClass} value={s.topMarkets} onChange={(e) => set("topMarkets")(e.target.value)}/></div>
          </div>
          <div><label className={labelClass}>Recent wins (placements, awards, growth)</label><textarea className={inputClass} rows={3} value={s.recentWins} onChange={(e) => set("recentWins")(e.target.value)} placeholder="Sync placements / chart positions / award nominations / streaming milestones — verified only"/></div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: COLOR }}>Catalogue highlights</p>
          <button onClick={() => setS({ ...s, highlights: [...s.highlights, newHighlight()] })} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: COLOR }}><Plus size={12}/> Add highlight</button>
        </div>
        <div className="space-y-3">
          {s.highlights.map((h) => (
            <div key={h.id} className="border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div><label className={labelClass}>Title</label><input className={inputClass} value={h.songTitle} onChange={(e) => updateH(h.id, { songTitle: e.target.value })}/></div>
              <div><label className={labelClass}>Artist</label><input className={inputClass} value={h.artist} onChange={(e) => updateH(h.id, { artist: e.target.value })}/></div>
              <div><label className={labelClass}>ISWC</label><input className={inputClass} value={h.iswc} onChange={(e) => updateH(h.id, { iswc: e.target.value })}/></div>
              <div><label className={labelClass}>Notable cuts / placements</label><input className={inputClass} value={h.cuts} onChange={(e) => updateH(h.id, { cuts: e.target.value })}/></div>
              <div><label className={labelClass}>Mood / sync angle</label><input className={inputClass} value={h.mood} onChange={(e) => updateH(h.id, { mood: e.target.value })}/></div>
              <div className="col-span-2 sm:col-span-5"><button onClick={() => removeH(h.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/></button></div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Commercial</p>
        <div className="space-y-4">
          <div><label className={labelClass}>Sync clearance state</label><input className={inputClass} value={s.syncCleared} onChange={(e) => set("syncCleared")(e.target.value)}/></div>
          <div><label className={labelClass}>Contact block</label><textarea className={inputClass} rows={3} value={s.contactBlock} onChange={(e) => set("contactBlock")(e.target.value)} placeholder="Name / role / email / phone for follow-up. Add multiple if needed."/></div>
        </div>
      </section>
    </ResourcePage>
  );
}
