"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_album_budget_v1";
const COLOR = "#10B981";

const SECTIONS = [
  {
    id: "studio",
    title: "Studio & Recording",
    color: "#10B981",
    items: [
      { id: "studio_hire", label: "Studio hire (days)" },
      { id: "asst_engineer", label: "Assistant engineer (days)" },
      { id: "studio_vocals", label: "Studio hire, vocal sessions" },
      { id: "rehearsal_room", label: "Rehearsal room hire" },
      { id: "travel_studio", label: "Travel to/from studio (trips)" },
    ],
  },
  {
    id: "production",
    title: "Production & Mixing",
    color: "#8B5CF6",
    items: [
      { id: "producer_fee", label: "Record producer fee (flat)" },
      { id: "mix_engineer", label: "Mixing engineer (per song)" },
      { id: "master_engineer", label: "Mastering engineer (per song)" },
      { id: "session_musicians", label: "Session musician fees" },
      { id: "sample_clearance", label: "Sample clearance fees (estimated)" },
      { id: "music_licensing", label: "Music licensing fees (estimated)" },
    ],
  },
  {
    id: "artwork",
    title: "Artwork & Visual Assets",
    color: "#EC4899",
    items: [
      { id: "cover_artwork", label: "Cover artwork design" },
      { id: "photography", label: "Photography (shoot day)" },
      { id: "photo_editing", label: "Photo editing" },
      { id: "lyric_video", label: "Lyric video production" },
      { id: "music_video", label: "Music video production" },
      { id: "music_video_edit", label: "Music video editing" },
      { id: "spotify_canvas", label: "Animated cover / Spotify Canvas" },
    ],
  },
  {
    id: "marketing",
    title: "Marketing & Promotion",
    color: "#F59E0B",
    items: [
      { id: "radio_plugger", label: "Radio plugger (per month)" },
      { id: "pr_publicist", label: "PR / publicist (per month)" },
      { id: "meta_tiktok", label: "Meta / TikTok advertising" },
      { id: "playlist_pitching", label: "Playlist pitching services" },
      { id: "influencer_fees", label: "Influencer / creator fees" },
      { id: "press_release", label: "Press release writing & distribution" },
      { id: "epk_design", label: "EPK / one-sheet design" },
    ],
  },
  {
    id: "digital",
    title: "Digital Release Costs",
    color: "#06B6D4",
    items: [
      { id: "distro_fee", label: "Distribution platform fee (annual)" },
      { id: "isrc_reg", label: "ISRC registration (if applicable)" },
      { id: "samro_reg", label: "SAMRO registration" },
      { id: "capasso_reg", label: "CAPASSO registration" },
      { id: "spotify_verify", label: "Spotify for Artists verification" },
      { id: "website_update", label: "Website update / maintenance" },
    ],
  },
  {
    id: "physical",
    title: "Physical Manufacturing",
    color: "#C9A84C",
    items: [
      { id: "cd_replication", label: "CD replication (per unit)" },
      { id: "cd_packaging", label: "CD packaging / inserts (per unit)" },
      { id: "vinyl_pressing", label: "Vinyl pressing (per unit)" },
      { id: "gs1_barcode", label: "GS1 barcode registration" },
      { id: "physical_distro", label: "Physical distribution setup fee" },
      { id: "courier_shipping", label: "Courier / shipping (estimated)" },
    ],
  },
  {
    id: "release",
    title: "Release Event & Miscellaneous",
    color: "#EF4444",
    items: [
      { id: "venue", label: "Release show venue" },
      { id: "show_production", label: "Release show production (sound, lighting)" },
      { id: "merch_launch", label: "Merchandise for launch" },
      { id: "contingency", label: "Contingency / miscellaneous" },
    ],
  },
];

