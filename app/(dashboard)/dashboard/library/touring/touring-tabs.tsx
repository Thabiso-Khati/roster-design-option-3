"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ArrowRight, BookOpen, FileText, CheckSquare, ClipboardList, BarChart3, Mail, Music2, Users, Plane, ScrollText, Coffee, Disc, Plug } from "lucide-react";

const MODULE_COLOR = "#F59E0B";
type Tab = "guides" | "forms" | "tools";

const GUIDES = [
  { href: "/dashboard/library/touring/tour-booking", icon: BookOpen, color: "#F59E0B", title: "Tour Booking Guide", desc: "How to research markets, build your routing strategy, approach venues and promoters, and fill a tour calendar, even without a track record. The full 5-step process from intelligence gathering to advancing the show.", tag: "5 steps" },
  { href: "/dashboard/library/touring/tour-management", icon: ClipboardList, color: "#10B981", title: "Tour Management", desc: "Everything that happens between load-in and load-out, nightly operations, cross-border logistics, financial discipline on the road, fan data strategy, and the technology stack that keeps a tour running.", tag: "Full guide" },
  { href: "/dashboard/library/touring/show-booking-email", icon: Mail, color: "#8B5CF6", title: "Show Booking Email Guide", desc: "How to write a booking email that gets read and answered, the 5 checks before you write, the subject line formula, follow-up protocol, and every mistake that gets your email deleted.", tag: "Templates" },
  { href: "/dashboard/library/touring/set-list", icon: Music2, color: "#EC4899", title: "Building Your Set List", desc: "How to sequence songs for maximum impact, energy management, crowd psychology, pacing your peaks, and adapting the set for different room sizes and audience types.", tag: "Guide" },
  { href: "/dashboard/library/touring/stage-plot", icon: FileText, color: "#06B6D4", title: "Stage Plot & Technical Input List", desc: "The technical document every venue and sound engineer needs before your artist steps on stage. What to include, how to format it, and why getting this right prevents show-day disasters.", tag: "Technical" },
];

const FORMS = [
  { href: "/dashboard/library/touring/promoter-agreement", icon: FileText, color: "#F59E0B", title: "Promoter Agreement", desc: "A full show contract covering fee and payment schedule, performance details, technical rider, settlement process, cancellation terms, and force majeure. Edit for every show.", tag: "Contract" },
  { href: "/dashboard/library/touring/performance-rider", icon: Plug, color: "#F59E0B", title: "Performance / Technical Rider", desc: "Industry-standard technical rider — PA, FOH, monitors, mics, DIs, backline, stage size, lighting, video, set timing. Sent with every confirmation.", tag: "Rider" },
  { href: "/dashboard/library/touring/hospitality-rider", icon: Coffee, color: "#F59E0B", title: "Hospitality Rider", desc: "Travel, accommodation, ground transport, catering, dressing room, security, per-diem. The non-technical companion to the Performance Rider.", tag: "Rider" },
  { href: "/dashboard/library/touring/dj-set-submission", icon: Disc, color: "#F59E0B", title: "DJ Set Submission", desc: "DJ-specific advance — booth layout, deck spec, energy arc, do-not-play list, lighting brief.", tag: "DJ Advance" },
  { href: "/dashboard/library/touring/personnel-record", icon: Users, color: "#10B981", title: "Tour Personnel Record", desc: "Complete crew register, roles, contacts, emergency details, passport and ID info, per diems, and dietary requirements. One document, your whole team.", tag: "Fillable" },
];

