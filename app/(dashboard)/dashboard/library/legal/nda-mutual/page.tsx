"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";

const COLOR = "#64748B";

const CLAUSES = (govLaw: string, lawyerNote: string) => [
  { num: "1", title: "Purpose", text: "Each Party (acting both as Disclosing Party and Receiving Party) wishes to disclose certain confidential information to the other for the purpose described in Schedule A (the \"Purpose\") — for example: evaluating a recording deal, exploring a feature or co-write, considering a tour partnership, evaluating an investment or acquisition." },
  { num: "2", title: "Confidential Information", text: "\"Confidential Information\" means any information disclosed by one Party to the other (whether oral, written, electronic or visual) that is marked as confidential or that a reasonable person would understand to be confidential, including but not limited to: business plans, financial information, recordings, song demos, lyrics, master files, marketing strategies, contractual terms, customer / fan data, technical specifications, source code, and the existence and terms of this Agreement." },
  { num: "3", title: "Exclusions", text: "Confidential Information does not include information that: (i) is or becomes public other than through the Receiving Party's breach; (ii) was already known to the Receiving Party without obligation of confidence; (iii) is independently developed by the Receiving Party without reference to the Disclosing Party's information; or (iv) is rightfully received from a third party without restriction." },
  { num: "4", title: "Obligations", text: "The Receiving Party shall: (i) hold the Confidential Information in strict confidence; (ii) use it solely for the Purpose; (iii) not disclose it to any third party without the Disclosing Party's prior written consent, save to its own employees, contractors or advisors who need to know and who are bound by equivalent confidentiality terms; (iv) protect it using at least the same degree of care it uses for its own confidential information, but in no event less than reasonable care." },
  { num: "5", title: "Compelled Disclosure", text: "Where the Receiving Party is required by law, regulation, court order or government authority to disclose Confidential Information, it shall, where lawful, give the Disclosing Party prompt notice so that the Disclosing Party may seek a protective order or other remedy. The Receiving Party shall disclose only the minimum required and shall reasonably co-operate with the Disclosing Party's efforts to limit disclosure." },
  { num: "6", title: "Term", text: "This Agreement commences on the Effective Date in Schedule A and continues for the period set out in Schedule A. The confidentiality obligations survive termination for the period stated in Schedule A (typically three to five years; perpetual for trade secrets)." },
  { num: "7", title: "Return / Destruction", text: "On the Disclosing Party's written request or on termination, the Receiving Party shall promptly return or destroy all Confidential Information in its possession (including copies, summaries, and extracts) and certify destruction in writing. The Receiving Party may retain one copy in its legal archives for compliance purposes only, subject to ongoing confidentiality." },
  { num: "8", title: "No Licence", text: "No licence or right is granted under any patent, copyright, trademark, trade secret or other intellectual property right by virtue of this Agreement. All Confidential Information remains the property of the Disclosing Party." },
  { num: "9", title: "No Obligation to Proceed", text: "Nothing in this Agreement obligates either Party to enter into any further agreement, transaction, partnership or business relationship. Disclosure under this Agreement is for the Purpose only." },
  { num: "10", title: "Remedies", text: "The Parties acknowledge that breach of this Agreement may cause irreparable harm for which damages would be inadequate, and that the Disclosing Party shall be entitled to seek injunctive or other equitable relief in addition to any other remedy available at law." },
  { num: "11", title: "Governing Law & Disputes", text: `This Agreement is governed by the laws of ${govLaw}. Disputes shall be referred first to good-faith negotiation, then to mediation, and failing resolution to arbitration in the country of governance. Each Party shall, before signing, consult ${lawyerNote}.` },
];

export default function NDAMutualPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const govLaw = res.governingLaw ?? "the Republic of South Africa";
  const lawyerNote = res.lawyerNote ?? "a qualified entertainment attorney";

  return (
    <ResourcePage
      parentHref="/dashboard/library/legal"
      parentLabel="Back to Legal"
      color={COLOR}
      tag="Legal · NDA"
      title="NDA — Mutual"
      intro={`Mutual non-disclosure between two parties exchanging confidential information. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="nda-mutual" />}
      next={{ href: "/dashboard/library/legal/nda-one-way", label: "NDA (One-Way)" }}
    >
      <ContractScaffold contractId="nda-mutual">
      <div className="space-y-2 mb-6">
        {CLAUSES(govLaw, lawyerNote).map((c) => <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR}/>)}
      </div>
      <Disclaimer kind="legal"/>
          </ContractScaffold>
    </ResourcePage>
  );
}
