"use client";
import { useMemo } from "react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { Printer, RotateCcw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#C9A84C";
const STORAGE_KEY = "roster_artist_scorecard_v1";

interface Score {
  vocalCharisma: number;
  songwriting: number;
  liveDelivery: number;
  workEthic: number;
  cultureFit: number;
  visualIdentity: number;
  audienceFit: number;
  uniqueness: number;
}

interface State {
  artist: string;
  date: string;
  scout: string;
  reachSpotify: string;
  reachAudiomack: string;
  reachTikTok: string;
  reachYouTube: string;
  references: string;
  scores: Score;
  signOrPass: "Sign" | "Develop" | "Pass" | "Pending";
  rationale: string;
  redFlags: string;
  conditions: string;
}

const empty: State = {
  artist: "", date: "", scout: "",
  reachSpotify: "", reachAudiomack: "", reachTikTok: "", reachYouTube: "",
  references: "",
  scores: { vocalCharisma: 0, songwriting: 0, liveDelivery: 0, workEthic: 0, cultureFit: 0, visualIdentity: 0, audienceFit: 0, uniqueness: 0 },
  signOrPass: "Pending", rationale: "", redFlags: "", conditions: "",
};

const DIMENSIONS: Array<[keyof Score, string, string]> = [
  ["vocalCharisma", "Vocal & charisma", "On-stage presence + vocal performance — what hits the crowd in the chest"],
  ["songwriting", "Songwriting / topline strength", "Hook quality, melodic memorability, lyric distinctiveness"],
  ["liveDelivery", "Live delivery", "Show held vs. fell apart; energy curve; band dynamics; crowd response"],
  ["workEthic", "Work ethic & coachability", "Showed up on time, took feedback, demonstrated long-term hunger"],
  ["cultureFit", "Culture fit", "Fits how the team works; honest, easy, professional"],
  ["visualIdentity", "Visual & brand identity", "Distinctive look, owned aesthetic, brand-safe"],
  ["audienceFit", "Audience traction", "Existing audience velocity + market gap they fill"],
  ["uniqueness", "Differentiation", "Why this artist not the 5 lookalikes also on your DM"],
];

export default function ArtistScorecardPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("artist-scorecard", STORAGE_KEY, setS);
  const updateScore = (k: keyof Score, v: number) => setS({ ...s, scores: { ...s.scores, [k]: v } });
  const set = (k: keyof Omit<State, "scores">) => (v: string) => setS({ ...s, [k]: v });

  const total = useMemo(() => Object.values(s.scores).reduce((a, b) => a + b, 0), [s.scores]);
  const max = DIMENSIONS.length * 10;
  const pct = max ? Math.round((total / max) * 100) : 0;

  const recommendation = useMemo(() => {
    if (s.signOrPass !== "Pending") return s.signOrPass;
    if (pct >= 75) return "Sign";
    if (pct >= 60) return "Develop";
    return "Pass";
  }, [pct, s.signOrPass]);

  const recColor = { Sign: "#10B981", Develop: "#F59E0B", Pass: "#EF4444", Pending: "#94A3B8" }[recommendation];

  return (
    <ResourcePage
      parentHref="/dashboard/library/startup"
      parentLabel="Back to Onboarding"
      color={COLOR}
      tag="A&R · Scorecard"
      title="Artist Evaluation Scorecard"
      intro="The structured sign / develop / pass call. Score across 8 dimensions, bake in audience velocity, name the red flags. Make decisions defensible to your team and your own future self."
      toolbar={<><SaveButton toolSlug="artist-scorecard" storageKey={STORAGE_KEY} title={`Artist Scorecard — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/startup/songwriter-camp", label: "Songwriter Camp Programmer" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Identity</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Artist</label><input className={inputClass} value={s.artist} onChange={(e) => set("artist")(e.target.value)}/></div>
          <div><label className={labelClass}>Evaluator</label><input className={inputClass} value={s.scout} onChange={(e) => set("scout")(e.target.value)}/></div>
          <div><label className={labelClass}>Date</label><input type="date" className={inputClass} value={s.date} onChange={(e) => set("date")(e.target.value)}/></div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Audience reach (verified)</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Spotify monthly listeners</label><input className={inputClass} value={s.reachSpotify} onChange={(e) => set("reachSpotify")(e.target.value)} placeholder="Verified count"/></div>
          <div><label className={labelClass}>Audiomack MAU</label><input className={inputClass} value={s.reachAudiomack} onChange={(e) => set("reachAudiomack")(e.target.value)}/></div>
          <div><label className={labelClass}>TikTok followers + engagement</label><input className={inputClass} value={s.reachTikTok} onChange={(e) => set("reachTikTok")(e.target.value)} placeholder="Followers + recent videos avg views"/></div>
          <div><label className={labelClass}>YouTube subs / 28d views</label><input className={inputClass} value={s.reachYouTube} onChange={(e) => set("reachYouTube")(e.target.value)}/></div>
          <div className="col-span-2"><label className={labelClass}>References (artists they remind you of, market position)</label><input className={inputClass} value={s.references} onChange={(e) => set("references")(e.target.value)}/></div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Dimensions (0-10 each)</p>
        <div className="space-y-4">
          {DIMENSIONS.map(([k, name, hint]) => (
            <div key={k}>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>{name}</label>
                <span className="font-bold text-sm" style={{ color: COLOR }}>{s.scores[k]}/10</span>
              </div>
              <input type="range" min="0" max="10" step="1" className="w-full" value={s.scores[k]} onChange={(e) => updateScore(k, Number(e.target.value))}/>
              <p className="text-[10px] text-text-muted mt-1">{hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${COLOR}40` }}>
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Composite</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-text-muted mb-1">Total</p>
            <p className="font-black text-2xl text-text-primary">{total} / {max}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Score %</p>
            <p className="font-black text-2xl" style={{ color: COLOR }}>{pct}%</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Recommendation</p>
            <p className="font-black text-2xl" style={{ color: recColor }}>{recommendation}</p>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Decision narrative</p>
        <div className="space-y-4">
          <div><label className={labelClass}>Sign / Develop / Pass</label><select className={inputClass} value={s.signOrPass} onChange={(e) => set("signOrPass")(e.target.value)}><option>Pending</option><option>Sign</option><option>Develop</option><option>Pass</option></select></div>
          <div><label className={labelClass}>Rationale (the story, not the score)</label><textarea className={inputClass} rows={3} value={s.rationale} onChange={(e) => set("rationale")(e.target.value)} placeholder="What this artist is uniquely positioned to do, and why now."/></div>
          <div><label className={labelClass}>Red flags</label><textarea className={inputClass} rows={3} value={s.redFlags} onChange={(e) => set("redFlags")(e.target.value)} placeholder="Anything that would kill the deal — work ethic, family situation, prior commitments, legal."/></div>
          <div><label className={labelClass}>Conditions to sign (if Sign / Develop)</label><textarea className={inputClass} rows={2} value={s.conditions} onChange={(e) => set("conditions")(e.target.value)} placeholder="Specific deliverables / behaviour checkpoints before commitment."/></div>
        </div>
      </section>
    </ResourcePage>
  );
}
