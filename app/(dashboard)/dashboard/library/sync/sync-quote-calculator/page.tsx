"use client";
import { useMemo } from "react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { RotateCcw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#22D3EE";
const STORAGE_KEY = "roster_sync_quote_calc_v1";

interface State {
  baseFloor: number;
  useType: "Background" | "Featured background" | "Visual vocal" | "Featured / hero" | "End title / theme";
  duration: "≤30s" | "30-60s" | "60-120s" | "Full song";
  territory: "Single market" | "Region (e.g. SA+NG)" | "Worldwide";
  media: "AVOD only" | "SVOD" | "All Media digital" | "All Media inc. theatrical & broadcast" | "Trailer / promo";
  term: "1 yr" | "3 yr" | "5 yr" | "10 yr" | "Perpetuity";
  exclusivity: "Non-exclusive" | "Exclusive within media" | "Industry-exclusive";
  budgetTier: "Indie / festival film" | "Mid-budget series / brand" | "Major film / global ad" | "Tentpole / Super Bowl";
  artistCachet: "Emerging" | "Mid" | "Established" | "Superstar";
}

const empty: State = {
  baseFloor: 5000,
  useType: "Featured background",
  duration: "30-60s",
  territory: "Worldwide",
  media: "All Media digital",
  term: "Perpetuity",
  exclusivity: "Non-exclusive",
  budgetTier: "Mid-budget series / brand",
  artistCachet: "Mid",
};

const MULT = {
  useType: { Background: 0.7, "Featured background": 1.0, "Visual vocal": 1.4, "Featured / hero": 1.8, "End title / theme": 2.2 } as const,
  duration: { "≤30s": 0.7, "30-60s": 1.0, "60-120s": 1.3, "Full song": 1.6 } as const,
  territory: { "Single market": 0.5, "Region (e.g. SA+NG)": 0.75, "Worldwide": 1.0 } as const,
  media: { "AVOD only": 0.65, "SVOD": 0.85, "All Media digital": 1.0, "All Media inc. theatrical & broadcast": 1.4, "Trailer / promo": 1.6 } as const,
  term: { "1 yr": 0.5, "3 yr": 0.75, "5 yr": 0.9, "10 yr": 1.1, "Perpetuity": 1.3 } as const,
  exclusivity: { "Non-exclusive": 1.0, "Exclusive within media": 1.5, "Industry-exclusive": 2.5 } as const,
  budgetTier: { "Indie / festival film": 0.5, "Mid-budget series / brand": 1.0, "Major film / global ad": 2.5, "Tentpole / Super Bowl": 6.0 } as const,
  artistCachet: { Emerging: 0.7, Mid: 1.0, Established: 1.6, Superstar: 3.0 } as const,
} as const;

export default function SyncQuoteCalculatorPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("sync-quote-calculator", STORAGE_KEY, setS);
  const set = <K extends keyof State>(k: K) => (v: State[K]) => setS({ ...s, [k]: v });

  const factors = useMemo(() => ({
    useType: MULT.useType[s.useType],
    duration: MULT.duration[s.duration],
    territory: MULT.territory[s.territory],
    media: MULT.media[s.media],
    term: MULT.term[s.term],
    exclusivity: MULT.exclusivity[s.exclusivity],
    budgetTier: MULT.budgetTier[s.budgetTier],
    artistCachet: MULT.artistCachet[s.artistCachet],
  }), [s]);

  const totalMult = Object.values(factors).reduce<number>((a, b) => a * b, 1);
  const allInQuote = s.baseFloor * totalMult;
  const masterShare = allInQuote / 2;
  const compShare = allInQuote / 2;

  const fmt = (n: number) => `USD ${Math.round(n).toLocaleString()}`;

  const Choice = <K extends keyof State>({ k, opts }: { k: K; opts: readonly State[K][] }) => (
    <select className={inputClass} value={s[k] as string} onChange={(e) => set(k)(e.target.value as State[K])}>
      {opts.map((o) => <option key={o as string}>{o as string}</option>)}
    </select>
  );

  return (
    <ResourcePage
      parentHref="/dashboard/library/sync"
      parentLabel="Back to Sync"
      color={COLOR}
      tag="Sync · Calculator"
      title="Sync Quote Calculator"
      intro="A defensible starting number, every time. Multipliers based on industry-standard sync rate cards. Always negotiate up from here, never down."
      toolbar={<><SaveButton toolSlug="sync-quote-calculator" storageKey={STORAGE_KEY} title={`Sync Quote Calculator — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1">
          <RotateCcw size={13} /> Reset
        </button>
            </>
      }
      next={{ href: "/dashboard/library/sync/ai-sync-pitch-drafter", label: "AI Sync Pitch Drafter" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Inputs</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Base floor (USD)</label>
            <input type="number" className={inputClass} value={s.baseFloor}
              onChange={(e) => set("baseFloor")(Number(e.target.value) || 0)} />
            <p className="text-[10px] text-text-muted mt-1">Default 5,000 — your sync floor in USD</p>
          </div>
          <div><label className={labelClass}>Use type</label><Choice k="useType" opts={["Background","Featured background","Visual vocal","Featured / hero","End title / theme"] as const}/></div>
          <div><label className={labelClass}>Duration</label><Choice k="duration" opts={["≤30s","30-60s","60-120s","Full song"] as const}/></div>
          <div><label className={labelClass}>Territory</label><Choice k="territory" opts={["Single market","Region (e.g. SA+NG)","Worldwide"] as const}/></div>
          <div><label className={labelClass}>Media</label><Choice k="media" opts={["AVOD only","SVOD","All Media digital","All Media inc. theatrical & broadcast","Trailer / promo"] as const}/></div>
          <div><label className={labelClass}>Term</label><Choice k="term" opts={["1 yr","3 yr","5 yr","10 yr","Perpetuity"] as const}/></div>
          <div><label className={labelClass}>Exclusivity</label><Choice k="exclusivity" opts={["Non-exclusive","Exclusive within media","Industry-exclusive"] as const}/></div>
          <div><label className={labelClass}>Budget tier</label><Choice k="budgetTier" opts={["Indie / festival film","Mid-budget series / brand","Major film / global ad","Tentpole / Super Bowl"] as const}/></div>
          <div><label className={labelClass}>Artist cachet</label><Choice k="artistCachet" opts={["Emerging","Mid","Established","Superstar"] as const}/></div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${COLOR}40` }}>
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Suggested quote</p>
        <p className="text-4xl font-black" style={{ color: COLOR }}>{fmt(allInQuote)}</p>
        <p className="text-xs text-text-muted mt-1">All-in (master + composition)</p>
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">Master share</p>
            <p className="text-xl font-bold text-text-primary">{fmt(masterShare)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">Composition share</p>
            <p className="text-xl font-bold text-text-primary">{fmt(compShare)}</p>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Multiplier breakdown</p>
        <div className="space-y-2 text-sm">
          {Object.entries(factors).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-1 border-b border-border last:border-b-0">
              <span className="text-text-muted capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
              <span className="font-semibold text-text-primary">×{(v as number).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center py-2 mt-2 font-bold">
            <span style={{ color: COLOR }}>Total multiplier</span>
            <span style={{ color: COLOR }}>×{totalMult.toFixed(2)}</span>
          </div>
        </div>
        <p className="text-[11px] text-text-muted mt-4 leading-relaxed">
          Calculator is a starting reference, not a binding quote. Sync deals carry industry conventions (MFN, hold periods, options, second-window) that the calculator doesn't model. Use the Quote Letter tool to communicate the number once you've decided.
        </p>
      </section>
    </ResourcePage>
  );
}
