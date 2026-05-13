"use client";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#FB923C";
const STORAGE_KEY = "roster_tour_merch_inventory_v1";

interface SKU {
  id: string;
  sku: string; name: string; size: string; cost: number; price: number;
  opening: number; restocked: number; sold: number; comp: number; damaged: number;
}

const newSKU = (): SKU => ({
  id: Math.random().toString(36).slice(2, 8),
  sku: "", name: "", size: "M", cost: 0, price: 0,
  opening: 0, restocked: 0, sold: 0, comp: 0, damaged: 0,
});

export default function TourMerchInventoryPage() {
  const [skus, setSkus] = useLocalState<SKU[]>(STORAGE_KEY, []);
  useToolRestore("tour-merch-inventory", STORAGE_KEY, setSkus);
  const update = (id: string, p: Partial<SKU>) => setSkus(skus.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const remove = (id: string) => setSkus(skus.filter((s) => s.id !== id));

  const totals = skus.reduce(
    (acc, s) => {
      const closing = s.opening + s.restocked - s.sold - s.comp - s.damaged;
      return {
        opening: acc.opening + s.opening,
        sold: acc.sold + s.sold,
        revenue: acc.revenue + s.sold * s.price,
        cogs: acc.cogs + s.sold * s.cost,
        closing: acc.closing + closing,
      };
    },
    { opening: 0, sold: 0, revenue: 0, cogs: 0, closing: 0 }
  );

  const margin = totals.revenue - totals.cogs;
  const marginPct = totals.revenue ? Math.round((margin / totals.revenue) * 100) : 0;
  const fmt = (n: number) => `R${Math.round(n).toLocaleString()}`;

  return (
    <ResourcePage
      parentHref="/dashboard/library/merchandise"
      parentLabel="Back to Merchandise"
      color={COLOR}
      tag="Merch · Inventory"
      title="Tour Merch Inventory"
      intro="Per-SKU stock tracking for tour. Opening + restocked − sold − comp − damaged = closing. Pair with Tour Merch Settlement for the venue cut."
      toolbar={<><SaveButton toolSlug="tour-merch-inventory" storageKey={STORAGE_KEY} title={`Tour Merch Inventory — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setSkus([...skus, newSKU()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}><Plus size={13}/> Add SKU</button>
          <button onClick={() => setSkus([])} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Clear</button>
        </>
            </>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="glass-card rounded-xl p-3 text-center"><p className="text-xs text-text-muted mb-1">SKUs</p><p className="font-bold">{skus.length}</p></div>
        <div className="glass-card rounded-xl p-3 text-center"><p className="text-xs text-text-muted mb-1">Units sold</p><p className="font-bold">{totals.sold}</p></div>
        <div className="glass-card rounded-xl p-3 text-center"><p className="text-xs text-text-muted mb-1">Revenue</p><p className="font-bold">{fmt(totals.revenue)}</p></div>
        <div className="glass-card rounded-xl p-3 text-center"><p className="text-xs text-text-muted mb-1">Margin</p><p className="font-bold" style={{ color: COLOR }}>{fmt(margin)} ({marginPct}%)</p></div>
        <div className="glass-card rounded-xl p-3 text-center"><p className="text-xs text-text-muted mb-1">Closing stock</p><p className="font-bold">{totals.closing}</p></div>
      </div>

      {skus.length === 0 && <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">Add SKUs to start tracking.</div>}

      <div className="space-y-3">
        {skus.map((s) => {
          const closing = s.opening + s.restocked - s.sold - s.comp - s.damaged;
          return (
            <div key={s.id} className="glass-card rounded-2xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-2">
                <div><label className={labelClass}>SKU</label><input className={inputClass} value={s.sku} onChange={(e) => update(s.id, { sku: e.target.value })}/></div>
                <div className="col-span-2"><label className={labelClass}>Name</label><input className={inputClass} value={s.name} onChange={(e) => update(s.id, { name: e.target.value })} placeholder="Tee — black — A/W tour"/></div>
                <div><label className={labelClass}>Size / variant</label><input className={inputClass} value={s.size} onChange={(e) => update(s.id, { size: e.target.value })}/></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelClass}>Cost</label><input type="number" className={inputClass} value={s.cost} onChange={(e) => update(s.id, { cost: Number(e.target.value) || 0 })}/></div>
                  <div><label className={labelClass}>Price</label><input type="number" className={inputClass} value={s.price} onChange={(e) => update(s.id, { price: Number(e.target.value) || 0 })}/></div>
                </div>
                <div><label className={labelClass}>Opening</label><input type="number" className={inputClass} value={s.opening} onChange={(e) => update(s.id, { opening: Number(e.target.value) || 0 })}/></div>
                <div><label className={labelClass}>Restocked</label><input type="number" className={inputClass} value={s.restocked} onChange={(e) => update(s.id, { restocked: Number(e.target.value) || 0 })}/></div>
                <div><label className={labelClass}>Sold</label><input type="number" className={inputClass} value={s.sold} onChange={(e) => update(s.id, { sold: Number(e.target.value) || 0 })}/></div>
                <div><label className={labelClass}>Comp</label><input type="number" className={inputClass} value={s.comp} onChange={(e) => update(s.id, { comp: Number(e.target.value) || 0 })}/></div>
                <div><label className={labelClass}>Damaged</label><input type="number" className={inputClass} value={s.damaged} onChange={(e) => update(s.id, { damaged: Number(e.target.value) || 0 })}/></div>
                <div className="col-span-2 sm:col-span-5">
                  <p className="text-xs text-text-muted">Closing stock: <span className="font-bold text-text-primary">{closing}</span> · Revenue: <span className="font-bold text-text-primary">{fmt(s.sold * s.price)}</span> · Margin: <span className="font-bold" style={{ color: COLOR }}>{fmt(s.sold * (s.price - s.cost))}</span></p>
                </div>
              </div>
              <button onClick={() => remove(s.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={12}/> Remove</button>
            </div>
          );
        })}
      </div>
    </ResourcePage>
  );
}
