"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const COLOR = "#8B5CF6";
const STORAGE_KEY = "roster_net_worth_v1";
const PERIODS = ["Starting Balance", "30 Days", "60 Days", "90 Days"] as const;

const ASSET_SECTIONS = [
  {
    id: "cash",
    label: "Cash & Liquid Assets",
    items: [
      "Cheque / Current Account (FNB / Nedbank / Capitec)",
      "Savings Account",
      "Money Market Account",
      "Cash on Hand",
      "Petty Cash (Business)",
    ],
  },
  {
    id: "investments",
    label: "Investments & Marketable Assets",
    items: [
      "Unit Trusts (Allan Gray / Sanlam / Coronation)",
      "ETFs (Satrix / Ashburton / CoreShares)",
      "JSE-listed Shares",
      "Tax-Free Savings Account (TFSA)",
      "Crypto Holdings (Bitcoin / Ethereum / other)",
      "Other Investments",
    ],
  },
  {
    id: "retirement",
    label: "Retirement & Long-Term Assets",
    items: [
      "Retirement Annuity (RA), 10X / Allan Gray / Momentum",
      "Pension Fund or Provident Fund",
      "Endowment Policy / Life Assurance",
      "Employer-linked Retirement Fund",
    ],
  },
  {
    id: "physical",
    label: "Physical & Music Industry Assets",
    items: [
      "Primary Residence (estimated market value)",
      "Vehicle(s) (current trade-in value)",
      "Music Equipment & Studio Gear",
      "Instruments (guitars / keys / DJ gear / PA)",
      "Master Recording Rights (estimated value)",
      "Publishing / Songwriting Rights (catalogue value)",
      "Merchandise Inventory (at cost)",
      "Collectibles / Art / NFTs",
      "Other Personal Assets",
    ],
  },
];

const LIABILITY_SECTIONS = [
  {
    id: "short-term",
    label: "Short-Term Debt (due within 12 months)",
    items: [
      "Credit Card Balance(s)",
      "Store Account Balances (Woolworths / Edgars / Truworths)",
      "Personal Loan (short-term)",
      "SARS Tax Arrears or Instalment Agreement",
      "Overdue Municipal / Utilities Account",
      "Other Short-Term Debt",
    ],
  },
  {
    id: "long-term",
    label: "Long-Term Debt",
    items: [
      "Home Loan / Bond (outstanding balance)",
      "Vehicle Finance (outstanding balance)",
      "Student Loan",
      "Business Loan / Development Finance",
      "Equipment Finance",
      "Other Long-Term Debt",
    ],
  },
];

type Data = Record<string, string>;

const num = (v: string) => parseFloat((v || "").replace(/[^0-9.-]/g, "")) || 0;

const pKey = (period: string) => period.toLowerCase().replace(/ /g, "_");

