"use client";
import { Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#F472B6";
const STORAGE_KEY = "roster_awards_bio_pack_v1";

interface State {
  artist: string; submittingFor: string; category: string;
  bio50: string; bio100: string; bio250: string; bio500: string;
  recentMilestones: string;
  eligibilityCriteria: string;
  trackList: string;
  audioDelivery: string; videoDelivery: string; pressLinks: string;
  streamingStats: string;
  pressQuotes: string;
  awardHistory: string;
  contact: string;
}

const empty: State = {
  artist: "", submittingFor: "", category: "",
  bio50: "", bio100: "", bio250: "", bio500: "",
  recentMilestones: "Tour cities + crowd sizes / streaming milestones / press features (verified) / chart positions / playlist placements (with sizes)",
  eligibilityCriteria: "Confirm dates of recording/release fall within submission window. Confirm regional eligibility (most African awards require ZA/NG/etc. nationality OR significant regional presence).",
  trackList: "List per category — singles or album titles + ISRC + length + writer credits + producer credits + release date",
  audioDelivery: "WAV 24-bit/48kHz at the format the award accepts (some require MP3 320kbps; some require explicit + clean versions)",
  videoDelivery: "Music videos in 1080p H.264 MP4. Live performances in same. No watermarks, no DSP logos in screen overlays.",
  pressLinks: "Top 5 press features with publication, headline, link, date — only verified, publication-grade outlets",
  streamingStats: "Verified stats only — Spotify monthly listeners, Audiomack MAU, YouTube subs + 28d views, TikTok engagement. Pull from Artist Audience Report.",
  pressQuotes: "Top 3 press quotes with publication + journalist + date.",
  awardHistory: "All prior awards / nominations relevant to this submission — gives the voting body context.",
  contact: "Manager / publicist / submissions-coordinator name + email + phone",
};

const F = ({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {rows ? <textarea className={inputClass} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
          : <input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
  </div>
);

export default function AwardsBioPackPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("awards-bio-pack", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  return (
    <ResourcePage
      parentHref="/dashboard/library/pr-press"
      parentLabel="Back to PR, Press and Awards"
      color={COLOR}
      tag="PR · Awards"
      title="Awards Bio + EPK Pack"
      intro="The pack you bundle with every award submission. Different lengths of bio, audio + video specs, press quotes, streaming stats. Build once per cycle, re-version per award."
      toolbar={<><SaveButton toolSlug="awards-bio-pack" storageKey={STORAGE_KEY} title={`Awards Bio Pack — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Header</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Artist" value={s.artist} onChange={set("artist")}/>
          <F label="Submitting for" value={s.submittingFor} onChange={set("submittingFor")} placeholder="Award name + year"/>
          <F label="Category / categories" value={s.category} onChange={set("category")}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Bios (4 lengths)</p>
        <div className="space-y-4">
          <F label="50-word bio (programme card)" value={s.bio50} onChange={set("bio50")} rows={2}/>
          <F label="100-word bio (judge sheet)" value={s.bio100} onChange={set("bio100")} rows={3}/>
          <F label="250-word bio (full submission)" value={s.bio250} onChange={set("bio250")} rows={6}/>
          <F label="500-word bio (extended press / archive)" value={s.bio500} onChange={set("bio500")} rows={9}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Eligibility & track list</p>
        <div className="space-y-4">
          <F label="Eligibility criteria notes" value={s.eligibilityCriteria} onChange={set("eligibilityCriteria")} rows={3}/>
          <F label="Track list" value={s.trackList} onChange={set("trackList")} rows={4}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Deliverables</p>
        <div className="space-y-4">
          <F label="Audio delivery" value={s.audioDelivery} onChange={set("audioDelivery")} rows={2}/>
          <F label="Video delivery" value={s.videoDelivery} onChange={set("videoDelivery")} rows={2}/>
          <F label="Press links (top 5)" value={s.pressLinks} onChange={set("pressLinks")} rows={4}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Verified credentials</p>
        <div className="space-y-4">
          <F label="Streaming stats (verified)" value={s.streamingStats} onChange={set("streamingStats")} rows={3}/>
          <F label="Press quotes (top 3)" value={s.pressQuotes} onChange={set("pressQuotes")} rows={4}/>
          <F label="Award history" value={s.awardHistory} onChange={set("awardHistory")} rows={3}/>
          <F label="Submission contact" value={s.contact} onChange={set("contact")}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Recent milestones</p>
        <F label="" value={s.recentMilestones} onChange={set("recentMilestones")} rows={4}/>
      </section>
    </ResourcePage>
  );
}
