"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { STAFF_WRITER } from "@/lib/publishing-contracts";

const COLOR = "#06B6D4";

export default function StaffWriterAgreementPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const govLaw = res.governingLaw ?? "the Republic of South Africa";
  const lawyerNote = res.lawyerNote ?? "a qualified entertainment attorney";

  return (
    <ResourcePage
      parentHref="/dashboard/library/publishing"
      parentLabel="Back to Publishing"
      color={COLOR}
      tag="Publishing · Contract"
      title="Staff Writer / Songwriter Agreement"
      intro={`Exclusive songwriter deal — minimum delivery commitment, weekly draw, ownership of publisher share. Common at Sony / Universal / WMG-backed publishing houses. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="staff-writer-agreement" />}
      next={{ href: "/dashboard/library/publishing/single-song-assignment", label: "Single Song Assignment" }}
    >
      <ContractScaffold contractId="staff-writer-agreement">
      <div className="space-y-2 mb-6">
        {STAFF_WRITER(govLaw, lawyerNote).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
