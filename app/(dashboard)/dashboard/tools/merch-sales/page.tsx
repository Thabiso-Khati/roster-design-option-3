"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_merch_sales_v1";
const COLOR = "#C9A84C";

const COLUMNS = [
  { id: "tshirt_xs", label: "T-Shirt XS", category: "T-Shirts", color: "#EC4899" },
  { id: "tshirt_s", label: "T-Shirt S", category: "T-Shirts", color: "#EC4899" },
  { id: "tshirt_m", label: "T-Shirt M", category: "T-Shirts", color: "#EC4899" },
  { id: "tshirt_l", label: "T-Shirt L", category: "T-Shirts", color: "#EC4899" },
  { id: "tshirt_xl", label: "T-Shirt XL", category: "T-Shirts", color: "#EC4899" },
  { id: "hoodie_m", label: "Hoodie M", category: "Hoodies", color: "#8B5CF6" },
  { id: "hoodie_l", label: "Hoodie L", category: "Hoodies", color: "#8B5CF6" },
  { id: "cap", label: "Cap", category: "Headwear", color: "#F59E0B" },
  { id: "tote", label: "Tote Bag", category: "Bags", color: "#06B6D4" },
  { id: "cd", label: "CD / EP", category: "Music", color: "#10B981" },
  { id: "vinyl", label: "Vinyl", category: "Music", color: "#10B981" },
  { id: "usb", label: "USB / Card", category: "Music", color: "#10B981" },
];

interface SaleRow {
  id: string;
  time: string;
  payment: string;
  notes: string;
  [key: string]: string;
}

