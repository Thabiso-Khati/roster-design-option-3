"use client";
import { useState, useMemo, useEffect } from "react";
import { useLocale } from "@/context/locale-context";
import { Plus, Trash2, Download, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";
const STORAGE_KEY = "roster_tour_budget";

const CURRENCIES = ["AOA","DZD","EGP","ETB","GHS","KES","MAD","NGN","TZS","UGX","XAF","XOF","ZAR","EUR","GBP","USD"];
const CURRENCY_SYMBOLS: Record<string,string> = {
  AOA:"Kz", DZD:"DA",  EGP:"E£", ETB:"Br",  GHS:"GH₵",
  KES:"KSh",MAD:"MAD", NGN:"₦",  TZS:"TSh", UGX:"USh",
  XAF:"FCFA",XOF:"CFA",ZAR:"R",  EUR:"€",   GBP:"£",   USD:"$"
};

interface LineItem { id: string; description: string; amount: number; }
interface ShowItem  { id: string; city: string; venue: string; date: string; guarantee: number; }

const uid = () => Math.random().toString(36).slice(2,8);

const DEFAULT_SHOWS: ShowItem[] = [
  { id: uid(), city: "", venue: "", date: "", guarantee: 0 },
];
const DEFAULT_MERCH: LineItem[]    = [{ id: uid(), description: "T-Shirts", amount: 0 }];
const DEFAULT_TRAVEL: LineItem[]   = [
  { id: uid(), description: "Flights", amount: 0 },
  { id: uid(), description: "Ground transport", amount: 0 },
];
const DEFAULT_ACCOMM: LineItem[]   = [{ id: uid(), description: "Hotels (per night × nights)", amount: 0 }];
const DEFAULT_CREW: LineItem[]     = [
  { id: uid(), description: "Tour Manager fee", amount: 0 },
  { id: uid(), description: "Sound engineer fee", amount: 0 },
  { id: uid(), description: "Per diems", amount: 0 },
];
const DEFAULT_PROD: LineItem[]     = [{ id: uid(), description: "Equipment / backline hire", amount: 0 }];
const DEFAULT_MARKETING: LineItem[]= [{ id: uid(), description: "Local promotion", amount: 0 }];
const DEFAULT_OTHER: LineItem[]    = [{ id: uid(), description: "Contingency (10%)", amount: 0 }];

function useItems(init: LineItem[]) {
  const [items, setItems] = useState<LineItem[]>(init);
  const add = () => setItems(p => [...p, { id: uid(), description: "", amount: 0 }]);
  const remove = (id: string) => setItems(p => p.filter(i => i.id !== id));
  const update = (id: string, k: keyof LineItem, v: string|number) =>
    setItems(p => p.map(i => i.id === id ? {...i,[k]:v} : i));
  const total = items.reduce((s,i) => s + (Number(i.amount)||0), 0);
  return { items, setItems, add, remove, update, total };
}

function Section({ label, color, items, add, remove, update, total, sym }: {
  label: string; color: string;
  items: LineItem[]; add:()=>void; remove:(id:string)=>void;
  update:(id:string,k:keyof LineItem,v:string|number)=>void;
  total: number; sym: string;
}) {
  return (
    <div className="glass-card rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
        <span className="text-sm font-black" style={{ color }}>{sym}{total.toLocaleString()}</span>
      </div>
      {items.map(item => (
        <div key={item.id} className="flex gap-2 mb-2">
          <input value={item.description}
            onChange={e => update(item.id, "description", e.target.value)}
            placeholder="Description"
            className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted"/>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted">{sym}</span>
            <input type="number" min="0" value={item.amount || ""}
              onChange={e => update(item.id, "amount", Number(e.target.value))}
              placeholder="0"
              className="w-28 bg-surface-2 border border-border rounded-lg pl-6 pr-3 py-2 text-xs text-text-primary"/>
          </div>
          <button onClick={() => remove(item.id)}
            className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all">
            <Trash2 size={13}/>
          </button>
        </div>
      ))}
      <button onClick={add}
        className="flex items-center gap-1.5 text-xs font-semibold mt-2 transition-all"
        style={{ color }}>
        <Plus size={12}/>Add line
      </button>
    </div>
  );
}

export default function TourBudgetPage() {
  const handleExportPDF = () => { window.print(); };
  const { currency: profileCurrency, sym: profileSym } = useLocale();
  const [tourName, setTourName]   = useState("");
  const [currency, setCurrency]   = useState(profileCurrency);

  useEffect(() => {
    setCurrency(profileCurrency);
  }, [profileCurrency]);
  const [shows, setShows]         = useState<ShowItem[]>(DEFAULT_SHOWS);
  const [saved, setSaved]         = useState(false);

  const sym = CURRENCY_SYMBOLS[currency] || currency;

  const merch    = useItems(DEFAULT_MERCH);
  const travel   = useItems(DEFAULT_TRAVEL);
  const accomm   = useItems(DEFAULT_ACCOMM);
  const crew     = useItems(DEFAULT_CREW);
  const prod     = useItems(DEFAULT_PROD);
  const marketing= useItems(DEFAULT_MARKETING);
  const other    = useItems(DEFAULT_OTHER);

  const totalShows   = shows.reduce((s,sh) => s + (Number(sh.guarantee)||0), 0);
  const totalMerch   = merch.total;
  const totalIncome  = totalShows + totalMerch;
  const totalExpenses= travel.total + accomm.total + crew.total + prod.total + marketing.total + other.total;
  const netProfit    = totalIncome - totalExpenses;
  const margin       = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : "0";

  const addShow = () =>
    setShows(p => [...p, { id: uid(), city: "", venue: "", date: "", guarantee: 0 }]);
  const removeShow = (id: string) =>
    setShows(p => p.filter(s => s.id !== id));
  const updateShow = (id: string, k: keyof ShowItem, v: string|number) =>
    setShows(p => p.map(s => s.id === id ? {...s,[k]:v} : s));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { tourName?: string; currency?: string; shows?: ShowItem[]; merch?: LineItem[]; travel?: LineItem[]; accomm?: LineItem[]; crew?: LineItem[]; prod?: LineItem[]; marketing?: LineItem[]; other?: LineItem[] };
        if (d.tourName) setTourName(d.tourName);
        if (d.currency) setCurrency(d.currency);
        if (d.shows) setShows(d.shows);
        if (d.merch) merch.setItems(d.merch);
        if (d.travel) travel.setItems(d.travel);
        if (d.accomm) accomm.setItems(d.accomm);
        if (d.crew) crew.setItems(d.crew);
        if (d.prod) prod.setItems(d.prod);
        if (d.marketing) marketing.setItems(d.marketing);
        if (d.other) other.setItems(d.other);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=tour-budget`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as { tourName?: string; currency?: string; shows?: ShowItem[]; merch?: LineItem[]; travel?: LineItem[]; accomm?: LineItem[]; crew?: LineItem[]; prod?: LineItem[]; marketing?: LineItem[]; other?: LineItem[] };
        if (d.tourName) setTourName(d.tourName);
        if (d.currency) setCurrency(d.currency);
        if (d.shows) setShows(d.shows);
        if (d.merch) merch.setItems(d.merch);
        if (d.travel) travel.setItems(d.travel);
        if (d.accomm) accomm.setItems(d.accomm);
        if (d.crew) crew.setItems(d.crew);
        if (d.prod) prod.setItems(d.prod);
        if (d.marketing) marketing.setItems(d.marketing);
        if (d.other) other.setItems(d.other);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    const data = { tourName, currency, shows, merch: merch.items, travel: travel.items,
      accomm: accomm.items, crew: crew.items, prod: prod.items, marketing: marketing.items, other: other.items };
    localStorage.setItem("roster_tour_budget", JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (confirm("Reset the budget? This will clear all entries.")) {
      setShows(DEFAULT_SHOWS); setTourName("");
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["ROSTER, Tour Budget", tourName],
      ["Currency", currency],
      [],
      ["INCOME"],
      ["Show", "City", "Date", "Guarantee"],
      ...shows.map(s => [s.venue, s.city, s.date, s.guarantee]),
      ["Merchandise", "", "", totalMerch],
      ["Total Income", "", "", totalIncome],
      [],
      ["EXPENSES"],
      ...travel.items.map(i => [i.description, "", "", i.amount]),
      ...accomm.items.map(i => [i.description, "", "", i.amount]),
      ...crew.items.map(i  => [i.description, "", "", i.amount]),
      ...prod.items.map(i  => [i.description, "", "", i.amount]),
      ...marketing.items.map(i => [i.description, "", "", i.amount]),
      ...other.items.map(i => [i.description, "", "", i.amount]),
      ["Total Expenses", "", "", totalExpenses],
      [],
      ["NET PROFIT", "", "", netProfit],
      ["MARGIN %", "", "", margin + "%"],
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `Tour-Budget-${tourName || "ROSTER"}.csv`,
    });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-text-primary">Tour Budget</h1>
          <p className="text-text-muted mt-1 text-sm">Plan your tour before you confirm a single show.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all">
            <RefreshCw size={15}/>
          </button>
          <SaveButton toolSlug="tour-budget" storageKey={STORAGE_KEY} title={`Tour Budget — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} onCSV={handleExportCSV} />
            <button onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-border text-text-muted hover:text-brand hover:border-brand/30 transition-all">
            <Download size={13}/>Export CSV
          </button>
          <Button size="sm" onClick={handleSave} loading={false}>
            <Save size={13} className="mr-1.5"/>
            {saved ? "Saved ✓" : "Save"}
          </Button>
        </div>
      </div>

      {/* Tour info */}
      <div className="glass-card rounded-xl p-5 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Tour Name</label>
            <input value={tourName} onChange={e => setTourName(e.target.value)} placeholder="e.g. Summer Run 2025"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary">
              {[{code:"",label:"Currency"},...CURRENCIES.map(c=>({code:c,label:c}))].map(({code,label})=><option key={code} value={code} disabled={code===""}>{label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Shows */}
      <div className="glass-card rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Shows, Guarantees</p>
          <span className="text-sm font-black text-brand">{sym}{totalShows.toLocaleString()}</span>
        </div>
        {shows.map(sh => (
          <div key={sh.id} className="flex flex-wrap gap-2 mb-2">
            <input value={sh.venue} onChange={e => updateShow(sh.id,"venue",e.target.value)}
              placeholder="Venue" className="flex-1 min-w-[120px] bg-surface-2 border border-border rounded-lg px-2 py-2 text-xs text-text-primary placeholder:text-text-muted"/>
            <input value={sh.city} onChange={e => updateShow(sh.id,"city",e.target.value)}
              placeholder="City" className="flex-1 min-w-[100px] bg-surface-2 border border-border rounded-lg px-2 py-2 text-xs text-text-primary placeholder:text-text-muted"/>
            <input type="date" value={sh.date} onChange={e => updateShow(sh.id,"date",e.target.value)}
              className="flex-1 min-w-[130px] bg-surface-2 border border-border rounded-lg px-2 py-2 text-xs text-text-primary"/>
            <div className="flex gap-1 flex-1 min-w-[110px]">
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-text-muted">{sym}</span>
                <input type="number" min="0" value={sh.guarantee||""}
                  onChange={e => updateShow(sh.id,"guarantee",Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-surface-2 border border-border rounded-lg pl-5 pr-2 py-2 text-xs text-text-primary"/>
              </div>
              <button onClick={() => removeShow(sh.id)}
                className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all">
                <Trash2 size={12}/>
              </button>
            </div>
          </div>
        ))}
        <button onClick={addShow} className="flex items-center gap-1.5 text-xs font-semibold text-brand mt-2">
          <Plus size={12}/>Add show
        </button>
      </div>

      {/* Expense sections */}
      <Section label="Merchandise (estimated income)" color="#10B981"
        sym={sym} {...merch}/>
      <Section label="Travel" color="#F59E0B" sym={sym} {...travel}/>
      <Section label="Accommodation" color="#8B5CF6" sym={sym} {...accomm}/>
      <Section label="Crew & Per Diems" color="#EC4899" sym={sym} {...crew}/>
      <Section label="Production" color="#06B6D4" sym={sym} {...prod}/>
      <Section label="Marketing & Promotion" color="#C9A84C" sym={sym} {...marketing}/>
      <Section label="Other / Contingency" color="#64748B" sym={sym} {...other}/>

      {/* Summary */}
      <div className="glass-card rounded-2xl p-6 mt-6 border-brand/20">
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-5">Budget Summary</p>
        <div className="space-y-3">
          {[
            { label: "Total Show Guarantees", value: totalShows, color: "#10B981" },
            { label: "Merchandise (est.)", value: totalMerch, color: "#10B981" },
            { label: "Total Income", value: totalIncome, color: "#C9A84C", bold: true },
            { label: "Total Expenses", value: totalExpenses, color: "#EF4444" },
          ].map(({ label, value, color, bold }) => (
            <div key={label} className="flex items-center justify-between">
              <span className={`text-sm ${bold ? "font-bold text-text-primary" : "text-text-muted"}`}>{label}</span>
              <span className={`font-bold ${bold ? "text-base" : "text-sm"}`} style={{ color }}>
                {sym}{value.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <span className="font-black text-text-primary">Net Profit</span>
            <span className={`text-xl font-black ${netProfit >= 0 ? "text-success" : "text-error"}`}>
              {netProfit < 0 ? "-" : ""}{sym}{Math.abs(netProfit).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Margin</span>
            <span className={`text-sm font-bold ${Number(margin) >= 0 ? "text-success" : "text-error"}`}>
              {margin}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