const TOOLS = [
  { phase: "Plan",     href: "/dashboard/tools/tour-budget",     icon: BarChart3,   color: "#F59E0B", title: "Tour Budget",                   desc: "Full tour financial model, Pre-Tour costs plus up to 5 shows. Income, performance fees, hospitality, travel, accommodation, crew, production, merch, and contingency. Auto-calculated P&L.", tag: "5 shows" },
  { phase: "Plan",     href: "/dashboard/library/touring/festival-application-pack", icon: ScrollText, color: "#F59E0B", title: "Festival Application Pack", desc: "30-item bundle that goes with every festival pitch — music, visuals, EPK, riders, logistics, press proof, submission cadence.", tag: "Pack" },
  { phase: "Plan",     href: "/dashboard/library/touring/visa-travel-checklist",     icon: Plane,    color: "#F59E0B", title: "Visa & Travel Document Checklist", desc: "Cross-border touring backbone — passports, visas, gear carnets, insurance, money. SA + NG passport-holder routes.", tag: "Cross-border" },
  { phase: "Plan",     href: "/dashboard/tools/tour-reference",  icon: BookOpen,    color: "#8B5CF6", title: "Tour Reference Notes",          desc: "Show-by-show notes and a Venue Quick Reference for every city. Pre-populated with major South African venues, capacities, contacts, load-in specs, and notes.", tag: "SA venues" },
  { phase: "Book",     href: "/dashboard/tools/booking-advance", icon: FileText,    color: "#EC4899", title: "Booking Advance Sheet",         desc: "Complete show advance, venue details, load-in schedule, sound & lighting, hospitality rider, accommodation, travel, and settlement. One form per show.", tag: "Per show" },
  { phase: "Prepare",  href: "/dashboard/tools/tour-itinerary",  icon: ClipboardList, color: "#10B981", title: "Tour Itinerary",             desc: "Day-by-day schedule with travel, shows, accommodation, and rest days, colour-coded by type. Add, remove, and reorder rows. Share with your whole team.", tag: "Live tool" },
  { phase: "Prepare",  href: "/dashboard/tools/asset-inventory", icon: ClipboardList, color: "#EF4444", title: "Asset & Equipment Inventory", desc: "Track every piece of gear on the road, category, item, condition, insured value, and serial number. Includes an Insurance Summary with total replacement value.", tag: "Insurance ready" },
  { phase: "Show Day", href: "/dashboard/tools/run-sheet",       icon: CheckSquare, color: "#8B5CF6", title: "Run Sheet",                    desc: "Minute-by-minute show timeline from load-in to load-out. Simple and Detailed views. Every cue, every crew member's role, every stage transition tracked in one place.", tag: "2 views" },
  { phase: "Show Day", href: "/dashboard/tools/merch-sales",     icon: BarChart3,   color: "#C9A84C", title: "Merchandise Sales Register",   desc: "Per-show sales log by item and size, XS through XL, plus units, price, and payment method. Real-time totals and per-show revenue breakdown.", tag: "Per show" },
  { phase: "Show Day", href: "/dashboard/library/touring/show-settlement-sheet", icon: BarChart3, color: "#F59E0B", title: "Show Settlement Sheet", desc: "Post-show financial reconciliation — gross box office, expenses, guarantee + overage split, withholding tax, net to artist.", tag: "Per show" },
  { phase: "Debrief",  href: "/dashboard/tools/merch-revenue",   icon: BarChart3,   color: "#06B6D4", title: "Merchandise Revenue Tracker",  desc: "Monthly merch revenue by category, T-shirts, hoodies, hats, vinyl, CDs, bundles, and more. Track units sold, revenue, and cumulative totals across the full year.", tag: "12 months" },
  { phase: "Debrief",  href: "/dashboard/library/touring/tour-settlement-master", icon: BarChart3, color: "#F59E0B", title: "Tour Settlement Master", desc: "Multi-show roll-up — capacity utilisation, tour gross, withholding tax, net to artist across the whole tour.", tag: "Roll-up" },
  { phase: "Debrief",  href: "/dashboard/tools/fan-signup",      icon: Users,       color: "#10B981", title: "Fan Sign-Up & Data Capture",   desc: "Capture fan names, emails, WhatsApp numbers, and city at every show. Show-by-show summary, POPIA-compliant, and ready to export to your mailing list.", tag: "POPIA ready" },
];

