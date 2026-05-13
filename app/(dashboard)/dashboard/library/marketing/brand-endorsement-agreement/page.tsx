"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { BRAND_ENDORSEMENT } from "@/lib/brand-contracts";

const COLOR = "#8B5CF6";

export default function BrandEndorsementAgreementPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const govLaw = res.governingLaw ?? "the Republic of South Africa";
  const lawyerNote = res.lawyerNote ?? "a qualified entertainment attorney";

  return (
    <ResourcePage
      parentHref="/dashboard/library/marketing"
      parentLabel="Back to Marketing"
      color={COLOR}
      tag="Marketing · Contract"
      title="Brand Endorsement Agreement"
      intro={`Artist endorses a brand's product / service for fees + (optional) royalty on co-branded SKUs. Covers exclusivity, morality clause, performance, reporting. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="brand-endorsement-agreement" />}
      next={{ href: "/dashboard/library/marketing/ambassador-agreement", label: "Brand Ambassador Agreement" }}
    >
      <ContractScaffold contractId="brand-endorsement-agreement">
      <div className="space-y-2 mb-6">
        {BRAND_ENDORSEMENT(govLaw, lawyerNote).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
