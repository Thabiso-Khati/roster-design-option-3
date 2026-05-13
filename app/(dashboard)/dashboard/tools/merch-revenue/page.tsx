"use client";
import { useState, useEffect, useCallback } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_merch_revenue_v1";
const COLOR = "#06B6D4";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// `type` is the stable filter key; `metric` is rendered dynamically
// in the component body so the currency label updates with locale.
const ITEMS = [
  { id: "tshirt_units", label: "T-Shirt (Standard)", category: "T-Shirts", type: "units" as const },
  { id: "tshirt_rev",   label: "T-Shirt (Standard)", category: "T-Shirts", type: "rev"   as const },
  { id: "hoodie_units", label: "Hoodie / Sweatshirt", category: "Hoodies", type: "units" as const },
  { id: "hoodie_rev",   label: "Hoodie / Sweatshirt", category: "Hoodies", type: "rev"   as const },
  { id: "cap_units",    label: "Cap / Bucket Hat",    category: "Headwear", type: "units" as const },
  { id: "cap_rev",      label: "Cap / Bucket Hat",    category: "Headwear", type: "rev"   as const },
  { id: "cd_units",     label: "CD / EP",             category: "Music",    type: "units" as const },
  { id: "cd_rev",       label: "CD / EP",             category: "Music",    type: "rev"   as const },
  { id: "vinyl_units",  label: "Vinyl",               category: "Music",    type: "units" as const },
  { id: "vinyl_rev",    label: "Vinyl",               category: "Music",    type: "rev"   as const },
  { id: "poster_units", label: "Poster / Print",      category: "Prints",   type: "units" as const },
  { id: "poster_rev",   label: "Poster / Print",      category: "Prints",   type: "rev"   as const },
  { id: "tote_units",   label: "Tote Bag",            category: "Accessories", type: "units" as const },
  { id: "tote_rev",     label: "Tote Bag",            category: "Accessories", type: "rev"   as const },
  { id: "bundle_units", label: "Bundle Pack",         category: "Bundles",  type: "units" as const },
  { id: "bundle_rev",   label: "Bundle Pack",         category: "Bundles",  type: "rev"   as const },
  { id: "other_units",  label: "Other / Custom",      category: "Other",    type: "units" as const },
  { id: "other_rev",    label: "Other / Custom",      category: "Other",    type: "rev"   as const },
];

