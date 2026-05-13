"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, ArrowRight, BookOpen, FileText, TrendingUp,
  BarChart3, Calculator, FileSpreadsheet, Banknote, DollarSign,
  PiggyBank, Receipt, Wallet, Globe, Plane, Building2
} from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";

const MODULE_COLOR = "#EC4899";

type Tab = "guides" | "service" | "tools";

const TABS: { id: Tab; label: string }[] = [
  { id: "guides",  label: "Money Guides" },
  { id: "service", label: "Service Record" },
  { id: "tools",   label: "Work Tools" },
];

const GUIDES = [
  {
    href: "/dashboard/library/money/revenue-streams",
    icon: TrendingUp,
    color: "#EC4899",
    title: "Revenue Streams",
    desc: "Every income stream available to artists and music businesses, from live performance to sync, royalties, brand deals, grants, and direct fan monetisation.",
    tag: "28 revenue streams",
  },
  {
    href: "/dashboard/library/money/royalties",
    icon: BookOpen,
    color: "#8B5CF6",
    title: "Royalties 101",
    desc: "Know what you're owed, who collects it, and how to register. A complete breakdown of all 5 royalty types for African artists.",
    tag: "5 royalty types",
  },
  {
    href: "/dashboard/library/money/tax-calendar",
    icon: Receipt,
    color: "#EC4899",
    title: "Tax Calendar",
    desc: "Country-specific tax obligations across the music business — VAT / GST, PAYE, withholding, royalty accounting periods, social security, and local collection societies. Switch jurisdictions via the locale switcher.",
    tag: "15 African markets",
  },
  {
    href: "/dashboard/library/money/grant-funding",
    icon: Globe,
    color: "#10B981",
    title: "Grant & Funding Guide",
    desc: "Every verified, currently active funding programme for musicians, producers, and music businesses across key African markets. 2026 status confirmed.",
    tag: "SA · Pan-African · 2026",
  },
  {
    href: "/dashboard/library/money/wht-tracker",
    icon: Plane,
    color: "#EC4899",
    title: "Withholding Tax Tracker",
    desc: "Capture every show where foreign WHT was deducted at source — UK 20%, US 30%, Schengen varies. Track DTA reclaim status, certificate numbers, and refund pipeline.",
    tag: "Tour-day tool",
  },
  {
    href: "/dashboard/library/money/vat-decision",
    icon: Calculator,
    color: "#EC4899",
    title: "VAT Decision Tool",
    desc: "Should you register for VAT? Country-by-country thresholds for all 15 IFPI key African markets — turnover-vs-threshold gauge with compulsory / approaching / clear verdict.",
    tag: "15 African markets",
  },
  {
    href: "/dashboard/library/money/banking-forex",
    icon: Building2,
    color: "#EC4899",
    title: "Banking & Forex Quick-Cards",
    desc: "Per-country one-pagers — bank account types, forex receive options, common SWIFT routes, mobile money rails. SA + NG shipped now.",
    tag: "SA + NG",
  },
];

const LIVE_TOOLS = [
  // ── Set Up ────────────────────────────────────────────────────────────
  { phase: "Set Up", href: "/dashboard/tools/personal-budget",   icon: Calculator,      color: "#EF4444", title: "Personal Budget Planner",       desc: "Map your personal income against every expense category. Know your monthly surplus or shortfall before month-end.",    tag: "Monthly" },
  { phase: "Set Up", href: "/dashboard/tools/cashflow-forecast", icon: DollarSign,      color: "#F59E0B", title: "Cashflow Forecast",             desc: "Plan your expected cash position month by month, forecast vs actuals so you never get caught short.",               tag: "12 months" },
  // ── Get Paid ──────────────────────────────────────────────────────────
  { phase: "Get Paid", href: "/dashboard/tools/invoice",         icon: FileSpreadsheet, color: "#6366F1", title: "Invoice Builder",             desc: "Tax-compliant invoice with automatic VAT calculation. Professional output every time.",                               tag: "VAT-ready" },
  // ── Track Daily ───────────────────────────────────────────────────────
  { phase: "Track Daily", href: "/dashboard/tools/daily-bookkeeping", icon: Receipt,   color: "#10B981", title: "Daily Bookkeeping Log",         desc: "Record every transaction with VAT tracking, local tax categories, and running totals. Tax authority-ready.",           tag: "Full year" },
  // ── Review Monthly ────────────────────────────────────────────────────
  { phase: "Review Monthly", href: "/dashboard/tools/monthly-revenue", icon: TrendingUp, color: "#EC4899", title: "Monthly Revenue Tracker",    desc: "Track all income sources week by week across every month. See exactly where your money comes from.",                tag: "12 months" },
  { phase: "Review Monthly", href: "/dashboard/tools/artist-finances", icon: Wallet,   color: "#06B6D4", title: "Artist Finances",               desc: "Complete financial management, income sources, spend plan, sales tracker, forecast vs actuals, and 3-year overview.", tag: "5 sheets" },
  // ── Annual Review ─────────────────────────────────────────────────────
  { phase: "Annual Review", href: "/dashboard/tools/annual-pl",  icon: BarChart3,       color: "#8B5CF6", title: "Annual Profit & Loss",          desc: "6-year income and expense tracker across every revenue category. Know your real P&L before your accountant does.",   tag: "6 years" },
  { phase: "Annual Review", href: "/dashboard/tools/net-worth",  icon: PiggyBank,       color: "#C9A84C", title: "Net Worth Tracker",             desc: "Track your assets and liabilities at 30, 60, and 90-day intervals. Know your real financial position.",              tag: "90-day view" },
];

