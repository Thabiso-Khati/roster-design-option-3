"use client";
import { Check } from "lucide-react";
import { ResourcePage, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#10B981";
const STORAGE_KEY = "roster_master_delivery_specs_v1";

interface Item { id: string; label: string; rule: string; }
interface Section { name: string; items: Item[]; }

const SECTIONS: Section[] = [
  {
    name: "Audio specs (Streaming master)",
    items: [
      { id: "wav-24-48", label: "Stereo WAV, 24-bit / 48 kHz minimum", rule: "Universal DSP delivery floor; 96 kHz preferred for premium delivery" },
      { id: "lufs", label: "Integrated loudness within −16 to −9 LUFS depending on platform target", rule: "Spotify normalises to −14, Apple to −16, Tidal to −14" },
      { id: "true-peak", label: "True peak ≤ −1 dBTP", rule: "Prevents inter-sample clipping on lossy encodes" },
      { id: "no-dither-double", label: "No dither double-applied (master is final)", rule: "Dither once at final bit-depth reduction" },
      { id: "dc-offset", label: "DC offset removed", rule: "Spectrum analysis at 0 Hz should be flat" },
    ],
  },
  {
    name: "Apple Digital Master (MFiT)",
    items: [
      { id: "afclip-pass", label: "Passes Apple's afclip (no clipping at encoded format)", rule: "Run through afclip before submission" },
      { id: "ot-flags", label: "All overruns and warnings reviewed", rule: "Borderline true peaks flagged for re-master" },
      { id: "ddp-or-wav", label: "Provided as DDP image OR 24-bit WAV per submission target", rule: "Apple accepts both" },
    ],
  },
  {
    name: "Stems",
    items: [
      { id: "stem-instrumental", label: "Instrumental version (full mix less lead vocals)", rule: "Required for sync, TV mixes, karaoke" },
      { id: "stem-acapella", label: "Acapella version (lead + harmonies, no music)", rule: "For remixes and edits" },
      { id: "stem-tv-mix", label: "TV mix (instrumental + backing vox + ad-libs less lead)", rule: "TV/film usage where artist not on-screen" },
      { id: "stem-multitrack", label: "Stems folder (drums, bass, vocals, instruments, FX, master bus)", rule: "For sync re-mixing and live in-ears" },
    ],
  },
  {
    name: "Atmos / Spatial (where applicable)",
    items: [
      { id: "adm", label: "ADM BWF master with renderer report", rule: "Apple Spatial / Tidal Atmos delivery" },
      { id: "binaural", label: "Binaural reference render included", rule: "QC reference for headphone listening" },
      { id: "atmos-loudness", label: "Atmos integrated loudness within −18 to −16 LUFS", rule: "Apple Atmos guidelines" },
    ],
  },
  {
    name: "Metadata",
    items: [
      { id: "isrc", label: "ISRC embedded in WAV header per track", rule: "iXML / BWF chunks; required by some distributors" },
      { id: "song-meta", label: "Song metadata complete in distributor portal (title, artist, writers, publisher, ISRC, ISWC)", rule: "Pull from Song Metadata tool" },
      { id: "label-copy", label: "Label Copy completed and matches audio file metadata", rule: "Cross-checked against Label Copy template" },
      { id: "explicit", label: "Explicit / clean flag set correctly per track", rule: "Don't render warning labels into artwork" },
    ],
  },
  {
    name: "File hygiene",
    items: [
      { id: "naming", label: "File naming convention applied: Artist_Title_v01.wav (no spaces, lowercase)", rule: "Universal naming; prevents distributor errors" },
      { id: "no-leading-silence", label: "No leading silence beyond 100 ms", rule: "Check first sample" },
      { id: "fade-in-out", label: "Fade-in/out applied on first/last track of album where appropriate", rule: "Prevents abrupt transition on shuffle" },
      { id: "checksum", label: "MD5 / SHA checksum recorded on hand-off drive", rule: "Verifies clean transfer" },
    ],
  },
  {
    name: "Pre-flight before delivery",
    items: [
      { id: "qc-listen", label: "Full QC listen on monitors + reference earbuds", rule: "Catches the click no scope catches" },
      { id: "phase-check", label: "Phase check (mono compatibility for radio/AM)", rule: "Critical for African radio" },
      { id: "club-check", label: "Club system reference (where applicable)", rule: "For Amapiano / dance — sub-bass response" },
    ],
  },
];

export default function MasterDeliverySpecsPage() {
  const [state, setState] = useLocalState<Record<string, boolean>>(STORAGE_KEY, {});
  useToolRestore("master-delivery-specs", STORAGE_KEY, setState);
  const all = SECTIONS.flatMap((s) => s.items);
  const done = all.filter((i) => state[i.id]).length;
  const total = all.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <ResourcePage
      parentHref="/dashboard/library/recording"
      parentLabel="Back to A&R, Recording & Production"
      color={COLOR}
      tag="Recording · Specs"
      title="Master Delivery Specs"
      intro="The pre-flight checklist before files leave your distributor's portal. Catches the issues that cause DSP rejections and the issues that lose you a quarter-million streams to a buggy true-peak."
      next={{ href: "/dashboard/library/recording/atmos-spatial-brief", label: "Atmos / Spatial Audio Brief" }}
    
      toolbar={<><SaveButton toolSlug="master-delivery-specs" storageKey={STORAGE_KEY} title={`Master Delivery Specs — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} /></>}>
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
