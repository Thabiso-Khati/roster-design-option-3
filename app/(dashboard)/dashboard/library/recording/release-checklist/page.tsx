"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, Printer, Check, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_release_checklist_v1";
const COLOR = "#10B981";

const SECTIONS = [
  {
    id: "preproduction",
    title: "Pre-Production & Planning",
    color: "#10B981",
    items: [
      "Confirm recording date(s) and block studio time",
      "Confirm record producer and agree terms in writing (use a Producer Agreement)",
      "Set single release date(s)",
      "Set album / EP release date",
      "Define team structure: in-house vs. third-party PR, radio plugger, or label support",
      "Agree distribution plan (DistroKid, TuneCore, Amuse, CD Baby, or African-specific partner)",
      "Draft release budget and cash-flow schedule in your local currency",
      "Confirm sync and licensing strategy",
    ],
  },
  {
    id: "recording",
    title: "Recording & Delivery",
    color: "#8B5CF6",
    items: [
      "All tracking, overdubs, and vocal sessions completed",
      "Album mixes approved by artist and producer",
      "Masters delivered to mastering engineer",
      "Mastered files received and quality-checked (WAV 24-bit / 48 kHz minimum)",
      "Stems archived and backed up (cloud + external drive)",
      "Instrumental and a cappella versions created where needed",
      "All sample clearances secured in writing before submission",
    ],
  },
  {
    id: "artwork",
    title: "Artwork & Visual Assets",
    color: "#EC4899",
    items: [
      "Cover artwork designed (3000×3000 px, RGB, under 10 MB)",
      "Artwork approved, no explicit text clashing with Boomplay / AudioMack guidelines",
      "Single artwork created for each pre-release single",
      "All fonts and images in artwork are licensed for commercial use",
      "Artist photo shoot completed",
      "Edited photos delivered and approved",
      "Visual assets resized for all platforms (square, portrait, banner formats)",
      "Album / project logo finalised",
      "Animated cover or lyric video asset created (Spotify Canvas, YouTube Shorts, TikTok)",
    ],
  },
  {
    id: "distribution",
    title: "Digital Distribution & Metadata",
    color: "#06B6D4",
    items: [
      "Distributor account active and in good standing",
      "Release submitted to distributor at least 14 days before street date (28 days recommended)",
      "UPC barcode assigned for physical product (if applicable)",
      "UPC barcode assigned for standard digital release",
      "ISRC codes assigned to every individual track",
      "All metadata completed: track titles, featured artists, composers, publishers, ISRC, UPC",
      "Language and territory settings confirmed",
      "Explicit content tags applied where required",
      "Spotify pre-save link live",
      "Boomplay pre-order set up (critical for East and West African markets)",
      "AudioMack release scheduled",
      "Apple Music connect post scheduled",
      "YouTube Art Track / Official Audio upload scheduled",
      "YouTube monetisation enabled on all tracks",
      "TikTok / CapCut audio delivered to platform",
    ],
  },
  {
    id: "societies",
    title: "Song Registrations & Collecting Societies",
    color: "#F59E0B",
    items: [] as string[], // populated dynamically from country-resources
  },
  {
    id: "marketing",
    title: "Marketing & Promotional Materials",
    color: "#C9A84C",
    items: [
      "Artist biography updated (short 100-word version + full version)",
      "Quote sheet / press quotes compiled",
      "One-sheet (one-page press release) written and designed",
      "EPK (Electronic Press Kit) updated and live on website",
      "Artist website updated with new release information and buy/stream links",
      "WhatsApp broadcast list prepped for release-day announcement",
      "Social media content calendar built out for 4 weeks pre- and post-release",
      "Short-form video content (Reels, TikTok, YouTube Shorts) shot and edited",
      "Behind-the-scenes content captured and scheduled",
      "Advertising creatives (static and video) designed for Meta and TikTok ads",
      "Advertising budget allocated in your local currency and campaigns configured",
      "Radio plugger briefed (community radio, regional, national)",
      "Spotify for Artists editorial pitch submitted at least 7 days before release",
      "Boomplay editorial playlist pitch submitted",
      "Influencer and content creator partnerships confirmed",
      "Merchandise drop aligned with release (where applicable)",
    ],
  },
  {
    id: "media",
    title: "Media & Radio",
    color: "#EF4444",
    items: [] as string[], // populated dynamically from country-resources
  },
  {
    id: "physical",
    title: "Physical Release (If Applicable)",
    color: "#8B5CF6",
    items: [
      "CD / vinyl manufacturing order placed (6–8 weeks minimum lead time)",
      "Label copy finalised and submitted to manufacturer",
      "Barcode positioned correctly on packaging",
      "Physical units received and quality-checked",
      "Products dispatched to publicist",
      "Products dispatched to radio plugger",
      "Physical distribution partner briefed and stock allocated",
      "Retail placement confirmed (record stores, event merchandise tables)",
    ],
  },
  {
    id: "milestones",
    title: "Milestone Summary Tracker",
    color: "#10B981",
    items: [
      "Recording dates confirmed",
      "Record producer contracted",
      "Single release dates locked",
      "Album / EP release date locked",
      "Team roles assigned (PR, radio, digital, touring)",
      "Distribution agreement signed",
      "Media plan signed off",
      "Social media content plan built",
      "Radio strategy agreed",
      "Streaming strategy agreed",
      "Touring plan aligned to release",
      "Merchandise plan confirmed",
      "Sync / licensing strategy confirmed",
      "Release-day go/no-go confirmed",
    ],
  },
];

