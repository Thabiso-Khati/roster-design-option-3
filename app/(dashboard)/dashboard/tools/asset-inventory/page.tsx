"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_asset_inventory_v1";
const COLOR = "#EF4444";

const CATEGORIES = ["Audio", "Backline", "Visual / Tech", "Transport", "Merch & Display", "Lighting", "Personal", "Other"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Needs Repair", "Written Off"];

interface Asset {
  id: string;
  category: string;
  name: string;
  description: string;
  ownedBy: string;
  yearModel: string;
  serialNumber: string;
  condition: string;
  insuredValue: string;
  replacementCost: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const defaultAssets = (): Asset[] => [
  { id: uid(), category: "Audio", name: "", description: "", ownedBy: "", yearModel: "", serialNumber: "", condition: "Good", insuredValue: "", replacementCost: "" },
];

type SummaryTab = "inventory" | "summary";

export default function AssetInventoryPage() {
  const handleExportPDF = () => { window.print(); };
  const { fmt, country } = useLocale();
  const res = getCountryResources(country);
  const currency = res.currency ?? "ZAR";
  const [assets, setAssets] = useState<Asset[]>(defaultAssets());
  const [tab, setTab] = useState<SummaryTab>("inventory");

  useEffect(() => {
    type Saved = { assets?: Asset[] };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d: Saved = JSON.parse(raw);
        if (d.assets) setAssets(d.assets);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=asset-inventory`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as Saved;
        if (d.assets) setAssets(d.assets);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback((a: Asset[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ assets: a }));
  }, []);

  const updateAsset = (id: string, key: keyof Asset, val: string) => {
    setAssets(prev => {
      const next = prev.map(a => a.id === id ? { ...a, [key]: val } : a);
      save(next);
      return next;
    });
  };

  const addAsset = () => {
    setAssets(prev => {
      const next = [...prev, { id: uid(), category: "Audio", name: "", description: "", ownedBy: "", yearModel: "", serialNumber: "", condition: "Good", insuredValue: "", replacementCost: "" }];
      save(next);
      return next;
    });
  };

  const removeAsset = (id: string) => {
    setAssets(prev => {
      const next = prev.filter(a => a.id !== id);
      save(next);
      return next;
    });
  };

  const totalInsured = assets.reduce((sum, a) => sum + (parseFloat(a.insuredValue) || 0), 0);
  const totalReplacement = assets.reduce((sum, a) => sum + (parseFloat(a.replacementCost) || 0), 0);

  const categorySummary = CATEGORIES.map(cat => {
    const catAssets = assets.filter(a => a.category === cat);
    return {
      category: cat,
      count: catAssets.length,
      insured: catAssets.reduce((sum, a) => sum + (parseFloat(a.insuredValue) || 0), 0),
      replacement: catAssets.reduce((sum, a) => sum + (parseFloat(a.replacementCost) || 0), 0),
    };
  }).filter(c => c.count > 0);

  const catColors: Record<string, string> = {
    "Audio": "#10B981",
    "Backline": "#8B5CF6",
    "Visual / Tech": "#06B6D4",
    "Transport": "#F59E0B",
    "Merch & Display": "#EC4899",
    "Lighting": "#C9A84C",
    "Personal": "#6B7280",
    "Other": "#6B7280",
  };

  const inputCls = "bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5";

  return (
    <div className="animate-fade-in max-w-6xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="asset-inventory" storageKey={STORAGE_KEY} title={`Asset Inventory — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Asset & Equipment Inventory</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Insurance Ready · Live Tool · Auto-Saved</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Asset & Equipment Inventory</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Track every piece of gear on the road. Insurance-ready.</p>
        <p className="text-sm text-text-muted">Log every asset by category, audio, backline, visual/tech, transport, merch. Enter insured value and replacement cost. The Insurance Summary tab auto-calculates totals by category.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: COLOR }}>Total Insured</p>
          <p className="text-lg font-black text-text-primary">{fmt(totalInsured)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1 text-text-muted">Total Replacement</p>
          <p className="text-lg font-black text-text-primary">{fmt(totalReplacement)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1 text-text-muted">Total Assets</p>
          <p className="text-lg font-black text-text-primary">{assets.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1 text-text-muted">Categories</p>
          <p className="text-lg font-black text-text-primary">{categorySummary.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-5 border-b border-border">
        {([["inventory", "Asset Inventory"], ["summary", "Insurance Summary"]] as [SummaryTab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${tab === id ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "inventory" && (
        <div className="glass-card rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 1000 }}>
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  {["Category", "Item Name", "Description", "Used / Owned By", "Year / Model", "Serial #", "Condition", "Insured Value ({currency})", "Replacement Cost ({currency})", ""].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-text-muted text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, i) => {
                  const catColor = catColors[asset.category] || "#6B7280";
                  return (
                    <tr key={asset.id} className={`border-b border-border last:border-0 group ${i % 2 === 1 ? "bg-surface-2/40" : ""}`}
                      style={{ borderLeft: `3px solid ${catColor}40` }}>
                      <td className="px-3 py-2" style={{ minWidth: 110 }}>
                        <select value={asset.category} onChange={e => updateAsset(asset.id, "category", e.target.value)}
                          className="bg-transparent text-xs focus:outline-none py-0.5 cursor-pointer"
                          style={{ color: catColor }}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 130 }}>
                        <input type="text" value={asset.name} onChange={e => updateAsset(asset.id, "name", e.target.value)}
                          placeholder="Item name" className={inputCls}/>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 150 }}>
                        <input type="text" value={asset.description} onChange={e => updateAsset(asset.id, "description", e.target.value)}
                          placeholder="Brand, model, colour" className={inputCls}/>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 100 }}>
                        <input type="text" value={asset.ownedBy} onChange={e => updateAsset(asset.id, "ownedBy", e.target.value)}
                          placeholder="Name / Band" className={inputCls}/>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 80 }}>
                        <input type="text" value={asset.yearModel} onChange={e => updateAsset(asset.id, "yearModel", e.target.value)}
                          placeholder="2024" className={inputCls}/>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 100 }}>
                        <input type="text" value={asset.serialNumber} onChange={e => updateAsset(asset.id, "serialNumber", e.target.value)}
                          placeholder="Serial / IMEI" className={inputCls}/>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 110 }}>
                        <select value={asset.condition} onChange={e => updateAsset(asset.id, "condition", e.target.value)}
                          className="bg-transparent text-xs focus:outline-none py-0.5 cursor-pointer text-text-primary">
                          {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 110 }}>
                        <input type="number" value={asset.insuredValue} onChange={e => updateAsset(asset.id, "insuredValue", e.target.value)}
                          placeholder="0" min="0" className={inputCls + " text-right"}/>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 110 }}>
                        <input type="number" value={asset.replacementCost} onChange={e => updateAsset(asset.id, "replacementCost", e.target.value)}
                          placeholder="0" min="0" className={inputCls + " text-right"}/>
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeAsset(asset.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-red-400 transition-all">
                          <Trash2 size={12}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {/* Totals */}
                <tr className="border-t-2 border-border bg-surface-2">
                  <td colSpan={7} className="px-3 py-3">
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Portfolio Total</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-black" style={{ color: COLOR }}>{fmt(totalInsured)}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-black text-text-primary">{fmt(totalReplacement)}</span>
                  </td>
                  <td/>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <button onClick={addAsset} className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: COLOR }}>
              <Plus size={13}/>Add asset
            </button>
          </div>
        </div>
      )}

      {tab === "summary" && (
        <div className="glass-card rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Insurance Summary by Category</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {["Category", "Assets", "Total Insured Value ({currency})", "Total Replacement Cost ({currency})", "Gap (Replacement − Insured)"].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left font-black uppercase tracking-wider text-text-muted text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categorySummary.map((row, i) => {
                const catColor = catColors[row.category] || "#6B7280";
                const gap = row.replacement - row.insured;
                return (
                  <tr key={row.category} className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
                    <td className="px-5 py-3">
                      <span className="text-xs font-black px-2 py-0.5 rounded" style={{ color: catColor, backgroundColor: `${catColor}15` }}>{row.category}</span>
                    </td>
                    <td className="px-5 py-3 text-text-muted">{row.count}</td>
                    <td className="px-5 py-3 font-bold" style={{ color: catColor }}>{fmt(row.insured)}</td>
                    <td className="px-5 py-3 text-text-primary">{fmt(row.replacement)}</td>
                    <td className="px-5 py-3">
                      {gap > 0 ? (
                        <span className="text-red-400 font-semibold">{fmt(gap)} underinsured</span>
                      ) : gap < 0 ? (
                        <span className="text-green-400 font-semibold">Overinsured by {fmt(Math.abs(gap))}</span>
                      ) : (
                        <span className="text-text-muted">, </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-border bg-surface-2">
                <td className="px-5 py-3" colSpan={2}>
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Total Portfolio</span>
                </td>
                <td className="px-5 py-3"><span className="text-base font-black" style={{ color: COLOR }}>{fmt(totalInsured)}</span></td>
                <td className="px-5 py-3"><span className="text-base font-black text-text-primary">{fmt(totalReplacement)}</span></td>
                <td className="px-5 py-3">
                  {totalReplacement > totalInsured ? (
                    <span className="text-red-400 font-bold">{fmt(totalReplacement - totalInsured)} total gap</span>
                  ) : <span className="text-text-muted">, </span>}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-border">
            <p className="text-xs text-text-muted">Insured values are declared insurance values. Replacement costs are current market replacement values. Any gap represents underinsurance risk.</p>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> All amounts in {currency}. Update insured values each time you renew your policy or acquire new gear.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <button onClick={() => { if (confirm("Reset all asset inventory data?")) { setAssets(defaultAssets()); localStorage.removeItem(STORAGE_KEY); } }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset inventory
        </button>
      </div>
    </div>
  );
}
