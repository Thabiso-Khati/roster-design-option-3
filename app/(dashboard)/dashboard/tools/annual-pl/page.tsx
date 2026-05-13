"use client";
import { useState, useCallback, useEffect } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const COLOR = "#8B5CF6";
const STORAGE_KEY = "roster_annual_pl_v1";
const YEARS = ["2021", "2022", "2023", "2024", "2025", "2026"];

const INCOME_ROWS = [
  { section: "Live Performance & Events", items: ["Headline Shows & Concerts", "Festival Appearances", "Corporate & Private Events", "Club & Venue Bookings", "Ticket Sales (Artist Share)"] },
  { section: "Streaming & Digital", items: ["Spotify / Apple Music / TIDAL", "Boomplay / Audiomack / Mdundo", "YouTube / Content ID", "Digital Downloads"] },
  { section: "Royalties", items: ["SAMRO (Performance)", "CAPASSO (Mechanical)", "SAMPRA / AIRCO (Neighbouring)", "Sync Licensing Fees"] },
  { section: "Brand & Commercial", items: ["Brand Endorsements", "Sponsorships", "Merchandise Sales", "Commissioned Compositions"] },
  { section: "Other Income", items: ["Grants & Funding", "Music Production Services", "Workshops / Teaching", "Publishing Advances"] },
];

const EXPENSE_ROWS = [
  { section: "Team & Creative", items: ["Management Commission", "Booking Agent Commission", "Band / Musician Fees", "Producer / Studio Costs"] },
  { section: "Marketing & Promotion", items: ["Social Media Advertising", "PR & Publicist", "Radio Plugging", "Content Creation"] },
  { section: "Operations", items: ["Travel & Accommodation", "Equipment & Backline", "Legal & Accounting", "Software & Subscriptions"] },
  { section: "Other Expenses", items: ["Distribution Fees", "Merchandise Costs", "Visa & Admin Fees", "Miscellaneous"] },
];

type Data = Record<string, string>;

