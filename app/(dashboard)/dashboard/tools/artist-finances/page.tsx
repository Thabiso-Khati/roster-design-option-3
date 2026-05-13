"use client";
import { useState, useCallback, useEffect } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const COLOR = "#C9A84C";
const STORAGE_KEY = "roster_artist_finances_v1";

const INCOME_SOURCES = [
  { id: "live-shows", label: "Live Shows & Concerts", note: "Headline, support, festivals" },
  { id: "club-venue", label: "Club & Venue Bookings", note: "Residencies, private events" },
  { id: "corporate", label: "Corporate & Private Events", note: "Brand events, weddings, etc." },
  { id: "streaming", label: "Streaming (Boomplay / Spotify / Apple Music)", note: "Paid 2–3 months in arrears" },
  { id: "youtube", label: "YouTube Ad Revenue", note: "AdSense payments monthly" },
  { id: "samro", label: "SAMRO, Public Performance", note: "Quarterly payments" },
  { id: "sampra", label: "SAMPRA, Neighbouring Rights", note: "Periodic payments" },
  { id: "capasso", label: "CAPASSO, Mechanical Royalties", note: "Periodic payments" },
  { id: "sync", label: "Sync & Licensing Fees", note: "Film, TV, ads, games" },
  { id: "merch-sales", label: "Merchandise Sales", note: "Shopify / Bigcartel / venue" },
  { id: "brand", label: "Brand Sponsorships & Endorsements", note: "Per contract" },
  { id: "grants", label: "Grants & Funding (NAC / DAC / NLC)", note: "Enter when received" },
  { id: "teaching", label: "Teaching & Masterclasses", note: "Per session / monthly" },
  { id: "content", label: "Content Creation Income", note: "YouTube / TikTok / Patreon" },
  { id: "session", label: "Contracting / Session Work", note: "Feature verses, session playing" },
  { id: "other-inc", label: "Other Income", note: "Specify in notes" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const SPEND_SECTIONS = [
  { id: "team", label: "Artist Team & Creative", items: [
    "Band / Musician Fees", "Backing Vocals / Dancers", "Music Producer & Beat Costs",
    "Recording Studio Hire", "Mixing & Mastering", "Music Video Production", "Photographer / Videographer",
  ]},
  { id: "touring", label: "Touring & Live", items: [
    "Travel (Flights / Intercape / BazBus)", "Accommodation", "Ground Transport & Car Hire",
    "Staging, PA & Lighting", "Backline & Equipment Hire", "Fuel & Tolls (SANRAL)", "Per Diem / Meals on Tour",
  ]},
  { id: "marketing", label: "Marketing & Digital", items: [
    "Social Media Ads (Meta / TikTok)", "PR & Publicist Fees", "Graphic Design & Branding",
    "Website Hosting & Domain", "Email Marketing", "Streaming Promotion", "Radio Promotion",
  ]},
  { id: "admin", label: "Management & Admin", items: [
    "Manager Commission (15–20%)", "Booking Agent Commission (10–15%)", "Accountant & Bookkeeper",
    "Legal & Contract Fees", "CIPC Annual Return", "SAMRO / SAMPRA / CAPASSO Fees",
    "Bank Charges", "Payment Platform Fees (Yoco / PayFast)", "Software & Subscriptions",
  ]},
  { id: "equipment", label: "Equipment & Infrastructure", items: [
    "Equipment Purchase & Upgrade", "Equipment Repair & Maintenance",
    "Loadshedding (Generator / UPS / Fuel)", "Mobile Data & Internet",
    "Instrument Insurance", "Home Studio Contribution",
  ]},
  { id: "tax", label: "Tax & Financial", items: [
    "SARS Provisional Tax (IRP6, Aug)", "SARS Provisional Tax (IRP6, Feb)",
    "Medical Aid Contribution", "Retirement Annuity (RA)",
    "Life / Income Protection Insurance", "Emergency Fund Savings",
  ]},
  { id: "merch-cost", label: "Merchandise & Stock", items: [
    "Clothing Production Costs", "CD / Vinyl Pressing & Duplication",
    "Packaging & Labelling", "Shipping & Fulfilment", "Shopify / Bigcartel Fees",
  ]},
];

const SALES_SECTIONS = [
  { id: "physical", label: "Physical Sales", items: ["CD / EP Sales", "Vinyl / Limited Edition", "Cassette / Special Format"] },
  { id: "merch", label: "Merchandise", items: ["T-Shirts & Hoodies", "Caps, Beanies & Accessories", "Prints & Posters", "Branded Stationery & Zines", "Fan Bundles (CD + shirt)"] },
  { id: "digital", label: "Digital Sales", items: ["Bandcamp Downloads", "Direct Digital Sales (Gumroad)", "Sample Pack & Beat Sales"] },
  { id: "experiences", label: "Experiences & Access", items: ["VIP Backstage Passes", "Fan Club Subscription", "Online Course / Masterclass", "Exclusive Content Drops"] },
];

const SALES_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const FORECAST_INCOME_CATS = [
  "Live Shows & Events", "Streaming & Royalties", "Merchandise Sales",
  "Sync & Licensing", "Sponsorships & Grants", "Other Income",
];
const FORECAST_EXPENSE_CATS = [
  "Artist Team & Creative", "Touring & Live Costs", "Marketing & Promotion",
  "Management & Admin", "Equipment & Infrastructure",
  "Tax & Financial Obligations", "Merchandise Costs", "Personal Expenses",
];

const ANNUAL_INCOME_CATS = [
  "Live Shows & Concerts", "Streaming Revenue", "Royalties (SAMRO / SAMPRA / CAPASSO)",
  "Sync & Licensing", "Merchandise & Product Sales", "Sponsorships & Endorsements",
  "Grants & Funding", "Teaching & Other Income",
];
const ANNUAL_EXPENSE_CATS = [
  "Artist Team & Production", "Touring & Events", "Marketing & Promotion",
  "Management & Legal", "Equipment & Infrastructure",
  "Tax & SARS Payments", "Merchandise Production", "Personal Expenses",
];
const YEARS_3 = ["2024", "2025", "2026"];

type Data = Record<string, string>;
type Tab = "income" | "spend" | "sales" | "forecast" | "annuals";

const num = (v: string) => parseFloat((v || "").replace(/[^0-9.-]/g, "")) || 0;

export default function ArtistFinancesPage() {
  const handleExportPDF = () => { window.print(); };
  const { fmt: rand, country, currency } = useLocale();
  const res = getCountryResources(country);
  const proAbbr       = res.performanceRights.abbr;
  const mechAbbr      = res.mechanicalRights?.abbr ?? proAbbr;
  const neighbourAbbr = res.neighbouringRights?.abbr ?? proAbbr;
  const taxAbbr       = res.taxAuthorityAbbr ?? "SARS";
  const busRegAbbr    = res.businessRegAbbr ?? "CIPC";
  const loc = useCallback((t: string) => t
    .replace(/\bSAMRO\b/g, proAbbr)
    .replace(/\bCAPASSO\b/g, mechAbbr)
    .replace(/\bSAMPRA\b/g, neighbourAbbr)
    .replace(/\bSARS\b/g, taxAbbr)
    .replace(/\bCIPC\b/g, busRegAbbr)
    .replace(/\bIRP6\b/g, "Provisional Tax")
    .replace(/\bSANRAL\b/g, "Road Authority")
  , [proAbbr, mechAbbr, neighbourAbbr, taxAbbr, busRegAbbr]);
  const [data, setData] = useState<Data>({});
  const [tab, setTab] = useState<Tab>("income");
  const [incomeMonth, setIncomeMonth] = useState(new Date().getMonth());

  useToolRestore<Data>("artist-finances", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(prev => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const n = (key: string) => num(data[key] || "");

  const input = (key: string, placeholder = "0", extraClass = "") => (
    <input
      type="text" inputMode="numeric"
      value={data[key] || ""}
      onChange={e => set(key, e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-surface-2 rounded px-2 py-1 text-right text-xs text-text-primary focus:outline-none transition-all placeholder:text-text-muted/30 ${extraClass}`}
      onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${COLOR}40`}
      onBlur={e => { e.target.style.boxShadow = "none"; }}
    />
  );

  const monthKey = MONTHS[incomeMonth].toLowerCase().slice(0, 3);

  // ---- Income totals ----
  const incWeekTotal = (week: string) =>
    INCOME_SOURCES.reduce((s, src) => s + n(`inc__${src.id}__${monthKey}__${week}`), 0);
  const incRowTotal = (srcId: string) =>
    ["w1","w2","w3","w4"].reduce((s, w) => s + n(`inc__${srcId}__${monthKey}__${w}`), 0);
  const totalMonthlyIncome = INCOME_SOURCES.reduce((s, src) => s + incRowTotal(src.id), 0);

  // ---- Spend plan running balance ----
  const spendIncomeActual = n("spend__income__actual");
  const spendRunBalances: Record<string, number> = {};
  let rb = spendIncomeActual;
  SPEND_SECTIONS.forEach(section => {
    section.items.forEach(item => {
      rb -= n(`spend__${item}__actual`);
      spendRunBalances[item] = rb;
    });
  });
  const totalSpendBudget = SPEND_SECTIONS.flatMap(s => s.items).reduce((s, item) => s + n(`spend__${item}__budget`), 0);
  const totalSpendActual = SPEND_SECTIONS.flatMap(s => s.items).reduce((s, item) => s + n(`spend__${item}__actual`), 0);

  // ---- Sales totals ----
  const salesRowTotal = (item: string) => SALES_MONTHS.reduce((s, m) => s + n(`sales__${item}__${m}`), 0);
  const salesColTotal = (month: string) =>
    SALES_SECTIONS.flatMap(s => s.items).reduce((s, item) => s + n(`sales__${item}__${month}`), 0);

  // ---- Forecast totals ----
  const fcastTotal = (type: "inc" | "exp", field: "forecast" | "actual") => {
    const cats = type === "inc" ? FORECAST_INCOME_CATS : FORECAST_EXPENSE_CATS;
    return cats.reduce((s, cat) => s + n(`fcast__${type}__${cat}__${field}`), 0);
  };

  // ---- Annual totals ----
  const annualIncTotal = (yr: string) => ANNUAL_INCOME_CATS.reduce((s, cat) => s + n(`ann__inc__${cat}__${yr}`), 0);
  const annualExpTotal = (yr: string) => ANNUAL_EXPENSE_CATS.reduce((s, cat) => s + n(`ann__exp__${cat}__${yr}`), 0);
  const annualNet = (yr: string) => annualIncTotal(yr) - annualExpTotal(yr);

  const yoyPct = (curr: number, prev: number) =>
    prev !== 0 ? Math.round(((curr - prev) / Math.abs(prev)) * 100) : null;

  const TABS: { id: Tab; label: string }[] = [
    { id: "income", label: "💰 Income Sources" },
    { id: "spend", label: "📋 Spend Plan" },
    { id: "sales", label: "🛍️ Sales Tracker" },
    { id: "forecast", label: "📊 Forecast vs Actuals" },
    { id: "annuals", label: "📅 3-Year Overview" },
  ];

  return (
    <div className="animate-fade-in max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="artist-finances" storageKey={STORAGE_KEY} title={`Artist Finances — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library/money" className="hover:text-text-primary transition-colors">Money Matters</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Artist Finances</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Complete Financial Management · {currency} · 2026</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Artist Finances</h1>
        <p className="text-sm text-text-muted">Track income, plan spending, monitor sales, and forecast your financial performance, all in one place.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
              tab === t.id ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"
            }`}>{t.label}</button>
        ))}
      </div>

      {/* ── INCOME SOURCES ── */}
      {tab === "income" && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-sm text-text-muted">Monthly income by source and week · {currency}</p>
            <select value={incomeMonth} onChange={e => setIncomeMonth(Number(e.target.value))}
              className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none cursor-pointer"
              onFocus={e => (e.target.style.boxShadow = `0 0 0 2px ${COLOR}40`)}
              onBlur={e => (e.target.style.boxShadow = "none")}>
              {MONTHS.map((m, i) => <option key={m} value={i}>{m} 2026</option>)}
            </select>
          </div>
          <div className="glass-card rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
                    <th className="text-left px-4 py-2.5 font-black uppercase tracking-wider text-text-muted min-w-[200px]">Income Source</th>
                    {["Week 1","Week 2","Week 3","Week 4"].map(w => (
                      <th key={w} className="text-right px-3 py-2.5 font-black uppercase tracking-wider min-w-[95px]" style={{ color: COLOR }}>{w}</th>
                    ))}
                    <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-green-400 min-w-[110px]">Monthly Total</th>
                    <th className="text-left px-3 py-2.5 font-black uppercase tracking-wider text-text-muted min-w-[150px]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {INCOME_SOURCES.map((src, idx) => {
                    const rowTotal = incRowTotal(src.id);
                    return (
                      <tr key={src.id} className={`border-b border-border/30 hover:bg-surface-2/50 transition-colors ${idx % 2 === 1 ? "bg-surface/20" : ""}`}>
                        <td className="px-4 py-2 text-text-muted">{loc(src.label)}</td>
                        {["w1","w2","w3","w4"].map(w => (
                          <td key={w} className="px-2 py-1.5">{input(`inc__${src.id}__${monthKey}__${w}`)}</td>
                        ))}
                        <td className="px-3 py-2 text-right font-bold text-green-400">{rowTotal > 0 ? rand(rowTotal) : ", "}</td>
                        <td className="px-2 py-2">
                          <input type="text"
                            value={data[`inc__${src.id}__${monthKey}__notes`] || ""}
                            onChange={e => set(`inc__${src.id}__${monthKey}__notes`, e.target.value)}
                            placeholder={src.note}
                            className="w-full bg-transparent text-xs text-text-muted placeholder:text-text-muted/40 focus:outline-none"/>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2" style={{ borderColor: "#10B981" }}>
                    <td className="px-4 py-3 font-black uppercase tracking-wider text-xs text-green-400">Total Monthly Income</td>
                    {["w1","w2","w3","w4"].map(w => (
                      <td key={w} className="px-3 py-3 text-right font-black text-green-400">
                        {incWeekTotal(w) > 0 ? rand(incWeekTotal(w)) : ", "}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right font-black text-green-400">{totalMonthlyIncome > 0 ? rand(totalMonthlyIncome) : ", "}</td>
                    <td/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SPEND PLAN ── */}
      {tab === "spend" && (
        <div>
          <p className="text-sm text-text-muted mb-4">Map your income against all expenses, cascading balance · {currency}</p>
          <div className="glass-card rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
                    <th className="text-left px-4 py-2.5 font-black uppercase tracking-wider text-text-muted min-w-[230px]">Item / Category</th>
                    <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider min-w-[110px]" style={{ color: COLOR }}>Budgeted</th>
                    <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-red-400 min-w-[110px]">Actual Spent</th>
                    <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-green-400 min-w-[120px]">Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Income row */}
                  <tr className="border-b border-border" style={{ backgroundColor: "#10B98110" }}>
                    <td className="px-4 py-3 font-black uppercase tracking-wider text-green-400 text-[11px]">Total Income (from Income Sources)</td>
                    <td className="px-2 py-2">{input("spend__income__budget")}</td>
                    <td className="px-2 py-2">{input("spend__income__actual")}</td>
                    <td className="px-3 py-3 text-right font-bold text-green-400">
                      {spendIncomeActual > 0 ? rand(spendIncomeActual) : ", "}
                    </td>
                  </tr>
                  {SPEND_SECTIONS.flatMap(section => [
                    <tr key={`sec-${section.id}`} className="border-b border-border/50">
                      <td colSpan={4} className="px-4 py-2" style={{ backgroundColor: `${COLOR}06` }}>
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: COLOR }}>{section.label}</p>
                      </td>
                    </tr>,
                    ...section.items.map(item => {
                      const rb = spendRunBalances[item] ?? 0;
                      const hasData = spendIncomeActual > 0 || n(`spend__${item}__actual`) > 0;
                      return (
                        <tr key={item} className="border-b border-border/30 hover:bg-surface-2/50 transition-colors">
                          <td className="px-4 py-2 text-text-muted">{loc(item)}</td>
                          <td className="px-2 py-1.5">{input(`spend__${item}__budget`)}</td>
                          <td className="px-2 py-1.5">{input(`spend__${item}__actual`)}</td>
                          <td className={`px-3 py-2 text-right font-semibold ${rb >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {hasData ? rand(rb) : ", "}
                          </td>
                        </tr>
                      );
                    }),
                  ])}
                </tbody>
                <tfoot>
                  <tr className="border-t-2" style={{ borderColor: COLOR }}>
                    <td className="px-4 py-3 font-black uppercase tracking-wider text-xs" style={{ color: COLOR }}>Total Expenses</td>
                    <td className="px-3 py-3 text-right font-black" style={{ color: COLOR }}>{totalSpendBudget > 0 ? rand(totalSpendBudget) : ", "}</td>
                    <td className="px-3 py-3 text-right font-black text-red-400">{totalSpendActual > 0 ? rand(totalSpendActual) : ", "}</td>
                    <td className={`px-3 py-3 text-right font-black ${spendIncomeActual - totalSpendActual >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {(spendIncomeActual > 0 || totalSpendActual > 0) ? rand(spendIncomeActual - totalSpendActual) : ", "}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SALES TRACKER ── */}
      {tab === "sales" && (
        <div>
          <p className="text-sm text-text-muted mb-4">Track unit sales revenue by product type and month · {currency}</p>
          <div className="glass-card rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
                    <th className="text-left px-4 py-2.5 font-black uppercase tracking-wider text-text-muted min-w-[160px]">Product / Type</th>
                    {SALES_MONTHS.map(m => (
                      <th key={m} className="text-right px-1.5 py-2.5 font-black uppercase tracking-wider min-w-[60px]" style={{ color: COLOR }}>{m}</th>
                    ))}
                    <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-green-400 min-w-[95px]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {SALES_SECTIONS.flatMap(section => [
                    <tr key={`sec-${section.id}`} className="border-b border-border/50">
                      <td colSpan={14} className="px-4 py-2" style={{ backgroundColor: `${COLOR}06` }}>
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: COLOR }}>{section.label}</p>
                      </td>
                    </tr>,
                    ...section.items.map(item => {
                      const rowTotal = salesRowTotal(item);
                      return (
                        <tr key={item} className="border-b border-border/30 hover:bg-surface-2/50 transition-colors">
                          <td className="px-4 py-2 text-text-muted">{loc(item)}</td>
                          {SALES_MONTHS.map(m => (
                            <td key={m} className="px-1 py-1.5">
                              <input type="text" inputMode="numeric"
                                value={data[`sales__${item}__${m}`] || ""}
                                onChange={e => set(`sales__${item}__${m}`, e.target.value)}
                                placeholder="0"
                                className="w-full bg-surface-2 rounded px-1 py-1 text-right text-xs text-text-primary focus:outline-none transition-all placeholder:text-text-muted/30"
                                onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${COLOR}40`}
                                onBlur={e => { e.target.style.boxShadow = "none"; }}/>
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right font-bold text-green-400">{rowTotal > 0 ? rand(rowTotal) : ", "}</td>
                        </tr>
                      );
                    }),
                    <tr key={`sub-${section.id}`} className="border-b border-border/50" style={{ backgroundColor: `${COLOR}04` }}>
                      <td className="px-4 py-2 font-bold text-text-muted text-[11px]">Subtotal</td>
                      {SALES_MONTHS.map(m => {
                        const st = section.items.reduce((s, item) => s + n(`sales__${item}__${m}`), 0);
                        return <td key={m} className="px-1.5 py-2 text-right font-bold" style={{ color: COLOR }}>{st > 0 ? rand(st) : ", "}</td>;
                      })}
                      <td className="px-3 py-2 text-right font-black" style={{ color: COLOR }}>
                        {rand(section.items.reduce((s, item) => s + salesRowTotal(item), 0))}
                      </td>
                    </tr>,
                  ])}
                </tbody>
                <tfoot>
                  <tr className="border-t-2" style={{ borderColor: "#10B981" }}>
                    <td className="px-4 py-3 font-black uppercase tracking-wider text-xs text-green-400">Total Revenue</td>
                    {SALES_MONTHS.map(m => (
                      <td key={m} className="px-1.5 py-3 text-right font-black text-green-400">
                        {salesColTotal(m) > 0 ? rand(salesColTotal(m)) : ", "}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right font-black text-green-400">
                      {rand(SALES_SECTIONS.flatMap(s => s.items).reduce((s, item) => s + salesRowTotal(item), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── FORECAST VS ACTUALS ── */}
      {tab === "forecast" && (
        <div>
          <p className="text-sm text-text-muted mb-4">Compare planned income and expenditure against actuals · {currency}</p>
          <div className="glass-card rounded-xl p-4 mb-4 flex items-center gap-4 flex-wrap">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: COLOR }}>Opening Cash Balance</p>
            <div className="w-44">{input("fcast__opening")}</div>
          </div>
          <div className="glass-card rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
                    <th className="text-left px-4 py-2.5 font-black uppercase tracking-wider text-text-muted min-w-[200px]">Category</th>
                    <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider min-w-[120px]" style={{ color: COLOR }}>Forecast</th>
                    <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-green-400 min-w-[120px]">Actual</th>
                    <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-blue-400 min-w-[120px]">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Income */}
                  <tr className="border-b border-border/50">
                    <td colSpan={4} className="px-4 py-2" style={{ backgroundColor: "#10B98108" }}>
                      <p className="text-[10px] font-black uppercase tracking-wider text-green-400">▶ Income</p>
                    </td>
                  </tr>
                  {FORECAST_INCOME_CATS.map(cat => {
                    const f = n(`fcast__inc__${cat}__forecast`);
                    const a = n(`fcast__inc__${cat}__actual`);
                    const v = a - f;
                    return (
                      <tr key={cat} className="border-b border-border/30 hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-2 text-text-muted">{cat}</td>
                        <td className="px-2 py-1.5">{input(`fcast__inc__${cat}__forecast`)}</td>
                        <td className="px-2 py-1.5">{input(`fcast__inc__${cat}__actual`)}</td>
                        <td className={`px-3 py-2 text-right font-semibold ${v >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {(f > 0 || a > 0) ? (v >= 0 ? `+${rand(v)}` : rand(v)) : ", "}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-b border-border" style={{ backgroundColor: "#10B98108" }}>
                    <td className="px-4 py-2.5 font-black text-green-400 text-xs">Subtotal, Income</td>
                    <td className="px-3 py-2.5 text-right font-black text-green-400">{fcastTotal("inc","forecast") > 0 ? rand(fcastTotal("inc","forecast")) : ", "}</td>
                    <td className="px-3 py-2.5 text-right font-black text-green-400">{fcastTotal("inc","actual") > 0 ? rand(fcastTotal("inc","actual")) : ", "}</td>
                    <td className={`px-3 py-2.5 text-right font-black ${fcastTotal("inc","actual") - fcastTotal("inc","forecast") >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {(fcastTotal("inc","forecast") > 0 || fcastTotal("inc","actual") > 0)
                        ? rand(fcastTotal("inc","actual") - fcastTotal("inc","forecast")) : ", "}
                    </td>
                  </tr>
                  {/* Expenses */}
                  <tr className="border-b border-border/50">
                    <td colSpan={4} className="px-4 py-2" style={{ backgroundColor: "#EF444408" }}>
                      <p className="text-[10px] font-black uppercase tracking-wider text-red-400">▶ Expenses</p>
                    </td>
                  </tr>
                  {FORECAST_EXPENSE_CATS.map(cat => {
                    const f = n(`fcast__exp__${cat}__forecast`);
                    const a = n(`fcast__exp__${cat}__actual`);
                    const v = f - a;
                    return (
                      <tr key={cat} className="border-b border-border/30 hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-2 text-text-muted">{cat}</td>
                        <td className="px-2 py-1.5">{input(`fcast__exp__${cat}__forecast`)}</td>
                        <td className="px-2 py-1.5">{input(`fcast__exp__${cat}__actual`)}</td>
                        <td className={`px-3 py-2 text-right font-semibold ${v >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {(f > 0 || a > 0) ? rand(v) : ", "}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-b border-border" style={{ backgroundColor: "#EF444408" }}>
                    <td className="px-4 py-2.5 font-black text-red-400 text-xs">Subtotal, Expenses</td>
                    <td className="px-3 py-2.5 text-right font-black text-red-400">{fcastTotal("exp","forecast") > 0 ? rand(fcastTotal("exp","forecast")) : ", "}</td>
                    <td className="px-3 py-2.5 text-right font-black text-red-400">{fcastTotal("exp","actual") > 0 ? rand(fcastTotal("exp","actual")) : ", "}</td>
                    <td className={`px-3 py-2.5 text-right font-black ${fcastTotal("exp","forecast") - fcastTotal("exp","actual") >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {(fcastTotal("exp","forecast") > 0 || fcastTotal("exp","actual") > 0)
                        ? rand(fcastTotal("exp","forecast") - fcastTotal("exp","actual")) : ", "}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2" style={{ borderColor: COLOR }}>
                    <td className="px-4 py-3 font-black uppercase tracking-wider text-xs" style={{ color: COLOR }}>Net Cashflow</td>
                    {(["forecast","actual"] as const).map(field => {
                      const net = fcastTotal("inc", field) - fcastTotal("exp", field);
                      return <td key={field} className={`px-3 py-3 text-right font-black ${net >= 0 ? "text-green-400" : "text-red-400"}`}>{net !== 0 ? rand(net) : ", "}</td>;
                    })}
                    <td className="px-3 py-3 text-right font-black text-blue-400">
                      {(() => {
                        const fv = fcastTotal("inc","forecast") - fcastTotal("exp","forecast");
                        const av = fcastTotal("inc","actual") - fcastTotal("exp","actual");
                        const v = av - fv;
                        return (fv !== 0 || av !== 0) ? rand(v) : ", ";
                      })()}
                    </td>
                  </tr>
                  <tr className="border-t border-border/50">
                    <td className="px-4 py-2.5 font-bold text-brand text-xs">Closing Cash Balance</td>
                    {(["forecast","actual"] as const).map(field => {
                      const closing = n("fcast__opening") + fcastTotal("inc", field) - fcastTotal("exp", field);
                      return <td key={field} className="px-3 py-2.5 text-right font-black text-brand">{rand(closing)}</td>;
                    })}
                    <td/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 3-YEAR OVERVIEW ── */}
      {tab === "annuals" && (
        <div>
          <p className="text-sm text-text-muted mb-4">Annual income, expenses and net profit with year-on-year growth · {currency}</p>
          <div className="glass-card rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
                    <th className="text-left px-4 py-2.5 font-black uppercase tracking-wider text-text-muted min-w-[220px]">Category</th>
                    {YEARS_3.map(yr => (
                      <th key={yr} className="text-right px-3 py-2.5 font-black uppercase tracking-wider min-w-[110px]" style={{ color: COLOR }}>{yr}</th>
                    ))}
                    <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-text-muted min-w-[90px]">YoY Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Income */}
                  <tr className="border-b border-border/50">
                    <td colSpan={5} className="px-4 py-2" style={{ backgroundColor: "#10B98108" }}>
                      <p className="text-[10px] font-black uppercase tracking-wider text-green-400">▶ Income</p>
                    </td>
                  </tr>
                  {ANNUAL_INCOME_CATS.map(cat => {
                    const v25 = n(`ann__inc__${cat}__2025`);
                    const v26 = n(`ann__inc__${cat}__2026`);
                    const yoy = yoyPct(v26, v25);
                    return (
                      <tr key={cat} className="border-b border-border/30 hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-2 text-text-muted">{cat}</td>
                        {YEARS_3.map(yr => <td key={yr} className="px-2 py-1.5">{input(`ann__inc__${cat}__${yr}`)}</td>)}
                        <td className={`px-3 py-2 text-right font-semibold text-xs ${yoy !== null ? (yoy >= 0 ? "text-green-400" : "text-red-400") : "text-text-muted"}`}>
                          {yoy !== null ? `${yoy >= 0 ? "+" : ""}${yoy}%` : ", "}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-b border-border" style={{ backgroundColor: "#10B98108" }}>
                    <td className="px-4 py-2.5 font-black text-green-400 text-xs">Subtotal, Income</td>
                    {YEARS_3.map(yr => (
                      <td key={yr} className="px-3 py-2.5 text-right font-black text-green-400">
                        {annualIncTotal(yr) > 0 ? rand(annualIncTotal(yr)) : ", "}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right font-semibold text-xs">
                      {(() => { const y = yoyPct(annualIncTotal("2026"), annualIncTotal("2025")); return y !== null ? <span className={y >= 0 ? "text-green-400" : "text-red-400"}>{y >= 0 ? "+" : ""}{y}%</span> : ", "; })()}
                    </td>
                  </tr>
                  {/* Expenses */}
                  <tr className="border-b border-border/50">
                    <td colSpan={5} className="px-4 py-2" style={{ backgroundColor: "#EF444408" }}>
                      <p className="text-[10px] font-black uppercase tracking-wider text-red-400">▶ Expenses</p>
                    </td>
                  </tr>
                  {ANNUAL_EXPENSE_CATS.map(cat => {
                    const v25 = n(`ann__exp__${cat}__2025`);
                    const v26 = n(`ann__exp__${cat}__2026`);
                    const yoy = yoyPct(v26, v25);
                    return (
                      <tr key={cat} className="border-b border-border/30 hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-2 text-text-muted">{cat}</td>
                        {YEARS_3.map(yr => <td key={yr} className="px-2 py-1.5">{input(`ann__exp__${cat}__${yr}`)}</td>)}
                        <td className={`px-3 py-2 text-right font-semibold text-xs ${yoy !== null ? (yoy <= 0 ? "text-green-400" : "text-red-400") : "text-text-muted"}`}>
                          {yoy !== null ? `${yoy >= 0 ? "+" : ""}${yoy}%` : ", "}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-b border-border" style={{ backgroundColor: "#EF444408" }}>
                    <td className="px-4 py-2.5 font-black text-red-400 text-xs">Subtotal, Expenses</td>
                    {YEARS_3.map(yr => (
                      <td key={yr} className="px-3 py-2.5 text-right font-black text-red-400">
                        {annualExpTotal(yr) > 0 ? rand(annualExpTotal(yr)) : ", "}
                      </td>
                    ))}
                    <td/>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2" style={{ borderColor: COLOR }}>
                    <td className="px-4 py-3 font-black uppercase tracking-wider text-xs" style={{ color: COLOR }}>Net Profit / (Loss)</td>
                    {YEARS_3.map(yr => {
                      const net = annualNet(yr);
                      return (
                        <td key={yr} className={`px-3 py-3 text-right font-black ${net > 0 ? "text-green-400" : net < 0 ? "text-red-400" : "text-text-muted"}`}>
                          {net !== 0 ? rand(net) : ", "}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-right font-semibold text-xs">
                      {(() => { const y = yoyPct(annualNet("2026"), annualNet("2025")); return y !== null ? <span className={y >= 0 ? "text-green-400" : "text-red-400"}>{y >= 0 ? "+" : ""}{y}%</span> : ", "; })()}
                    </td>
                  </tr>
                  <tr className="border-t border-border/50">
                    <td className="px-4 py-2 text-text-muted text-xs">Profit Margin %</td>
                    {YEARS_3.map(yr => {
                      const inc = annualIncTotal(yr);
                      const net = annualNet(yr);
                      const pct = inc > 0 ? Math.round((net / inc) * 100) : null;
                      return (
                        <td key={yr} className={`px-3 py-2 text-right font-bold text-xs ${pct !== null ? (pct >= 0 ? "text-green-400" : "text-red-400") : "text-text-muted"}`}>
                          {pct !== null ? `${pct}%` : ", "}
                        </td>
                      );
                    })}
                    <td/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Auto-save note */}
      <div className="glass-card rounded-xl p-4 flex items-start gap-3 mt-2" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> All 5 sheets save automatically as you type.
        </p>
      </div>
    </div>
  );
}
