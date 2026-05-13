"use client";
import { Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { useLocale } from "@/context/locale-context";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#A855F7";
const STORAGE_KEY = "roster_mv_budget_v1";

interface LineItem { label: string; amount: number; }
interface Section { name: string; items: LineItem[]; }
interface Budget { project: string; sections: Section[]; vatPct: number; contingencyPct: number; }

const seed = (): Budget => ({
  project: "",
  vatPct: 15,
  contingencyPct: 10,
  sections: [
    { name: "Pre-production", items: [
      { label: "Director fee (incl. pre / supervision)", amount: 0 },
      { label: "Producer / production manager", amount: 0 },
      { label: "Storyboards / treatment refinement", amount: 0 },
      { label: "Location scout & permits", amount: 0 },
      { label: "Casting (talent fees only — see Talent line)", amount: 0 },
    ] },
    { name: "Crew (per shoot day)", items: [
      { label: "DP", amount: 0 }, { label: "1st AC / Focus puller", amount: 0 }, { label: "Gaffer", amount: 0 },
      { label: "Key grip", amount: 0 }, { label: "Sound recordist", amount: 0 }, { label: "Make-up + hair", amount: 0 },
      { label: "Wardrobe / stylist", amount: 0 }, { label: "Production assistants ×N", amount: 0 },
    ] },
    { name: "Equipment", items: [
      { label: "Camera package + lenses", amount: 0 }, { label: "Lighting package", amount: 0 },
      { label: "Grip package (rails, jib, sliders)", amount: 0 }, { label: "Drone / aerial", amount: 0 },
      { label: "Special equipment (steadicam, underwater, FX)", amount: 0 },
    ] },
    { name: "Talent & extras", items: [
      { label: "Featured talent / dancers", amount: 0 }, { label: "Extras (per head × days)", amount: 0 },
      { label: "Body double / stunt", amount: 0 },
    ] },
    { name: "Locations", items: [
      { label: "Location fees", amount: 0 }, { label: "Permits", amount: 0 }, { label: "Power / utilities", amount: 0 },
    ] },
    { name: "Production design", items: [
      { label: "Set build", amount: 0 }, { label: "Props", amount: 0 }, { label: "Wardrobe purchase / hire", amount: 0 },
      { label: "Make-up / hair budget", amount: 0 },
    ] },
    { name: "Catering & transport", items: [
      { label: "Catering (per head × days)", amount: 0 }, { label: "Crew transport", amount: 0 },
      { label: "Talent travel + accommodation", amount: 0 },
    ] },
    { name: "Post-production", items: [
      { label: "Edit (offline + online)", amount: 0 }, { label: "Colour grading", amount: 0 },
      { label: "VFX / motion design", amount: 0 }, { label: "Sound design / mix to picture", amount: 0 },
      { label: "Deliverables (multi-format encodes)", amount: 0 },
    ] },
    { name: "Insurance", items: [
      { label: "Public liability + production insurance", amount: 0 },
    ] },
  ],
});

export default function MusicVideoBudgetPage() {
  const { sym } = useLocale();
  const [b, setB] = useLocalState<Budget>(STORAGE_KEY, seed());
  useToolRestore("music-video-budget", STORAGE_KEY, setB);

  const update = (s: number, i: number, patch: Partial<LineItem>) => {
    const next = { ...b, sections: b.sections.map((sec, si) => si !== s ? sec : ({ ...sec, items: sec.items.map((it, ii) => ii !== i ? it : { ...it, ...patch }) })) };
    setB(next);
  };

  const sectionTotals = b.sections.map((s) => s.items.reduce((a, c) => a + (c.amount || 0), 0));
  const subtotal = sectionTotals.reduce((a, c) => a + c, 0);
  const contingency = (subtotal * b.contingencyPct) / 100;
  const vat = ((subtotal + contingency) * b.vatPct) / 100;
  const total = subtotal + contingency + vat;

  const fmt = (n: number) => `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Budget"
      title="Music Video Budget"
      intro="9-section production budget — pre-production through post. Auto-calculates contingency and VAT in your locale's currency."
      toolbar={<><SaveButton toolSlug="music-video-budget" storageKey={STORAGE_KEY} title={`Music Video Budget — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setB(seed())} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/visual-production/music-video-call-sheet", label: "Music Video Call Sheet" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Project</label>
            <input className={inputClass} value={b.project} onChange={(e) => setB({ ...b, project: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Contingency %</label>
              <input type="number" className={inputClass} value={b.contingencyPct} onChange={(e) => setB({ ...b, contingencyPct: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <label className={labelClass}>VAT %</label>
              <input type="number" className={inputClass} value={b.vatPct} onChange={(e) => setB({ ...b, vatPct: Number(e.target.value) || 0 })} />
            </div>
          </div>
        </div>
      </section>

      {b.sections.map((sec, si) => (
        <section key={sec.name} className="glass-card rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: COLOR }}>{sec.name}</p>
            <p className="font-bold text-sm" style={{ color: COLOR }}>{fmt(sectionTotals[si])}</p>
          </div>
          <div className="space-y-2">
            {sec.items.map((it, ii) => (
              <div key={ii} className="grid grid-cols-3 gap-3 items-center">
                <input className={`${inputClass} col-span-2`} value={it.label} onChange={(e) => update(si, ii, { label: e.target.value })} />
                <input type="number" className={inputClass} value={it.amount} onChange={(e) => update(si, ii, { amount: Number(e.target.value) || 0 })} />
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="glass-card rounded-2xl p-6" style={{ borderColor: `${COLOR}40` }}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-text-muted">Subtotal</span><span className="text-text-primary font-semibold">{fmt(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Contingency ({b.contingencyPct}%)</span><span className="text-text-primary font-semibold">{fmt(contingency)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">VAT ({b.vatPct}%)</span><span className="text-text-primary font-semibold">{fmt(vat)}</span></div>
          <div className="flex justify-between text-lg pt-3 mt-3 border-t border-border" style={{ color: COLOR }}>
            <span className="font-black">Total</span><span className="font-black">{fmt(total)}</span>
          </div>
        </div>
      </section>
    </ResourcePage>
  );
}
