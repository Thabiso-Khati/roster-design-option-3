"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_shipping_matrix_v1";
const COLOR = "#EC4899";

const REGIONS = [
  { id: "rsa", label: "RSA", full: "South Africa (Domestic)" },
  { id: "sadc", label: "SADC", full: "SADC (Zimbabwe, Mozambique, Botswana, Namibia, Zambia)" },
  { id: "africa", label: "W & E Africa", full: "West & East Africa (Nigeria, Ghana, Kenya, Tanzania)" },
  { id: "intl", label: "International", full: "International (Europe, USA, UK, Australia)" },
];

const DEFAULT_ITEMS = [
  "CDs (standard jewel case)",
  "Vinyl (12-inch, single)",
  "T-Shirts (standard)",
  "Hoodies / Sweatshirts",
  "Posters (rolled, A2)",
  "Bundle Pack (CD + T-Shirt)",
  "Other / Custom Item",
];

export default function ShippingMatrixPage() {
  const handleExportPDF = () => { window.print(); };
  const { fmt, country } = useLocale();
  const res = getCountryResources(country);
  const currency = res.currency ?? "ZAR";
  const [data, setData] = useState<Record<string, string>>({});
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [lookup, setLookup] = useState({ item: "0", region: "rsa" });

  useEffect(() => {
    type Saved = { data?: Record<string, string>; items?: string[] };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d: Saved = JSON.parse(raw);
        if (d.data) setData(d.data);
        if (d.items) setItems(d.items);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=shipping-matrix`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as Saved;
        if (d.data) setData(d.data);
        if (d.items) setItems(d.items);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback((newData: Record<string, string>, newItems: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: newData, items: newItems }));
  }, []);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      save(next, items);
      return next;
    });
  }, [items, save]);

  const v = (key: string) => data[key] || "";
  const n = (key: string) => parseFloat(data[key] || "0") || 0;

  const updateItemName = (i: number, name: string) => {
    const newItems = items.map((item, idx) => idx === i ? name : item);
    setItems(newItems);
    save(data, newItems);
  };

  const handleReset = () => {
    if (confirm("Reset all shipping rates? This cannot be undone.")) {
      setData({});
      setItems(DEFAULT_ITEMS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const cellInput = "bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5";

  // Quick lookup
  const lookupItemIdx = parseInt(lookup.item);
  const lookupCourier = v(`item_${lookupItemIdx}_${lookup.region}_courier`);
  const lookupCost = n(`item_${lookupItemIdx}_${lookup.region}_cost`);
  const lookupDays = n(`item_${lookupItemIdx}_${lookup.region}_days`);
  const usdRate = n("rate_usd") || 18.5;
  const eurRate = n("rate_eur") || 20.0;
  const gbpRate = n("rate_gbp") || 23.5;

  const REGION_COLORS = { rsa: "#10B981", sadc: "#F59E0B", africa: "#8B5CF6", intl: "#06B6D4" };

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="shipping-matrix" storageKey={STORAGE_KEY} title={`Shipping Matrix — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Shipping Cost Matrix</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>7 Items · 4 Regions · Live Tool · Auto-Saved</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Shipping Cost Matrix</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Shipping rates for merch items across RSA, SADC, West &amp; East Africa, and International.</p>
        <p className="text-sm text-text-muted">Enter courier name, cost in {currency}, and transit days for each item and region combination. Use the Quick Lookup tool to instantly find rates.</p>
      </div>

      {/* Region Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {REGIONS.map(r => (
          <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{ backgroundColor: `${REGION_COLORS[r.id as keyof typeof REGION_COLORS]}15`, border: `1px solid ${REGION_COLORS[r.id as keyof typeof REGION_COLORS]}25` }}>
            <span className="font-black" style={{ color: REGION_COLORS[r.id as keyof typeof REGION_COLORS] }}>{r.label}</span>
            <span className="text-text-muted">{r.full}</span>
          </div>
        ))}
      </div>

      {/* Item Cards */}
      <div className="space-y-5 mb-8">
        {items.map((itemName, itemIdx) => {
          const isCustom = itemIdx === 6;
          return (
            <div key={itemIdx} className="glass-card rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center gap-3" style={{ backgroundColor: `${COLOR}08` }}>
                <span className="text-xs font-black w-5 flex-shrink-0" style={{ color: COLOR }}>{itemIdx + 1}</span>
                {isCustom ? (
                  <input type="text" value={v(`item_${itemIdx}_name`) || itemName} onChange={e => updateItemName(itemIdx, e.target.value)}
                    placeholder="Custom item name" className="bg-transparent text-sm font-black text-text-primary focus:outline-none flex-1"/>
                ) : (
                  <p className="text-sm font-black text-text-primary">{itemName}</p>
                )}
              </div>
              <div>
                <div className="grid grid-cols-12 px-5 py-2 border-b border-border text-[10px] font-black uppercase tracking-wider text-text-muted">
                  <span className="col-span-3">Region</span>
                  <span className="col-span-3">Courier</span>
                  <span className="col-span-3 text-right">Cost ({currency})</span>
                  <span className="col-span-3 text-right">Days</span>
                </div>
                {REGIONS.map((region, ri) => {
                  const key = `item_${itemIdx}_${region.id}`;
                  const cost = n(`${key}_cost`);
                  const days = n(`${key}_days`);
                  return (
                    <div key={region.id} className={`grid grid-cols-12 px-5 py-2.5 border-b border-border last:border-0 items-center ${ri % 2 === 1 ? "bg-surface-2" : ""}`}>
                      <div className="col-span-3">
                        <span className="text-xs font-black px-2 py-0.5 rounded"
                          style={{ color: REGION_COLORS[region.id as keyof typeof REGION_COLORS], backgroundColor: `${REGION_COLORS[region.id as keyof typeof REGION_COLORS]}15` }}>
                          {region.label}
                        </span>
                      </div>
                      <div className="col-span-3 px-1">
                        <input type="text" value={v(`${key}_courier`)} onChange={e => set(`${key}_courier`, e.target.value)}
                          placeholder="e.g. DHL, Aramex" className={cellInput}/>
                      </div>
                      <div className="col-span-3 px-1">
                        <input type="number" value={v(`${key}_cost`)} onChange={e => set(`${key}_cost`, e.target.value)}
                          placeholder="0.00" min="0" className={cellInput + " text-right"}/>
                      </div>
                      <div className="col-span-3 px-1">
                        <input type="number" value={v(`${key}_days`)} onChange={e => set(`${key}_days`, e.target.value)}
                          placeholder="0" min="0" className={cellInput + " text-right"}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Lookup */}
      <div className="glass-card rounded-xl p-5 mb-5" style={{ borderColor: `${COLOR}20` }}>
        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Quick Lookup</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1 block text-text-muted">Item</label>
            <select value={lookup.item} onChange={e => setLookup(l => ({ ...l, item: e.target.value }))}
              className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand w-full">
              {items.map((item, i) => (
                <option key={i} value={i.toString()}>{v(`item_${i}_name`) || item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1 block text-text-muted">Region</label>
            <select value={lookup.region} onChange={e => setLookup(l => ({ ...l, region: e.target.value }))}
              className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand w-full">
              {REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}, {r.full}</option>)}
            </select>
          </div>
        </div>
        {(lookupCourier || lookupCost > 0) ? (
          <div className="rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 gap-4" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}20` }}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider mb-0.5 text-text-muted">Courier</p>
              <p className="text-sm font-bold text-text-primary">{lookupCourier || "Not set"}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider mb-0.5 text-text-muted">Cost ({currency})</p>
              <p className="text-sm font-bold" style={{ color: COLOR }}>{fmt(lookupCost)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider mb-0.5 text-text-muted">Transit (days)</p>
              <p className="text-sm font-bold text-text-primary">{lookupDays > 0 ? `${lookupDays} days` : ", "}</p>
            </div>
            {lookupCost > 0 && (
              <>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-0.5 text-text-muted">Cost (USD ~)</p>
                  <p className="text-sm text-text-muted">≈ ${(lookupCost / usdRate).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-0.5 text-text-muted">Cost (EUR ~)</p>
                  <p className="text-sm text-text-muted">≈ €{(lookupCost / eurRate).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-0.5 text-text-muted">Cost (GBP ~)</p>
                  <p className="text-sm text-text-muted">≈ £{(lookupCost / gbpRate).toFixed(2)}</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: `${COLOR}05`, border: `1px solid ${COLOR}15` }}>
            <p className="text-sm text-text-muted">No rates entered yet for this combination. Enter courier and cost above.</p>
          </div>
        )}
      </div>

      {/* Exchange Rate Reference */}
      <div className="glass-card rounded-xl p-5 mb-8">
        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "#C9A84C" }}>Exchange Rate Reference (for currency conversions above)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: `USD to ${currency}`, key: "rate_usd", def: "18.50" },
            { label: `EUR to ${currency}`, key: "rate_eur", def: "20.00" },
            { label: `GBP to ${currency}`, key: "rate_gbp", def: "23.50" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-text-muted block mb-1">{f.label}</label>
              <input type="number" value={v(f.key) || f.def} onChange={e => set(f.key, e.target.value)}
                placeholder={f.def} step="0.01" min="0"
                className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full text-right"/>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3">Exchange rates are for reference only, verify with your bank or central bank before quoting international customers.</p>
      </div>

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed">All rates in {currency}. <span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Update rates as courier prices change.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/recording" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Releasing Music
        </Link>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset all rates
        </button>
      </div>
    </div>
  );
}
