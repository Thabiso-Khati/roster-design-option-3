"use client";
import { useState, useCallback, useEffect } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const COLOR = "#F59E0B";
const STORAGE_KEY = "roster_personal_budget_v1";

const BUDGET_SECTIONS = [
  {
    id: "giving",
    label: "Giving & Charity",
    color: "#EC4899",
    items: [
      { id: "tithe", label: "Church / Tithe / Offering", debit: "1st of month" },
      { id: "donations", label: "Charitable Donations (BackaBuddy / other)", debit: "Monthly debit" },
      { id: "stokvel", label: "Stokvel Contribution", debit: "Per stokvel schedule" },
      { id: "burial", label: "Burial Society Premium", debit: "1st of month" },
    ],
  },
  {
    id: "saving",
    label: "Saving & Investing",
    color: "#10B981",
    items: [
      { id: "emergency", label: "Emergency Fund (3–6 months expenses)", debit: "Transfer 1st of month" },
      { id: "tfsa", label: "Tax-Free Savings Account (TFSA)", debit: "EasyEquities / Bank TFSA" },
      { id: "ra", label: "Retirement Annuity (RA)", debit: "Monthly debit order" },
      { id: "etf", label: "Unit Trust / ETF Investment", debit: "Monthly debit order" },
      { id: "goal", label: "Goal Savings (equipment / tour / purchase)", debit: "Separate savings account" },
    ],
  },
  {
    id: "housing",
    label: "Housing & Accommodation",
    color: "#8B5CF6",
    items: [
      { id: "rent", label: "Rent / Bond Instalment", debit: "1st of month" },
      { id: "rates", label: "Municipal Rates & Taxes", debit: "Municipal account" },
      { id: "electricity", label: "Electricity (Prepaid or Municipal)", debit: "Load weekly / debit 1st" },
      { id: "water", label: "Water & Sanitation", debit: "Municipal account" },
      { id: "contents", label: "Home Contents Insurance", debit: "Monthly debit" },
      { id: "security", label: "Security (ADT / Fidelity / Electric fence)", debit: "Monthly debit" },
      { id: "maintenance", label: "Home Maintenance & Repairs", debit: "As needed" },
    ],
  },
  {
    id: "load",
    label: "Loadshedding & Connectivity",
    color: "#06B6D4",
    items: [
      { id: "diesel", label: "Generator Diesel / Petrol", debit: "Fill as needed" },
      { id: "ups", label: "UPS / Inverter Battery Maintenance", debit: "Quarterly / as needed" },
      { id: "data", label: "Mobile Data Top-up (Vodacom / MTN / Telkom)", debit: "Weekly / monthly" },
      { id: "internet", label: "Internet (Fibre / LTE Router)", debit: "Monthly debit" },
      { id: "powerbank", label: "Power Bank Replacement", debit: "As needed" },
    ],
  },
  {
    id: "food",
    label: "Food & Groceries",
    color: "#10B981",
    items: [
      { id: "groceries", label: "Weekly Groceries (Checkers / Woolworths / Pick n Pay)", debit: "Weekly" },
      { id: "produce", label: "Fresh Produce (Market / Spar)", debit: "Weekly" },
      { id: "household", label: "Household Supplies (cleaning / toiletries)", debit: "Monthly" },
      { id: "takeaways", label: "Eating Out & Takeaways", debit: "As needed" },
      { id: "coffee", label: "Coffee & Snacks", debit: "Daily / as needed" },
    ],
  },
  {
    id: "transport",
    label: "Transport",
    color: "#F59E0B",
    items: [
      { id: "petrol", label: "Vehicle Petrol / Diesel", debit: "Weekly" },
      { id: "car-insurance", label: "Vehicle Insurance (OUTsurance / Discovery / MiWay)", debit: "Monthly debit" },
      { id: "licence", label: "Vehicle Licence & Roadworthy (NATIS)", debit: "Annual, provision monthly" },
      { id: "car-service", label: "Vehicle Maintenance (service / tyres)", debit: "As needed" },
      { id: "etoll", label: "E-Tags (SANRAL)", debit: "As applicable" },
      { id: "uber", label: "Uber / Bolt / inDrive", debit: "As needed" },
      { id: "taxi", label: "Taxi / MyCiTi / Rea Vaya / Gautrain", debit: "Daily if using public transport" },
    ],
  },
  {
    id: "health",
    label: "Health & Wellness",
    color: "#EC4899",
    items: [
      { id: "medical-aid", label: "Medical Aid (Discovery / Bonitas / Momentum)", debit: "1st of month" },
      { id: "gap-cover", label: "Gap Cover Insurance", debit: "Monthly debit" },
      { id: "pharmacy", label: "Pharmacy & Medication", debit: "As needed" },
      { id: "doctor", label: "Doctor / Specialist Visits", debit: "As needed" },
      { id: "gym", label: "Gym / Fitness Membership", debit: "Monthly debit" },
      { id: "therapy", label: "Mental Health / Therapy", debit: "Per session" },
    ],
  },
  {
    id: "clothing",
    label: "Clothing & Personal",
    color: "#8B5CF6",
    items: [
      { id: "clothes", label: "Clothing & Shoes", debit: "Monthly allowance" },
      { id: "stage-wear", label: "Stage / Performance Wardrobe", debit: "As needed, allocate monthly" },
      { id: "beauty", label: "Hair & Beauty / Grooming", debit: "Monthly" },
      { id: "personal-care", label: "Personal Care Products", debit: "Monthly" },
    ],
  },
  {
    id: "subscriptions",
    label: "Subscriptions & Tech",
    color: "#06B6D4",
    items: [
      { id: "spotify", label: "Spotify / Apple Music", debit: "13th / 14th of month" },
      { id: "youtube-prem", label: "YouTube Premium", debit: "Monthly debit" },
      { id: "microsoft", label: "Microsoft 365 / Google Workspace", debit: "24th / 28th of month" },
      { id: "adobe", label: "Adobe Creative Cloud", debit: "Monthly debit" },
      { id: "canva", label: "Canva Pro / Notion / other tools", debit: "Monthly debit" },
      { id: "streaming-tv", label: "Streaming (Netflix / Showmax / DStv)", debit: "Monthly debit" },
      { id: "cloud", label: "Cloud Storage (Google One / iCloud)", debit: "Monthly debit" },
      { id: "bank-fee", label: "Bank App / Yoco Monthly Fee", debit: "Monthly debit" },
    ],
  },
  {
    id: "education",
    label: "Education & Development",
    color: "#10B981",
    items: [
      { id: "courses", label: "Online Courses (Udemy / Skillshare / Coursera)", debit: "As needed" },
      { id: "books", label: "Books & Industry Publications", debit: "Monthly allowance" },
      { id: "events", label: "Industry Events & Networking", debit: "As needed" },
      { id: "lessons", label: "Music Lessons / Coaching", debit: "Monthly" },
    ],
  },
  {
    id: "insurance",
    label: "Insurance & Financial",
    color: "#F59E0B",
    items: [
      { id: "life-insurance", label: "Life Insurance (Sanlam / Old Mutual)", debit: "Monthly debit" },
      { id: "funeral", label: "Funeral Cover", debit: "Monthly debit" },
      { id: "liability", label: "Personal Liability / Business Insurance", debit: "Monthly debit" },
      { id: "income-protect", label: "Income Protection Insurance", debit: "Monthly debit" },
    ],
  },
  {
    id: "debt",
    label: "Debt Repayments",
    color: "#EF4444",
    items: [
      { id: "credit-card", label: "Credit Card Minimum / Full Payment", debit: "Payment due date" },
      { id: "personal-loan", label: "Personal Loan Instalment", debit: "Monthly debit" },
      { id: "vehicle-finance", label: "Vehicle Finance Instalment", debit: "Monthly debit" },
      { id: "other-debt", label: "Any Other Debt", debit: "Per agreement" },
    ],
  },
  {
    id: "misc",
    label: "Personal & Miscellaneous",
    color: COLOR,
    items: [
      { id: "gifts", label: "Birthday / Gifts", debit: "As occasions arise" },
      { id: "entertainment", label: "Entertainment & Outings", debit: "Monthly allowance" },
      { id: "family", label: "Family Support (lobola / events / remittances)", debit: "As needed" },
      { id: "pets", label: "Pet Care (if applicable)", debit: "Monthly" },
      { id: "buffer", label: "Miscellaneous / Unplanned Buffer", debit: "5% of income" },
    ],
  },
];

