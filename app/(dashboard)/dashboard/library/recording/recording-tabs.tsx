"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ArrowRight, Music2, BarChart3, FileText, CheckSquare, ClipboardList, BookOpen, Radio, Disc3, Rocket } from "lucide-react";

const MODULE_COLOR = "#10B981";
type Tab = "guides" | "forms" | "tools";

const GUIDES = [
  { href: "/dashboard/library/recording/artist-cycle",       icon: Music2,    color: "#10B981", title: "The Artist Cycle",                      desc: "Understand the full recording and release cycle, from writing and recording through promotion, touring, and back to the studio. The operational reality of a music career in 2026.", tag: "4 phases" },
  { href: "/dashboard/library/recording/distribution",       icon: Disc3,     color: "#8B5CF6", title: "Music Distribution",                    desc: "A practical guide to getting your music to listeners, digital platforms, physical distribution, African streaming, and what to watch for in every distribution agreement.", tag: "Full guide" },
  { href: "/dashboard/library/recording/isrc-upc",           icon: BookOpen,  color: "#06B6D4", title: "ISRC & UPC Codes",                      desc: "The codes that connect your recordings to royalty collection, streaming analytics, and anti-piracy monitoring globally. Get them right before you release anything.", tag: "Registration" },
  { href: "/dashboard/library/recording/content-requirements", icon: Radio,   color: "#F59E0B", title: "African Music Content Requirements",    desc: "Local content quotas, broadcast regulations, and certification frameworks across South Africa, Nigeria, Kenya, Ghana, Tanzania, Uganda, and eight more key markets.", tag: "11 markets" },
];

const FORMS = [
  { href: "/dashboard/library/recording/release-checklist",  icon: CheckSquare,  color: "#10B981", title: "Release Checklist", desc: "Every step from studio sign-off to release day. Nothing ships until every box is checked.", tag: "Interactive" },
  { href: "/dashboard/library/recording/master-delivery-specs", icon: CheckSquare, color: "#10B981", title: "Master Delivery Specs", desc: "Pre-flight checklist before files leave your distributor portal — LUFS, true peak, MFiT, stems, metadata.", tag: "Specs" },
  { href: "/dashboard/library/recording/atmos-spatial-brief", icon: FileText, color: "#10B981", title: "Atmos / Spatial Audio Brief", desc: "Apple + Tidal pay premium pool rates for Spatial. Brief for the Atmos mix engineer — bed + objects + binaural + loudness target.", tag: "Brief" },
  { href: "/dashboard/library/recording/vocal-comp-sheet", icon: FileText, color: "#10B981", title: "Vocal Comp Sheet", desc: "Phrase-by-phrase take selection. Document which take wins per phrase, alternates, FX. Prevents 'wait, which take?' four months later.", tag: "Form" },
  { href: "/dashboard/library/recording/daw-handoff", icon: CheckSquare, color: "#10B981", title: "DAW Project Handoff Checklist", desc: "Producer-to-mix-engineer handover. Stems, plug-ins, automation, vocal comp, documentation. Catches the issues that cause days of session debugging.", tag: "Checklist" },
  { href: "/dashboard/library/recording/label-copy",         icon: ClipboardList, color: "#8B5CF6", title: "Label Copy Template",               desc: "Complete metadata for every release. Required by every distributor.", tag: "Fillable" },
  { href: "/dashboard/library/recording/lyric-sheet",        icon: FileText,     color: "#EC4899", title: "Lyric Sheet Template",               desc: "Correctly formatted for PRO registration, sync submissions, publishing pitches.", tag: "Template" },
  { href: "/dashboard/library/recording/studio-booking-agreement", icon: FileText, color: "#10B981", title: "Studio Booking Agreement", desc: "Studio lockout, deposit, multitrack ownership, conduct, force-majeure refunds.", tag: "Contract" },
  { href: "/dashboard/library/recording/producer-agreement", icon: FileText,     color: "#C9A84C", title: "Producer Agreement",                 desc: "Flat fee, master ownership, sample clearance, credit terms.", tag: "Contract" },
  { href: "/dashboard/library/recording/mixing-engineer-agreement", icon: FileText, color: "#10B981", title: "Mixing Engineer Agreement", desc: "Per-mix fee, revisions, deliverables (stems, instrumental, acapella, TV mix), ownership.", tag: "Contract" },
  { href: "/dashboard/library/recording/mastering-engineer-agreement", icon: FileText, color: "#10B981", title: "Mastering Engineer Agreement", desc: "Loudness targets, Apple Digital Master compliance, recall window, ownership.", tag: "Contract" },
  { href: "/dashboard/library/recording/featured-artist-agreement", icon: FileText, color: "#10B981", title: "Featured Artist Agreement", desc: "Guest performance — flat fee or master points, side-artist letter of direction, credit, splits.", tag: "Contract" },
  { href: "/dashboard/library/recording/beat-lease-agreement", icon: FileText, color: "#10B981", title: "Beat Lease Agreement", desc: "Three-tier beat licensing — Lease / Premium / Exclusive Buyout. Critical for Afrobeats and Amapiano.", tag: "Contract" },
  { href: "/dashboard/library/recording/sample-clearance",   icon: ClipboardList, color: "#EF4444", title: "Sample Clearance Form",             desc: "One form per sample used. Master, composition, traditional / indigenous material.", tag: "Form" },
  { href: "/dashboard/library/recording/session-song-form",  icon: FileText,     color: "#06B6D4", title: "Session / Song Form",                desc: "Creative and technical participants for a single track.", tag: "Form" },
];

