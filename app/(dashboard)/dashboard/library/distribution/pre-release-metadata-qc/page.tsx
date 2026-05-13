"use client";
import { Check } from "lucide-react";
import { ResourcePage, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#0EA5E9";
const STORAGE_KEY = "roster_pre_release_qc_v1";

interface Item { id: string; label: string; rule: string; }
interface Section { name: string; items: Item[]; }

const SECTIONS: Section[] = [
  {
    name: "Track-level metadata",
    items: [
      { id: "tt-1", label: "Track title final + spelt correctly + matches the rendered audio", rule: "Spotify / Apple cross-check" },
      { id: "tt-2", label: "Featuring credits formatted as '(feat. Artist)' — not 'ft.' or 'featuring'", rule: "Apple metadata standard" },
      { id: "tt-3", label: "Version suffix consistent: 'Title (Remix)', 'Title (Acoustic)', 'Title (Sped Up)'", rule: "Apple style guide" },
      { id: "tt-4", label: "ISRC assigned and unique per track", rule: "Format: CC-XXX-YY-NNNNN" },
      { id: "tt-5", label: "Explicit / clean flag set correctly", rule: "Don't render warning text into artwork" },
      { id: "tt-6", label: "Genre + sub-genre selected (matches DSP categorisation)", rule: "" },
      { id: "tt-7", label: "Track duration matches audio file (within 1s)", rule: "" },
    ],
  },
  {
    name: "Release-level metadata",
    items: [
      { id: "rl-1", label: "Album / EP / Single title final + cased correctly", rule: "" },
      { id: "rl-2", label: "Primary artist name matches official spelling across DSPs", rule: "Cross-check Spotify / Apple / Audiomack profile" },
      { id: "rl-3", label: "Release date set + delivery deadline known (typical 7-14 days lead)", rule: "" },
      { id: "rl-4", label: "Original release date populated (where re-release / re-issue)", rule: "" },
      { id: "rl-5", label: "UPC assigned and unique to this release", rule: "Distributor or label-issued" },
      { id: "rl-6", label: "Label name set (artist's loan-out / label / distributor default)", rule: "" },
      { id: "rl-7", label: "© line and ℗ line populated correctly per track", rule: "© = composition; ℗ = master" },
      { id: "rl-8", label: "Language code set per track if non-English", rule: "isiZulu (zu), Yoruba (yo), Swahili (sw), etc." },
    ],
  },
  {
    name: "Artwork",
    items: [
      { id: "ar-1", label: "3000×3000 RGB JPG / PNG, under 10 MB", rule: "Universal DSP delivery floor" },
      { id: "ar-2", label: "No URLs / handles / DSP logos / promotional overlays", rule: "Hard reject by Spotify / Apple" },
      { id: "ar-3", label: "Track / album title in artwork matches metadata exactly", rule: "Including punctuation" },
      { id: "ar-4", label: "Artist name in artwork matches metadata exactly", rule: "" },
      { id: "ar-5", label: "Release-week thumbnail review (64×64) is legible", rule: "" },
    ],
  },
  {
    name: "Credits & splits",
    items: [
      { id: "cr-1", label: "Songwriter list complete with PRO affiliations", rule: "Pull from Co-Writing Splits Agreement" },
      { id: "cr-2", label: "Producer credits set in distributor portal", rule: "" },
      { id: "cr-3", label: "Composer / arranger credits set", rule: "" },
      { id: "cr-4", label: "Featured artists credited as performers", rule: "" },
      { id: "cr-5", label: "Mixed by / Mastered by credits added where supported", rule: "Apple Music supports; Spotify limited" },
    ],
  },
  {
    name: "Lyrics & territory",
    items: [
      { id: "ly-1", label: "Lyrics submitted to LyricFind / Musixmatch / Genius", rule: "Drives Apple Music sing-along feature" },
      { id: "ly-2", label: "Lyrics formatted line-by-line with timecodes (where supported)", rule: "Required for Spotify sync-lyrics" },
      { id: "ly-3", label: "Territory restrictions applied (where applicable)", rule: "Some sample-cleared tracks have territory carve-outs" },
      { id: "ly-4", label: "Pre-release availability set per territory", rule: "Pre-save campaign should match" },
    ],
  },
  {
    name: "Sample / sample-replay clearance",
    items: [
      { id: "sa-1", label: "All samples cleared in writing", rule: "Sample Clearance Form on file" },
      { id: "sa-2", label: "Interpolation negotiations closed", rule: "Cover Mech-License Tool used where applicable" },
      { id: "sa-3", label: "Co-publishing splits adjusted for cleared samples", rule: "Sample owner gets a comp share where required" },
    ],
  },
  {
    name: "Audio QC",
    items: [
      { id: "au-1", label: "Master Delivery Specs checklist complete", rule: "Cross-link to Master Delivery Specs" },
      { id: "au-2", label: "Audio QC tool run on each track", rule: "True peak, LUFS, RMS within target" },
      { id: "au-3", label: "All stems / acapella / instrumental / TV mix ready for sync requests", rule: "" },
    ],
  },
];

export default function PreReleaseMetadataQCPage() {
  const [state, setState] = useLocalState<Record<string, boolean>>(STORAGE_KEY, {});
  useToolRestore("pre-release-metadata-qc", STORAGE_KEY, setState);
  const all = SECTIONS.flatMap((s) => s.items);
  const done = all.filter((i) => state[i.id]).length;
  const total = all.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <ResourcePage
      parentHref="/dashboard/library/distribution"
      parentLabel="Back to Distribution"
      color={COLOR}
      tag="Distribution · QC"
      title="Pre-Release Metadata QC Checklist"
      intro="Final pre-flight before delivery to distributor. Catches the metadata issues that cause editorial rejection or stream-routing errors. Run on every release."
      next={{ href: "/dashboard/library/distribution/pitch-audit", label: "Pitch Audit Report" }}
    
      toolbar={<><SaveButton toolSlug="pre-release-metadata-qc" storageKey={STORAGE_KEY} title={`Pre-Release Metadata QC — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} /></>}>
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
                <button key={it.id} onClick={() => setState({ ...state, [it.id]: !ok })}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-surface-2 text-left transition-colors">
                  <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: ok ? COLOR : "transparent", border: `1px solid ${ok ? COLOR : "var(--border)"}` }}>
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