type Data = Record<string, string>;

const num = (v: string) => parseFloat((v || "").replace(/[^0-9.-]/g, "")) || 0;

export default function PersonalBudgetPage() {
  const handleExportPDF = () => { window.print(); };
  const { fmt: rand, country } = useLocale();
  const res = getCountryResources(country);
  const currency = res.currency ?? "ZAR";
  const taxAbbr = res.taxAuthorityAbbr ?? "SARS";
  const [data, setData] = useState<Data>({});

  useToolRestore("personal-budget", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(prev => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const n = (key: string) => num(data[key] || "");

  const totalIncome = n("income__budgeted");
  const totalIncomeActual = n("income__actual");

  const sectionBudget = (sectionId: string, items: typeof BUDGET_SECTIONS[0]["items"]) =>
    items.reduce((s, item) => s + n(`${sectionId}__${item.id}__budget`), 0);
  const sectionActual = (sectionId: string, items: typeof BUDGET_SECTIONS[0]["items"]) =>
    items.reduce((s, item) => s + n(`${sectionId}__${item.id}__actual`), 0);

  const totalBudget = BUDGET_SECTIONS.reduce((s, sec) => s + sectionBudget(sec.id, sec.items), 0);
  const totalActual = BUDGET_SECTIONS.reduce((s, sec) => s + sectionActual(sec.id, sec.items), 0);

  const remainingBudget = totalIncome - totalBudget;
  const remainingActual = totalIncomeActual - totalActual;

  const input = (key: string, color?: string) => (
    <input
      type="text" inputMode="numeric"
      value={data[key] || ""}
      onChange={e => set(key, e.target.value)}
      placeholder="0"
      className="w-full bg-surface-2 rounded px-2 py-1 text-right text-xs text-text-primary focus:outline-none transition-all placeholder:text-text-muted/30"
      style={color ? { color } : undefined}
      onFocus={e => (e.target.style.boxShadow = `0 0 0 2px ${color || COLOR}40`)}
      onBlur={e => (e.target.style.boxShadow = "none")}
    />
  );

  return (
    <div className="animate-fade-in max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="personal-budget" storageKey={STORAGE_KEY} title={`Personal Budget — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library/money" className="hover:text-text-primary transition-colors">Money Matters</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Personal Budget</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Monthly Personal Finances · {currency} · {country}</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Personal Budget Planner</h1>
        <p className="text-sm text-text-muted">Plan your monthly personal spending. Budget vs Actual vs Remaining, every category.</p>
      </div>

      {/* Income row */}
      <div className="glass-card rounded-xl p-5 mb-6" style={{ borderColor: "#10B98125", backgroundColor: "#10B98106" }}>
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-xs font-black uppercase tracking-widest text-green-400 flex-shrink-0">Total Monthly Income</p>
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <div className="flex items-center gap-2 min-w-[160px]">
              <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider w-16">Budgeted</span>
              <div className="flex-1">{input("income__budgeted", "#10B981")}</div>
            </div>
            <div className="flex items-center gap-2 min-w-[160px]">
              <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider w-16">Actual</span>
              <div className="flex-1">{input("income__actual", "#10B981")}</div>
            </div>
            <p className="text-xs text-text-muted">After-tax take-home (all sources)</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Budgeted Expenses", val: totalBudget, color: COLOR },
          { label: "Actual Expenses", val: totalActual, color: "#EF4444" },
          { label: "Remaining (Budgeted)", val: remainingBudget, color: remainingBudget >= 0 ? "#10B981" : "#EF4444" },
          { label: "Remaining (Actual)", val: remainingActual, color: remainingActual >= 0 ? "#10B981" : "#EF4444" },
        ].map(stat => (
          <div key={stat.label} className="glass-card rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-1">{stat.label}</p>
            <p className="text-sm font-black" style={{ color: stat.color }}>{stat.val !== 0 ? rand(stat.val) : ", "}</p>
          </div>
        ))}
      </div>

      {/* Budget Table */}
      <div className="glass-card rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
                <th className="text-left px-4 py-2.5 font-black uppercase tracking-wider text-text-muted min-w-[230px]">Item / Description</th>
                <th className="text-left px-3 py-2.5 font-black uppercase tracking-wider text-text-muted min-w-[130px] hidden sm:table-cell">Debit Date / Notes</th>
                <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider min-w-[110px]" style={{ color: COLOR }}>Budgeted</th>
                <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-red-400 min-w-[110px]">Actual Spent</th>
                <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-green-400 min-w-[110px]">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {BUDGET_SECTIONS.flatMap(section => [
                <tr key={`sec-${section.id}`} className="border-b border-border/50">
                  <td colSpan={5} className="px-4 py-2" style={{ backgroundColor: `${section.color}08` }}>
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: section.color }}>{section.label}</p>
                  </td>
                </tr>,
                ...section.items.map((item, idx) => {
                  const budget = n(`${section.id}__${item.id}__budget`);
                  const actual = n(`${section.id}__${item.id}__actual`);
                  const remaining = budget - actual;
                  const hasData = budget > 0 || actual > 0;
                  return (
                    <tr key={item.id} className={`border-b border-border/30 hover:bg-surface-2/50 transition-colors ${idx % 2 === 1 ? "bg-surface/10" : ""}`}>
                      <td className="px-4 py-2 text-text-muted">{item.label}</td>
                      <td className="px-3 py-2 text-text-muted/60 text-[11px] hidden sm:table-cell">{item.debit}</td>
                      <td className="px-2 py-1.5">{input(`${section.id}__${item.id}__budget`)}</td>
                      <td className="px-2 py-1.5">{input(`${section.id}__${item.id}__actual`)}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${hasData ? (remaining >= 0 ? "text-green-400" : "text-red-400") : "text-text-muted"}`}>
                        {hasData ? rand(remaining) : ", "}
                      </td>
                    </tr>
                  );
                }),
                <tr key={`sub-${section.id}`} className="border-b border-border/50" style={{ backgroundColor: `${section.color}05` }}>
                  <td className="px-4 py-2 font-black text-[11px]" style={{ color: section.color }}>Subtotal, {section.label}</td>
                  <td className="hidden sm:table-cell"/>
                  <td className="px-3 py-2 text-right font-black" style={{ color: section.color }}>
                    {sectionBudget(section.id, section.items) > 0 ? rand(sectionBudget(section.id, section.items)) : ", "}
                  </td>
                  <td className="px-3 py-2 text-right font-black text-red-400">
                    {sectionActual(section.id, section.items) > 0 ? rand(sectionActual(section.id, section.items)) : ", "}
                  </td>
                  <td className={`px-3 py-2 text-right font-black ${sectionBudget(section.id, section.items) - sectionActual(section.id, section.items) >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {(sectionBudget(section.id, section.items) > 0 || sectionActual(section.id, section.items) > 0)
                      ? rand(sectionBudget(section.id, section.items) - sectionActual(section.id, section.items))
                      : ", "}
                  </td>
                </tr>,
              ])}
            </tbody>
            <tfoot>
              <tr className="border-t-2" style={{ borderColor: COLOR }}>
                <td className="px-4 py-3 font-black uppercase tracking-wider text-xs" style={{ color: COLOR }}>Total Budgeted Expenses</td>
                <td className="hidden sm:table-cell"/>
                <td className="px-3 py-3 text-right font-black" style={{ color: COLOR }}>{totalBudget > 0 ? rand(totalBudget) : ", "}</td>
                <td className="px-3 py-3 text-right font-black text-red-400">{totalActual > 0 ? rand(totalActual) : ", "}</td>
                <td className="px-3 py-3 text-right font-black">, </td>
              </tr>
              <tr className="border-t border-border/50" style={{ backgroundColor: "rgba(16,185,129,0.05)" }}>
                <td className="px-4 py-3 font-black uppercase tracking-wider text-xs text-green-400">Remaining Balance (Unallocated)</td>
                <td className="hidden sm:table-cell"/>
                <td className={`px-3 py-3 text-right font-black ${remainingBudget >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {(totalIncome > 0 || totalBudget > 0) ? rand(remainingBudget) : ", "}
                </td>
                <td className={`px-3 py-3 text-right font-black ${remainingActual >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {(totalIncomeActual > 0 || totalActual > 0) ? rand(remainingActual) : ", "}
                </td>
                <td/>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Budgeting tips */}
      <div className="glass-card rounded-xl p-5 mb-6" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}04` }}>
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Budgeting Tips</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Give first, save second, spend last", tip: "Tithe and save before any other payment. Set up debit orders for the 1st of the month." },
            { label: "Utilities as a budget line", tip: "Generator diesel, UPS maintenance, and data top-ups are real monthly costs, budget for them." },
            { label: "Family obligations", tip: "Include community contributions, society premiums, and family support as fixed line items." },
            { label: "Provisional Tax", tip: `If you earn income outside of PAYE employment, set aside a portion quarterly for ${taxAbbr} to avoid end-of-year tax surprises.` },
          ].map(item => (
            <div key={item.label} className="flex gap-2">
              <div className="w-1 h-4 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: COLOR }}/>
              <div>
                <p className="text-xs font-black text-text-primary mb-0.5">{item.label}</p>
                <p className="text-xs text-text-muted leading-relaxed">{item.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save note */}
      <div className="glass-card rounded-xl p-4 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Reset the Actual column each month and update your Budgeted amounts as your circumstances change.
        </p>
      </div>
    </div>
  );
}
