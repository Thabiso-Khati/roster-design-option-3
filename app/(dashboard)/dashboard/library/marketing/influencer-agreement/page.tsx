"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { INFLUENCER } from "@/lib/brand-contracts";

const COLOR = "#8B5CF6";

export default function InfluencerAgreementPage() {
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
      title="Influencer / Creator Agreement"
      intro={`Used when an artist (or artist's manager) is paying an influencer / creator to post sponsored content. Covers approval, disclosure, usage rights, exclusivity, boost / allowlist. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="influencer-agreement" />}
      next={{ href: "/dashboard/library/marketing/brand-endorsement-agreement", label: "Brand Endorsement Agreement" }}
    >
      <ContractScaffold contractId="influencer-agreement">
      <div className="space-y-2 mb-6">
        {INFLUENCER(govLaw, lawyerNote).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