const fmt = (v: string) => {
  const n = parseFloat(v.replace(/[^0-9.-]/g, "")) || 0;
  return n === 0 ? "" : n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
const num = (v: string) => parseFloat(v.replace(/[^0-9.-]/g, "")) || 0;

export default function AnnualPLPage() {
  const handleExportPDF = () => { window.print(); };
  const { fmt: rand, country, currency } = useLocale();
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
  const [data, setData] = useState<Data>({});
  const [activeSection, setActiveSection] = useState<"income" | "expenses">("income");

  useToolRestore("annual-pl", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(prev => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const colTotal = (rows: typeof INCOME_ROWS, yr: string) =>
    rows.flatMap(r => r.items).reduce((s, item) => s + num(data[`${item}__${yr}`] || ""), 0);

  const totalIncome = (yr: string) => colTotal(INCOME_ROWS, yr);
  const totalExpenses = (yr: string) => colTotal(EXPENSE_ROWS, yr);
  const netProfit = (yr: string) => totalIncome(yr) - totalExpenses(yr);

  const renderTable = (rows: typeof INCOME_ROWS, prefix: string, color: string) => (
    <div className="glass-card rounded-xl overflow-hidden mb-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border" style={{ backgroundColor: `${color}08` }}>
              <th className="text-left px-4 py-2.5 font-black uppercase tracking-wider text-text-muted w-48">Category</th>
              {YEARS.map(yr => (
                <th key={yr} className="text-right px-3 py-2.5 font-black uppercase tracking-wider min-w-[100px]" style={{ color }}>{yr}</th>
              ))}
              <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-text-muted min-w-[100px]">6-Yr Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(section => (
              <>
                <tr key={section.section} className="border-b border-border/50">
                  <td colSpan={YEARS.length + 2} className="px-4 py-2" style={{ backgroundColor: `${color}06` }}>
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color }}>{section.section}</p>
                  </td>
                </tr>
                {section.items.map(item => {
                  const rowTotal = YEARS.reduce((s, yr) => s + num(data[`${item}__${yr}`] || ""), 0);
                  return (
                    <tr key={item} className="border-b border-border/30 hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-2 text-text-muted">{loc(item)}</td>
                      {YEARS.map(yr => (
                        <td key={yr} className="px-2 py-1.5">
                          <input
                            type="text" inputMode="numeric"
                            value={data[`${item}__${yr}`] || ""}
                            onChange={e => set(`${item}__${yr}`, e.target.value)}
                            placeholder="0"
                            className="w-full bg-surface-2 rounded px-2 py-1 text-right text-text-primary focus:outline-none transition-all placeholder:text-text-muted/30"
                            onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${color}40`}
                            onBlur={e => { e.target.style.boxShadow = "none"; set(`${item}__${e.currentTarget.name || yr}`, e.target.value); }}
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-semibold text-text-muted">{rowTotal > 0 ? rand(rowTotal) : ", "}</td>
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2" style={{ borderColor: color }}>
              <td className="px-4 py-3 font-black uppercase tracking-wider text-xs" style={{ color }}>Total {prefix}</td>
              {YEARS.map(yr => {
                const total = colTotal(rows, yr);
                return (
                  <td key={yr} className="px-3 py-3 text-right font-black" style={{ color }}>
                    {total > 0 ? rand(total) : ", "}
                  </td>
                );
              })}
              <td className="px-3 py-3 text-right font-black" style={{ color }}>
                {rand(YEARS.reduce((s, yr) => s + colTotal(rows, yr), 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-5xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="annual-pl" storageKey={STORAGE_KEY} title={`Annual Pl — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library/money" className="hover:text-text-primary transition-colors">Money Matters</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Annual Profit & Loss</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: "#8B5CF625" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Financial Years 2021 – 2026 · {currency}</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Annual Profit & Loss</h1>
            <p className="text-sm text-text-muted">Enter your actual figures in each year column. Totals calculate automatically.</p>
          </div>
          
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
        {YEARS.slice(-3).map(yr => {
          const inc = totalIncome(yr), exp = totalExpenses(yr), net = netProfit(yr);
          return (
            <div key={yr} className="glass-card rounded-xl p-4">
              <p className="text-xs font-black uppercase tracking-wider text-text-muted mb-3">{yr}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-xs text-text-muted">Income</span><span className="text-xs font-bold text-green-400">{inc > 0 ? rand(inc) : ", "}</span></div>
                <div className="flex justify-between"><span className="text-xs text-text-muted">Expenses</span><span className="text-xs font-bold text-red-400">{exp > 0 ? rand(exp) : ", "}</span></div>
                <div className="flex justify-between border-t border-border pt-1.5"><span className="text-xs font-bold text-text-primary">Net</span><span className={`text-xs font-black ${net >= 0 ? "text-brand" : "text-red-400"}`}>{net !== 0 ? rand(net) : ", "}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section tabs */}
      <div className="flex gap-0 mb-6 border-b border-border">
        {(["income", "expenses"] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px capitalize ${
              activeSection === s ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"
            }`}>{s === "income" ? "Income" : "Expenses"}</button>
        ))}
      </div>

      {activeSection === "income" && renderTable(INCOME_ROWS, "Income", "#10B981")}
      {activeSection === "expenses" && renderTable(EXPENSE_ROWS, "Expenses", "#EF4444")}

      {/* Net profit summary */}
      <div className="glass-card rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border" style={{ backgroundColor: "rgba(201,168,76,0.08)" }}>
                <th className="text-left px-4 py-2.5 font-black uppercase tracking-wider text-brand w-48">Summary</th>
                {YEARS.map(yr => <th key={yr} className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-brand">{yr}</th>)}
                <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-brand">6-Yr Total</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Total Income", fn: totalIncome, color: "#10B981" },
                { label: "Total Expenses", fn: totalExpenses, color: "#EF4444" },
                { label: "Net Profit / Loss", fn: netProfit, color: "#C9A84C" },
              ].map(row => (
                <tr key={row.label} className="border-b border-border/50">
                  <td className="px-4 py-3 font-bold" style={{ color: row.color }}>{row.label}</td>
                  {YEARS.map(yr => {
                    const v = row.fn(yr);
                    return <td key={yr} className="px-3 py-3 text-right font-bold" style={{ color: v !== 0 ? row.color : undefined }}>{v !== 0 ? rand(v) : ", "}</td>;
                  })}
                  <td className="px-3 py-3 text-right font-black" style={{ color: row.color }}>
                    {rand(YEARS.reduce((s, yr) => s + row.fn(yr), 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Export regularly to keep a permanent record.</p>
      </div>
    </div>
  );
}
