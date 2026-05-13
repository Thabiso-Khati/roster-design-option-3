"use client";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { useLocale } from "@/context/locale-context";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#EAB308";
const STORAGE_KEY = "roster_royalty_recon_v1";

interface Line {
  id: string;
  source: string;       // Spotify, Apple, YouTube, distributor
  period: string;       // 2026 H1
  reportedGross: number;
  expectedGross: number; // your tracker's number
  withholding: number;
  fees: number;
  reportedNet: number;
  expectedNet: number;
  notes: string;
}

const newLine = (): Line => ({
  id: Math.random().toString(36).slice(2, 8),
  source: "Spotify (via distributor)",
  period: "",
  reportedGross: 0,
  expectedGross: 0,
  withholding: 0,
  fees: 0,
  reportedNet: 0,
  expectedNet: 0,
  notes: "",
});

export default function RoyaltyStatementReconciliationPage() {
  const { sym } = useLocale();
  const [lines, setLines] = useLocalState<Line[]>(STORAGE_KEY, []);
  useToolRestore("royalty-statement-reconciliation", STORAGE_KEY, setLines);
  const update = (id: string, p: Partial<Line>) => setLines(lines.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const remove = (id: string) => setLines(lines.filter((l) => l.id !== id));

  const totalReportedNet = lines.reduce((a, l) => a + l.reportedNet, 0);
  const totalExpectedNet = lines.reduce((a, l) => a + l.expectedNet, 0);
  const variance = totalReportedNet - totalExpectedNet;
  const variancePct = totalExpectedNet ? Math.round((variance / totalExpectedNet) * 100) : 0;
  const fmt = (n: number) => `${sym}${Math.round(n).toLocaleString()}`;

  return (
    <ResourcePage
      parentHref="/dashboard/library/royalties"
      parentLabel="Back to Royalties"
      color={COLOR}
      tag="Royalties · Recon"
      title="Royalty Statement Reconciliation"
      intro="Compare what the label / distributor reported vs. what your tracker said you earned. Variance over 5% is grounds to query. Variance over 10% is grounds to audit."
      toolbar={<><SaveButton toolSlug="royalty-statement-reconciliation" storageKey={STORAGE_KEY} title={`Royalty Statement Reconciliation — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setLines([...lines, newLine()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}><Plus size={13}/> Add line</button>
          <button onClick={() => setLines([])} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Clear</button>
        </>
            </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs text-text-muted mb-1">Reported net</p>
          <p className="font-bold text-text-primary">{fmt(totalReportedNet)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs text-text-muted mb-1">Expected net</p>
          <p className="font-bold text-text-primary">{fmt(totalExpectedNet)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center" style={{ borderColor: `${variance < 0 ? "#EF4444" : COLOR}40` }}>
          <p className="text-xs text-text-muted mb-1">Variance</p>
          <p className="font-black text-lg" style={{ color: variance < 0 ? "#EF4444" : COLOR }}>{fmt(variance)} <span className="text-xs">({variancePct}%)</span></p>
        </div>
      </div>

      {lines.length === 0 && <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">No reconciliation lines yet.</div>}

      <div className="space-y-3">
        {lines.map((l) => (
          <div key={l.id} className="glass-card rounded-2xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
              <div><label className={labelClass}>Source</label><input className={inputClass} value={l.source} onChange={(e) => update(l.id, { source: e.target.value })}/></div>
              <div><label className={labelClass}>Period</label><input className={inputClass} value={l.period} onChange={(e) => update(l.id, { period: e.target.value })} placeholder="2026 H1"/></div>
              <div><label className={labelClass}>Reported gross</label><input type="number" className={inputClass} value={l.reportedGross} onChange={(e) => update(l.id, { reportedGross: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>Expected gross</label><input type="number" className={inputClass} value={l.expectedGross} onChange={(e) => update(l.id, { expectedGross: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>WHT</label><input type="number" className={inputClass} value={l.withholding} onChange={(e) => update(l.id, { withholding: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>Other fees</label><input type="number" className={inputClass} value={l.fees} onChange={(e) => update(l.id, { fees: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>Reported net</label><input type="number" className={inputClass} value={l.reportedNet} onChange={(e) => update(l.id, { reportedNet: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>Expected net</label><input type="number" className={inputClass} value={l.expectedNet} onChange={(e) => update(l.id, { expectedNet: Number(e.target.value) || 0 })}/></div>
              <div className="col-span-2 sm:col-span-4">
                <label className={labelClass}>Notes</label>
                <textarea className={inputClass} rows={2} value={l.notes} onChange={(e) => update(l.id, { notes: e.target.value })} placeholder="Statement reference, dispute notes, follow-up date"/>
              </div>
            </div>
            <button onClick={() => remove(l.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={12}/> Remove</button>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
