"use client";
import { useState, useEffect } from "react";
import { useLocale } from "@/context/locale-context";
import { Download, Save, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";
const STORAGE_KEY = "roster_monthly_revenue";

const CURRENCIES = ["AOA","DZD","EGP","ETB","GHS","KES","MAD","NGN","TZS","UGX","XAF","XOF","ZAR","EUR","GBP","USD"];
const CURRENCY_SYMBOLS: Record<string,string> = {
  AOA:"Kz", DZD:"DA",  EGP:"E£", ETB:"Br",  GHS:"GH₵",
  KES:"KSh",MAD:"MAD", NGN:"₦",  TZS:"TSh", UGX:"USh",
  XAF:"FCFA",XOF:"CFA",ZAR:"R",  EUR:"€",   GBP:"£",   USD:"$"
};
const SYM: Record<string,string> = { ZAR:"R",NGN:"₦",KES:"KSh",GHS:"GH₵",USD:"$",GBP:"£",EUR:"€" };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STREAMS = [
  { id: "live",       label: "Live / Shows",          color: "#C9A84C" },
  { id: "streaming",  label: "Streaming (DSPs)",       color: "#8B5CF6" },
  { id: "merch",      label: "Merchandise",            color: "#10B981" },
  { id: "sync",       label: "Sync Licensing",         color: "#F59E0B" },
  { id: "royalties",  label: "Royalties / Publishing", color: "#EC4899" },
  { id: "brand",      label: "Brand Deals",            color: "#06B6D4" },
  { id: "mgmt",       label: "Management Commission",  color: "#64748B" },
  { id: "other",      label: "Other",                  color: "#374151" },
];

type MonthlyData = Record<string, Record<string, number>>;

function buildEmpty(): MonthlyData {
  const d: MonthlyData = {};
  MONTHS.forEach(m => {
    d[m] = {};
    STREAMS.forEach(s => { d[m][s.id] = 0; });
  });
  return d;
}

export default function MonthlyRevenuePage() {
  const handleExportPDF = () => { window.print(); };
  const { currency: profileCurrency, sym: profileSym } = useLocale();
  const [currency, setCurrency] = useState(profileCurrency);

  useEffect(() => {
    setCurrency(profileCurrency);
  }, [profileCurrency]);
  const [year, setYear]         = useState(new Date().getFullYear());
  const [artist, setArtist]     = useState("");
  const [data, setData]         = useState<MonthlyData>(buildEmpty);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { currency?: string; year?: number; artist?: string; data?: MonthlyData };
        if (d.currency) setCurrency(d.currency);
        if (d.year) setYear(d.year);
        if (d.artist) setArtist(d.artist);
        if (d.data) setData(d.data);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=monthly-revenue`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as { currency?: string; year?: number; artist?: string; data?: MonthlyData };
        if (d.currency) setCurrency(d.currency);
        if (d.year) setYear(d.year);
        if (d.artist) setArtist(d.artist);
        if (d.data) setData(d.data);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sym = SYM[currency] || currency;

  const set = (month: string, streamId: string, val: number) =>
    setData(d => ({ ...d, [month]: { ...d[month], [streamId]: val } }));

  const monthTotal  = (m: string) => STREAMS.reduce((s,st) => s + (data[m][st.id]||0), 0);
  const streamTotal = (sid: string) => MONTHS.reduce((s,m) => s + (data[m][sid]||0), 0);
  const grandTotal  = MONTHS.reduce((s,m) => s + monthTotal(m), 0);

  const handleSave = () => {
    localStorage.setItem("roster_monthly_revenue", JSON.stringify({ currency, year, artist, data }));
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const handleExportCSV = () => {
    const header = ["Revenue Stream", ...MONTHS, "Total"];
    const rows = STREAMS.map(s => [
      s.label, ...MONTHS.map(m => data[m][s.id]||0), streamTotal(s.id)
    ]);
    const totals = ["Monthly Total", ...MONTHS.map(m => monthTotal(m)), grandTotal];
    const csv = [header, ...rows, totals].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv],{type:"text/csv"})),
      download: `Monthly-Revenue-${artist||"ROSTER"}-${year}.csv`,
    });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-text-primary">Monthly Revenue Tracker</h1>
          <p className="text-text-muted mt-1 text-sm">Track every income stream across the full year.</p>
        </div>
        <div className="flex items-center gap-2">
          <SaveButton toolSlug="monthly-revenue" storageKey={STORAGE_KEY} title={`Monthly Revenue — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} onCSV={handleExportCSV} />
            <button onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-border text-text-muted hover:text-brand hover:border-brand/30 transition-all">
            <Download size={13}/>CSV
          </button>
          <Button size="sm" onClick={handleSave}>
            <Save size={13} className="mr-1.5"/>{saved ? "Saved ✓" : "Save"}
          </Button>
        </div>
      </div>

      {/* Settings row */}
      <div className="glass-card rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Artist</label>
            <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist name"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Year</label>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} min="2020" max="2030"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
              {[{code:"",label:"Currency"},...CURRENCIES.map(c=>({code:c,label:c}))].map(({code,label})=><option key={code} value={code} disabled={code===""}>{label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Scrollable table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead className="border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-widest w-40">Stream</th>
                {MONTHS.map(m => (
                  <th key={m} className="px-2 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wide w-20">{m}</th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-bold text-brand uppercase tracking-widest">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {STREAMS.map(stream => (
                <tr key={stream.id} className="hover:bg-surface-2/40 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-semibold text-xs" style={{ color: stream.color }}>
                      {stream.label}
                    </span>
                  </td>
                  {MONTHS.map(m => (
                    <td key={m} className="px-1 py-2">
                      <div className="relative">
                        <input type="number" min="0"
                          value={data[m][stream.id] || ""}
                          onChange={e => set(m, stream.id, Number(e.target.value))}
                          placeholder="0"
                          className="w-full bg-transparent border border-transparent hover:border-border focus:border-brand/50 rounded px-1.5 py-1 text-xs text-text-primary text-center transition-all"/>
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-black text-xs" style={{ color: stream.color }}>
                      {sym}{streamTotal(stream.id).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Monthly totals row */}
              <tr className="bg-surface border-t-2 border-brand/20">
                <td className="px-4 py-3 font-black text-text-primary text-xs">Monthly Total</td>
                {MONTHS.map(m => (
                  <td key={m} className="px-1 py-3 text-center">
                    <span className="font-bold text-xs text-brand">{sym}{monthTotal(m).toLocaleString()}</span>
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <span className="font-black text-sm text-brand">{sym}{grandTotal.toLocaleString()}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        {STREAMS.slice(0,4).map(s => (
          <div key={s.id} className="glass-card rounded-xl p-4">
            <p className="text-xs font-semibold mb-1 truncate" style={{ color: s.color }}>{s.label}</p>
            <p className="text-lg font-black text-text-primary">
              {sym}{streamTotal(s.id).toLocaleString()}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {grandTotal > 0 ? ((streamTotal(s.id)/grandTotal)*100).toFixed(1) : "0"}% of total
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
