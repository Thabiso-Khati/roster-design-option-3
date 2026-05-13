"use client";
import { Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#8B5CF6";
const STORAGE_KEY = "roster_tour_sponsorship_deck_v1";

interface State {
  artist: string; tourName: string; dates: string; cities: string; expectedReach: string;
  positioning: string; audienceProfile: string;
  tierA: string; tierB: string; tierC: string;
  activations: string; mediaValue: string;
  contact: string;
}

const empty: State = {
  artist: "", tourName: "", dates: "", cities: "",
  expectedReach: "Total tour capacity 12,500 across 4 cities; broadcast reach 2.4M (verified)",
  positioning: "Africa's premier amapiano summer tour. Mid-20s urban audience, Tier-1 AB demographics.",
  audienceProfile: "Primary: 18-34 / urban / monthly streamers / 65% women / R5,000+ HHI. Secondary: 35-45 / first-time amapiano live attendees.",
  tierA: "Title sponsor — naming rights, R500,000-R1.5M\n  • Tour named '[Brand] presents [Artist] — [Tour Name]'\n  • Logo on all marketing\n  • Onstage activation per show\n  • 30-second sponsor mention in artist's pre-tour interview pack\n  • Exclusive product placement in artist's SM content\n  • 500 tickets per city for sponsor distribution",
  tierB: "Presenting sponsor — co-branding, R250,000-R500,000\n  • '[Tour Name] presented by [Brand]'\n  • Logo on top tier of marketing\n  • Branded VIP zone activation\n  • 200 tickets per city",
  tierC: "Supporting sponsor — category exclusivity, R50,000-R150,000\n  • Category exclusivity (e.g. official beverage)\n  • Logo on lower tier of marketing\n  • On-site activation booth\n  • 50 tickets per city",
  activations: "Pre-show fan-zone branding, in-venue product sampling, behind-the-scenes content rights, post-tour social asset library, content collaboration with artist (3 posts).",
  mediaValue: "Estimated EAV (Equivalent Advertising Value) breakdown: Out-of-Home R120k, Press R85k, Digital R175k, Influencer R220k = R600k+ in earned media equivalent.",
  contact: "",
};

const F = ({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {rows ? <textarea className={inputClass} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
          : <input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
  </div>
);

export default function TourSponsorshipDeckPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("tour-sponsorship-deck", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  return (
    <ResourcePage
      parentHref="/dashboard/library/marketing"
      parentLabel="Back to Marketing"
      color={COLOR}
      tag="Marketing · Pitch deck"
      title="Tour Sponsorship Pitch Deck"
      intro="Lead-gen document for brand partnerships before tour confirmation. Cover the audience, the tiers, the activations, the media value. One-pager / 4-page format."
      toolbar={<><SaveButton toolSlug="tour-sponsorship-deck" storageKey={STORAGE_KEY} title={`Tour Sponsorship Deck — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/marketing/meta-ads-brief", label: "Meta Ads Brief" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Tour identity</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Artist" value={s.artist} onChange={set("artist")}/>
          <F label="Tour name" value={s.tourName} onChange={set("tourName")}/>
          <F label="Dates" value={s.dates} onChange={set("dates")}/>
          <F label="Cities" value={s.cities} onChange={set("cities")}/>
        </div>
        <div className="mt-4">
          <F label="Expected reach (verified)" value={s.expectedReach} onChange={set("expectedReach")} rows={2}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Positioning & audience</p>
        <div className="space-y-4">
          <F label="One-line positioning" value={s.positioning} onChange={set("positioning")} rows={2}/>
          <F label="Audience profile" value={s.audienceProfile} onChange={set("audienceProfile")} rows={3}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Sponsorship tiers</p>
        <div className="space-y-4">
          <F label="Tier A — Title" value={s.tierA} onChange={set("tierA")} rows={6}/>
          <F label="Tier B — Presenting" value={s.tierB} onChange={set("tierB")} rows={5}/>
          <F label="Tier C — Supporting" value={s.tierC} onChange={set("tierC")} rows={5}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Activations & value</p>
        <div className="space-y-4">
          <F label="Activations included" value={s.activations} onChange={set("activations")} rows={3}/>
          <F label="Estimated media value" value={s.mediaValue} onChange={set("mediaValue")} rows={3}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Contact</p>
        <F label="Contact block" value={s.contact} onChange={set("contact")} rows={3} placeholder="Manager / brand-partnerships lead — name, role, email, phone"/>
      </section>
    </ResourcePage>
  );
}
