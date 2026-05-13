"use client";
import { Check } from "lucide-react";
import { ResourcePage, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#10B981";
const STORAGE_KEY = "roster_daw_handoff_v1";

interface Item { id: string; label: string; rule: string; }
interface Section { name: string; items: Item[]; }

const SECTIONS: Section[] = [
  {
    name: "Project hygiene",
    items: [
      { id: "ph-1", label: "Project saved with version suffix (Artist_Title_v01.ptx)", rule: "Universal naming convention" },
      { id: "ph-2", label: "Session frame rate + sample rate confirmed", rule: "48 kHz / 24-bit standard for delivery" },
      { id: "ph-3", label: "All audio files consolidated into Audio Files folder", rule: "Use Save Copy In → Audio Files only" },
      { id: "ph-4", label: "Unused audio + clips deleted (Clear)", rule: "Reduces transfer size + confusion" },
      { id: "ph-5", label: "Session colour-coded by stem group (drums / bass / vox / instruments / FX)", rule: "Speeds visual orientation" },
    ],
  },
  {
    name: "Tracks",
    items: [
      { id: "tr-1", label: "Tracks named consistently — no 'Audio 14'", rule: "DR_Kick / BS_Bass / VX_Lead etc." },
      { id: "tr-2", label: "All tracks routed correctly + bus assignments documented", rule: "Bus structure visible in Mix window" },
      { id: "tr-3", label: "Inactive / deleted tracks removed", rule: "Cleans the session" },
      { id: "tr-4", label: "Aux returns clearly labelled (Reverb-A / Delay-B / Slap)", rule: "" },
      { id: "tr-5", label: "Group tracks documented (Drum Bus / Vocal Bus / Master Bus)", rule: "" },
    ],
  },
  {
    name: "Plug-ins + automation",
    items: [
      { id: "pl-1", label: "All plug-ins on commercially available licences (no leaked / shareware)", rule: "Receiving engineer needs same licences" },
      { id: "pl-2", label: "Third-party plug-in list documented (alongside session)", rule: "Waves / FabFilter / iZotope / Soundtoys etc." },
      { id: "pl-3", label: "Mix bus / Master fader plug-ins committed or printed (where intended)", rule: "Mix engineer can re-create your bus FX" },
      { id: "pl-4", label: "Automation lanes visible + intentional", rule: "Hidden lanes removed" },
      { id: "pl-5", label: "Plug-in presets saved with session (where customised)", rule: "" },
    ],
  },
  {
    name: "Stems / Bounce",
    items: [
      { id: "st-1", label: "Multitrack stems exported per stem group", rule: "Drums / Bass / Vox / Instruments / FX / Master Bus" },
      { id: "st-2", label: "Stems aligned to start of session (timecode 00:00:00 = first downbeat)", rule: "Critical for mix engineer — drag-and-drop must align" },
      { id: "st-3", label: "Stems exported at session sample rate + bit depth (24-bit / 48 kHz)", rule: "" },
      { id: "st-4", label: "Reference rough mix included as separate WAV", rule: "Mix engineer references your intent" },
      { id: "st-5", label: "Tempo / time signature changes documented per phrase", rule: "Critical for editing-aware engineers" },
    ],
  },
  {
    name: "Vocal-specific",
    items: [
      { id: "vo-1", label: "Comp Sheet attached (which take per phrase)", rule: "Cross-link to Vocal Comp Sheet tool" },
      { id: "vo-2", label: "Lead vocal pitch correction state documented (Melodyne / Auto-Tune / off)", rule: "" },
      { id: "vo-3", label: "Backing vocals organised in BV Comp folders + bussed", rule: "" },
      { id: "vo-4", label: "Ad-libs labelled by section + intent", rule: "Verse 1 ad-libs / Chorus 2 ad-libs / etc." },
    ],
  },
  {
    name: "Documentation",
    items: [
      { id: "do-1", label: "Session notes file alongside (txt / md)", rule: "What's done, what's pending, intended direction" },
      { id: "do-2", label: "Reference tracks named (artist / song / why)", rule: "Mix engineer can target sonics" },
      { id: "do-3", label: "Clearance status of any samples / interpolations stated", rule: "Engineer needs to know before changing anything" },
      { id: "do-4", label: "Hand-off media checked + checksum verified", rule: "MD5 / SHA-256 on the drive" },
    ],
  },
];

export default function DAWHandoffPage() {
  const [state, setState] = useLocalState<Record<string, boolean>>(STORAGE_KEY, {});
  useToolRestore("daw-handoff", STORAGE_KEY, setState);
  const all = SECTIONS.flatMap((s) => s.items);
  const done = all.filter((i) => state[i.id]).length;
  const total = all.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <ResourcePage
      parentHref="/dashboard/library/recording"
      parentLabel="Back to A&R, Recording & Production"
      color={COLOR}
      tag="Recording · Engineer-to-Engineer"
      title="DAW Project Handoff Checklist"
      intro="The handover checklist between producer and mix engineer (or mix-to-master). Catches the issues that cause days of session debugging and missed deadlines."
      next={{ href: "/dashboard/library/recording/label-copy", label: "Label Copy Template" }}
    
      toolbar={<><SaveButton toolSlug="daw-handoff" storageKey={STORAGE_KEY} title={`DAW Handoff — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} /></>}>
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
