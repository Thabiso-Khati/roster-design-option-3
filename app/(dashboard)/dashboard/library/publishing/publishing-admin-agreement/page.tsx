"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { PUBLISHING_ADMIN } from "@/lib/publishing-contracts";

const COLOR = "#06B6D4";

export default function PublishingAdminAgreementPage() {
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
      title="Publishing Administration Agreement"
      intro={`The 'admin deal' — most common publishing arrangement in Africa. Songwriter retains ownership; Administrator runs registration, collection, accounting. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="publishing-admin-agreement" />}
      next={{ href: "/dashboard/library/publishing/co-publishing-agreement", label: "Co-Publishing Agreement" }}
    >
      <ContractScaffold contractId="publishing-admin-agreement">
      <div className="space-y-2 mb-6">
        {PUBLISHING_ADMIN(govLaw, lawyerNote).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
