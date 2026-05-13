"use client";
import { useMemo } from "react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { useLocale } from "@/context/locale-context";
import { RotateCcw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#EAB308";
const STORAGE_KEY = "roster_advance_recoupment_v1";

interface State {
  advance: number;
  artistRoyaltyRate: number; // % of net receipts
  // earnings ladder
  streamsToDate: number;
  avgPerStream: number; // USD
  syncIncome: number;
  syncToArtistPct: number;
  physicalIncome: number;
  otherIncome: number;
  // recoupable costs that count against the advance
  recoupableCosts: number;
}

const empty: State = {
  advance: 0, artistRoyaltyRate: 18,
  streamsToDate: 0, avgPerStream: 0.0035,
  syncIncome: 0, syncToArtistPct: 50,
  physicalIncome: 0, otherIncome: 0,
  recoupableCosts: 0,
};

export default function AdvanceRecoupmentTrackerPage() {
  const { sym } = useLocale();
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("advance-recoupment-tracker", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: Number(v) || 0 });

  const totals = useMemo(() => {
    const streamingNet = s.streamsToDate * s.avgPerStream;
    const streamingArtistShare = (streamingNet * s.artistRoyaltyRate) / 100;
    const syncArtistShare = (s.syncIncome * s.syncToArtistPct) / 100;
    const physicalArtistShare = (s.physicalIncome * s.artistRoyaltyRate) / 100;
    const otherArtistShare = (s.otherIncome * s.artistRoyaltyRate) / 100;
    const totalArtistEarned = streamingArtistShare + syncArtistShare + physicalArtistShare + otherArtistShare;
    const recoupedToDate = totalArtistEarned;
    const balance = s.advance + s.recoupableCosts - recoupedToDate;
    const pct = s.advance + s.recoupableCosts > 0 ? Math.round((recoupedToDate / (s.advance + s.recoupableCosts)) * 100) : 0;
    const streamsToBreakEven = Math.max(0, balance / (s.avgPerStream * (s.artistRoyaltyRate / 100)));
    return { streamingNet, streamingArtistShare, syncArtistShare, physicalArtistShare, otherArtistShare, totalArtistEarned, balance, pct, streamsToBreakEven };
  }, [s]);

  const fmt = (n: number) => `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const N = ({ label, k, step = 1, hint }: { label: string; k: keyof State; step?: number; hint?: string }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input type="number" step={step} className={inputClass} value={s[k]} onChange={(e) => set(k)(e.target.value)}/>
      {hint && <p className="text-[10px] text-text-muted mt-1">{hint}</p>}
    </div>
  );

  return (
    <ResourcePage
      parentHref="/dashboard/library/royalties"
      parentLabel="Back to Royalties"
      color={COLOR}
      tag="Royalties · Tracker"
      title="Advance Recoupment Tracker"
      intro="Burn-down of the label advance. How many streams / how much sync income to recoupment. The number every artist asks but rarely sees clearly."
      toolbar={<><SaveButton toolSlug="advance-recoupment-tracker" storageKey={STORAGE_KEY} title={`Advance Recoupment Tracker — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>          </>
          }
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Deal terms</p>
        <div className="grid grid-cols-2 gap-4">
          <N label="Total advance" k="advance"/>
          <N label="Artist royalty rate (% of net receipts)" k="artistRoyaltyRate" step={0.5}/>
          <N label="Recoupable label costs (cumulative)" k="recoupableCosts" hint="From Recoupable Cost Tracker"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Income to date</p>
        <div className="grid grid-cols-2 gap-4">
          <N label="Streams to date" k="streamsToDate"/>
          <N label="Avg per-stream rate (USD)" k="avgPerStream" step={0.0001}/>
          <N label="Sync income" k="syncIncome"/>
          <N label="Sync share to artist (%)" k="syncToArtistPct" step={1}/>
          <N label="Physical / merch income" k="physicalIncome"/>
          <N label="Other recoupable income" k="otherIncome"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6" style={{ borderColor: `${COLOR}40` }}>
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Recoupment status</p>
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between"><span className="text-text-muted">Streaming net (gross to label)</span><span className="font-semibold">{fmt(totals.streamingNet)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">→ Artist share at {s.artistRoyaltyRate}%</span><span className="font-semibold">{fmt(totals.streamingArtistShare)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Sync (artist share)</span><span className="font-semibold">{fmt(totals.syncArtistShare)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Physical (artist share)</span><span className="font-semibold">{fmt(totals.physicalArtistShare)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Other (artist share)</span><span className="font-semibold">{fmt(totals.otherArtistShare)}</span></div>
          <div className="flex justify-between border-t border-border pt-2"><span className="text-text-muted">Total artist earned</span><span className="font-bold">{fmt(totals.totalArtistEarned)}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-text-muted mb-1">Recoupment progress</p>
            <p className="text-3xl font-black" style={{ color: COLOR }}>{totals.pct}%</p>
            <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden mt-2">
              <div className="h-full transition-all" style={{ width: `${Math.min(100, totals.pct)}%`, backgroundColor: COLOR }}/>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-muted mb-1">Outstanding</p>
            <p className="text-3xl font-black" style={{ color: totals.balance <= 0 ? COLOR : "var(--text-primary)" }}>{fmt(Math.max(0, totals.balance))}</p>
            <p className="text-[11px] text-text-muted mt-1">~{Math.round(totals.streamsToBreakEven).toLocaleString()} more streams to recoupment</p>
          </div>
        </div>

        {totals.balance <= 0 && (
          <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
            <p className="font-bold text-sm">Advance fully recouped — royalties payable from this point.</p>
          </div>
        )}
      </section>
    </ResourcePage>
  );
}
