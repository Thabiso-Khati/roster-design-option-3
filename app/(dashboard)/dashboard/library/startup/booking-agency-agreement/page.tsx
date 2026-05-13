"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";

const COLOR = "#C9A84C";

const CLAUSES = (govLaw: string, lawyerNote: string) => [
  { num: "1", title: "Appointment & Scope", text: "Artist appoints Agency as Artist's exclusive (or non-exclusive, where stated in Schedule A) booking agent for the Territory and Term defined in Schedule A. Agency's services include soliciting, negotiating and confirming live engagements, festival slots, branded performances, university bookings, club residencies and corporate appearances on Artist's behalf." },
  { num: "2", title: "Exclusions from Scope", text: "Unless otherwise agreed in writing, Agency's appointment expressly excludes: (i) recording, distribution and master licensing; (ii) songwriting, publishing and synchronization licensing; (iii) merchandise; (iv) endorsement and brand partnership deals not arising from a live engagement; (v) personal management. These remain Artist's responsibility or that of separately appointed representatives." },
  { num: "3", title: "Term & Territory", text: "The Term commences on the date of execution and runs for the period set out in Schedule A. The Territory shall be as set out in Schedule A. Either party may terminate at the end of the Term on not less than ninety (90) days' written notice. Engagements confirmed during the Term but performed thereafter remain commissionable subject to clause 7." },
  { num: "4", title: "Agency's Obligations", text: "Agency shall: (i) act in good faith and use commercially reasonable efforts to secure suitable engagements; (ii) submit each offer to Artist for written acceptance before binding Artist; (iii) provide written confirmation of every booking; (iv) not commit Artist to performance fees, terms, riders or appearances without Artist's prior written approval; (v) provide quarterly reports of all bookings, fees, deposits and outstanding balances." },
  { num: "5", title: "Artist's Obligations", text: "Artist shall: (i) refer all live booking enquiries to Agency during the Term; (ii) honour all bookings confirmed in writing and accepted by Artist; (iii) maintain reasonable availability for performance dates within Schedule A's blackout / availability framework; (iv) notify Agency of any direct booking enquiries received." },
  { num: "6", title: "Commission", text: "Artist shall pay Agency a commission of the percentage specified in Schedule A on Gross Performance Income. Gross Performance Income means all gross fees received by or on behalf of Artist for live performances confirmed during the Term, before deduction of Artist's expenses but after deduction of: VAT or equivalent, withholding tax mandated by the booking country, sound and light buy-out where shown separately, and bona-fide third-party production costs invoiced by suppliers other than Artist." },
  { num: "7", title: "Sunset Period", text: "Following expiry or termination of this Agreement (other than termination for material breach by Agency), Agency shall be entitled to commission on engagements confirmed during the Term that take place within twelve (12) months of expiry, and on extensions of those engagements (e.g. additional dates of the same tour or festival run) that take place within eighteen (18) months." },
  { num: "8", title: "Direct Receipts", text: "Where Agency does not collect performance fees direct, Artist (or Artist's accountant) shall remit Agency's commission within fourteen (14) days of cleared receipt of each fee, supported by a copy of the relevant invoice and remittance advice. Where Agency collects fees direct, Agency shall remit the net to Artist within fourteen (14) days, less commission and any approved costs." },
  { num: "9", title: "Cancellations & Force Majeure", text: "Where an engagement is cancelled by the promoter without cause, the cancellation fee (if any) is treated as Gross Performance Income and remains commissionable. Where Artist cancels without cause and Agency has performed work, Artist shall pay Agency a kill fee equal to fifty per cent (50%) of the commission Agency would have earned. Force majeure cancellations shall not give rise to commission save where deposits are non-refundable." },
  { num: "10", title: "Riders & Performance Quality", text: "Agency shall not bind Artist to performance riders without Artist's prior written approval. Where promoters fail to deliver on agreed riders, Agency shall use reasonable efforts to remedy on the day; structural rider failure (e.g. backline missing) shall be grounds for Agency to renegotiate or, with Artist's consent, cancel the engagement at the promoter's cost." },
  { num: "11", title: "Conflicts", text: "Agency shall disclose to Artist any potential conflict of interest including but not limited to representation of artists likely to be considered for the same engagement. Artist's prior written consent is required for Agency to act for both Artist and a directly competing artist on the same booking." },
  { num: "12", title: "Records & Audit", text: "Agency shall maintain accurate records of all bookings, fees, deposits, commissions and remittances for not less than five (5) years. Artist may, on thirty (30) days' written notice, audit those records once per Term, at Artist's cost; provided that where the audit identifies undercollection or overcommission of more than three per cent (3%), Agency shall bear the cost of the audit." },
  { num: "13", title: "Termination for Cause", text: "Either party may terminate immediately on written notice where the other commits a material breach not remedied within thirty (30) days of notice; or where the other becomes insolvent, enters business rescue, or has its registration revoked by the relevant business-registration authority." },
  { num: "14", title: "Confidentiality", text: "Each party undertakes to keep confidential the commercial terms of all bookings, riders, and the contents of this Agreement, save where disclosure is required by law, by tax authorities, or by Artist's other professional advisors (manager, accountant, attorney) under equivalent confidentiality." },
  { num: "15", title: "Independent Contractor", text: "Agency provides services as an independent contractor and not as an employee of Artist. Each party is responsible for its own statutory obligations, registrations and taxes. Agency does not have authority to bind Artist beyond the scope expressly set out in this Agreement." },
  { num: "16", title: "Governing Law & Disputes", text: `This Agreement is governed by the laws of ${govLaw}. Any dispute that cannot be resolved by good-faith negotiation shall be referred to mediation and, failing resolution, to arbitration under the rules of the Arbitration Foundation of Southern Africa (where ${govLaw} is South Africa) or the Lagos Court of Arbitration (where ${govLaw} is Nigeria), or such other body as the parties agree. Each party shall, before signing, consult ${lawyerNote} licensed in the relevant jurisdiction.` },
];

