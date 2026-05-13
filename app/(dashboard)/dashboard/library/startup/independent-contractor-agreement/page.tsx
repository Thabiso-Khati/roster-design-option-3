"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";

const COLOR = "#C9A84C";

const CLAUSES = (govLaw: string, lawyerNote: string, taxAbbr: string) => [
  { num: "1", title: "Engagement", text: "Principal engages Contractor to provide the services described in Schedule A. Contractor accepts the engagement on the terms set out in this Agreement and Schedule A. The relationship between the parties is one of independent contractor and client; nothing in this Agreement creates an employment, partnership, joint-venture, agency or franchise relationship." },
  { num: "2", title: "Term", text: "This Agreement commences on the Start Date in Schedule A and continues until completion of the services or until terminated in accordance with clause 11. Where Schedule A specifies a fixed term, the Agreement shall expire on the end-date stated unless extended in writing by the parties." },
  { num: "3", title: "Services", text: "Contractor shall perform the services described in Schedule A with reasonable skill and care, in accordance with industry-standard practice, and to the timelines stated. Contractor shall determine the means and methods of performing the services, subject to Principal's reasonable directions on the deliverables, milestones and creative requirements." },
  { num: "4", title: "Fees & Payment", text: "Principal shall pay Contractor the fees set out in Schedule A. Where stated as a flat fee, no further amount is payable save for pre-approved expenses. Where stated as a day or hour rate, Contractor shall submit timesheets within seven (7) days of the end of each calendar month. Invoices shall be paid within fourteen (14) days of receipt by EFT. VAT shall be added where Contractor is registered for VAT." },
  { num: "5", title: "Expenses", text: "Contractor shall not incur expenses on Principal's account without Principal's prior written approval. Where pre-approved, expenses shall be reimbursed at cost on production of original receipts within thirty (30) days of being incurred. Mileage, where applicable, shall be reimbursed at the rate published by the relevant tax authority for the year of travel." },
  { num: "6", title: "Independent Contractor Status", text: `Contractor provides services as an independent contractor. Principal shall not deduct or pay PAYE, UIF, SDL, NHIF or equivalent statutory employment contributions in respect of fees paid to Contractor. Contractor is solely responsible for: (i) registration with ${taxAbbr}; (ii) submission of returns; (iii) payment of income tax, VAT (if registered) and any other tax obligation. Contractor shall not represent to any third party that Contractor is an employee of Principal.` },
  { num: "7", title: "Intellectual Property", text: "All work product, deliverables and materials created by Contractor in the course of performing the services (the \"Work Product\"), including all underlying drafts, files and assets, shall vest in Principal upon creation as a commissioned work for the purposes of applicable copyright law. To the extent that any element of the Work Product does not vest automatically, Contractor irrevocably assigns to Principal all right, title and interest in and to the Work Product, in perpetuity, throughout the world, free of further consideration. Contractor retains the right to display the Work Product in Contractor's portfolio for marketing purposes only." },
  { num: "8", title: "Confidentiality", text: "Contractor undertakes to keep confidential all non-public information disclosed by Principal in the course of providing the services, including but not limited to creative work, commercial terms, contact information, schedules, financial information and the contents of this Agreement. The obligation survives termination indefinitely save for information that is or becomes public other than through Contractor's breach." },
  { num: "9", title: "Warranties", text: "Contractor warrants: (i) the right to provide the services; (ii) the Work Product shall be original and shall not infringe any third-party rights; (iii) any third-party material incorporated has been licensed in writing for the use Principal intends; (iv) Contractor shall comply with applicable laws including health and safety, labour and tax. Contractor indemnifies Principal against direct claims arising from breach of these warranties up to a cap equal to the fees paid under this Agreement, save for claims of fraud or wilful misconduct where the cap shall not apply." },
  { num: "10", title: "Insurance", text: "Where the services involve attendance at a third-party venue or shoot location, Contractor shall maintain public liability insurance to a level not less than the amount stated in Schedule A. Contractor shall provide a copy of the certificate on request." },
  { num: "11", title: "Termination", text: "Either party may terminate this Agreement on seven (7) days' written notice without cause; in which event Contractor is entitled to fees due for services performed up to the termination date. Either party may terminate immediately on written notice for material breach not remedied within ten (10) days, or for insolvency or business rescue. On termination Contractor shall return all Principal property and Confidential Information." },
  { num: "12", title: "Conduct on Site", text: "When attending Principal's premises, a third-party shoot or a venue, Contractor shall: (i) comply with all reasonable directions of the producer, venue or site manager; (ii) observe health, safety and security protocols; (iii) refrain from photographing, recording or sharing any aspect of the engagement on personal social media without Principal's prior written consent." },
  { num: "13", title: "Non-Solicitation", text: "During the Term and for twelve (12) months thereafter, Contractor shall not directly solicit or accept engagement from any of Principal's other clients, signed artists, or third parties whose details Contractor became aware of through this engagement, save with Principal's prior written consent." },
  { num: "14", title: "Notices", text: "Notices under this Agreement shall be in writing and may be sent by email to the addresses in Schedule A. Email is deemed received on the day sent if received before 17h00 local time on a working day, and on the next working day otherwise." },
  { num: "15", title: "Governing Law & Disputes", text: `This Agreement is governed by the laws of ${govLaw}. Any dispute that cannot be resolved by good-faith negotiation shall be referred to mediation and, failing resolution, to arbitration under the rules of the Arbitration Foundation of Southern Africa (where ${govLaw} is South Africa) or the Lagos Court of Arbitration (where ${govLaw} is Nigeria), or such other body as the parties agree. Each party shall, before signing, consult ${lawyerNote} licensed in the relevant jurisdiction.` },
];

const SCHEDULE = [
  { f: "Principal name + reg #", note: "Artist's loan-out company or label" },
  { f: "Contractor name + reg # / ID", note: "" },
  { f: "Services", note: "Plain-English description of the work" },
  { f: "Deliverables & milestones", note: "Specific outputs and dates" },
  { f: "Start date / End date", note: "" },
  { f: "Fees", note: "Flat fee / day rate / hour rate, currency" },
  { f: "Expense pre-approval cap", note: "Above which written approval needed" },
  { f: "Insurance level (if applicable)", note: "" },
  { f: "Notice email — Principal", note: "" },
  { f: "Notice email — Contractor", note: "" },
];

export default function IndependentContractorAgreementPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const govLaw = res.governingLaw ?? "the Republic of South Africa";
  const lawyerNote = res.lawyerNote ?? "a qualified entertainment attorney";
  const taxAbbr = res.taxAuthorityAbbr ?? "SARS";

  return (
    <ResourcePage
      parentHref="/dashboard/library/startup"
      parentLabel="Back to Onboarding"
      color={COLOR}
      tag="Onboarding · Contract"
      title="Independent Contractor Agreement"
      intro={`Universal contractor template — producers, photographers, designers, mixing engineers, drivers, security, etc. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="independent-contractor-agreement" />}
      next={{ href: "/dashboard/library/startup/ar-pipeline", label: "A&R Pipeline Board" }}
    >
      <ContractScaffold contractId="independent-contractor-agreement">
      <div className="space-y-2 mb-6">
        {CLAUSES(govLaw, lawyerNote, taxAbbr).map((c) => (
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