const TOOLS = [
  { phase: "Plan",         href: "/dashboard/releases/new",          icon: Rocket,    color: "#06B6D4", title: "Plan a Release",        desc: "Lock in title, date, DSPs and distributor for an upcoming release. Once saved, it lands in your Pipeline → Next Releases for tracking through to release day.", tag: "Pipeline" },
  { phase: "Budget",       href: "/dashboard/tools/album-budget",    icon: BarChart3, color: "#10B981", title: "Album Budget",          desc: "Plan your full recording budget, studio time, producers, artwork, video, marketing, release show, physical manufacturing, and distribution. Auto-calculates VAT at 15%.", tag: "7 sections" },
  { phase: "Plan Campaign", href: "/dashboard/tools/release-targets", icon: BarChart3, color: "#F59E0B", title: "Release Targets",       desc: "Set and track streaming targets, radio and TV airplay goals, editorial playlist pitching, press and media coverage, and audience demographics for your release campaign.", tag: "5 sheets" },
  { phase: "Distribute",   href: "/dashboard/tools/shipping-matrix", icon: BarChart3, color: "#EC4899", title: "Shipping Cost Matrix",  desc: "Shipping rates for every merch item, CDs, vinyl, t-shirts, bundles, posters, across RSA, SADC, West & East Africa, and international. Courier comparison by region.", tag: "7 items" },
  { phase: "Measure",      href: "/dashboard/tools/artist-pl",       icon: BarChart3, color: "#8B5CF6", title: "Artist Profit & Loss",  desc: "Revenue model for a single album release, streaming by platform, downloads, physical, live, sync, merchandise, and brand deals. Auto-calculated costs and net profit.", tag: "Full P&L" },
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

export function RecordingTabs() {
  const [tab, setTab] = useState<Tab>("guides");

  const TABS: { id: Tab; label: string }[] = [
    { id: "guides", label: "Release Guides" },
    { id: "forms",  label: "Forms & Templates" },
    { id: "tools",  label: "Work Tools" },
  ];

  return (
    <>
      <Link href="/dashboard/library" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15}/>Back to Toolkit
      </Link>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: "#10B98125" }}>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0" style={{ backgroundColor: "#10B98115" }}>🎵</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: MODULE_COLOR }}>Make It Right</p>
            <h1 className="text-2xl font-black text-text-primary mb-2">A&R, Recording & Production</h1>
            <p className="text-text-muted text-sm leading-relaxed">From the demo to the master: studio bookings, producer & engineer agreements, beat licenses, sample clearance, master delivery specs, and the A&R pipeline.</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-text-muted flex-wrap">
              <span style={{ color: MODULE_COLOR }} className="font-semibold">{GUIDES.length} guides</span>
              <span>·</span>
              <span style={{ color: MODULE_COLOR }} className="font-semibold">{FORMS.length} forms & contracts</span>
              <span>·</span>
              <span style={{ color: MODULE_COLOR }} className="font-semibold">{TOOLS.length} work tools</span>
            </div>
          </div>
        </div>
      </div>

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
          <p className="text-xs text-text-muted mb-5">Click any guide to read it on ROSTER. Download the original as PDF.</p>
          <div className="space-y-3">{GUIDES.map((item, i) => <ModuleCard key={item.href} item={item} delay={i * 40}/>)}</div>
        </div>
      )}

      {tab === "forms" && (
        <div>
          <p className="text-xs text-text-muted mb-5">Interactive forms and templates, fill in on ROSTER, download as PDF when complete.</p>
          <div className="space-y-3">{FORMS.map((item, i) => <ModuleCard key={item.href} item={item} delay={i * 40}/>)}</div>
          <div className="glass-card rounded-xl p-4 mt-6 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
            <span className="text-sm flex-shrink-0">⚠️</span>
            <p className="text-xs text-text-muted leading-relaxed">Templates are provided for general guidance only. They do not constitute legal advice. Always have a qualified entertainment attorney in your jurisdiction review contracts and agreements before signing or issuing any document.</p>
          </div>
        </div>
      )}

      {tab === "tools" && (
        <div>
          <p className="text-xs text-text-muted mb-5">Live interactive tools ordered by the release execution sequence — from first budget to final P&L.</p>
          {(["Plan", "Budget", "Plan Campaign", "Distribute", "Measure"] as const).map(phase => {
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