export default function MerchRevenuePage() {
  const handleExportPDF = () => { window.print(); };
  const { fmt, currency } = useLocale();
  const [data, setData] = useState<Record<string, string>>({});

  // Display label for each row's "metric" column — adapts to locale currency.
  const metricLabel = (type: "rev" | "units") =>
    type === "rev" ? `Revenue (${currency})` : "Units Sold";

  useToolRestore("merch-revenue", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const n = (key: string) => parseFloat(data[key] || "0") || 0;

  const getRowTotal = (itemId: string) => MONTHS.reduce((sum, _, mi) => sum + n(`${itemId}_${mi}`), 0);
  const getMonthTotal = (mi: number) => ITEMS.filter(i => i.type === "rev").reduce((sum, item) => sum + n(`${item.id}_${mi}`), 0);
  const grandTotal = MONTHS.reduce((sum, _, mi) => sum + getMonthTotal(mi), 0);

  const inputCls = "bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5 text-right";

  const categoryColors: Record<string, string> = {
    "T-Shirts": "#EC4899",
    "Hoodies": "#8B5CF6",
    "Headwear": "#F59E0B",
    "Music": "#10B981",
    "Prints": "#C9A84C",
    "Accessories": "#06B6D4",
    "Bundles": "#EF4444",
    "Other": "#6B7280",
  };

  return (
    <div className="animate-fade-in max-w-6xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="merch-revenue" storageKey={STORAGE_KEY} title={`Merch Revenue — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Merchandise Revenue Tracker</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>12 Months · 9 Categories · Live Tool · Auto-Saved</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Merchandise Revenue Tracker</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Monthly merch revenue by item across the full year.</p>
        <p className="text-sm text-text-muted">Track units sold and revenue for every merch item, T-shirts, hoodies, caps, CDs, vinyl, posters, totes, and bundles. Auto-calculates monthly and annual totals.</p>
      </div>

      {/* Year summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: COLOR }}>Annual Revenue</p>
          <p className="text-lg font-black text-text-primary">{fmt(grandTotal)}</p>
        </div>
        {["T-Shirts", "Music", "Hoodies"].map(cat => {
          const catTotal = ITEMS.filter(i => i.category === cat && i.type === "rev").reduce((sum, item) => sum + getRowTotal(item.id), 0);
          return (
            <div key={cat} className="glass-card rounded-xl p-4 text-center">
              <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: categoryColors[cat] }}>{cat}</p>
              <p className="text-lg font-black text-text-primary">{fmt(catTotal)}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 1100 }}>
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-text-muted text-[10px] sticky left-0 bg-surface-2" style={{ minWidth: 100 }}>Category</th>
                <th className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-text-muted text-[10px]" style={{ minWidth: 150 }}>Item / Metric</th>
                {MONTHS.map(m => (
                  <th key={m} className="px-2 py-2.5 text-right font-black uppercase tracking-wider text-text-muted text-[10px]" style={{ minWidth: 65 }}>{m}</th>
                ))}
                <th className="px-3 py-2.5 text-right font-black uppercase tracking-wider text-text-muted text-[10px]" style={{ minWidth: 80 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {ITEMS.map((item, idx) => {
                const isRevRow = item.type === "rev";
                const rowTotal = getRowTotal(item.id);
                const catColor = categoryColors[item.category] || "#6B7280";
                return (
                  <tr key={item.id} className={`border-b border-border last:border-0 ${idx % 2 === 1 ? "bg-surface-2/50" : ""}`}>
                    <td className="px-3 py-2" style={{ borderLeft: `3px solid ${catColor}40` }}>
                      {idx % 2 === 0 ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded" style={{ color: catColor, backgroundColor: `${catColor}15` }}>{item.category}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs ${isRevRow ? "font-semibold text-text-primary" : "text-text-muted"}`}>{metricLabel(item.type)}</span>
                    </td>
                    {MONTHS.map((_, mi) => (
                      <td key={mi} className="px-2 py-1.5">
                        <input type="number" value={data[`${item.id}_${mi}`] || ""}
                          onChange={e => set(`${item.id}_${mi}`, e.target.value)}
                          placeholder="0" min="0"
                          className={inputCls}/>
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      {isRevRow ? (
                        <span className="font-black text-xs" style={{ color: rowTotal > 0 ? catColor : undefined }}>
                          {rowTotal > 0 ? fmt(rowTotal) : ", "}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">{rowTotal > 0 ? rowTotal.toLocaleString() : ", "}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {/* Monthly totals */}
              <tr className="border-t-2 border-border bg-surface-2">
                <td className="px-3 py-3" colSpan={2}>
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Monthly Revenue Total</span>
                </td>
                {MONTHS.map((_, mi) => {
                  const monthTotal = getMonthTotal(mi);
                  return (
                    <td key={mi} className="px-2 py-3 text-right">
                      <span className="text-xs font-black" style={{ color: monthTotal > 0 ? COLOR : undefined }}>
                        {monthTotal > 0 ? fmt(monthTotal) : ", "}
                      </span>
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-right">
                  <span className="text-sm font-black" style={{ color: COLOR }}>{fmt(grandTotal)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> All amounts in {currency}. Update monthly after every show or sales period.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <button onClick={() => { if (confirm("Reset all merch revenue data?")) { setData({}); localStorage.removeItem(STORAGE_KEY); } }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset tracker
        </button>
      </div>
    </div>
  );
}
