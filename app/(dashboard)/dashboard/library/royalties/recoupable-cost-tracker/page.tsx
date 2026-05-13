"use client";
import { Plus, Trash2 } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { useLocale } from "@/context/locale-context";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#EAB308";
const STORAGE_KEY = "roster_recoupable_v1";

interface Cost {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  recoupable: "Yes" | "No" | "Partial";
  partialPct: number;
  paidBy: string;
  invoiceRef: string;
}

const newCost = (): Cost => ({
  id: Math.random().toString(36).slice(2, 8),
  date: "", category: "Recording", description: "", amount: 0,
  recoupable: "Yes", partialPct: 100, paidBy: "Label", invoiceRef: "",
});

const CATEGORIES = ["Recording", "Mixing & mastering", "Producer fees", "Music video", "Photography", "Marketing & PR", "Tour support", "Travel", "Touring (rider, hospitality)", "Manager fees", "Lawyer fees", "Distribution", "Other"];

export default function RecoupableCostTrackerPage() {
  const { sym } = useLocale();
  const [costs, setCosts] = useLocalState<Cost[]>(STORAGE_KEY, []);
  useToolRestore("recoupable-cost-tracker", STORAGE_KEY, setCosts);
  const update = (id: string, p: Partial<Cost>) => setCosts(costs.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const remove = (id: string) => setCosts(costs.filter((c) => c.id !== id));

  const totals = costs.reduce(
    (acc, c) => {
      const recoupAmt = c.recoupable === "Yes" ? c.amount : c.recoupable === "Partial" ? (c.amount * c.partialPct) / 100 : 0;
      return { all: acc.all + c.amount, recoupable: acc.recoupable + recoupAmt, nonRecoup: acc.nonRecoup + (c.amount - recoupAmt) };
    },
    { all: 0, recoupable: 0, nonRecoup: 0 }
  );

  const fmt = (n: number) => `${sym}${Math.round(n).toLocaleString()}`;

  return (
    <ResourcePage
      parentHref="/dashboard/library/royalties"
      parentLabel="Back to Royalties"
      color={COLOR}
      tag="Royalties · Tracker"
      title="Recoupable Cost Tracker"
      intro="Every line item the label spent. Mark each Recoupable / Not Recoupable / Partial. Catches disputes early. Pair with the Advance Recoupment Tracker."
      toolbar={<><SaveButton toolSlug="recoupable-cost-tracker" storageKey={STORAGE_KEY} title={`Recoupable Cost Tracker — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <button onClick={() => setCosts([...costs, newCost()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}><Plus size={13}/> Add cost</button>
            </>
      }
      next={{ href: "/dashboard/library/royalties/advance-recoupment-tracker", label: "Advance Recoupment Tracker" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-xl p-4 text-center"><p className="text-xs text-text-muted mb-1">Total spent</p><p className="font-bold text-text-primary">{fmt(totals.all)}</p></div>
        <div className="glass-card rounded-xl p-4 text-center" style={{ borderColor: `${COLOR}40` }}><p className="text-xs text-text-muted mb-1">Recoupable</p><p className="font-black" style={{ color: COLOR }}>{fmt(totals.recoupable)}</p></div>
        <div className="glass-card rounded-xl p-4 text-center"><p className="text-xs text-text-muted mb-1">Non-recoupable</p><p className="font-bold text-text-primary">{fmt(totals.nonRecoup)}</p></div>
      </div>

      {costs.length === 0 && <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">No costs tracked.</div>}

      <div className="space-y-3">
        {costs.map((c) => (
          <div key={c.id} className="glass-card rounded-2xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-2">
              <div><label className={labelClass}>Date</label><input type="date" className={inputClass} value={c.date} onChange={(e) => update(c.id, { date: e.target.value })}/></div>
              <div><label className={labelClass}>Category</label><select className={inputClass} value={c.category} onChange={(e) => update(c.id, { category: e.target.value })}>{CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}</select></div>
              <div className="col-span-2"><label className={labelClass}>Description</label><input className={inputClass} value={c.description} onChange={(e) => update(c.id, { description: e.target.value })}/></div>
              <div><label className={labelClass}>Amount</label><input type="number" className={inputClass} value={c.amount} onChange={(e) => update(c.id, { amount: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>Recoupable</label><select className={inputClass} value={c.recoupable} onChange={(e) => update(c.id, { recoupable: e.target.value as Cost["recoupable"] })}><option>Yes</option><option>No</option><option>Partial</option></select></div>
              {c.recoupable === "Partial" && <div><label className={labelClass}>Recoupable %</label><input type="number" className={inputClass} value={c.partialPct} onChange={(e) => update(c.id, { partialPct: Number(e.target.value) || 0 })}/></div>}
              <div><label className={labelClass}>Paid by</label><select className={inputClass} value={c.paidBy} onChange={(e) => update(c.id, { paidBy: e.target.value })}><option>Label</option><option>Distributor</option><option>Artist</option><option>Manager</option></select></div>
              <div><label className={labelClass}>Invoice ref</label><input className={inputClass} value={c.invoiceRef} onChange={(e) => update(c.id, { invoiceRef: e.target.value })}/></div>
            </div>
            <button onClick={() => remove(c.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={12}/> Remove</button>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
