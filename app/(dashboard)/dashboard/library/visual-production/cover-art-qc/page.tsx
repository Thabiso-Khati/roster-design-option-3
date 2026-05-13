"use client";
import { Check, X } from "lucide-react";
import { ResourcePage, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#A855F7";
const STORAGE_KEY = "roster_cover_art_qc_v1";

interface Item { id: string; label: string; rule: string; }
interface Section { name: string; items: Item[]; }

const SECTIONS: Section[] = [
  {
    name: "Specifications",
    items: [
      { id: "size", label: "Image is 3000×3000px (or larger, square)", rule: "Required by Spotify, Apple Music, Audiomack, Boomplay" },
      { id: "format", label: "JPG or PNG (no TIFF, BMP, GIF, WEBP)", rule: "Universal DSP format" },
      { id: "color", label: "RGB colour profile (not CMYK)", rule: "CMYK is for print and is rejected by every DSP" },
      { id: "weight", label: "File size under 10 MB", rule: "Most distributors limit at this size" },
      { id: "resolution", label: "300 DPI minimum", rule: "Print-quality threshold; ensures sharpness on retina screens" },
    ],
  },
  {
    name: "Visual content rules",
    items: [
      { id: "no-urls", label: "No website addresses, URLs, or social handles", rule: "Apple and Spotify reject these" },
      { id: "no-logos", label: "No DSP logos (Spotify, Apple, YouTube, etc.)", rule: "Hard reject" },
      { id: "no-prices", label: "No prices, currencies, or 'New', 'Featured' badges", rule: "Stop the listener confusion" },
      { id: "no-promos", label: "No promotional text ('Out now', 'Single', 'Pre-order')", rule: "Apple's metadata-style guidelines" },
      { id: "no-explicit-symbols", label: "No explicit / mature flags rendered into the artwork", rule: "Use the metadata 'explicit' flag, not the artwork" },
      { id: "no-trademarks", label: "No third-party trademarks or copyrighted imagery without licence", rule: "DMCA / takedown risk" },
      { id: "no-celebrity", label: "No third-party people without signed image release", rule: "Right of publicity / image release on file" },
    ],
  },
  {
    name: "Typography & legibility",
    items: [
      { id: "title-readable", label: "Title and artist name readable at 64×64px (mobile thumbnail)", rule: "Test it: shrink the image and squint" },
      { id: "no-overlap", label: "Text doesn't overlap critical visual elements", rule: "Avoid burying eyes / face under type" },
      { id: "fonts-licensed", label: "Fonts used are licensed for commercial use", rule: "Adobe Fonts / Google Fonts / paid licence" },
      { id: "no-pixelation", label: "No pixelated edges or compression artifacts at 100% view", rule: "Open at full size and inspect 4 corners" },
    ],
  },
  {
    name: "Metadata alignment",
    items: [
      { id: "title-matches", label: "Track / album title in artwork matches DSP metadata exactly", rule: "Including punctuation, case, and (feat. …) credits" },
      { id: "artist-matches", label: "Artist name(s) match the DSP metadata exactly", rule: "Including any 'with' / 'feat.' attribution" },
      { id: "version-suffix", label: "Version suffixes consistent (Remix / Acoustic / Sped Up / etc.)", rule: "Apple style: 'Title (Remix)' not 'Title - Remix'" },
    ],
  },
  {
    name: "Cultural & contextual",
    items: [
      { id: "language-spelling", label: "Spelling correct in all featured languages (isiZulu, Yoruba, English)", rule: "Native-language proofread before delivery" },
      { id: "imagery-permission", label: "Indigenous patterns, motifs, ceremonial imagery cleared with originating community", rule: "Especially relevant to Amapiano / Afrobeats covers" },
      { id: "weapons-substances", label: "No depictions of weapons, drugs, or substances likely to trigger Apple parental review", rule: "Soft-flag triggers manual review delays" },
    ],
  },
];

export default function CoverArtQCPage() {
  const [state, setState] = useLocalState<Record<string, boolean>>(STORAGE_KEY, {});
  useToolRestore("cover-art-qc", STORAGE_KEY, setState);
  const all = SECTIONS.flatMap((s) => s.items);
  const done = all.filter((i) => state[i.id]).length;
  const total = all.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Checklist"
      title="Cover Art QC Checklist"
      intro="Run this on every release before delivery. A failed DSP review can delay a release by 5–14 days."
      next={{ href: "/dashboard/library/visual-production/director-agreement", label: "Director Agreement" }}
    
      toolbar={<><SaveButton toolSlug="cover-art-qc" storageKey={STORAGE_KEY} title={`Cover Art QC — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} /></>}>
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${COLOR}40` }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-text-primary">{done} / {total} checks passed</p>
          <p className="text-2xl font-black" style={{ color: COLOR }}>{pct}%</p>
        </div>
        <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLOR }} />
        </div>
      </div>

      {SECTIONS.map((sec) => (
        <section key={sec.name} className="glass-card rounded-2xl p-6 mb-4">
          <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>{sec.name}</p>
          <div className="space-y-2">
            {sec.items.map((it) => {
              const ok = !!state[it.id];
              return (
                <button
                  key={it.id}
                  onClick={() => setState({ ...state, [it.id]: !ok })}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-surface-2 text-left transition-colors"
                >
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: ok ? COLOR : "transparent", border: `1px solid ${ok ? COLOR : "var(--border)"}` }}
                  >
                    {ok ? <Check size={12} color="white" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${ok ? "text-text-muted line-through" : "text-text-primary"}`}>{it.label}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{it.rule}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </ResourcePage>
  );
}