export default function NetWorthPage() {
  const handleExportPDF = () => { window.print(); };
  const { fmtSigned: rand, country } = useLocale();
  const res = getCountryResources(country);
  const currency = res.currency ?? "ZAR";
  const taxAbbr = res.taxAuthorityAbbr ?? "SARS";
  const mechAbbr = res.mechanicalRights?.abbr ?? res.performanceRights.abbr;

  const localizedLiabilitySections = useMemo(() => LIABILITY_SECTIONS.map(sec => ({
    ...sec,
    items: sec.items.map(item =>
      item === "SARS Tax Arrears or Instalment Agreement"
        ? `${taxAbbr} Tax Arrears or Instalment Agreement`
        : item
    ),
  })), [taxAbbr]);

  const [data, setData] = useState<Data>({});

  useToolRestore("net-worth", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(prev => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const n = (key: string) => num(data[key] || "");

  // ---- Section totals ----
  const sectionTotal = (section: typeof ASSET_SECTIONS[0], period: string) =>
    section.items.reduce((s, item) => s + n(`${section.id}__${item}__${pKey(period)}`), 0);

  const totalAssets = (period: string) =>
    ASSET_SECTIONS.reduce((s, sec) => s + sectionTotal(sec, period), 0);

  const liabSectionTotal = (section: typeof LIABILITY_SECTIONS[0], period: string) =>
    section.items.reduce((s, item) => s + n(`${section.id}__${item}__${pKey(period)}`), 0);

  const totalLiabilities = (period: string) =>
    localizedLiabilitySections.reduce((s, sec) => s + liabSectionTotal(sec, period), 0);

  const netWorth = (period: string) => totalAssets(period) - totalLiabilities(period);

  const input = (key: string) => (
    <input
      type="text" inputMode="numeric"
      value={data[key] || ""}
      onChange={e => set(key, e.target.value)}
      placeholder="0"
      className="w-full bg-surface-2 rounded px-2 py-1 text-right text-xs text-text-primary focus:outline-none transition-all placeholder:text-text-muted/30"
      onFocus={e => (e.target.style.boxShadow = `0 0 0 2px ${COLOR}40`)}
      onBlur={e => (e.target.style.boxShadow = "none")}
    />
  );

  const startNW = netWorth("Starting Balance");
  const periodColors = [COLOR, "#06B6D4", "#10B981", "#F59E0B"];

  return (
    <div className="animate-fade-in max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="net-worth" storageKey={STORAGE_KEY} title={`Net Worth — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library/money" className="hover:text-text-primary transition-colors">Money Matters</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Net Worth Sheet</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{country} Artist Financial Position · {currency} · 2026</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Net Worth Sheet</h1>
        <p className="text-sm text-text-muted">Track everything you own and everything you owe across four snapshot periods. Net Worth = Total Assets minus Total Liabilities.</p>
      </div>

      {/* Net worth summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {PERIODS.map((period, i) => {
          const nw = netWorth(period);
          const growth = i > 0 ? nw - startNW : null;
          return (
            <div key={period} className="glass-card rounded-xl p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-2">{period}</p>
              <p className="text-sm font-black mb-1" style={{ color: nw > 0 ? periodColors[i] : nw < 0 ? "#EF4444" : "var(--color-text-muted)" }}>
                {nw !== 0 ? rand(nw) : ", "}
              </p>
              {growth !== null && growth !== 0 && (
                <p className={`text-[10px] font-semibold ${growth >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {growth >= 0 ? "▲" : "▼"} {rand(Math.abs(growth))}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Assets Table */}
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#10B981" }}/>
          <h2 className="text-base font-black text-text-primary">Assets, What You Own</h2>
        </div>
        <div className="glass-card rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border" style={{ backgroundColor: "#10B98108" }}>
                  <th className="text-left px-4 py-2.5 font-black uppercase tracking-wider text-text-muted min-w-[250px]">Asset</th>
                  {PERIODS.map((p, i) => (
                    <th key={p} className="text-right px-3 py-2.5 font-black uppercase tracking-wider min-w-[115px]" style={{ color: periodColors[i] }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ASSET_SECTIONS.flatMap(section => [
                  <tr key={`sec-${section.id}`} className="border-b border-border/50">
                    <td colSpan={5} className="px-4 py-2" style={{ backgroundColor: "#10B98106" }}>
                      <p className="text-[10px] font-black uppercase tracking-wider text-green-400">{section.label}</p>
                    </td>
                  </tr>,
                  ...section.items.map(item => (
                    <tr key={item} className="border-b border-border/30 hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-2 text-text-muted">{item}</td>
                      {PERIODS.map(period => (
                        <td key={period} className="px-2 py-1.5">{input(`${section.id}__${item}__${pKey(period)}`)}</td>
                      ))}
                    </tr>
                  )),
                  <tr key={`sub-${section.id}`} className="border-b border-border/50" style={{ backgroundColor: "#10B98106" }}>
                    <td className="px-4 py-2 font-black text-green-400 text-[11px]">Subtotal, {section.label}</td>
                    {PERIODS.map((period, i) => {
                      const st = sectionTotal(section, period);
                      return <td key={period} className="px-3 py-2 text-right font-black text-green-400">{st > 0 ? rand(st) : ", "}</td>;
                    })}
                  </tr>,
                ])}
              </tbody>
              <tfoot>
                <tr className="border-t-2" style={{ borderColor: "#10B981" }}>
                  <td className="px-4 py-3 font-black uppercase tracking-wider text-xs text-green-400">Total Assets</td>
                  {PERIODS.map(period => (
                    <td key={period} className="px-3 py-3 text-right font-black text-green-400">
                      {totalAssets(period) > 0 ? rand(totalAssets(period)) : ", "}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Liabilities Table */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#EF4444" }}/>
          <h2 className="text-base font-black text-text-primary">Liabilities, What You Owe</h2>
        </div>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border" style={{ backgroundColor: "#EF444408" }}>
                  <th className="text-left px-4 py-2.5 font-black uppercase tracking-wider text-text-muted min-w-[250px]">Liability</th>
                  {PERIODS.map((p, i) => (
                    <th key={p} className="text-right px-3 py-2.5 font-black uppercase tracking-wider min-w-[115px]" style={{ color: periodColors[i] }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localizedLiabilitySections.flatMap(section => [
                  <tr key={`sec-${section.id}`} className="border-b border-border/50">
                    <td colSpan={5} className="px-4 py-2" style={{ backgroundColor: "#EF444406" }}>
                      <p className="text-[10px] font-black uppercase tracking-wider text-red-400">{section.label}</p>
                    </td>
                  </tr>,
                  ...section.items.map(item => (
                    <tr key={item} className="border-b border-border/30 hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-2 text-text-muted">{item}</td>
                      {PERIODS.map(period => (
                        <td key={period} className="px-2 py-1.5">{input(`${section.id}__${item}__${pKey(period)}`)}</td>
                      ))}
                    </tr>
                  )),
                  <tr key={`sub-${section.id}`} className="border-b border-border/50" style={{ backgroundColor: "#EF444406" }}>
                    <td className="px-4 py-2 font-black text-red-400 text-[11px]">Subtotal, {section.label}</td>
                    {PERIODS.map(period => {
                      const st = liabSectionTotal(section, period);
                      return <td key={period} className="px-3 py-2 text-right font-black text-red-400">{st > 0 ? rand(st) : ", "}</td>;
                    })}
                  </tr>,
                ])}
              </tbody>
              <tfoot>
                <tr className="border-t-2" style={{ borderColor: "#EF4444" }}>
                  <td className="px-4 py-3 font-black uppercase tracking-wider text-xs text-red-400">Total Liabilities</td>
                  {PERIODS.map(period => (
                    <td key={period} className="px-3 py-3 text-right font-black text-red-400">
                      {totalLiabilities(period) > 0 ? rand(totalLiabilities(period)) : ", "}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Net Worth Summary */}
      <div className="glass-card rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
                <th className="text-left px-4 py-2.5 font-black uppercase tracking-wider min-w-[250px]" style={{ color: COLOR }}>Net Worth Summary</th>
                {PERIODS.map((p, i) => (
                  <th key={p} className="text-right px-3 py-2.5 font-black uppercase tracking-wider min-w-[115px]" style={{ color: periodColors[i] }}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Total Assets", fn: totalAssets, color: "#10B981" },
                { label: "Total Liabilities", fn: totalLiabilities, color: "#EF4444" },
              ].map(row => (
                <tr key={row.label} className="border-b border-border/50">
                  <td className="px-4 py-3 font-bold" style={{ color: row.color }}>{row.label}</td>
                  {PERIODS.map(period => {
                    const v = row.fn(period);
                    return <td key={period} className="px-3 py-3 text-right font-bold" style={{ color: v !== 0 ? row.color : undefined }}>{v !== 0 ? rand(v) : ", "}</td>;
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2" style={{ borderColor: COLOR }}>
                <td className="px-4 py-3 font-black uppercase tracking-wider text-xs" style={{ color: COLOR }}>Net Worth</td>
                {PERIODS.map(period => {
                  const nw = netWorth(period);
                  return (
                    <td key={period} className={`px-3 py-3 text-right font-black ${nw > 0 ? "text-green-400" : nw < 0 ? "text-red-400" : "text-text-muted"}`}>
                      {nw !== 0 ? rand(nw) : ", "}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-t border-border/50">
                <td className="px-4 py-2 text-text-muted text-xs">Growth vs Starting Balance</td>
                {PERIODS.map((period, i) => {
                  const growth = i > 0 ? netWorth(period) - startNW : null;
                  return (
                    <td key={period} className={`px-3 py-2 text-right font-semibold text-xs ${growth !== null ? (growth >= 0 ? "text-green-400" : "text-red-400") : "text-text-muted"}`}>
                      {growth !== null && (netWorth(period) !== 0 || startNW !== 0) ? rand(growth) : ", "}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Asset Guide */}
      <div className="glass-card rounded-xl p-5 mb-6" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}04` }}>
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Asset & Liability Notes</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {[
            { label: "Retirement Fund / Pension", note: "Self-employed pension contributions are typically tax-deductible. Check your country's annual limits." },
            { label: "Tax-Free Savings", note: "Many countries offer tax-free investment accounts with annual and lifetime contribution limits." },
            { label: "Master Recording Rights", note: "If you own your master recordings, their market value is an asset. Estimate conservatively." },
            { label: `Publishing Rights (${mechAbbr})`, note: "Your songwriting/composition rights are a long-term income-producing asset." },
            { label: `${taxAbbr} Tax Debt`, note: `Outstanding provisional or income tax owed to ${taxAbbr} is a short-term liability. Include it.` },
            { label: "ETF / Unit Trust Investments", note: "ETFs and unit trusts tracking local or global indices are marketable assets, use current portfolio value." },
          ].map(item => (
            <div key={item.label} className="flex gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider flex-shrink-0 mt-0.5" style={{ color: COLOR }}>{item.label}:</span>
              <p className="text-xs text-text-muted leading-relaxed">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Save note */}
      <div className="glass-card rounded-xl p-4 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Update your net worth every 30 days to track your financial progress accurately.
        </p>
      </div>
    </div>
  );
}
