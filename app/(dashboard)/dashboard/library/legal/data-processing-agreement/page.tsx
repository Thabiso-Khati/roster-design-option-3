"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";

const COLOR = "#64748B";

const DPA_CLAUSES = (govLaw: string, dpaName: string) => [
  { num: "1", title: "Subject Matter", text: `Controller has engaged Processor to provide the services described in Schedule A (\"Services\"). In providing the Services, Processor may process Personal Data on behalf of Controller. This Data Processing Agreement (DPA) sets out the parties' obligations under the ${dpaName} and applicable equivalent laws.` },
  { num: "2", title: "Definitions", text: "\"Personal Data\", \"Controller\", \"Processor\", \"Data Subject\", \"Processing\", \"Sub-Processor\", \"Personal Data Breach\" have the meanings given in the applicable data protection law. The categories of Personal Data and Data Subjects are set out in Schedule B." },
  { num: "3", title: "Compliance with Instructions", text: "Processor shall process Personal Data only on documented instructions from Controller. Where Processor reasonably believes an instruction infringes applicable data protection law, Processor shall notify Controller without delay and may suspend processing pending Controller's confirmation." },
  { num: "4", title: "Confidentiality", text: "Processor ensures that all personnel authorised to process Personal Data are bound by written confidentiality obligations no less restrictive than those imposed on Controller." },
  { num: "5", title: "Security", text: "Processor shall implement appropriate technical and organisational measures including: (i) encryption of Personal Data in transit and at rest; (ii) access controls (role-based, least-privilege); (iii) regular security testing; (iv) audit logs; (v) backup and recovery procedures; (vi) personnel training. The specific measures are set out in Schedule C." },
  { num: "6", title: "Sub-Processors", text: "Processor may engage Sub-Processors only with Controller's prior written consent (general or specific, as set out in Schedule D). Processor shall impose on each Sub-Processor data protection obligations no less restrictive than those in this DPA. Processor remains liable for the acts of its Sub-Processors. A current list of approved Sub-Processors is maintained at Schedule D." },
  { num: "7", title: "Data Subject Rights", text: "Processor shall, taking into account the nature of the processing, assist Controller by appropriate technical and organisational measures, insofar as possible, to fulfil Controller's obligation to respond to Data Subjects' requests (access, correction, deletion, portability, objection). Processor shall not respond directly to Data Subject requests except on Controller's documented instruction." },
  { num: "8", title: "Personal Data Breach", text: "Processor shall notify Controller without undue delay (and in any event within seventy-two (72) hours) on becoming aware of a Personal Data Breach. The notification shall include: nature of the breach; categories and approximate number of Data Subjects and records affected; likely consequences; measures taken or proposed to address it. Processor shall co-operate fully with Controller's regulatory notification obligations." },
  { num: "9", title: "Data Protection Impact Assessment", text: "Processor shall provide reasonable assistance to Controller in conducting Data Protection Impact Assessments (where required) and in consulting with the supervisory authority." },
  { num: "10", title: "Deletion / Return on Termination", text: "On termination of the Services or on Controller's earlier written request, Processor shall (at Controller's choice) delete or return all Personal Data and copies thereof to Controller, save to the extent law requires retention. Processor shall certify deletion in writing within thirty (30) days." },
  { num: "11", title: "Audit Rights", text: "Processor shall make available to Controller information necessary to demonstrate compliance with this DPA and shall allow Controller (or an auditor mandated by Controller) to conduct audits or inspections, on reasonable notice and during business hours, no more than once per calendar year. Where audit reveals material non-compliance, the cost of the audit shall be borne by Processor." },
  { num: "12", title: "International Transfers", text: "Processor shall not transfer Personal Data outside the country where Controller is established without Controller's prior written consent and without ensuring adequate safeguards (Standard Contractual Clauses, adequacy decisions, or equivalent mechanisms)." },
  { num: "13", title: "Liability", text: "Each party's liability under this DPA is governed by the limitations and exclusions set out in the underlying Services Agreement, save that liability for fraud, wilful misconduct, breach of confidentiality, or breach causing a regulatory fine to Controller shall not be capped." },
  { num: "14", title: "Governing Law", text: `This DPA is governed by the laws of ${govLaw}.` },
];

export default function DPAPage() {
  const { country } = useLocale();
  const govLaw = getCountryResources(country).governingLaw ?? "the Republic of South Africa";
  const dpaName = country === "Nigeria" ? "Nigeria Data Protection Act, 2023 (NDPA)" : "Protection of Personal Information Act, 2013 (POPIA)";

  return (
    <ResourcePage
      parentHref="/dashboard/library/legal"
      parentLabel="Back to Legal"
      color={COLOR}
      tag="Legal · Compliance"
      title="Data Processing Agreement (DPA)"
      intro={`Use this DPA whenever you engage a third party (CRM, email service, ticketing platform, design agency, distributor) that processes personal data on your behalf. Required by ${dpaName} under most contracts. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="data-processing-agreement" />}
      next={{ href: "/dashboard/library/legal/trademark-tracker", label: "Trademark Application Tracker" }}
    >
      <ContractScaffold contractId="data-processing-agreement">
      <div className="space-y-2 mb-6">
        {DPA_CLAUSES(govLaw, dpaName).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
