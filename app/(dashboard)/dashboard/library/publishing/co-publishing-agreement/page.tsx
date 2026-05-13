"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { CO_PUBLISHING } from "@/lib/publishing-contracts";

const COLOR = "#06B6D4";

export default function CoPublishingAgreementPage() {
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
      title="Co-Publishing Agreement"
      intro={`50/50 publishing share with advance, recoupment, audit. Songwriter retains the writer share. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="co-publishing-agreement" />}
      next={{ href: "/dashboard/library/publishing/staff-writer-agreement", label: "Staff Writer Agreement" }}
    >
      <ContractScaffold contractId="co-publishing-agreement">
      <div className="space-y-2 mb-6">
        {CO_PUBLISHING(govLaw, lawyerNote).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
