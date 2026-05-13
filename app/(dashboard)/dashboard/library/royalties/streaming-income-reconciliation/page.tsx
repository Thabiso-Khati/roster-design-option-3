"use client";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { useLocale } from "@/context/locale-context";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#EAB308";
const STORAGE_KEY = "roster_streaming_recon_v1";

// Industry-published average per-stream rates (USD). Always vary by territory mix
// and pay tier; these are anchor benchmarks managers should challenge per period.
const PER_STREAM = {
  Spotify: 0.0035,
  "Apple Music": 0.008,
  "YouTube Music (premium)": 0.006,
  "YouTube CMS (ad)": 0.0009,
  Audiomack: 0.0028,
  Boomplay: 0.0009,
  Deezer: 0.0048,
  Tidal: 0.0125,
  Mdundo: 0.0015,
  Anghami: 0.0017,
  Other: 0.003,
};

interface Line {
  id: string;
  track: string;
  isrc: string;
  platform: keyof typeof PER_STREAM;
  streams: number;
  reportedPayout: number;
  override: number; // override per-stream rate (0 = use default)
}

const newLine = (): Line => ({
  id: Math.random().toString(36).slice(2, 8),
  track: "", isrc: "", platform: "Spotify", streams: 0, reportedPayout: 0, override: 0,
});

export default function StreamingIncomeReconciliationPage() {
  const { sym } = useLocale();
  const [lines, setLines] = useLocalState<Line[]>(STORAGE_KEY, []);
  useToolRestore("streaming-income-reconciliation", STORAGE_KEY, setLines);
  const update = (id: string, p: Partial<Line>) => setLines(lines.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const remove = (id: string) => setLines(lines.filter((l) => l.id !== id));

  const totals = lines.reduce(
    (acc, l) => {
      const rate = l.override > 0 ? l.override : PER_STREAM[l.platform];
      const expected = l.streams * rate;
      return { streams: acc.streams + l.streams, expected: acc.expected + expected, reported: acc.reported + l.reportedPayout };
    },
    { streams: 0, expected: 0, reported: 0 }
  );

  const variance = totals.reported - totals.expected;
  const variancePct = totals.expected ? Math.round((variance / totals.expected) * 100) : 0;
  const fmt = (n: number) => `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <ResourcePage
      parentHref="/dashboard/library/royalties"
      parentLabel="Back to Royalties"
      color={COLOR}
      tag="Royalties · Recon"
      title="Streaming Income Reconciliation"
      intro="Per-track per-platform stream count × industry-benchmark rate vs. reported payout. Catches the under-payment. Per-stream rates are anchor benchmarks (USD)."
      toolbar={<><SaveButton toolSlug="streaming-income-reconciliation" storageKey={STORAGE_KEY} title={`Streaming Income Reconciliation — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setLines([...lines, newLine()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}><Plus size={13}/> Add line</button>
          <button onClick={() => setLines([])} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Clear</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/royalties/recoupable-cost-tracker", label: "Recoupable Cost Tracker" }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs text-text-muted mb-1">Total streams</p>
          <p className="font-bold text-text-primary">{totals.streams.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs text-text-muted mb-1">Expected (benchmark)</p>
          <p className="font-bold text-text-primary">{fmt(totals.expected)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs text-text-muted mb-1">Reported payout</p>
          <p className="font-bold text-text-primary">{fmt(totals.reported)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center" style={{ borderColor: `${variance < 0 ? "#EF4444" : COLOR}40` }}>
          <p className="text-xs text-text-muted mb-1">Variance</p>
          <p className="font-black" style={{ color: variance < 0 ? "#EF4444" : COLOR }}>{fmt(variance)} ({variancePct}%)</p>
        </div>
      </div>

      <div className="space-y-3">
        {lines.map((l) => {
          const rate = l.override > 0 ? l.override : PER_STREAM[l.platform];
          const expected = l.streams * rate;
          const lineVar = l.reportedPayout - expected;
          return (
            <div key={l.id} className="glass-card rounded-2xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-2">
                <div className="col-span-2"><label className={labelClass}>Track</label><input className={inputClass} value={l.track} onChange={(e) => update(l.id, { track: e.target.value })}/></div>
                <div><label className={labelClass}>ISRC</label><input className={inputClass} value={l.isrc} onChange={(e) => update(l.id, { isrc: e.target.value })}/></div>
                <div><label className={labelClass}>Platform</label><select className={inputClass} value={l.platform} onChange={(e) => update(l.id, { platform: e.target.value as Line["platform"] })}>{Object.keys(PER_STREAM).map((p) => <option key={p}>{p}</option>)}</select></div>
                <div><label className={labelClass}>Streams</label><input type="number" className={inputClass} value={l.streams} onChange={(e) => update(l.id, { streams: Number(e.target.value) || 0 })}/></div>
                <div><label className={labelClass}>Reported pay</label><input type="number" step="0.01" className={inputClass} value={l.reportedPayout} onChange={(e) => update(l.id, { reportedPayout: Number(e.target.value) || 0 })}/></div>
                <div><label className={labelClass}>Override rate</label><input type="number" step="0.0001" className={inputClass} value={l.override} onChange={(e) => update(l.id, { override: Number(e.target.value) || 0 })} placeholder={`${PER_STREAM[l.platform]}`}/></div>
                <div className="col-span-2 sm:col-span-3 text-xs">
                  <p className="text-text-muted mt-2">Rate used: <span className="font-semibold text-text-primary">${rate}</span> · Expected: <span className="font-semibold text-text-primary">{fmt(expected)}</span> · Variance: <span className="font-bold" style={{ color: lineVar < 0 ? "#EF4444" : COLOR }}>{fmt(lineVar)}</span></p>
                </div>
              </div>
              <button onClick={() => remove(l.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={12}/> Remove</button>
            </div>
          );
        })}
        {lines.length === 0 && <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">Add a line to start.</div>}
      </div>
    </ResourcePage>
  );
}