function ModuleCard({ item, delay = 0 }: { item: typeof GUIDES[0]; delay?: number }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="glass-card rounded-xl p-5 flex items-start gap-4 hover:border-brand/30 transition-all group" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: `${item.color}15` }}>
        <Icon size={18} style={{ color: item.color }}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="font-bold text-sm text-text-primary">{item.title}</p>
          <span className="text-[10px] font-black px-2 py-0.5 rounded" style={{ color: item.color, backgroundColor: `${item.color}15` }}>{item.tag}</span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
      </div>
      <ArrowRight size={15} className="flex-shrink-0 text-text-muted group-hover:text-brand transition-colors mt-0.5"/>
    </Link>
  );
}

export function TouringTabs() {
  const [tab, setTab] = useState<Tab>("guides");

  const TABS: { id: Tab; label: string }[] = [
    { id: "guides", label: "Tour Guides" },
    { id: "forms",  label: "Forms & Templates" },
    { id: "tools",  label: "Work Tools" },
  ];

  return (
    <>
      <Link href="/dashboard/library" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15}/>Back to Toolkit
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: "#F59E0B25" }}>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0" style={{ backgroundColor: "#F59E0B15" }}>🎪</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: MODULE_COLOR }}>Shows That Pay</p>
            <h1 className="text-2xl font-black text-text-primary mb-2">Live, Touring & Festivals</h1>
            <p className="text-text-muted text-sm leading-relaxed">From the first booking email to sell-out night, book shows, run the rider, manage the tour, handle settlement, and bring your team home with money in the bank.</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-text-muted flex-wrap">
              <span style={{ color: MODULE_COLOR }} className="font-semibold">{GUIDES.length} guides</span>
              <span>·</span>
              <span style={{ color: MODULE_COLOR }} className="font-semibold">{FORMS.length} forms & riders</span>
              <span>·</span>
              <span style={{ color: MODULE_COLOR }} className="font-semibold">{TOOLS.length} work tools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${tab === t.id ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "guides" && (
        <div>
          <p className="text-xs text-text-muted mb-5">Click any guide to read it on ROSTER. Download as PDF to keep.</p>
          <div className="space-y-3">{GUIDES.map((item, i) => <ModuleCard key={item.href} item={item} delay={i * 40}/>)}</div>
        </div>
      )}

      {tab === "forms" && (
        <div>
          <p className="text-xs text-text-muted mb-5">Interactive forms, fill in on ROSTER, download as PDF when complete.</p>
          <div className="space-y-3">{FORMS.map((item, i) => <ModuleCard key={item.href} item={item} delay={i * 40}/>)}</div>
          <div className="glass-card rounded-xl p-4 mt-6 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
            <span className="text-sm flex-shrink-0">⚠️</span>
            <p className="text-xs text-text-muted leading-relaxed">Templates are provided for general guidance only and do not constitute legal advice. Always have a qualified entertainment attorney review contracts before signing or issuing any document.</p>
          </div>
        </div>
      )}

      {tab === "tools" && (
        <div>
          <p className="text-xs text-text-muted mb-5">Live interactive tools ordered by how you actually work a tour — from first budget to final debrief.</p>
          {(["Plan", "Book", "Prepare", "Show Day", "Debrief"] as const).map(phase => {
            const items = TOOLS.filter(t => t.phase === phase);
            if (!items.length) return null;
            return (
              <div key={phase} className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: MODULE_COLOR }}>{phase}</p>
                <div className="space-y-3">{items.map((item, i) => <ModuleCard key={item.href} item={item} delay={i * 40}/>)}</div>
              </div>
            );
          })}
          <div className="glass-card rounded-xl p-4 mt-2 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
            <span className="text-base flex-shrink-0">💾</span>
            <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">All tools auto-save to this device for 90 days.</span> Data is stored in your browser, export or screenshot regularly to keep a permanent record.</p>
          </div>
        </div>
      )}
    </>
  );
}
