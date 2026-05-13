"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, FileText, Users, Radio, BarChart3, Calendar, TrendingUp,
  Sparkles, Zap, CheckSquare, Mail, CalendarDays, PlayCircle, Hash, Megaphone,
  BookOpen, Clock,
} from "lucide-react";
import { RosterAIBadge } from "@/components/ui/roster-ai-badge";

const MODULE_COLOR = "#8B5CF6";

type Tab = "brand" | "routine" | "tools";

// Ordered by real-life execution sequence: plan → create → distribute → pitch → measure
const liveTools = [
  // ── 0. Strategy (first — builds the plan before all else) ──
  {
    href: "/dashboard/campaign-builder",
    icon: Megaphone, color: "#C9A84C",
    title: "Campaign Builder",
    desc: "Tell ROSTER your goal, budget, markets, and creative vision. Get a personalised campaign plan — channel breakdown, budget allocation, timeline, owned media — in 20 seconds.",
    tag: "✦ ROSTER AI",
    phase: "Plan",
  },
  // ── 1. Plan ──
  {
    href: "/dashboard/library/marketing/epk-builder",
    icon: FileText, color: "#8B5CF6",
    title: "EPK Builder",
    desc: "Industry-standard Electronic Press Kit — 3 bios, links, press quotes, achievements, contacts. Use for festival, label A&R, agent, brand outreach.",
    tag: "Press Kit",
    phase: "Plan",
  },
  {
    href: "/dashboard/library/marketing/pre-save-builder",
    icon: Sparkles, color: "#8B5CF6",
    title: "Pre-Save Campaign Builder",
    desc: "Smart link, platform URLs, and ready-to-copy IG / X / WhatsApp launch copy.",
    tag: "Pre-Save",
    phase: "Plan",
  },
  {
    href: "/dashboard/tools/single-release-plan",
    icon: Calendar, color: "#10B981",
    title: "Single Release Planner",
    desc: "Every task from recording to release day, organised by phase. Budget tracker included.",
    tag: "8 phases",
    phase: "Plan",
  },
  {
    href: "/dashboard/tools/marketing-forecast",
    icon: BarChart3, color: "#F59E0B",
    title: "Marketing Forecast",
    desc: "Annual cultural calendar + monthly budget planner + weekly routine checklist, all in one place.",
    tag: "Annual + Monthly",
    phase: "Plan",
  },
  {
    href: "/dashboard/tools/content-calendar",
    icon: CalendarDays, color: "#06B6D4",
    title: "Content Calendar (12-Month)",
    desc: "Year-at-a-glance planner scaffolded around your release cycle, industry awards, and cultural moments in your market.",
    tag: "12 months",
    isNew: true,
    phase: "Plan",
  },
  // ── 2. Create ──
  {
    href: "/dashboard/tools/viral-hooks",
    icon: Zap, color: "#F59E0B",
    title: "Viral Hooks Engine",
    desc: "Top-performing short-form hooks from TikTok, Reels and Shorts — adapted to your voice, genre, and market.",
    tag: "Weekly refresh",
    isNew: true,
    phase: "Create",
  },
  {
    href: "/dashboard/tools/social-media-calendar",
    icon: TrendingUp, color: "#06B6D4",
    title: "Social Media Strategy Calendar",
    desc: "Artist brief, content calendar, annual themes, hashtag bank, collabs tracker and analytics — all one place.",
    tag: "8 sheets",
    phase: "Create",
  },
  {
    href: "/dashboard/tools/posting-checklist",
    icon: CheckSquare, color: "#10B981",
    title: "Master Posting Checklist",
    desc: "Platform-specific pre-publish checks, best-time-to-post, caption optimiser, and post-publish pulse tracker.",
    tag: "All platforms",
    isNew: true,
    phase: "Create",
  },
  {
    href: "/dashboard/library/marketing/ai-social-captions",
    icon: Hash, color: "#8B5CF6",
    title: "AI Social Captions",
    desc: "Generate platform-optimised captions for TikTok, Instagram, Twitter/X and Facebook — hook, body, CTA, hashtags. Tuned for African audiences.",
    tag: "AI",
    isNew: true,
    phase: "Create",
  },
  // ── 3. Distribute ──
  {
    href: "/dashboard/tools/dsp-pitching",
    icon: Radio, color: "#EC4899",
    title: "DSP Pitching Tracker",
    desc: "Log every pitch to Spotify, Apple Music, Audiomack, Boomplay and more. Track status and success rates.",
    tag: "11 platforms",
    phase: "Distribute",
  },
  {
    href: "/dashboard/tools/youtube-growth",
    icon: PlayCircle, color: "#EF4444",
    title: "YouTube Growth Module",
    desc: "Thumbnail A/B tester, title optimiser, format library, and Shorts-to-subscriber framework — per-market benchmarks.",
    tag: "Music-artist specific",
    isNew: true,
    phase: "Distribute",
  },
  // ── 4. Pitch ──
  {
    href: "/dashboard/tools/pitching-scripts",
    icon: Mail, color: "#EC4899",
    title: "Pitching Scripts CRM",
    desc: "Ready-to-send outreach scripts for PR, DSP editorial, radio, sync, labels, and A&Rs — with a global contact database.",
    tag: "Global database",
    isNew: true,
    phase: "Pitch",
  },
  {
    href: "/dashboard/library/marketing/one-sheet",
    icon: FileText, color: "#8B5CF6",
    title: "Artist One Sheet Generator",
    desc: "Fill in your artist details and export a polished dark-themed one sheet as a PDF, ready to send to bookers, labels, and media.",
    tag: "Export to PDF",
    phase: "Pitch",
  },
  // ── 5. Measure ──
  {
    href: "/dashboard/tools/artist-audience-report",
    icon: Users, color: "#8B5CF6",
    title: "Artist Audience Report",
    desc: "Monthly growth tracker across every social and streaming platform. Auto-calculates week-by-week performance.",
    tag: "13 months",
    phase: "Measure",
  },
  // ── Brand & Sponsorship contracts ──
  {
    href: "/dashboard/library/marketing/influencer-agreement",
    icon: FileText, color: "#8B5CF6",
    title: "Influencer / Creator Agreement",
    desc: "Used when paying an influencer to post sponsored content. Approval, disclosure, usage rights, exclusivity, allowlist.",
    tag: "Contract",
    phase: "Brand",
  },
  {
    href: "/dashboard/library/marketing/brand-endorsement-agreement",
    icon: FileText, color: "#8B5CF6",
    title: "Brand Endorsement Agreement",
    desc: "Artist endorses a brand's product / service for fees + royalty on co-branded SKUs. Exclusivity, morality, performance.",
    tag: "Contract",
    phase: "Brand",
  },
  {
    href: "/dashboard/library/marketing/ambassador-agreement",
    icon: FileText, color: "#8B5CF6",
    title: "Brand Ambassador Agreement",
    desc: "Long-term endorsement (1-3 years) with co-branded releases, performance bonuses, ROFR.",
    tag: "Contract",
    phase: "Brand",
  },
  {
    href: "/dashboard/library/marketing/tour-sponsorship-deck",
    icon: BarChart3, color: "#8B5CF6",
    title: "Tour Sponsorship Pitch Deck",
    desc: "Lead-gen document for brand partnerships before tour confirmation. Audience, tiers, activations, media value.",
    tag: "Pitch",
    phase: "Brand",
  },
  {
    href: "/dashboard/library/marketing/meta-ads-brief",
    icon: Sparkles, color: "#8B5CF6",
    title: "Meta Ads Brief",
    desc: "Brief for media-buyer or self-serve campaign on FB / IG. Targeting, creatives, tracking, budget envelope.",
    tag: "Brief",
    phase: "Distribute",
  },
];

