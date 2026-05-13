"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ArrowRight, FileText, BarChart3, Calculator, ClipboardList, BookOpen, Users, Music2 } from "lucide-react";

const MODULE_COLOR = "#06B6D4";
type Tab = "forms" | "tools";

const FORMS = [
  { href: "/dashboard/library/publishing/lyric-sheet", icon: FileText, color: "#06B6D4", title: "Song Lyric Sheet", desc: "Master lyrics record for PRO registration, DSP metadata, and sync licensing. PRO-formatted, multi-language.", tag: "Fillable" },
  { href: "/dashboard/library/publishing/co-writing-splits", icon: Users, color: "#8B5CF6", title: "Co-Writing Splits Agreement", desc: "Sign before leaving the room. Splits, PRO affiliation, producer share, digital + sync rights — for up to 4 writers.", tag: "Contract" },
  { href: "/dashboard/library/publishing/publishing-admin-agreement", icon: FileText, color: "#06B6D4", title: "Publishing Administration Agreement", desc: "Most common pub deal in Africa — songwriter retains ownership; admin runs registration, collection, accounting.", tag: "Contract" },
  { href: "/dashboard/library/publishing/co-publishing-agreement", icon: FileText, color: "#06B6D4", title: "Co-Publishing Agreement", desc: "50/50 publisher share with advance, recoupment, audit. Songwriter keeps writer share.", tag: "Contract" },
  { href: "/dashboard/library/publishing/staff-writer-agreement", icon: FileText, color: "#06B6D4", title: "Staff Writer / Songwriter Agreement", desc: "Exclusive songwriter deal — minimum delivery commitment, weekly draw, ownership of pub share.", tag: "Contract" },
  { href: "/dashboard/library/publishing/single-song-assignment", icon: FileText, color: "#06B6D4", title: "Single Song Assignment", desc: "Single-track publishing transfer. Songwriter assigns 100% of pub share; retains writer share.", tag: "Contract" },
  { href: "/dashboard/library/publishing/cue-sheet", icon: ClipboardList, color: "#06B6D4", title: "Cue Sheet Template", desc: "PRO-required for film, TV, ad use. Lodge within 30 days of broadcast — drives all back-end PRO collection.", tag: "Form" },
  { href: "/dashboard/library/publishing/publisher-pitch-pager", icon: FileText, color: "#06B6D4", title: "Publisher Pitch One-Pager", desc: "Catalogue pitch for sub-pub meetings, sync agency partnerships, M&A conversations.", tag: "Pitch" },
];

const TOOLS = [
  { phase: "Register", href: "/dashboard/library/publishing/pro-membership-tracker", icon: Users, color: "#06B6D4", title: "PRO / MRO / Neighbouring Rights Membership Tracker", desc: "Every writer × every society. Missing memberships = missing money. SAMRO, COSON, MCSK, ASCAP, BMI, MLC, SoundExchange — track all.", tag: "Tracker" },
  { phase: "Register", href: "/dashboard/library/publishing/mlc-tracker", icon: ClipboardList, color: "#06B6D4", title: "MLC Registration Tracker", desc: "US streaming mechanicals via The Mechanical Licensing Collective. Free; African artists routinely miss this.", tag: "Tracker" },
  { phase: "Register", href: "/dashboard/library/publishing/soundexchange-guide", icon: BookOpen, color: "#06B6D4", title: "SoundExchange Registration Guide", desc: "US neighbouring rights for sound recordings. Master side. Performers + master owners get separate registrations.", tag: "Guide" },
  { phase: "Register", href: "/dashboard/tools/song-metadata", icon: BarChart3, color: "#06B6D4", title: "Song Master Metadata Record", desc: "Full catalogue and rights documentation per song.", tag: "7 songs" },
  { phase: "Calculate", href: "/dashboard/library/publishing/royalty-calculator", icon: Calculator, color: "#06B6D4", title: "Publishing Royalty Calculator", desc: "Estimate writer + publisher income from streaming, sync, physical. Models split structure, admin fee, co-write share.", tag: "Calculator" },
  { phase: "Comply", href: "/dashboard/library/publishing/cover-mech-license", icon: Music2, color: "#06B6D4", title: "Cover Song Mech-License Tool", desc: "Releasing a cover? Routes to MLC, HFA, CAPASSO, MCSN, MCPS, AMCOS by territory + statutory rate calculator.", tag: "Compliance" },
];

