"use client";
import { Check } from "lucide-react";
import { ResourcePage, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#F59E0B";
const STORAGE_KEY = "roster_visa_travel_checklist_v1";

interface Item { id: string; label: string; rule: string; }
interface Section { name: string; items: Item[]; }

const SECTIONS: Section[] = [
  {
    name: "Passports & ID — every traveller",
    items: [
      { id: "passport-validity", label: "Passport valid for 6+ months from date of return", rule: "Most countries reject passports closer to expiry" },
      { id: "blank-pages", label: "Minimum 2 blank pages per traveller", rule: "Schengen, UK, US all require this" },
      { id: "passport-photos", label: "4× passport photos per traveller (recent, biometric standard)", rule: "Visa applications + emergency replacements" },
      { id: "id-copies", label: "ID + passport copies stored separately from originals", rule: "Cloud backup (Google Drive / Vault) + physical copy with TM" },
    ],
  },
  {
    name: "Common artist visas — South African passport holders",
    items: [
      { id: "uk-tier5", label: "UK Tier 5 Creative & Sporting Worker visa OR Permitted Paid Engagement (PPE)", rule: "Tier 5 requires Certificate of Sponsorship; PPE is for max 1 month, no sponsorship needed" },
      { id: "schengen-c", label: "Schengen Type C (short-stay) for EU shows under 90 days", rule: "Apply through the country with the most days; usually 4-6 weeks lead time" },
      { id: "us-p2", label: "US P-2 / P-3 / O-1B visa for paid US performances", rule: "P-1B for groups, P-3 for culturally unique acts, O-1B for Extraordinary ability — 3-6 months lead time" },
      { id: "us-petition", label: "US visa: USCIS Form I-129 + petition by sponsor", rule: "Almost always engage a US immigration attorney" },
      { id: "canada-iec", label: "Canada IEC / work permit if doing paid shows", rule: "" },
      { id: "australia-400", label: "Australia subclass 400 (short-stay specialist)", rule: "Apply 4-6 weeks before" },
      { id: "uae-mission", label: "UAE Mission Visa for performers", rule: "Sponsored by venue / promoter" },
    ],
  },
  {
    name: "Common artist visas — Nigerian passport holders",
    items: [
      { id: "uk-pa", label: "UK Permitted Paid Engagement (PPE) up to 1 month, OR Tier 5", rule: "Nigerian passports often face higher refusal rate — apply with strongest financial evidence" },
      { id: "schengen-ng", label: "Schengen Type C — apply via country with most days", rule: "Show financial means, return tickets, accommodation, performance contract" },
      { id: "us-p1b-ng", label: "US P-1B / P-3 / O-1B with sponsor petition", rule: "Same process as ZA; engage immigration attorney" },
      { id: "ecowas", label: "ECOWAS region: visa-free entry across most ECOWAS member states", rule: "No visa needed for shows in Ghana, Senegal, Côte d'Ivoire, Liberia, etc." },
      { id: "kenya-tw", label: "Kenya TW (work permit) for paid performance", rule: "" },
      { id: "sa-business", label: "South Africa Business / Section 11(2) for paid performance", rule: "Apply via VFS Global; typically 5-15 working days" },
    ],
  },
  {
    name: "Documents the embassy / consulate will want",
    items: [
      { id: "performance-contract", label: "Signed performance contract / engagement letter from promoter", rule: "Stating fee, dates, venue" },
      { id: "invitation-letter", label: "Invitation letter on promoter's letterhead", rule: "Includes passport details, full party, accommodation" },
      { id: "flight-bookings", label: "Flight bookings (held / refundable until visa granted)", rule: "Don't pay full fare before visa approval" },
      { id: "accommodation", label: "Accommodation bookings or letter from promoter", rule: "" },
      { id: "bank-statements", label: "Bank statements 3-6 months", rule: "Demonstrating financial means" },
      { id: "tax-cert", label: "Tax clearance / SARS / FIRS / KRA letter", rule: "Some embassies want tax compliance proof" },
      { id: "police-clearance", label: "Police clearance certificate (where required)", rule: "" },
      { id: "yellow-fever", label: "Yellow fever certificate for entry to certain countries", rule: "Mandatory for several West / East African countries' arrivals" },
    ],
  },
  {
    name: "Travel insurance & health",
    items: [
      { id: "med-insurance", label: "Travel medical insurance for all travellers", rule: "Schengen mandates min EUR 30,000" },
      { id: "covid-status", label: "Vaccination / health declaration as required by destination", rule: "Confirm IATA Travel Centre on departure day" },
      { id: "rx-meds", label: "Prescription medication letter for any controlled meds", rule: "" },
      { id: "emergency-card", label: "Emergency card for each traveller (allergies, blood group, medications)", rule: "" },
    ],
  },
  {
    name: "Cargo / equipment",
    items: [
      { id: "ata-carnet", label: "ATA Carnet for international gear shipments", rule: "Required for Schengen, UK, US — issued by chambers of commerce" },
      { id: "carnet-list", label: "Detailed gear list with serials, replacement values, country of origin", rule: "" },
      { id: "checked-luggage", label: "Excess baggage / oversized item bookings", rule: "Flight cabin crew lay-up policy" },
      { id: "instrument-special", label: "Instrument cabin policy confirmed (extra seat / overhead-only)", rule: "Per airline" },
      { id: "freight-quote", label: "Freight forwarder quote (where applicable)", rule: "" },
    ],
  },
  {
    name: "Money & receipts",
    items: [
      { id: "forex", label: "Foreign currency cash float per country", rule: "Per-diem in destination currency, sourced before travel" },
      { id: "card-notify", label: "Card issuer notified of travel dates", rule: "Prevents fraud freezes" },
      { id: "tax-withholding", label: "Withholding tax rate confirmed for performance income", rule: "UK 20%, US 30%, Schengen varies" },
      { id: "receipts-system", label: "Receipt-capture workflow confirmed (per-traveller)", rule: "Tour Budget tool tracks; expenses for tax claim back home" },
    ],
  },
];

export default function VisaTravelChecklistPage() {
  const [state, setState] = useLocalState<Record<string, boolean>>(STORAGE_KEY, {});
  useToolRestore("visa-travel-checklist", STORAGE_KEY, setState);
  const all = SECTIONS.flatMap((s) => s.items);
  const done = all.filter((i) => state[i.id]).length;
  const total = all.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <ResourcePage
      parentHref="/dashboard/library/touring"
      parentLabel="Back to Live, Touring & Festivals"
      color={COLOR}
      tag="Live · Travel"
      title="Visa & Travel Document Checklist"
      intro="The cross-border touring backbone for African artists — passports, visas, gear carnets, insurance, money. SA + NG passport-holder routes covered."
      next={{ href: "/dashboard/library/touring/show-settlement-sheet", label: "Show Settlement Sheet" }}
    
      toolbar={<><SaveButton toolSlug="visa-travel-checklist" storageKey={STORAGE_KEY} title={`Visa Travel Checklist — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} /></>}>
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${COLOR}40` }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-text-primary">{done} / {total} ready</p>
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
                <button key={it.id} onClick={() => setState({ ...state, [it.id]: !ok })} className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-surface-2 text-left transition-colors">
                  <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: ok ? COLOR : "transparent", border: `1px solid ${ok ? COLOR : "var(--border)"}` }}>
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
