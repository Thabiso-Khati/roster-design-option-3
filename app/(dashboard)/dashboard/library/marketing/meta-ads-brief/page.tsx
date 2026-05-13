"use client";
import { useMemo } from "react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { RotateCcw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#8B5CF6";
const STORAGE_KEY = "roster_meta_ads_brief_v1";

interface State {
  campaignName: string; objective: string;
  totalBudget: number; durationDays: number;
  countries: string;
  ageMin: number; ageMax: number; gender: string;
  interests: string;
  customAudience: string;
  lookalike: string;
  formats: string;
  creatives: string;
  pixelEvent: string;
  catalogTracking: string;
  utm: string;
  notes: string;
}

const empty: State = {
  campaignName: "", objective: "Streams / pre-saves",
  totalBudget: 5000, durationDays: 14,
  countries: "South Africa, Nigeria",
  ageMin: 18, ageMax: 34, gender: "All",
  interests: "Amapiano, Afrobeats, Spotify, similar-artist fanbase (e.g. Tyla, Asake)",
  customAudience: "Existing email list (CSV upload), past website visitors (last 90 days)",
  lookalike: "Lookalike of past purchasers / pre-savers (1% LAL, expand to 3%)",
  formats: "Reels (9:16, 15s + 30s), Feed (4:5, 15s), Stories (9:16, 15s)",
  creatives: "3 creatives × 2 hook variations = 6 ad-set variants. Test for 5 days, kill the bottom 50%.",
  pixelEvent: "Spotify pre-save click → custom event \"PRE_SAVE\" via UTM",
  catalogTracking: "Catalog uploaded if running ROAS-tracked merch / ticket campaign",
  utm: "utm_source=meta&utm_medium=paid_social&utm_campaign={campaign}&utm_content={ad_name}",
  notes: "",
};

export default function MetaAdsBriefPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("meta-ads-brief", STORAGE_KEY, setS);
  const num = (k: keyof State) => (v: string) => setS({ ...s, [k]: Number(v) || 0 });
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  const dailyBudget = useMemo(() => s.durationDays > 0 ? s.totalBudget / s.durationDays : 0, [s.totalBudget, s.durationDays]);
  const cpmEstimate = 50; // R50 CPM low-end ZA estimate
  const reachEstimate = (s.totalBudget * 1000) / cpmEstimate;
  const ctrEstimate = 0.025;
  const clicksEstimate = reachEstimate * ctrEstimate;
  const conversionRateEstimate = 0.10;
  const conversionsEstimate = clicksEstimate * conversionRateEstimate;
  const cpcEstimate = clicksEstimate > 0 ? s.totalBudget / clicksEstimate : 0;

  const N = ({ label, k, hint }: { label: string; k: keyof State; hint?: string }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input type="number" className={inputClass} value={s[k]} onChange={(e) => num(k)(e.target.value)}/>
      {hint && <p className="text-[10px] text-text-muted mt-1">{hint}</p>}
    </div>
  );

  const F = ({ label, k, rows, placeholder }: { label: string; k: keyof State; rows?: number; placeholder?: string }) => (
    <div>
      <label className={labelClass}>{label}</label>
      {rows ? <textarea className={inputClass} rows={rows} value={s[k] as string} onChange={(e) => set(k)(e.target.value)} placeholder={placeholder}/>
            : <input className={inputClass} value={s[k] as string} onChange={(e) => set(k)(e.target.value)} placeholder={placeholder}/>}
    </div>
  );

  return (
    <ResourcePage
      parentHref="/dashboard/library/marketing"
      parentLabel="Back to Marketing"
      color={COLOR}
      tag="Marketing · Brief"
      title="Meta Ads Brief"
      intro="Brief for media-buyer or self-serve campaign on Facebook / Instagram. Targeting + creatives + tracking + budget envelope. Pairs with the Marketing Forecast tool."
      toolbar={<><SaveButton toolSlug="meta-ads-brief" storageKey={STORAGE_KEY} title={`Meta Ads Brief — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>          </>
          }
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Campaign</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Campaign name" k="campaignName"/>
          <F label="Objective" k="objective" placeholder="Streams / pre-saves / merch / tickets / fan-list growth"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Budget & duration</p>
        <div className="grid grid-cols-2 gap-4">
          <N label="Total budget (R)" k="totalBudget"/>
          <N label="Duration (days)" k="durationDays"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Targeting</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Countries / regions" k="countries"/>
          <div className="grid grid-cols-3 gap-2">
            <N label="Age min" k="ageMin"/>
            <N label="Age max" k="ageMax"/>
            <div><label className={labelClass}>Gender</label><select className={inputClass} value={s.gender} onChange={(e) => set("gender")(e.target.value)}><option>All</option><option>Female</option><option>Male</option></select></div>
          </div>
          <F label="Interests" k="interests" rows={2}/>
          <F label="Custom audiences" k="customAudience" rows={2}/>
          <F label="Lookalikes" k="lookalike" rows={2}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Creatives & formats</p>
        <div className="space-y-4">
          <F label="Formats" k="formats" rows={2}/>
          <F label="Creative testing plan" k="creatives" rows={3}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Tracking</p>
        <div className="space-y-4">
          <F label="Pixel / conversion event" k="pixelEvent"/>
          <F label="Catalog (if applicable)" k="catalogTracking"/>
          <F label="UTM template" k="utm"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${COLOR}40` }}>
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Performance forecast (rough)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-text-muted text-xs mb-1">Daily budget</p><p className="font-bold text-text-primary">R{Math.round(dailyBudget).toLocaleString()}</p></div>
          <div><p className="text-text-muted text-xs mb-1">Est. reach</p><p className="font-bold text-text-primary">{Math.round(reachEstimate).toLocaleString()}</p></div>
          <div><p className="text-text-muted text-xs mb-1">Est. clicks (~2.5% CTR)</p><p className="font-bold text-text-primary">{Math.round(clicksEstimate).toLocaleString()}</p></div>
          <div><p className="text-text-muted text-xs mb-1">Est. conversions (~10%)</p><p className="font-bold" style={{ color: COLOR }}>{Math.round(conversionsEstimate).toLocaleString()}</p></div>
          <div><p className="text-text-muted text-xs mb-1">Est. CPM (ZA)</p><p className="font-bold text-text-primary">R{cpmEstimate}</p></div>
          <div><p className="text-text-muted text-xs mb-1">Est. CPC</p><p className="font-bold text-text-primary">R{cpcEstimate.toFixed(2)}</p></div>
        </div>
        <p className="text-[10px] text-text-muted mt-3">Estimates assume R50 CPM (low end ZA market), 2.5% CTR (industry average), 10% click-to-action conversion. Adjust based on past performance.</p>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Notes</p>
        <F label="" k="notes" rows={3} placeholder="Brand-safety constraints, blackout dates, A/B testing rules"/>
      </section>
    </ResourcePage>
  );
}