interface StoreState {
  rows: SaleRow[];
  showName: string;
  venue: string;
  date: string;
  city: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const defaultRows = (): SaleRow[] => [
  { id: uid(), time: "", payment: "Cash", notes: "", ...Object.fromEntries(COLUMNS.map(c => [c.id, ""])) },
];

export default function MerchSalesPage() {
  const handleExportPDF = () => { window.print(); };
  const { fmt, country } = useLocale();
  const res = getCountryResources(country);
  const currency = res.currency ?? "ZAR";
  const [rows, setRows] = useState<SaleRow[]>(defaultRows());
  const [showName, setShowName] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [city, setCity] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    type Saved = StoreState & { prices?: Record<string, string> };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d: Saved = JSON.parse(raw);
        if (d.rows) setRows(d.rows);
        if (d.showName) setShowName(d.showName);
        if (d.venue) setVenue(d.venue);
        if (d.date) setDate(d.date);
        if (d.city) setCity(d.city);
        if (d.prices) setPrices(d.prices);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=merch-sales`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as Saved;
        if (d.rows) setRows(d.rows);
        if (d.showName) setShowName(d.showName);
        if (d.venue) setVenue(d.venue);
        if (d.date) setDate(d.date);
        if (d.city) setCity(d.city);
        if (d.prices) setPrices(d.prices);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback((r: SaleRow[], sn: string, v: string, d: string, c: string, p: Record<string, string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: r, showName: sn, venue: v, date: d, city: c, prices: p }));
  }, []);

  const updateRow = (id: string, key: string, val: string) => {
    setRows(prev => {
      const next = prev.map(r => r.id === id ? { ...r, [key]: val } : r);
      save(next, showName, venue, date, city, prices);
      return next;
    });
  };

  const addRow = () => {
    setRows(prev => {
      const next = [...prev, { id: uid(), time: "", payment: "Cash", notes: "", ...Object.fromEntries(COLUMNS.map(c => [c.id, ""])) }];
      save(next, showName, venue, date, city, prices);
      return next;
    });
  };

  const removeRow = (id: string) => {
    setRows(prev => {
      const next = prev.filter(r => r.id !== id);
      save(next, showName, venue, date, city, prices);
      return next;
    });
  };

  const updatePrice = (colId: string, val: string) => {
    const next = { ...prices, [colId]: val };
    setPrices(next);
    save(rows, showName, venue, date, city, next);
  };

  const getColUnits = (colId: string) => rows.reduce((sum, r) => sum + (parseFloat(r[colId]) || 0), 0);
  const getColRevenue = (colId: string) => getColUnits(colId) * (parseFloat(prices[colId]) || 0);
  const getRowTotal = (row: SaleRow) => COLUMNS.reduce((sum, col) => sum + (parseFloat(row[col.id]) || 0) * (parseFloat(prices[col.id]) || 0), 0);
  const grandTotal = rows.reduce((sum, r) => sum + getRowTotal(r), 0);
  const totalUnits = COLUMNS.reduce((sum, col) => sum + getColUnits(col.id), 0);

  const inputCls = "bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5 text-right";
  const inputHeader = "bg-transparent text-[10px] text-text-muted placeholder:text-text-muted/50 focus:outline-none border-b border-border focus:border-brand w-full py-0.5 text-right";

  return (
    <div className="animate-fade-in max-w-7xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="merch-sales" storageKey={STORAGE_KEY} title={`Merch Sales — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Merchandise Sales Register</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Per-Show · Live Tool · Auto-Saved</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Merchandise Sales Register</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Per-show sales log by item, size, and payment method.</p>
        <p className="text-sm text-text-muted">Set your unit prices in the header row, then log each transaction. Auto-calculates totals per item, per transaction, and for the full show.</p>
      </div>

      {/* Show header */}
      <div className="glass-card rounded-xl p-5 mb-5" style={{ borderColor: `${COLOR}20` }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Show / Event Name", val: showName, fn: (v: string) => { setShowName(v); save(rows, v, venue, date, city, prices); } },
            { label: "Venue", val: venue, fn: (v: string) => { setVenue(v); save(rows, showName, v, date, city, prices); } },
            { label: "Date", val: date, fn: (v: string) => { setDate(v); save(rows, showName, venue, v, city, prices); } },
            { label: "City", val: city, fn: (v: string) => { setCity(v); save(rows, showName, venue, date, v, prices); } },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1">{f.label}</label>
              <input type="text" value={f.val} onChange={e => f.fn(e.target.value)}
                placeholder={f.label} className="bg-transparent border-b border-border focus:border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full py-1"/>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: COLOR }}>Show Revenue</p>
          <p className="text-lg font-black text-text-primary">{fmt(grandTotal)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1 text-text-muted">Total Units</p>
          <p className="text-lg font-black text-text-primary">{totalUnits > 0 ? totalUnits.toLocaleString() : ", "}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: "#EC4899" }}>T-Shirts</p>
          <p className="text-lg font-black text-text-primary">
            {fmt(["tshirt_xs", "tshirt_s", "tshirt_m", "tshirt_l", "tshirt_xl"].reduce((sum, id) => sum + getColRevenue(id), 0))}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: "#10B981" }}>Music</p>
          <p className="text-lg font-black text-text-primary">
            {fmt(["cd", "vinyl", "usb"].reduce((sum, id) => sum + getColRevenue(id), 0))}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 1100 }}>
            <thead>
              {/* Category headers */}
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-text-muted" colSpan={3}>Transaction</th>
                {COLUMNS.map(col => (
                  <th key={col.id} className="px-2 py-2 text-center text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
                    style={{ color: col.color }}>
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-wider text-text-muted">Total</th>
                <th className="px-2 py-2 w-8"/>
              </tr>
              {/* Price row */}
              <tr className="border-b border-border bg-surface-2">
                <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-text-muted" colSpan={3}>Unit Price ({currency}) →</th>
                {COLUMNS.map(col => (
                  <th key={col.id} className="px-2 py-1">
                    <div className="flex items-center gap-0.5 justify-end">
                      <span className="text-text-muted text-[10px]">R</span>
                      <input type="number" value={prices[col.id] || ""}
                        onChange={e => updatePrice(col.id, e.target.value)}
                        placeholder="0" min="0"
                        className={inputHeader} style={{ width: 45 }}/>
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2"/>
                <th/>
              </tr>
              {/* Column headers */}
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-black uppercase tracking-wider text-text-muted text-[10px]">Time</th>
                <th className="px-3 py-2 text-left font-black uppercase tracking-wider text-text-muted text-[10px]">Payment</th>
                <th className="px-3 py-2 text-left font-black uppercase tracking-wider text-text-muted text-[10px]">Notes</th>
                {COLUMNS.map(col => (
                  <th key={col.id} className="px-2 py-2 text-right font-black uppercase tracking-wider text-text-muted text-[10px]">Qty</th>
                ))}
                <th className="px-3 py-2 text-right font-black uppercase tracking-wider text-text-muted text-[10px]">Row Total</th>
                <th className="px-2 py-2 w-8"/>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const rowTotal = getRowTotal(row);
                return (
                  <tr key={row.id} className={`border-b border-border last:border-0 group ${i % 2 === 1 ? "bg-surface-2/40" : ""}`}>
                    <td className="px-3 py-1.5">
                      <input type="text" value={row.time} onChange={e => updateRow(row.id, "time", e.target.value)}
                        placeholder="00:00" className="bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5" style={{ width: 50 }}/>
                    </td>
                    <td className="px-3 py-1.5">
                      <select value={row.payment} onChange={e => updateRow(row.id, "payment", e.target.value)}
                        className="bg-transparent text-xs text-text-primary focus:outline-none py-0.5 cursor-pointer">
                        {["Cash", "Card", "SnapScan", "Zapper", "EFT", "MoMo", "M-Pesa", "Other"].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <input type="text" value={row.notes} onChange={e => updateRow(row.id, "notes", e.target.value)}
                        placeholder="Notes..." className="bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand py-0.5" style={{ width: 80 }}/>
                    </td>
                    {COLUMNS.map(col => (
                      <td key={col.id} className="px-2 py-1.5">
                        <input type="number" value={row[col.id]} onChange={e => updateRow(row.id, col.id, e.target.value)}
                          placeholder="0" min="0" className={inputCls} style={{ width: 40 }}/>
                      </td>
                    ))}
                    <td className="px-3 py-1.5 text-right">
                      <span className="text-xs font-bold" style={{ color: rowTotal > 0 ? COLOR : undefined }}>
                        {fmt(rowTotal)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => removeRow(row.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-red-400 transition-all">
                        <Trash2 size={12}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {/* Column totals */}
              <tr className="border-t-2 border-border bg-surface-2">
                <td className="px-3 py-2.5" colSpan={3}>
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Column Totals</span>
                </td>
                {COLUMNS.map(col => {
                  const units = getColUnits(col.id);
                  const rev = getColRevenue(col.id);
                  return (
                    <td key={col.id} className="px-2 py-2.5 text-right">
                      <div>
                        <p className="font-black text-xs" style={{ color: units > 0 ? col.color : undefined }}>{units > 0 ? units : ", "}</p>
                        {rev > 0 && <p className="text-[10px] text-text-muted">{fmt(rev)}</p>}
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-2.5 text-right">
                  <span className="text-sm font-black" style={{ color: COLOR }}>
                    {fmt(grandTotal)}
                  </span>
                </td>
                <td/>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border">
          <button onClick={addRow} className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: COLOR }}>
            <Plus size={13}/>Add transaction
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Set unit prices once per show and log transactions as they happen. Screenshot at end of night for your records.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <button onClick={() => { if (confirm("Reset all sales register data?")) { setRows(defaultRows()); setShowName(""); setVenue(""); setDate(""); setCity(""); setPrices({}); localStorage.removeItem(STORAGE_KEY); } }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset register
        </button>
      </div>
    </div>
  );
}