export default function MoneyModulePage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const taxAbbr = res.taxAuthorityAbbr ?? "your tax authority";
  const [tab, setTab] = useState<Tab>("guides");

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link href="/dashboard/library" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15}/>Back to Toolkit
      </Link>

      {/* Module header */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: "#EC489925" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EC489915" }}>
            <Banknote size={26} style={{ color: MODULE_COLOR }}/>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: MODULE_COLOR }}>Run the Books</p>
            <h1 className="text-2xl font-black text-text-primary">Finance and Tax</h1>
            <p className="text-sm text-text-muted mt-0.5">Royalties, revenue streams, funding, and live financial tools, all in one place.</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-text-muted flex-wrap">
              <span style={{ color: MODULE_COLOR }} className="font-semibold">7 guides & tools</span>
              <span>·</span>
              <span style={{ color: MODULE_COLOR }} className="font-semibold">1 form & template</span>
              <span>·</span>
              <span style={{ color: MODULE_COLOR }} className="font-semibold">8 live work tools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-8 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              tab === t.id ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Guides tab ── */}
      {tab === "guides" && (
        <div>
          <p className="text-sm text-text-muted mb-5">Money guides and decision-support tools — revenue streams, royalty collection, grant funding, withholding tax, VAT registration, and banking / forex. Read here on ROSTER, save as PDF, or capture data directly.</p>
          <div className="space-y-3">
            {GUIDES.map(guide => (
              <Link key={guide.href} href={guide.href}
                className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-brand/30 transition-all block">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${guide.color}15` }}>
                  <guide.icon size={22} style={{ color: guide.color }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-bold text-text-primary group-hover:text-brand transition-colors">{guide.title}</p>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded" style={{ color: guide.color, backgroundColor: `${guide.color}15` }}>{guide.tag}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">{guide.desc}</p>
                </div>
                <ArrowRight size={18} className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0"/>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Service Record tab ── */}
      {tab === "service" && (
        <div>
          <p className="text-sm text-text-muted mb-5">Log every service you deliver, managing artists, booking, consulting, or performing. Protects you in disputes, supports invoicing, and provides evidence for {taxAbbr} submissions.</p>
          <Link href="/dashboard/library/money/service-record"
            className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-brand/30 transition-all block">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EC489915" }}>
              <FileText size={22} style={{ color: MODULE_COLOR }}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text-primary group-hover:text-brand transition-colors mb-0.5">Service Record</p>
              <p className="text-xs text-text-muted leading-relaxed">Professional service log for music managers, artists, and industry practitioners. Date, client, service type, duration, and notes, ready for {taxAbbr} and grant applications.</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{country} · 2026 Edition</span>
                <span className="text-xs text-text-muted">Interactive log · 30+ service categories</span>
              </div>
            </div>
            <ArrowRight size={18} className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0"/>
          </Link>
          <div className="mt-5 glass-card rounded-xl p-4 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
            <span className="text-base flex-shrink-0">💾</span>
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="font-semibold text-brand">Your data is saved for 90 days.</span> All entries are stored on this device. Export as PDF regularly to keep a permanent record for {taxAbbr}, legal, and grant purposes.
            </p>
          </div>
        </div>
      )}

      {/* ── Work Tools tab ── */}
      {tab === "tools" && (
        <div>
          <p className="text-sm text-text-muted mb-5">Eight live financial tools ordered by how you actually manage money — from setup through to annual review.</p>
          {(["Set Up", "Get Paid", "Track Daily", "Review Monthly", "Annual Review"] as const).map(phase => {
            const items = LIVE_TOOLS.filter(t => t.phase === phase);
            if (!items.length) return null;
            return (
              <div key={phase} className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: MODULE_COLOR }}>{phase}</p>
                <div className="space-y-3">
                  {items.map(tool => (
                    <Link key={tool.href} href={tool.href}
                      className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-brand/30 transition-all block">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${tool.color}15` }}>
                        <tool.icon size={22} style={{ color: tool.color }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="font-bold text-text-primary group-hover:text-brand transition-colors">{tool.title}</p>
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded" style={{ color: tool.color, backgroundColor: `${tool.color}15` }}>{tool.tag}</span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">{tool.desc}</p>
                      </div>
                      <ArrowRight size={18} className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0"/>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="mt-2 glass-card rounded-xl p-4 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
            <span className="text-base flex-shrink-0">💾</span>
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="font-semibold text-brand">Data stored for 90 days.</span> Your work is saved to this device. If you don&apos;t log in for 90 days the data resets, use the print option in each tool to keep a permanent copy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
