"use client";
import { useState, useEffect } from "react";
import { useLocale } from "@/context/locale-context";
import { Plus, Trash2, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";
const STORAGE_KEY = "roster_cashflow";

const CURRENCIES = ["AOA","DZD","EGP","ETB","GHS","KES","MAD","NGN","TZS","UGX","XAF","XOF","ZAR","EUR","GBP","USD"];
const CURRENCY_SYMBOLS: Record<string,string> = {
  AOA:"Kz", DZD:"DA",  EGP:"E£", ETB:"Br",  GHS:"GH₵",
  KES:"KSh",MAD:"MAD", NGN:"₦",  TZS:"TSh", UGX:"USh",
  XAF:"FCFA",XOF:"CFA",ZAR:"R",  EUR:"€",   GBP:"£",   USD:"$"
};
const SYM: Record<string,string> = { ZAR:"R",NGN:"₦",KES:"KSh",GHS:"GH₵",USD:"$",GBP:"£",EUR:"€" };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const uid = () => Math.random().toString(36).slice(2,7);

interface ForecastRow { id: string; label: string; type: "income"|"expense"; values: Record<string,number>; }

function buildRow(label: string, type: "income"|"expense"): ForecastRow {
  const values: Record<string,number> = {};
  MONTHS.forEach(m => { values[m] = 0; });
  return { id: uid(), label, type, values };
}

const DEFAULT_ROWS: ForecastRow[] = [
  buildRow("Show guarantees", "income"),
  buildRow("Streaming royalties", "income"),
  buildRow("Brand / sponsorship", "income"),
  buildRow("Management commission", "income"),
  buildRow("Travel expenses", "expense"),
  buildRow("Crew & personnel", "expense"),
  buildRow("Studio / recording", "expense"),
  buildRow("Marketing", "expense"),
  buildRow("Overheads", "expense"),
];

export default function CashflowForecastPage() {
  const handleExportPDF = () => { window.print(); };
  const { currency: profileCurrency, sym: profileSym } = useLocale();
  const [currency, setCurrency]     = useState(profileCurrency);

  useEffect(() => {
    setCurrency(profileCurrency);
  }, [profileCurrency]);
  const [year, setYear]             = useState(new Date().getFullYear());
  const [openingBalance, setOB]     = useState(0);
  const [rows, setRows]             = useState<ForecastRow[]>(DEFAULT_ROWS);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { currency?: string; year?: number; openingBalance?: number; rows?: ForecastRow[] };
        if (d.currency) setCurrency(d.currency);
        if (d.year) setYear(d.year);
        if (d.openingBalance !== undefined) setOB(d.openingBalance);
        if (d.rows) setRows(d.rows);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=cashflow-forecast`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as { currency?: string; year?: number; openingBalance?: number; rows?: ForecastRow[] };
        if (d.currency) setCurrency(d.currency);
        if (d.year) setYear(d.year);
        if (d.openingBalance !== undefined) setOB(d.openingBalance);
        if (d.rows) setRows(d.rows);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sym = SYM[currency] || currency;

  const update = (id: string, month: string, val: number) =>
    setRows(p => p.map(r => r.id === id ? {...r, values: {...r.values, [month]: val}} : r));

  const updateLabel = (id: string, label: string) =>
    setRows(p => p.map(r => r.id === id ? {...r, label} : r));

  const addRow = (type: "income"|"expense") =>
    setRows(p => [...p, buildRow("", type)]);

  const removeRow = (id: string) =>
    setRows(p => p.filter(r => r.id !== id));

  const monthIncome  = (m: string) => rows.filter(r=>r.type==="income").reduce((s,r)=>s+(r.values[m]||0),0);
  const monthExpense = (m: string) => rows.filter(r=>r.type==="expense").reduce((s,r)=>s+(r.values[m]||0),0);
  const monthNet     = (m: string) => monthIncome(m) - monthExpense(m);

  // Running balance
  let runningBalance = openingBalance;
  const balances: Record<string,number> = {};
  MONTHS.forEach(m => {
    runningBalance += monthNet(m);
    balances[m] = runningBalance;
  });

  const handleSave = () => {
    localStorage.setItem("roster_cashflow", JSON.stringify({ currency, year, openingBalance, rows }));
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const handleExportCSV = () => {
    const header = ["Item", "Type", ...MONTHS];
    const data = rows.map(r => [r.label, r.type, ...MONTHS.map(m => r.values[m]||0)]);
    const incRow = ["Total Income", "", ...MONTHS.map(m => monthIncome(m))];
    const expRow = ["Total Expenses", "", ...MONTHS.map(m => monthExpense(m))];
    const netRow = ["Net", "", ...MONTHS.map(m => monthNet(m))];
    const balRow = ["Closing Balance", "", ...MONTHS.map(m => balances[m])];
    const csv = [header,...data,incRow,expRow,netRow,balRow].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"),{
      href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),
      download:`Cashflow-${year}.csv`
    });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const incomeRows  = rows.filter(r => r.type === "income");
  const expenseRows = rows.filter(r => r.type === "expense");

  const renderSection = (sectionRows: ForecastRow[], type: "income"|"expense", color: string, label: string) => (
    <>
      <tr>
        <td colSpan={MONTHS.length + 2} className="px-4 pt-4 pb-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color }}>{label}</p>
            <button onClick={() => addRow(type)}
              className="flex items-center gap-1 text-xs font-semibold transition-all" style={{ color }}>
              <Plus size={10}/>Add
            </button>
          </div>
        </td>
      </tr>
      {sectionRows.map(row => (
        <tr key={row.id} className="hover:bg-surface-2/40 transition-colors group">
          <td className="px-4 py-1.5 min-w-[140px]">
            <div className="flex items-center gap-1">
              <input value={row.label} onChange={e => updateLabel(row.id, e.target.value)}
                placeholder="Description"
                className="flex-1 bg-transparent text-xs text-text-muted border-b border-transparent hover:border-border focus:border-brand/40 py-0.5 outline-none transition-colors"/>
              <button onClick={() => removeRow(row.id)}
                className="p-0.5 opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-all">
                <Trash2 size={10}/>
              </button>
            </div>
          </td>
          {MONTHS.map(m => (
            <td key={m} className="px-1 py-1">
              <input type="number" min="0" value={row.values[m]||""}
                onChange={e => update(row.id, m, Number(e.target.value))}
                placeholder="0"
                className="w-full bg-transparent border border-transparent hover:border-border focus:border-brand/50 rounded px-1 py-1 text-xs text-text-primary text-center transition-all"/>
            </td>
          ))}
          <td className="px-3 py-1 text-right">
            <span className="text-xs font-semibold" style={{ color }}>
              {sym}{Object.values(row.values).reduce((s,v)=>s+v,0).toLocaleString()}
            </span>
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-text-primary">Cashflow Forecast</h1>
          <p className="text-text-muted mt-1 text-sm">Know your cash position for every month of the year.</p>
        </div>
        <div className="flex items-center gap-2">
          <SaveButton toolSlug="cashflow-forecast" storageKey={STORAGE_KEY} title={`Cashflow Forecast — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} onCSV={handleExportCSV} />
            <button onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-border text-text-muted hover:text-brand hover:border-brand/30 transition-all">
            <Download size={13}/>CSV
          </button>
          <Button size="sm" onClick={handleSave}>
            <Save size={13} className="mr-1.5"/>{saved?"Saved ✓":"Save"}
          </Button>
        </div>
      </div>

      {/* Settings */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Year</label>
            <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} min="2020" max="2030"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Currency</label>
            <select value={currency} onChange={e=>setCurrency(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
              {[{code:"",label:"Currency"},...CURRENCIES.map(c=>({code:c,label:c}))].map(({code,label})=><option key={code} value={code} disabled={code===""}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Opening Balance</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">{sym}</span>
              <input type="number" value={openingBalance} onChange={e=>setOB(Number(e.target.value))}
                className="w-full bg-surface-2 border border-border rounded-lg pl-7 pr-3 py-2 text-sm text-text-primary"/>
            </div>
          </div>
        </div>
      </div>

      {/* Main table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[1000px]">
            <thead className="border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase w-36">Item</th>
                {MONTHS.map(m => <th key={m} className="px-1 py-3 text-center text-xs font-bold text-text-muted w-16">{m}</th>)}
                <th className="px-3 py-3 text-right text-xs font-bold text-text-muted">Total</th>
              </tr>
            </thead>
            <tbody>
              {renderSection(incomeRows, "income", "#10B981", "Income")}
              {/* Income totals */}
              <tr className="bg-green-500/5 border-y border-green-500/10">
                <td className="px-4 py-2 font-bold text-success">Total Income</td>
                {MONTHS.map(m=><td key={m} className="px-1 py-2 text-center font-semibold text-success">{sym}{monthIncome(m).toLocaleString()}</td>)}
                <td className="px-3 py-2 text-right font-bold text-success">{sym}{MONTHS.reduce((s,m)=>s+monthIncome(m),0).toLocaleString()}</td>
              </tr>

              {renderSection(expenseRows, "expense", "#EF4444", "Expenses")}
              {/* Expense totals */}
              <tr className="bg-red-500/5 border-y border-red-500/10">
                <td className="px-4 py-2 font-bold text-error">Total Expenses</td>
                {MONTHS.map(m=><td key={m} className="px-1 py-2 text-center font-semibold text-error">{sym}{monthExpense(m).toLocaleString()}</td>)}
                <td className="px-3 py-2 text-right font-bold text-error">{sym}{MONTHS.reduce((s,m)=>s+monthExpense(m),0).toLocaleString()}</td>
              </tr>

              {/* Net row */}
              <tr className="border-y border-border bg-surface">
                <td className="px-4 py-2 font-bold text-text-primary">Monthly Net</td>
                {MONTHS.map(m=>{
                  const n = monthNet(m);
                  return <td key={m} className="px-1 py-2 text-center font-bold" style={{color:n>=0?"#10B981":"#EF4444"}}>{sym}{Math.abs(n).toLocaleString()}</td>;
                })}
                <td className="px-3 py-2"/>
              </tr>

              {/* Closing balance */}
              <tr className="bg-brand/5 border-t-2 border-brand/20">
                <td className="px-4 py-3 font-black text-text-primary">Closing Balance</td>
                {MONTHS.map(m=>{
                  const b = balances[m];
                  return <td key={m} className="px-1 py-3 text-center font-black text-sm" style={{color:b>=0?"#C9A84C":"#EF4444"}}>{sym}{Math.abs(b).toLocaleString()}</td>;
                })}
                <td className="px-3 py-3"/>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