const TABS: { id: Tab; label: string }[] = [
  { id: "routine",  label: "Marketing Checklist" },
  { id: "brand",    label: "Brand Studio" },
  { id: "tools",    label: "Work Tools" },
];

interface SavedBrandBook {
  id: string;
  created_at: string;
  artist_name: string;
  market: string;
  sub_genre: string;
  archetype_label: string;
  is_active: boolean;
}

export function MarketingTabs() {
  const [tab, setTab] = useState<Tab>("routine");
  const [savedBooks, setSavedBooks] = useState<SavedBrandBook[]>([]);

  useEffect(() => {
    if (tab !== "brand") return;
    fetch("/api/brand-book?limit=5")
      .then(r => r.json())
      .then(d => { if (d.books) setSavedBooks(d.books); })
      .catch(() => {});
  }, [tab]);

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-0 mb-8 border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap ${
              tab === t.id
                ? "border-brand text-brand"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Brand Studio tab ── */}
      {tab === "brand" && (
        <div>
          <p className="text-sm text-text-muted mb-2">Your artist identity, built once, used everywhere. The Brand Book seeds your hooks, pitches, content calendar, and YouTube strategy so every tool sounds like you — not a template.</p>
          <p className="text-xs text-text-muted mb-6 opacity-70">Complete this first. Every other module is better once your Brand Book exists.</p>

          {/* Build / open Brand Book */}
          <Link href="/dashboard/library/marketing/brand-studio"
            className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-brand/30 transition-all block mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#8B5CF615" }}>
              <Sparkles size={22} style={{ color: MODULE_COLOR }}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <p className="font-bold text-text-primary group-hover:text-brand transition-colors">Brand Book Builder</p>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>15–25 min session</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">Archetype mapping · Visual direction · Tone of voice guide · Audience definition · Save to ROSTER</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>Global archetype library</span>
                <span className="text-xs text-text-muted">Every major music market</span>
              </div>
            </div>
            <ArrowRight size={18} className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0"/>
          </Link>

          {/* Saved Brand Books */}
          {savedBooks.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: MODULE_COLOR }}>Saved Brand Books</p>
              <div className="space-y-2">
                {savedBooks.map(b => (
                  <Link key={b.id} href="/dashboard/library/marketing/brand-studio"
                    className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 group hover:border-brand/20 transition-all block">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#8B5CF610" }}>
                      <BookOpen size={15} style={{ color: MODULE_COLOR }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-text-primary truncate">{b.artist_name || "Untitled"}</p>
                        {b.is_active && (
                          <span className="text-[9px] font-black uppercase px-1 py-0.5 rounded flex-shrink-0"
                                style={{ color: "#1DB954", backgroundColor: "#1DB95415" }}>Active</span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">{b.market} · {b.sub_genre}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted flex-shrink-0">
                      <Clock size={11} />
                      {new Date(b.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Routine tab ── */}
      {tab === "routine" && (
        <div>
          <p className="text-sm text-text-muted mb-5">Your complete marketing operating system, built for the African market. Click to read it here on ROSTER, or save as PDF to keep a copy.</p>
          <Link href="/dashboard/library/marketing/routine-checklist"
            className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-brand/30 transition-all block">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#8B5CF615" }}>
              <FileText size={22} style={{ color: MODULE_COLOR }}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text-primary group-hover:text-brand transition-colors mb-0.5">Artist Marketing Routine Checklist</p>
              <p className="text-xs text-text-muted leading-relaxed">Daily · Weekly · Monthly · Quarterly · Annual tasks + Africa 2026 platform quick reference.</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>Africa 2026 Edition</span>
                <span className="text-xs text-text-muted">5 cadences · 50+ tasks</span>
              </div>
            </div>
            <ArrowRight size={18} className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0"/>
          </Link>
        </div>
      )}

      {/* ── Tools tab ── */}
      {tab === "tools" && (
        <div>
          <p className="text-sm text-text-muted mb-6">12 tools, ordered by how you actually work a campaign — from planning through to measuring what landed.</p>
          {(["Plan", "Create", "Distribute", "Pitch", "Measure", "Brand"] as const).map(phase => {
            const phaseTools = liveTools.filter(t => t.phase === phase);
            return (
              <div key={phase} className="mb-7">
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: MODULE_COLOR }}>{phase}</p>
                <div className="space-y-2.5">
                  {phaseTools.map(tool => (
                    <Link key={tool.href} href={tool.href}
                      className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-brand/30 transition-all block">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${tool.color}15` }}>
                        <tool.icon size={22} style={{ color: tool.color }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="font-bold text-text-primary group-hover:text-brand transition-colors">{tool.title}</p>
                          {tool.tag === "✦ ROSTER AI"
                            ? <RosterAIBadge />
                            : <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded" style={{ color: tool.color, backgroundColor: `${tool.color}15` }}>{tool.tag}</span>
                          }
                          {"isNew" in tool && tool.isNew && (
                            <span className="text-[9px] font-black uppercase px-1 py-0.5 rounded" style={{ color: "#8B5CF6", backgroundColor: "#8B5CF615" }}>New</span>
                          )}
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
          <div className="glass-card rounded-xl p-4 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
            <span className="text-base flex-shrink-0">💾</span>
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="font-semibold text-brand">Data stored for 90 days.</span> Your work is saved to this device. Export as PDF regularly to keep a permanent record.
            </p>
          </div>
        </div>
      )}

    </>
  );
}