function ModuleCard({ item, delay = 0 }: { item: typeof FORMS[0]; delay?: number }) {
  const Icon = item.icon;
  return (
    <Link href={item.href}
      className="glass-card rounded-xl p-5 flex items-start gap-4 hover:border-brand/30 transition-all group"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${item.color}15` }}>
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

export default function PublishingModulePage() {
  const [tab, setTab] = useState<Tab>("forms");

  const TABS: { id: Tab; label: string }[] = [
    { id: "forms", label: "Forms & Templates" },
    { id: "tools", label: "Work Tools" },
  ];

  return (
    <div className="animate-fade-in max-w-3xl">
      <Link href="/dashboard/library" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15}/>Back to Toolkit
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${MODULE_COLOR}25` }}>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0" style={{ backgroundColor: `${MODULE_COLOR}15` }}>✍🏽</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: MODULE_COLOR }}>Own What You Write</p>
            <h1 className="text-2xl font-black text-text-primary mb-2">Publishing and Songwriting</h1>
            <p className="text-text-muted text-sm leading-relaxed">
              Your songs are assets. Register them, split them, license them, and make sure every PRO and MRO knows about every work. What you don't document, you don't own.
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-text-muted flex-wrap">
              <span style={{ color: MODULE_COLOR }} className="font-semibold">{FORMS.length} forms & contracts</span>
              <span>·</span>
              <span style={{ color: MODULE_COLOR }} className="font-semibold">{TOOLS.length} work tools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cardinal rule callout */}
      <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}20`, backgroundColor: `${MODULE_COLOR}06` }}>
        <span className="text-base flex-shrink-0">⚖️</span>
        <div>
          <p className="text-xs font-bold mb-1" style={{ color: MODULE_COLOR }}>The cardinal rule of co-writing</p>
          <p className="text-xs text-text-muted leading-relaxed">Always sign a split agreement before you leave the session, even with friends, even on demos, even when it feels awkward. Five minutes now prevents disputes that last years.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              tab === t.id ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === "forms" && (
        <div>
          <p className="text-xs text-text-muted mb-5">Interactive forms, fill in on ROSTER, download as PDF when complete.</p>
          <div className="space-y-3">
            {FORMS.map((item, i) => <ModuleCard key={item.href} item={item} delay={i * 40}/>)}
          </div>
          <div className="glass-card rounded-xl p-4 mt-6 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
            <span className="text-sm flex-shrink-0">⚠️</span>
            <p className="text-xs text-text-muted leading-relaxed">Templates are provided for general guidance only and do not constitute legal advice. Always have a qualified South African entertainment attorney review agreements before signing or issuing any document.</p>
          </div>
        </div>
      )}

      {tab === "tools" && (
        <div>
          <p className="text-xs text-text-muted mb-5">Live interactive tools, use like Excel, auto-save to your browser. No downloads needed.</p>
          {(["Register", "Calculate", "Comply"] as const).map(phase => {
            const items = TOOLS.filter(t => t.phase === phase);
            if (!items.length) return null;
            return (
              <div key={phase} className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: MODULE_COLOR }}>{phase}</p>
                <div className="space-y-3">
                  {items.map((item, i) => <ModuleCard key={item.href} item={item} delay={i * 40}/>)}
                </div>
              </div>
            );
          })}
          <div className="glass-card rounded-xl p-4 mt-2 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
            <span className="text-base flex-shrink-0">💾</span>
            <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">All tools auto-save to this device for 90 days.</span> Data is stored in your browser, export or screenshot regularly to keep a permanent record.</p>
          </div>
        </div>
      )}
    </div>
  );
}
