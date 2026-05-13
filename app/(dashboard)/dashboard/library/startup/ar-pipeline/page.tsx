"use client";
import { Plus, Trash2 } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#C9A84C";
const STORAGE_KEY = "roster_ar_pipeline_v1";

const STAGES = ["Discovery", "First listen", "First meeting", "Showcase / live see", "Scorecard pass", "Lawyered up", "LOI / Term sheet", "Signed", "Passed"] as const;
type Stage = typeof STAGES[number];

interface Prospect {
  id: string;
  artist: string;
  source: string;
  city: string;
  country: string;
  genre: string;
  stage: Stage;
  scoreOverall: number;
  reachAtFirstListen: string;
  nextStep: string;
  nextStepDate: string;
  notes: string;
  scoreCardLink: string;
}

const newProspect = (): Prospect => ({
  id: Math.random().toString(36).slice(2, 8),
  artist: "", source: "Inbound — DM / Email", city: "", country: "South Africa", genre: "Amapiano",
  stage: "Discovery", scoreOverall: 0, reachAtFirstListen: "", nextStep: "", nextStepDate: "", notes: "", scoreCardLink: "",
});

const STAGE_COLOR: Record<Stage, string> = {
  Discovery: "#94A3B8",
  "First listen": "#3B82F6",
  "First meeting": "#A855F7",
  "Showcase / live see": "#F59E0B",
  "Scorecard pass": "#22D3EE",
  "Lawyered up": "#06B6D4",
  "LOI / Term sheet": "#10B981",
  Signed: "#16A34A",
  Passed: "#64748B",
};

export default function ARPipelinePage() {
  const [prospects, setProspects] = useLocalState<Prospect[]>(STORAGE_KEY, []);
  useToolRestore("ar-pipeline", STORAGE_KEY, setProspects);
  const update = (id: string, patch: Partial<Prospect>) => setProspects(prospects.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id: string) => setProspects(prospects.filter((p) => p.id !== id));

  const stats = STAGES.reduce<Record<Stage, number>>((acc, s) => ({ ...acc, [s]: prospects.filter((p) => p.stage === s).length }), {} as Record<Stage, number>);

  return (
    <ResourcePage
      parentHref="/dashboard/library/startup"
      parentLabel="Back to Onboarding"
      color={COLOR}
      tag="A&R · Pipeline"
      title="A&R Pipeline Board"
      intro="Track prospects from discovery to signing. One row per artist; move stages as the conversation deepens. Pair with the Artist Evaluation Scorecard for sign / pass calls."
      toolbar={<><SaveButton toolSlug="ar-pipeline" storageKey={STORAGE_KEY} title={`A&R Pipeline — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <button onClick={() => setProspects([...prospects, newProspect()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          <Plus size={13}/> Add prospect
        </button>
            </>
      }
      next={{ href: "/dashboard/library/startup/artist-scorecard", label: "Artist Evaluation Scorecard" }}
    >
      <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 mb-6">
        {STAGES.map((s) => (
          <div key={s} className="glass-card rounded-lg p-2 text-center" style={{ borderColor: `${STAGE_COLOR[s]}40` }}>
            <p className="text-[10px] text-text-muted mb-1">{s}</p>
            <p className="font-black text-base" style={{ color: STAGE_COLOR[s] }}>{stats[s]}</p>
          </div>
        ))}
      </div>

      {prospects.length === 0 && <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">Empty pipeline. Click <span className="font-semibold text-brand">Add prospect</span> to start.</div>}

      <div className="space-y-3">
        {prospects.map((p) => (
          <div key={p.id} className="glass-card rounded-2xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div><label className={labelClass}>Artist</label><input className={inputClass} value={p.artist} onChange={(e) => update(p.id, { artist: e.target.value })}/></div>
              <div><label className={labelClass}>Source</label><select className={inputClass} value={p.source} onChange={(e) => update(p.id, { source: e.target.value })}>{["Inbound — DM / Email","Referral","Live show","TikTok / Reels discovery","Spotify / Audiomack discovery","Showcase / event","A&R scout","Producer recommendation","Other"].map((o) => <option key={o}>{o}</option>)}</select></div>
              <div><label className={labelClass}>City</label><input className={inputClass} value={p.city} onChange={(e) => update(p.id, { city: e.target.value })}/></div>
              <div><label className={labelClass}>Country</label><input className={inputClass} value={p.country} onChange={(e) => update(p.id, { country: e.target.value })}/></div>
              <div><label className={labelClass}>Genre</label><input className={inputClass} value={p.genre} onChange={(e) => update(p.id, { genre: e.target.value })}/></div>
              <div><label className={labelClass}>Stage</label><select className={inputClass} value={p.stage} onChange={(e) => update(p.id, { stage: e.target.value as Stage })} style={{ borderColor: STAGE_COLOR[p.stage] }}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className={labelClass}>Reach at 1st listen</label><input className={inputClass} value={p.reachAtFirstListen} onChange={(e) => update(p.id, { reachAtFirstListen: e.target.value })} placeholder="Spotify monthly listeners / IG followers"/></div>
              <div><label className={labelClass}>Score (0-100)</label><input type="number" min="0" max="100" className={inputClass} value={p.scoreOverall} onChange={(e) => update(p.id, { scoreOverall: Number(e.target.value) || 0 })}/></div>
              <div className="col-span-2"><label className={labelClass}>Next step</label><input className={inputClass} value={p.nextStep} onChange={(e) => update(p.id, { nextStep: e.target.value })}/></div>
              <div><label className={labelClass}>Next step date</label><input type="date" className={inputClass} value={p.nextStepDate} onChange={(e) => update(p.id, { nextStepDate: e.target.value })}/></div>
              <div><label className={labelClass}>Scorecard ref</label><input className={inputClass} value={p.scoreCardLink} onChange={(e) => update(p.id, { scoreCardLink: e.target.value })} placeholder="Vault / file ID"/></div>
              <div className="col-span-2 sm:col-span-4">
                <label className={labelClass}>Notes</label>
                <textarea className={inputClass} rows={2} value={p.notes} onChange={(e) => update(p.id, { notes: e.target.value })} placeholder="What's working, what's a flag, who else is sniffing"/>
              </div>
            </div>
            <button onClick={() => remove(p.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/> Remove</button>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
