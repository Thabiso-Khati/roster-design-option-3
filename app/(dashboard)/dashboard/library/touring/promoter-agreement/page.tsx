"use client";
import { useState, useEffect, useCallback } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, RotateCcw, Printer } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ContractTopBar, ContractSendButton } from "@/components/library/contract-scaffold";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_promoter_agreement_v1";
const COLOR = "#F59E0B";

function ClauseAccordion({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-xl overflow-hidden mb-2">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left group">
        <span className="text-xs font-black w-6 flex-shrink-0" style={{ color: COLOR }}>{num}.</span>
        <p className="font-semibold text-sm text-text-primary group-hover:text-brand transition-colors flex-1">{title}</p>
        <ChevronDown size={15} className={`text-text-muted transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}/>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-border pt-4 text-xs text-text-muted leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default function PromoterAgreementPage() {
  const handleExportPDF = () => { window.print(); };
  const { country, currency, sym } = useLocale();
  const res = getCountryResources(country);
  const proAbbr    = res.performanceRights.abbr;
  const taxAbbr    = res.taxAuthorityAbbr ?? "SARS";
  const govLaw     = res.governingLaw ?? "the Republic of South Africa";
  const lawyerNote = res.lawyerNote ?? "qualified entertainment attorney";
  const isSA = country === "South Africa";

  const loc = useCallback((text: string): string => text
    .replace(/\bSAMRO\b(?:\s*\([^)]*\))?/g, proAbbr)
    .replace(/\bSARS\b/g, taxAbbr)
    .replace(/South African Rand\s*\(ZAR\)/g, `${res.currencyName ?? currency} (${res.currency ?? currency})`)
    .replace(/\(ZAR\)/g, `(${res.currency ?? currency})`)
    .replace(/\bZAR\b/g, res.currency ?? "ZAR")
    .replace(/the Republic of South Africa/g, govLaw)
    .replace(/Republic of South Africa/g, govLaw)
    .replace(/\bSouth African\b/g, country)
    .replace(/\bSouth Africa\b/g, country)
    .replace(/\bR(\d[\d,]*(?:\.\d{2})?)\b/g, `${sym}\u00A0$1`)
  , [proAbbr, taxAbbr, govLaw, country, currency, sym, res.currency, res.currencyName]);

  const [data, setData] = useState<Record<string, string>>({});

  useToolRestore("promoter-agreement", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const v = (key: string) => data[key] || "";

  const inputBase = "bg-transparent border-b border-border focus:border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full py-1 transition-colors";
  const labelCls = "text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1";

  const handleReset = () => {
    if (confirm("Reset all agreement fields? This cannot be undone.")) {
      setData({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="promoter-agreement" storageKey={STORAGE_KEY} title={`Promoter Agreement — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Promoter Agreement</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} · Contract · Fillable · Auto-Saved · 2026 Edition</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Promoter Agreement</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>{res.country} & African Markets. Edit for every show.</p>
        <p className="text-sm text-text-muted">Fill in the agreement details below. Contract clauses are displayed below for reference. Auto-saved to this device.</p>
      </div>

      <div className="glass-card rounded-xl p-4 mb-4 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
        <span className="text-sm flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">This template does not constitute legal advice. Always have a {lawyerNote} review contracts before signing or issuing any document.</p>
      </div>

      {/* Locale context banner */}
      {!isSA && (
        <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}06` }}>
          <span className="text-base flex-shrink-0">{res.flag}</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: COLOR }}>{res.country} Context Note</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This template uses South African market defaults. For {res.country}: replace ZAR amounts with <span className="font-semibold text-text-primary">{currency}</span>, replace SAMRO licensing references with <span className="font-semibold text-text-primary">{proAbbr}</span> ({res.performanceRights.name}), and adapt VAT and tax references to applicable {res.country} rates. Have a {lawyerNote} review before use.
            </p>
          </div>
        </div>
      )}

      <ContractTopBar contractId="promoter-agreement" />

      <div id="contract-printable">

      {/* Offer Details */}
      <div className="glass-card rounded-xl p-5 mb-4" style={{ borderColor: `${COLOR}20` }}>
        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Offer Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: "offer_date", label: "Offer Date" },
            { key: "artist_manager", label: "To (Artist or Manager Name)" },
            { key: "promoter_name", label: "From (Promoter / Purchaser Name)" },
            { key: "artist_name", label: "Artist / Act Performing" },
            { key: "venue_name", label: "Performance Venue" },
            { key: "venue_address", label: "Venue Address" },
            { key: "city_province", label: "City / Province / Country" },
            { key: "show_date", label: "Performance Date" },
            { key: "show_name", label: "Performance Event / Show Name" },
            { key: "num_performances", label: "Number of Performances" },
          ].map(f => (
            <div key={f.key}>
              <label className={labelCls}>{f.label}</label>
              <input type="text" value={v(f.key)} onChange={e => set(f.key, e.target.value)}
                placeholder={f.label} className={inputBase}/>
            </div>
          ))}
        </div>
      </div>

      {/* Deal Terms */}
      <div className="glass-card rounded-xl p-5 mb-4" style={{ borderColor: `${COLOR}20` }}>
        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Deal Terms</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Artist Fee / Guarantee ({currency})</label>
            <input type="text" value={v("fee")} onChange={e => set("fee", e.target.value)}
              placeholder={`e.g. ${sym}5,000`} className={inputBase}/>
          </div>
          <div>
            <label className={labelCls}>VAT Status</label>
            <select value={v("vat_status")} onChange={e => set("vat_status", e.target.value)}
              className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand w-full">
              <option value="">Select...</option>
              <option value="inclusive">Inclusive of 15% VAT</option>
              <option value="exclusive">Exclusive of 15% VAT</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Merch Split</label>
            <input type="text" value={v("merch_split")} onChange={e => set("merch_split", e.target.value)}
              placeholder="e.g. 80% Artist / 20% Venue" className={inputBase}/>
          </div>
          <div>
            <label className={labelCls}>Ticketing Platform</label>
            <input type="text" value={v("ticketing_platform")} onChange={e => set("ticketing_platform", e.target.value)}
              placeholder="e.g. Quicket, Howler" className={inputBase}/>
          </div>
        </div>
      </div>

      {/* Performance Window */}
      <div className="glass-card rounded-xl p-5 mb-4" style={{ borderColor: `${COLOR}20` }}>
        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Performance Window</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { key: "doors_open", label: "Doors Open" },
            { key: "support_times", label: "Support Act Performance Time(s)" },
            { key: "set_start", label: "Artist Set Time (Start)" },
            { key: "set_end", label: "Artist Set Time (End)" },
            { key: "curfew", label: "Venue Curfew" },
            { key: "load_out", label: "Load-Out / Clear Venue By" },
          ].map(f => (
            <div key={f.key}>
              <label className={labelCls}>{f.label}</label>
              <input type="text" value={v(f.key)} onChange={e => set(f.key, e.target.value)}
                placeholder="--:--" className={inputBase}/>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Scaling */}
      <div className="glass-card rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Ticket Scaling</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {["Capacity", "Kills / Tech Holds", "Available", "Comps", `Price (${res.currency ?? "ZAR"})`, `Gross (${res.currency ?? "ZAR"})`].map(h => (
                  <th key={h} className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-text-muted text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2].map(i => (
                <tr key={i} className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
                  {["cap", "kills", "avail", "comps", "price", "gross"].map(col => (
                    <td key={col} className="px-3 py-1.5">
                      <input type="text" value={v(`ticket_${i}_${col}`)} onChange={e => set(`ticket_${i}_${col}`, e.target.value)}
                        placeholder=", " className="bg-transparent text-sm text-text-primary focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5"/>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses */}
      <div className="glass-card rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Expenses</p>
        </div>
        <div className="divide-y divide-border">
          {[
            { key: "venue_hire", label: "Venue Hire / House Nut" },
            { key: "samro", label: `${proAbbr} Licence Fee` },
            { key: "advertising", label: "Advertising & Marketing" },
            { key: "ticketing_fee", label: "Box Office / Ticketing Platform Fee" },
            { key: "payment_fees", label: "Card / EFT / Mobile Payment Processing Fees" },
            { key: "hospitality", label: "Food & Hospitality (per rider / agreed terms)" },
            { key: "insurance", label: "Insurance" },
            { key: "generator", label: "Load Shedding / Generator Hire (if applicable)" },
            { key: "contingency", label: "Contingency (recommended: 10–15%)" },
            { key: "misc", label: "Miscellaneous" },
          ].map((f, i) => (
            <div key={f.key} className={`grid grid-cols-12 px-5 py-2.5 items-center ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
              <span className="col-span-8 text-xs text-text-muted">{f.label}</span>
              <div className="col-span-4 pl-2">
                <input type="text" value={v(`expense_${f.key}`)} onChange={e => set(`expense_${f.key}`, e.target.value)}
                  placeholder={`${sym} 0.00`} className="bg-transparent text-sm text-text-primary text-right placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5"/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Offer Expiry */}
      <div className="glass-card rounded-xl p-5 mb-4" style={{ borderColor: `${COLOR}20` }}>
        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Offer Expiry & Notes</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Offer Expiry Date</label>
            <input type="text" value={v("expiry_date")} onChange={e => set("expiry_date", e.target.value)}
              placeholder="dd/mm/yyyy" className={inputBase}/>
          </div>
          <div>
            <label className={labelCls}>Settlement Method</label>
            <input type="text" value={v("settlement_method")} onChange={e => set("settlement_method", e.target.value)}
              placeholder="e.g. EFT, SnapScan, Cash" className={inputBase}/>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Additional Notes / Special Conditions</label>
            <textarea value={v("additional_notes")} onChange={e => set("additional_notes", e.target.value)}
              placeholder="Any specific conditions, exclusions, or arrangements not covered above..."
              rows={3}
              className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full resize-none"/>
          </div>
        </div>
      </div>

      {/* Signature Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { side: "artist", label: "On Behalf of the Artist / Manager" },
          { side: "promoter", label: "On Behalf of the Promoter / Purchaser" },
        ].map(block => (
          <div key={block.side} className="glass-card rounded-xl p-5" style={{ borderColor: `${COLOR}15` }}>
            <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>{block.label}</p>
            <div className="space-y-3">
              {[
                { key: "sig", label: "Signature" },
                { key: "name", label: "Print Name" },
                { key: "capacity", label: "Title / Capacity" },
                { key: "date", label: "Date" },
                { key: "address", label: "Address" },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input type="text" value={v(`${block.side}_${f.key}`)} onChange={e => set(`${block.side}_${f.key}`, e.target.value)}
                    placeholder={f.label} className={inputBase}/>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contract Clauses */}
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wider mb-3 px-1" style={{ color: COLOR }}>Contract Clauses</p>
        <p className="text-xs text-text-muted mb-4 px-1">The following standard clauses form part of this agreement. Review and discuss with both parties before signing.</p>

        <ClauseAccordion num={1} title="Artist Fee & Payment Terms">
          <p>The Purchaser (Promoter) agrees to pay the Artist fee / guarantee as specified above, or alternatively 50% of gross box office revenue net of VAT and agreed expenses, whichever is the greater of the guarantee or the percentage deal.</p>
          <p>{loc("All settlement amounts shall be paid in South African Rand (ZAR) for domestic shows, or as agreed in writing for pan-African or international performances. Settlement shall occur on the night of the performance unless otherwise agreed in writing.")}</p>
          <p>Accepted settlement methods: EFT, SnapScan, Zapper, cash, or as separately agreed.</p>
        </ClauseAccordion>

        <ClauseAccordion num={2} title="Merchandise">
          <p>The merchandise split applies as specified above (default: 80% Artist / 20% Venue, or as separately agreed in writing). Artist retains the right to sell merchandise at the venue. The Purchaser shall provide a suitable, prominently positioned merch table at no additional cost.</p>
          <p>Cash, card (via Artist's own card machine), SnapScan, Zapper, and other mobile payment options accepted at Artist's discretion. Venue merch commission (if applicable) must be agreed in writing prior to the show and documented in the settlement.</p>
        </ClauseAccordion>

        <ClauseAccordion num={3} title="Technical Provision">
          <p>Artist shall use house sound, lights, and monitors unless a technical rider specifying otherwise is attached to and incorporated into this Agreement. Travel, ground transport, accommodation, backline, support act fees, and booking agent fees are NOT included in this offer unless expressly specified in writing.</p>
        </ClauseAccordion>

        <ClauseAccordion num={4} title="Guest List / Comps">
          <p>The number of complimentary tickets or guest list entries shall be mutually agreed in writing prior to the on-sale date. Artist holds will be charged at full face value at settlement.</p>
        </ClauseAccordion>

        <ClauseAccordion num={5} title="Exclusivity">
          <p>This offer constitutes an exclusive engagement for live public performance. The Artist and each member of the act shall not perform or make any public appearance within a radius of 250 km of the venue, from the offer date until sixty (60) days after the confirmed performance date.</p>
          <p>Excluded appearances include: concert dates, club appearances, private engagements, and live video shoots. Marketing appearances promoting this concert are excluded. The Artist must disclose all confirmed or potential conflicting dates at the time of signing.</p>
        </ClauseAccordion>

        <ClauseAccordion num={6} title="Media Obligations">
          <p>Subject to reasonable notice and scheduling, the Artist agrees to participate in: (a) radio station phone interviews or pre-recorded segments; (b) television appearances and interviews; (c) print and online media interviews, all for the purpose of promoting the show.</p>
          <p>All media obligations shall be communicated to the Artist's representative no fewer than seven (7) days in advance.</p>
        </ClauseAccordion>

        <ClauseAccordion num={7} title="Ticket Inventory & Scaling">
          <p>The Purchaser reserves the right to review and revise ticket scaling in conjunction with the Artist prior to public on-sale. The Purchaser holds full rights and control over ticket inventory and ticketing processes, including presales, early bird pricing, and promotional mechanisms.</p>
          <p>Artist ticket holds are considered sold; no more than 20% may be returned to the public, and such returns must be effected no later than 14 days before the show.</p>
        </ClauseAccordion>

        <ClauseAccordion num={8} title="Overtime and Curfew">
          <p>If the performance extends beyond the agreed set time or venue curfew, the Artist shall be liable for all associated overtime costs, penalties, or fines. If a curfew is imposed by the venue, municipality, or applicable authority (including noise by-laws), the Artist must comply immediately.</p>
        </ClauseAccordion>

        <ClauseAccordion num={9} title="Load Shedding / Force Majeure">
          <p>In the event that load shedding, infrastructure failure, or any force majeure event (including extreme weather, civil unrest, or government restrictions) prevents or materially affects the performance, the parties agree to: (a) postpone to a mutually agreed date where possible; (b) apply refund or credit policies in compliance with the Consumer Protection Act 68 of 2008; (c) negotiate in good faith on expense recovery.</p>
          <p>Neither party shall be liable for losses arising from a bona fide force majeure event.</p>
        </ClauseAccordion>

        <ClauseAccordion num={10} title="Liability">
          <p>The Purchaser shall not be responsible for loss or damage to the Artist's property at the venue due to fire, theft, or any other cause, unless arising from the Purchaser's gross negligence or wilful misconduct. The Purchaser shall not be liable for loss or damage caused by the Artist, the Artist's employees, representatives, agents, guests, or invitees.</p>
        </ClauseAccordion>

        <ClauseAccordion num={11} title="POPIA Compliance">
          <p>Both parties agree to handle all personal information exchanged in connection with this Agreement in compliance with the Protection of Personal Information Act, 4 of 2013 (POPIA). Fan and audience data shall not be shared between parties without explicit consent.</p>
        </ClauseAccordion>

        <ClauseAccordion num={12} title="Legal Compliance">
          <p>{loc("The Artist shall adhere to all applicable laws, policies, regulations, and rules governing the event, including South African labour law, local government by-laws, venue house rules, and any relevant regulations in the jurisdiction of performance.")}</p>
        </ClauseAccordion>

        <ClauseAccordion num={13} title="Amendments, Authority & Governing Law">
          <p>This Agreement may not be modified, altered, or amended except by a written instrument signed by both parties. Each signatory warrants that they have full authority to enter into this Agreement on behalf of the party they represent, and that execution has been duly authorised.</p>
          <p>{loc("This Agreement shall be governed by the laws of the Republic of South Africa, unless the performance takes place in another jurisdiction, in which case the applicable governing law shall be agreed in writing.")}</p>
        </ClauseAccordion>
      </div>

      </div> {/* end #contract-printable */}

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device.</span> Fill in a fresh form for every show. Use Save as PDF to keep a permanent record.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
            <RotateCcw size={12}/>Reset form
          </button>
          <ContractSendButton contractId="promoter-agreement" />
          
          <Link href="/dashboard/library/touring/personnel-record"
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
            style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
            Next: Personnel Record<ChevronRight size={14}/>
          </Link>
        </div>
      </div>
    </div>
  );
}