export default function AlbumBudgetPage() {
  const handleExportPDF = () => { window.print(); };
  const { fmt, country } = useLocale();
  const res = getCountryResources(country);
  const proAbbr = res.performanceRights.abbr;
  const mechAbbr = res.mechanicalRights?.abbr ?? proAbbr;
  const currency = res.currency ?? "ZAR";

  const localizedSections = useMemo(() => SECTIONS.map(s => ({
    ...s,
    items: s.items.map(item => {
      if (item.id === "samro_reg") return { ...item, label: `${proAbbr} registration` };
      if (item.id === "capasso_reg") return { ...item, label: `${mechAbbr} registration` };
      return item;
    }),
  })), [proAbbr, mechAbbr]);

  const [data, setData] = useState<Record<string, string>>({});

  useToolRestore("album-budget", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const n = (key: string) => parseFloat(data[key] || "0") || 0;

  const getSectionTotal = (section: typeof SECTIONS[0]) =>
    section.items.reduce((sum, item) => sum + n(`${item.id}_qty`) * n(`${item.id}_rate`), 0);

  const grandTotal = localizedSections.reduce((sum, s) => sum + getSectionTotal(s), 0);
  const vat = grandTotal * 0.15;
  const totalIncVat = grandTotal + vat;

  const handleReset = () => {
    if (confirm("Reset all budget figures? This cannot be undone.")) {
      setData({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const cellInput = "bg-transparent text-right text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-1";

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="album-budget" storageKey={STORAGE_KEY} title={`Album Budget — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Album Budget</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>7 Sections · Live Tool · Auto-Saved</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Album Budget</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Plan your full recording budget in {currency}. Auto-calculates totals and VAT at 15%.</p>
        <p className="text-sm text-text-muted">Enter Qty and Rate for each item. Subtotals and totals calculate automatically. All amounts in {currency}.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Budget Total", value: grandTotal, color: COLOR },
          { label: "VAT (15%)", value: vat, color: "#F59E0B" },
          { label: "Total inc. VAT", value: totalIncVat, color: "#EC4899" },
        ].map(card => (
          <div key={card.label} className="glass-card rounded-xl p-4 text-center">
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: card.color }}>{card.label}</p>
            <p className="text-xl font-black text-text-primary">{fmt(card.value)}</p>
          </div>
        ))}
      </div>

      {/* Budget Sections */}
      <div className="space-y-5 mb-8">
        {localizedSections.map(section => {
          const sectionTotal = getSectionTotal(section);
          return (
            <div key={section.id} className="glass-card rounded-xl overflow-hidden">
              <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: `${section.color}10`, borderBottom: `1px solid ${section.color}20` }}>
                <p className="text-sm font-black uppercase tracking-wider" style={{ color: section.color }}>{section.title}</p>
                <p className="text-sm font-black text-text-primary">{fmt(sectionTotal)}</p>
              </div>
              <div>
                <div className="grid grid-cols-12 px-5 py-2 border-b border-border text-[10px] font-black uppercase tracking-wider text-text-muted">
                  <span className="col-span-5">Item</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="col-span-3 text-right">Rate ({currency})</span>
                  <span className="col-span-2 text-right">Subtotal</span>
                </div>
                {section.items.map((item, i) => {
                  const qty = n(`${item.id}_qty`);
                  const rate = n(`${item.id}_rate`);
                  const subtotal = qty * rate;
                  return (
                    <div key={item.id} className={`grid grid-cols-12 px-5 py-2.5 border-b border-border last:border-0 items-center ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
                      <span className="col-span-5 text-sm text-text-muted">{item.label}</span>
                      <div className="col-span-2 px-1">
                        <input type="number" value={data[`${item.id}_qty`] || ""} onChange={e => set(`${item.id}_qty`, e.target.value)}
                          placeholder="0" min="0" className={cellInput}/>
                      </div>
                      <div className="col-span-3 px-1">
                        <input type="number" value={data[`${item.id}_rate`] || ""} onChange={e => set(`${item.id}_rate`, e.target.value)}
                          placeholder="0.00" min="0" className={cellInput}/>
                      </div>
                      <span className="col-span-2 text-right text-sm font-semibold" style={{ color: subtotal > 0 ? section.color : undefined }}>
                        {subtotal > 0 ? fmt(subtotal) : ", "}
                      </span>
                    </div>
                  );
                })}
                <div className="grid grid-cols-12 px-5 py-3 bg-surface-2 border-t border-border">
                  <span className="col-span-10 text-xs font-black uppercase tracking-wider" style={{ color: section.color }}>Section Total</span>
                  <span className="col-span-2 text-right text-sm font-black text-text-primary">{fmt(sectionTotal)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand Total */}
      <div className="glass-card rounded-xl overflow-hidden mb-8" style={{ borderColor: `${COLOR}30` }}>
        <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Budget Summary</p>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: "Total Budget (excl. VAT)", value: grandTotal, color: COLOR },
            { label: "VAT at 15%", value: vat, color: "#F59E0B" },
            { label: "Total Budget (incl. VAT)", value: totalIncVat, color: "#EC4899", large: true },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3">
              <span className={`font-${row.large ? "black" : "semibold"} ${row.large ? "text-base" : "text-sm"} text-text-primary`}>{row.label}</span>
              <span className={`font-black ${row.large ? "text-xl" : "text-base"}`} style={{ color: row.color }}>{fmt(row.value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed">All amounts in {currency}. VAT calculated at 15%. This budget is a planning tool, actual costs may vary. <span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Export or screenshot regularly to keep a permanent record.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/recording" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Releasing Music
        </Link>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset budget
        </button>
      </div>
    </div>
  );
}
