"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";

const COLOR = "#64748B";

const CLAUSES = (govLaw: string, lawyerNote: string) => [
  { num: "1", title: "Purpose", text: "Disclosing Party (typically the artist, label or manager) wishes to disclose certain confidential information to Receiving Party (typically a producer, engineer, designer, contractor or evaluator) for the purpose described in Schedule A — for example: writing a song / producing a track, evaluating a beat, evaluating a release plan, or providing services on a confidential project." },
  { num: "2", title: "Confidential Information", text: "\"Confidential Information\" means any information disclosed by Disclosing Party (whether oral, written, electronic, demo recording, lyric, image, schedule or commercial term) that is marked confidential or that a reasonable person would understand to be confidential, including unreleased songs, lyrics, demo files, multitracks, masters, artwork, branding, release schedules, financial figures and contractual terms." },
  { num: "3", title: "Exclusions", text: "Confidential Information does not include information that is (i) public other than through Receiving Party's breach; (ii) already known to Receiving Party without confidentiality obligation; (iii) independently developed without reference to Disclosing Party's information; or (iv) lawfully received from a third party without restriction." },
  { num: "4", title: "Obligations", text: "Receiving Party shall: (i) hold the Confidential Information in strict confidence; (ii) use it solely for the Purpose stated in Schedule A; (iii) not disclose it to any third party without Disclosing Party's prior written consent; (iv) not post, share, upload or play any unreleased material to third parties or on social media; (v) protect the Confidential Information using at least reasonable care." },
  { num: "5", title: "Specific Music-Industry Restrictions", text: "Without limiting clause 4, Receiving Party specifically agrees: (i) not to record, screenshot, photograph or copy any unreleased material outside of the technical work required for the Purpose; (ii) not to discuss the project on podcasts, interviews, livestreams or any other public channel; (iii) not to claim or hint at involvement before public announcement; (iv) not to use the Confidential Information in Receiving Party's portfolio without prior written consent." },
  { num: "6", title: "Compelled Disclosure", text: "Where Receiving Party is compelled by law to disclose, Receiving Party shall (where lawful) give Disclosing Party prompt notice and shall disclose only the minimum required." },
  { num: "7", title: "Term", text: "This Agreement commences on the Effective Date in Schedule A. Confidentiality obligations survive termination for the period stated in Schedule A — typically until twelve (12) months after public release, or three (3) years if the project does not proceed." },
  { num: "8", title: "Return / Destruction", text: "On Disclosing Party's request, Receiving Party shall promptly return or destroy all Confidential Information including copies, demos, project files, screenshots and any derived materials, and certify destruction in writing." },
  { num: "9", title: "No Licence", text: "Nothing in this Agreement grants any licence in or to the Confidential Information, including any music, lyric, master, image, brand, trademark or trade secret." },
  { num: "10", title: "Remedies", text: "Receiving Party acknowledges that breach may cause irreparable harm for which damages would be inadequate. Disclosing Party shall be entitled to seek injunctive or other equitable relief in addition to any other remedy at law." },
  { num: "11", title: "Governing Law", text: `This Agreement is governed by the laws of ${govLaw}. Each Party shall, before signing, consult ${lawyerNote}.` },
];

export default function NDAOneWayPage() {
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
      title="NDA — One-Way"
      intro={`One-way non-disclosure for when only one party (e.g. an artist) discloses to a recipient (e.g. a producer evaluating a session). Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="nda-one-way" />}
      next={{ href: "/dashboard/library/legal/data-processing-agreement", label: "Data Processing Agreement" }}
    >
      <ContractScaffold contractId="nda-one-way">
      <div className="space-y-2 mb-6">
        {CLAUSES(govLaw, lawyerNote).map((c) => <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR}/>)}
      </div>
      <Disclaimer kind="legal"/>
          </ContractScaffold>
    </ResourcePage>
  );
}
