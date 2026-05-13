"use client";
import { useState, useCallback, useEffect } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const COLOR = "#06B6D4";
const STORAGE_KEY = "roster_daily_bookkeeping_v1";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const TAX_CATEGORIES = [
  "Live Performance Income",
  "Streaming & Digital Income",
  "Royalty Income (SAMRO / SAMPRA / CAPASSO)",
  "Sync & Licensing Income",
  "Grants & Funding Income",
  "Studio & Production Costs",
  "Travel & Accommodation",
  "Marketing & Promotion",
  "Manager / Agent Fees",
  "Equipment Purchase",
  "Loadshedding (Generator / UPS / Fuel)",
  "SARS Provisional Tax (IRP6)",
  "Meals & Entertainment (50% deductible)",
  "Retirement Annuity (RA)",
  "Personal, Non-deductible",
  "Other Business Expense",
];

interface Entry {
  id: string;
  date: string;
  income: string;
  vatCollected: string;
  expense: string;
  vatPaid: string;
  netExpense: string;
  description: string;
  taxCategory: string;
  vatManual: boolean; // if true, user overrode auto VAT
}

const emptyEntry = (): Entry => ({
  id: `bk-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  date: "",
  income: "",
  vatCollected: "",
  expense: "",
  vatPaid: "",
  netExpense: "",
  description: "",
  taxCategory: "",
  vatManual: false,
});

const num = (v: string) => parseFloat((v || "").replace(/[^0-9.-]/g, "")) || 0;

const defaultEntries = () => Array.from({ length: 5 }, emptyEntry);

export default function DailyBookkeepingPage() {
  const handleExportPDF = () => { window.print(); };
  const { fmt: rand, country, currency, taxName, taxRate } = useLocale();
  const res = getCountryResources(country);
  const proAbbr       = res.performanceRights.abbr;
  const mechAbbr      = res.mechanicalRights?.abbr ?? proAbbr;
  const neighbourAbbr = res.neighbouringRights?.abbr ?? proAbbr;
  const taxAbbr       = res.taxAuthorityAbbr ?? "SARS";
  const loc = useCallback((t: string) => t
    .replace(/\bSAMRO\b/g, proAbbr)
    .replace(/\bCAPASSO\b/g, mechAbbr)
    .replace(/\bSAMPRA\b/g, neighbourAbbr)
    .replace(/\bSARS\b/g, taxAbbr)
    .replace(/\bIRP6\b/g, "Provisional Tax")
  , [proAbbr, mechAbbr, neighbourAbbr, taxAbbr]);
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
  const [allData, setAllData] = useState<Record<string, Entry[]>>({});

  useToolRestore<Record<string, Entry[]>>("daily-bookkeeping", STORAGE_KEY, setAllData);

  const save = useCallback((next: Record<string, Entry[]>) => {
    setAllData(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const monthKey = MONTHS[monthIdx].toLowerCase().slice(0, 3);
  const entries: Entry[] = allData[monthKey] || defaultEntries();

  const updateEntries = useCallback((updated: Entry[]) => {
    save({ ...allData, [monthKey]: updated });
  }, [allData, monthKey, save]);

  const addEntry = useCallback(() => {
    updateEntries([...entries, emptyEntry()]);
  }, [entries, updateEntries]);

  const removeEntry = useCallback((id: string) => {
    if (entries.length <= 1) return;
    updateEntries(entries.filter(e => e.id !== id));
  }, [entries, updateEntries]);

  const updateEntry = useCallback((id: string, field: keyof Entry, value: string) => {
    const updated = entries.map(e => {
      if (e.id !== id) return e;
      const next = { ...e, [field]: value };
      // Auto-calculate VAT collected (15%) from income if not manually overridden
      if (field === "income" && !e.vatManual) {
        const inc = num(value);
        next.vatCollected = inc > 0 ? (inc * 0.15).toFixed(2) : "";
      }
      if (field === "vatCollected") {
        next.vatManual = true; // user manually set VAT
      }
      // Auto-calculate net expense = expense / 1.15
      if (field === "expense") {
        const exp = num(value);
        if (exp > 0) {
          const vat = exp - (exp / 1.15);
          next.vatPaid = vat.toFixed(2);
          next.netExpense = (exp / 1.15).toFixed(2);
        } else {
          next.vatPaid = "";
          next.netExpense = "";
        }
      }
      return next;
    });
    updateEntries(updated);
  }, [entries, updateEntries]);

  // Totals
  const totals = entries.reduce((acc, e) => ({
    income: acc.income + num(e.income),
    vatCollected: acc.vatCollected + num(e.vatCollected),
    expense: acc.expense + num(e.expense),
    vatPaid: acc.vatPaid + num(e.vatPaid),
    netExpense: acc.netExpense + num(e.netExpense),
  }), { income: 0, vatCollected: 0, expense: 0, vatPaid: 0, netExpense: 0 });

  const netCashflow = totals.income - totals.expense;
  const filledCount = entries.filter(e => e.date || e.description || e.income || e.expense).length;

  const inp = (entry: Entry, field: keyof Entry, placeholder = "", type = "text") => (
    <input
      type={type}
      inputMode={type === "numeric" ? "numeric" : undefined}
      value={(entry[field] as string) || ""}
      onChange={e => updateEntry(entry.id, field, e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted/40 focus:outline-none"
      style={{ colorScheme: "dark" }}
    />
  );

  return (
    <div className="animate-fade-in max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="daily-bookkeeping" storageKey={STORAGE_KEY} title={`Daily Bookkeeping — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library/money" className="hover:text-text-primary transition-colors">Money Matters</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Daily Bookkeeping</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Date-Based Income & Expense Log · {currency} · {taxName} @ {taxRate}%</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Daily Bookkeeping</h1>
        <p className="text-sm text-text-muted">Record every business transaction with SA tax categories. VAT is auto-calculated, override any field manually.</p>
      </div>

      {/* Month selector + stats */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <select value={monthIdx} onChange={e => setMonthIdx(Number(e.target.value))}
            className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none cursor-pointer"
            onFocus={e => (e.target.style.boxShadow = `0 0 0 2px ${COLOR}40`)}
            onBlur={e => (e.target.style.boxShadow = "none")}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m} 2026</option>)}
          </select>
          <p className="text-xs text-text-muted">
            <span className="font-semibold text-text-primary">{filledCount}</span> entries · <span className="font-semibold text-text-primary">{entries.length}</span> rows
          </p>
        </div>
        <button onClick={addEntry}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
          style={{ backgroundColor: `${COLOR}20`, color: COLOR, border: `1px solid ${COLOR}30` }}>
          <Plus size={14}/>Add Row
        </button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Income", val: totals.income, color: "#10B981" },
          { label: "VAT Collected", val: totals.vatCollected, color: COLOR },
          { label: "Total Expenses", val: totals.expense, color: "#EF4444" },
          { label: "Net Cashflow", val: netCashflow, color: netCashflow >= 0 ? "#10B981" : "#EF4444" },
        ].map(stat => (
          <div key={stat.label} className="glass-card rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-1">{stat.label}</p>
            <p className="text-sm font-black" style={{ color: stat.color }}>{stat.val !== 0 ? rand(stat.val) : ", "}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden mb-6">
        {/* Column headers */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: "900px" }}>
            <thead>
              <tr className="border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
                <th className="text-left px-3 py-2.5 font-black uppercase tracking-wider w-28" style={{ color: COLOR }}>Date</th>
                <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider w-28 text-green-400">Income<br/><span className="font-normal normal-case tracking-normal">(excl. VAT)</span></th>
                <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider w-28" style={{ color: COLOR }}>VAT Collected<br/><span className="font-normal normal-case tracking-normal">(15% auto)</span></th>
                <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider w-28 text-red-400">Expense<br/><span className="font-normal normal-case tracking-normal">(incl. VAT)</span></th>
                <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider w-24 text-text-muted">VAT Paid</th>
                <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider w-28 text-text-muted">Net Expense<br/><span className="font-normal normal-case tracking-normal">(excl. VAT)</span></th>
                <th className="text-left px-3 py-2.5 font-black uppercase tracking-wider text-text-muted">Description / Notes</th>
                <th className="text-left px-3 py-2.5 font-black uppercase tracking-wider w-44 text-text-muted">Tax Category</th>
                <th className="w-9"/>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={entry.id} className={`border-b border-border/30 hover:bg-surface-2/40 transition-colors ${idx % 2 === 1 ? "bg-surface/20" : ""}`}>
                  {/* Date */}
                  <td className="px-3 py-2">
                    <input type="date" value={entry.date}
                      onChange={e => updateEntry(entry.id, "date", e.target.value)}
                      className="w-full bg-transparent text-xs text-text-primary focus:outline-none"
                      style={{ colorScheme: "dark" }}/>
                  </td>
                  {/* Income */}
                  <td className="px-2 py-1.5">
                    <input type="text" inputMode="numeric"
                      value={entry.income}
                      onChange={e => updateEntry(entry.id, "income", e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-surface-2 rounded px-2 py-1 text-right text-xs text-green-400 focus:outline-none transition-all placeholder:text-text-muted/30"
                      onFocus={e => (e.target.style.boxShadow = `0 0 0 2px #10B98140`)}
                      onBlur={e => (e.target.style.boxShadow = "none")}/>
                  </td>
                  {/* VAT Collected */}
                  <td className="px-2 py-1.5">
                    <input type="text" inputMode="numeric"
                      value={entry.vatCollected}
                      onChange={e => updateEntry(entry.id, "vatCollected", e.target.value)}
                      placeholder="auto"
                      className="w-full bg-surface-2 rounded px-2 py-1 text-right text-xs focus:outline-none transition-all placeholder:text-text-muted/30"
                      style={{ color: COLOR }}
                      onFocus={e => (e.target.style.boxShadow = `0 0 0 2px ${COLOR}40`)}
                      onBlur={e => (e.target.style.boxShadow = "none")}/>
                  </td>
                  {/* Expense */}
                  <td className="px-2 py-1.5">
                    <input type="text" inputMode="numeric"
                      value={entry.expense}
                      onChange={e => updateEntry(entry.id, "expense", e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-surface-2 rounded px-2 py-1 text-right text-xs text-red-400 focus:outline-none transition-all placeholder:text-text-muted/30"
                      onFocus={e => (e.target.style.boxShadow = "0 0 0 2px #EF444440")}
                      onBlur={e => (e.target.style.boxShadow = "none")}/>
                  </td>
                  {/* VAT Paid */}
                  <td className="px-2 py-1.5">
                    <input type="text" inputMode="numeric"
                      value={entry.vatPaid}
                      onChange={e => updateEntry(entry.id, "vatPaid", e.target.value)}
                      placeholder="auto"
                      className="w-full bg-surface-2 rounded px-2 py-1 text-right text-xs text-text-muted focus:outline-none transition-all placeholder:text-text-muted/30"
                      onFocus={e => (e.target.style.boxShadow = `0 0 0 2px ${COLOR}40`)}
                      onBlur={e => (e.target.style.boxShadow = "none")}/>
                  </td>
                  {/* Net Expense */}
                  <td className="px-2 py-1.5">
                    <input type="text" inputMode="numeric"
                      value={entry.netExpense}
                      onChange={e => updateEntry(entry.id, "netExpense", e.target.value)}
                      placeholder="auto"
                      className="w-full bg-surface-2 rounded px-2 py-1 text-right text-xs text-text-muted focus:outline-none transition-all placeholder:text-text-muted/30"
                      onFocus={e => (e.target.style.boxShadow = `0 0 0 2px ${COLOR}40`)}
                      onBlur={e => (e.target.style.boxShadow = "none")}/>
                  </td>
                  {/* Description */}
                  <td className="px-2 py-2">
                    <input type="text" value={entry.description}
                      onChange={e => updateEntry(entry.id, "description", e.target.value)}
                      placeholder="Describe the transaction..."
                      className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted/40 focus:outline-none"/>
                  </td>
                  {/* Tax Category */}
                  <td className="px-2 py-2">
                    <select value={entry.taxCategory}
                      onChange={e => updateEntry(entry.id, "taxCategory", e.target.value)}
                      className="w-full bg-transparent text-xs text-text-muted focus:outline-none cursor-pointer">
                      <option value="">Select...</option>
                      {TAX_CATEGORIES.map(c => <option key={c} value={c} className="bg-surface text-text-primary">{loc(c)}</option>)}
                    </select>
                  </td>
                  {/* Delete */}
                  <td className="px-2 text-center">
                    <button onClick={() => removeEntry(entry.id)}
                      className="p-1.5 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={12}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2" style={{ borderColor: COLOR }}>
                <td className="px-3 py-3 font-black text-xs uppercase tracking-wider" style={{ color: COLOR }}>{MONTHS[monthIdx]} Totals</td>
                <td className="px-3 py-3 text-right font-black text-green-400">{totals.income > 0 ? rand(totals.income) : ", "}</td>
                <td className="px-3 py-3 text-right font-black" style={{ color: COLOR }}>{totals.vatCollected > 0 ? rand(totals.vatCollected) : ", "}</td>
                <td className="px-3 py-3 text-right font-black text-red-400">{totals.expense > 0 ? rand(totals.expense) : ", "}</td>
                <td className="px-3 py-3 text-right font-black text-text-muted">{totals.vatPaid > 0 ? rand(totals.vatPaid) : ", "}</td>
                <td className="px-3 py-3 text-right font-black text-text-muted">{totals.netExpense > 0 ? rand(totals.netExpense) : ", "}</td>
                <td colSpan={3} className={`px-3 py-3 font-black text-xs ${netCashflow >= 0 ? "text-green-400" : "text-red-400"}`}>
                  Net: {netCashflow !== 0 ? rand(netCashflow) : ", "}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {/* Add row */}
        <div className="border-t border-border">
          <button onClick={addEntry}
            className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold text-text-muted hover:text-brand hover:bg-brand/5 transition-all">
            <Plus size={13}/>Add row
          </button>
        </div>
      </div>

      {/* Tax Category Reference */}
      <div className="glass-card rounded-xl p-5 mb-6">
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Tax Category Reference</p>
        <p className="text-xs text-text-muted mb-3">Select the closest {taxAbbr}-relevant category for each transaction. Keep accurate records for your annual tax return.</p>
        <div className="flex flex-wrap gap-1.5">
          {TAX_CATEGORIES.map(cat => (
            <span key={cat} className="text-[10px] font-semibold px-2 py-0.5 rounded"
              style={{ color: COLOR, backgroundColor: `${COLOR}12`, border: `1px solid ${COLOR}20` }}>
              {loc(cat)}
            </span>
          ))}
        </div>
      </div>

      {/* VAT note */}
      <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}04` }}>
        <span className="text-sm flex-shrink-0">💡</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold" style={{ color: COLOR }}>VAT auto-calculation.</span> Enter gross income and VAT Collected (15%) is filled automatically. Enter total expense and VAT Paid + Net Expense are auto-filled. Override any field manually. Only applicable if you are VAT-registered (threshold: R1 million turnover).
        </p>
      </div>

      {/* Save note */}
      <div className="glass-card rounded-xl p-4 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Each month is stored separately. Switch months using the selector above, your data persists across sessions.
        </p>
      </div>
    </div>
  );
}