// TOTAL is computed dynamically inside the component using LOCALE_SECTIONS

export default function ReleaseChecklistPage() {
  const handleExportPDF = () => { window.print(); };
  const { country, currency } = useLocale();
  const res = getCountryResources(country);

  // Build locale-aware sections — inject country-specific items
  const LOCALE_SECTIONS = useMemo(() => {
    const defaultSocieties = [
      `${res.performanceRights.abbr} — register all compositions for performance royalties`,
      res.mechanicalRights && res.mechanicalRights.abbr !== res.performanceRights.abbr
        ? `${res.mechanicalRights.abbr} — mechanical royalty registration`
        : null,
      res.neighbouringRights && res.neighbouringRights.abbr !== res.performanceRights.abbr
        ? `${res.neighbouringRights.abbr} — register master recordings for neighbouring rights`
        : null,
      "SoundExchange (USA) — for digital performance royalties from US streaming and satellite radio",
      "PPL (UK) — for neighbouring rights in the United Kingdom",
      "Ensure your home country PRO has active CISAC membership for international reciprocal collection",
      "All song titles registered and confirmed on collecting society portals",
    ].filter(Boolean) as string[];

    return SECTIONS.map(s => {
      if (s.id === "societies") return { ...s, items: res.societiesChecklist ?? defaultSocieties };
      if (s.id === "media")    return { ...s, items: res.mediaChecklist ?? s.items };
      return s;
    });
  }, [res]);

  const TOTAL = LOCALE_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({ preproduction: true });

  useToolRestore("release-checklist", STORAGE_KEY, setChecked);

  const toggle = useCallback((key: string) => {
    setChecked(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleSection = useCallback((id: string) => {
    setOpen(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((checkedCount / TOTAL) * 100);

  const handleReset = () => {
    if (confirm("Reset all checkboxes? This cannot be undone.")) {
      setChecked({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="release-checklist" storageKey={STORAGE_KEY} title={`Release Checklist — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Release Checklist</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} · {TOTAL} Items · Interactive</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">New Single / Album Release Checklist</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>Every step from studio sign-off to release day.</p>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              A comprehensive pre-release and release-day reference for {res.localContentLabel ?? res.country} and African artists. Tick each item off as it is completed. Nothing ships until every box is checked.
            </p>
          </div>
          
        </div>
      </div>

      {/* Progress */}
      <div className="glass-card rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-text-primary">{checkedCount} of {TOTAL} complete</p>
            <p className="text-xs text-text-muted">{pct}%, {pct === 100 ? "🎉 Ready to release!" : pct >= 75 ? "Almost there, final push." : pct >= 50 ? "Good progress, keep going." : pct > 0 ? "Getting started." : "Not started yet."}</p>
          </div>
          <span className="text-2xl font-black" style={{ color: pct === 100 ? COLOR : "inherit" }}>{pct}%</span>
        </div>
        <div className="h-2.5 bg-surface-2 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: pct === 100 ? COLOR : pct >= 75 ? "#F59E0B" : "#8B5CF6" }}/>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {LOCALE_SECTIONS.map(s => {
            const sChecked = s.items.filter((_, i) => checked[`${s.id}__${i}`]).length;
            return (
              <span key={s.id} className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ color: s.color, backgroundColor: `${s.color}15` }}>
                {s.title.split(" ")[0]}: {sChecked}/{s.items.length}
              </span>
            );
          })}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3 mb-8">
        {LOCALE_SECTIONS.map((section, si) => {
          const sChecked = section.items.filter((_, i) => checked[`${section.id}__${i}`]).length;
          const isOpen = open[section.id] ?? false;
          return (
            <div key={section.id} className="glass-card rounded-xl overflow-hidden">
              <button onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: section.color }}/>
                  <span className="font-bold text-text-primary">{section.title}</span>
                  <span className="text-xs text-text-muted">({sChecked}/{section.items.length})</span>
                  {sChecked === section.items.length && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{ color: COLOR, backgroundColor: `${COLOR}20` }}>✓ Done</span>
                  )}
                </div>
                <ChevronDown size={16} className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}/>
              </button>
              {isOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {section.items.map((item, ii) => {
                    const key = `${section.id}__${ii}`;
                    const done = !!checked[key];
                    return (
                      <button key={ii} onClick={() => toggle(key)}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-surface-2 transition-colors group">
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all border ${
                          done ? "border-transparent" : "border-border group-hover:border-current"
                        }`} style={{ backgroundColor: done ? section.color : "transparent", borderColor: done ? section.color : undefined }}>
                          {done && <Check size={11} className="text-white" strokeWidth={3}/>}
                        </div>
                        <p className={`text-sm leading-relaxed transition-all ${done ? "text-text-muted line-through" : "text-text-primary"}`}>
                          {item}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <p className="text-xs text-text-muted">💾 Your checklist is saved to this device for 90 days.</p>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset all
        </button>
      </div>

      <Link href="/dashboard/library/recording" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Releasing Music
      </Link>
    </div>
  );
}
