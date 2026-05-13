"use client";
import { Check } from "lucide-react";
import { ResourcePage, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#06B6D4";
const STORAGE_KEY = "roster_soundexchange_v1";

interface Item { id: string; label: string; rule: string; }
interface Section { name: string; items: Item[]; }

const SECTIONS: Section[] = [
  {
    name: "What SoundExchange is",
    items: [
      { id: "what-1", label: "SoundExchange is the US neighbouring-rights collective for sound recordings", rule: "Pays performers (artists, session musicians) and master owners (labels) when recordings are played on US non-interactive digital radio (Pandora, SiriusXM, webcasters)" },
      { id: "what-2", label: "It does NOT cover the writer side — that's PRO + MLC territory", rule: "SX = master / performance side only" },
      { id: "what-3", label: "African artists with ANY US streaming on non-interactive radio earn here", rule: "Most miss it because registration is from-scratch and not automated by distributors" },
    ],
  },
  {
    name: "Two registrations needed",
    items: [
      { id: "reg-1", label: "Featured Artist registration (vocalist or named lead performer)", rule: "Receives 45% of distributable royalties" },
      { id: "reg-2", label: "Sound Recording Copyright Owner (label / artist's loan-out company)", rule: "Receives 50% of distributable royalties" },
      { id: "reg-3", label: "Non-Featured (session musicians) — separate AFM/SAG-AFTRA Trust", rule: "Receives 5% via the Trust, not direct from SX" },
    ],
  },
  {
    name: "How to register (Featured Artist)",
    items: [
      { id: "fa-1", label: "Sign up at soundexchange.com — free", rule: "Online application, takes ~30 minutes" },
      { id: "fa-2", label: "Provide proof of identity (passport)", rule: "" },
      { id: "fa-3", label: "Provide proof of recording artist work", rule: "Spotify / Apple links, distributor confirmations" },
      { id: "fa-4", label: "Bank details for international wire", rule: "USD-denominated wire fees apply" },
      { id: "fa-5", label: "ISRCs of every recording you appear on as featured artist", rule: "Required to claim — pull from Song Metadata tool" },
    ],
  },
  {
    name: "How to register (Sound Recording Copyright Owner)",
    items: [
      { id: "rco-1", label: "Separate registration from Featured Artist", rule: "Different account; even if you own both rights" },
      { id: "rco-2", label: "Documentation showing master ownership", rule: "Producer agreement, label deal, work-for-hire, or commissioning agreement" },
      { id: "rco-3", label: "Tax forms — W-8BEN-E for entities, W-8BEN for individuals", rule: "Lowers withholding tax under SA / NG tax treaties" },
      { id: "rco-4", label: "ISRCs of every master owned", rule: "" },
    ],
  },
  {
    name: "Tax considerations",
    items: [
      { id: "tax-1", label: "US 30% default withholding", rule: "Reduced to 0% (SA) or 7.5% (NG) with valid W-8BEN under DTA" },
      { id: "tax-2", label: "W-8BEN expires every 3 years", rule: "Renew before expiry or default 30% kicks back in" },
      { id: "tax-3", label: "Distributions are USD wire — bank wire-receive fee applies", rule: "Use a USD-receiving account where possible" },
    ],
  },
  {
    name: "Black box recovery",
    items: [
      { id: "bb-1", label: "Unclaimed royalties pool is held for 3 years before redistribution", rule: "Active claim within that window recovers historical earnings" },
      { id: "bb-2", label: "Submit a claim form for each ISRC suspected of having played in the US", rule: "Distributors won't do this for you" },
      { id: "bb-3", label: "Common for African Afrobeats / Amapiano artists with US Pandora play", rule: "Worth checking annually — historical claims can be 5-figure recoveries" },
    ],
  },
  {
    name: "Annual review checklist",
    items: [
      { id: "an-1", label: "Update ISRC catalogue (new releases this year)", rule: "" },
      { id: "an-2", label: "Verify W-8BEN is current", rule: "" },
      { id: "an-3", label: "Check distribution statements for missing ISRCs", rule: "Common: distributors miss ISRCs on early releases" },
      { id: "an-4", label: "Review unclaimed pool for own catalogue", rule: "Login → Repertoire → Unclaimed" },
      { id: "an-5", label: "Confirm bank details and tax treaty form unchanged", rule: "" },
    ],
  },
];

export default function SoundExchangeGuidePage() {
  const [state, setState] = useLocalState<Record<string, boolean>>(STORAGE_KEY, {});
  useToolRestore("soundexchange-guide", STORAGE_KEY, setState);
  const all = SECTIONS.flatMap((s) => s.items);
  const done = all.filter((i) => state[i.id]).length;
  const total = all.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <ResourcePage
      parentHref="/dashboard/library/publishing"
      parentLabel="Back to Publishing"
      color={COLOR}
      tag="Publishing · Guide"
      title="SoundExchange Registration Guide"
      intro="US neighbouring rights for sound recordings — the master side of the streaming royalty equation. Most African artists are missing this entirely. Free to register; pays via wire."
      next={{ href: "/dashboard/library/publishing/royalty-calculator", label: "Publishing Royalty Calculator" }}
    
      toolbar={<><SaveButton toolSlug="soundexchange-guide" storageKey={STORAGE_KEY} title={`SoundExchange Guide — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} /></>}>
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${COLOR}40` }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-text-primary">{done} / {total} steps reviewed</p>
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