const SCHEDULE = [
  { f: "Artist legal name", note: "Stage / loan-out company permitted" },
  { f: "Agency legal name + reg #", note: "" },
  { f: "Term", note: "Initial period in months" },
  { f: "Territory", note: "World / SA + NG / specific markets" },
  { f: "Exclusivity", note: "Exclusive / non-exclusive" },
  { f: "Commission %", note: "Industry standard 10–20%" },
  { f: "Excluded engagements", note: "Pre-existing bookings, charity, etc." },
  { f: "Availability framework", note: "Touring weeks / studio blackouts / family commitments" },
  { f: "Approval channel", note: "Email / WhatsApp + 24h response window" },
  { f: "Quarterly report cadence", note: "Last working day of each quarter" },
];

export default function BookingAgencyAgreementPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const govLaw = res.governingLaw ?? "the Republic of South Africa";
  const lawyerNote = res.lawyerNote ?? "a qualified entertainment attorney";

  return (
    <ResourcePage
      parentHref="/dashboard/library/startup"
      parentLabel="Back to Onboarding"
      color={COLOR}
      tag="Onboarding · Contract"
      title="Booking Agency Agreement"
      intro={`Exclusive (or non-exclusive) appointment of a booking agent for live engagements. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="booking-agency-agreement" />}
      next={{ href: "/dashboard/library/startup/service-provider-onboarding", label: "Service Provider Onboarding" }}
    >
      <ContractScaffold contractId="booking-agency-agreement">
      <div className="space-y-2 mb-6">
        {CLAUSES(govLaw, lawyerNote).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <div className="glass-card rounded-2xl p-6 mb-4">
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Schedule A</p>
        <div className="space-y-2">
          {SCHEDULE.map((f) => (
            <div key={f.f} className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-b-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">{f.f}</p>
                {f.note && <p className="text-[11px] text-text-muted">{f.note}</p>}
              </div>
              <input className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand w-48 sm:w-64 flex-shrink-0" placeholder="—" />
            </div>
          ))}
        </div>
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
