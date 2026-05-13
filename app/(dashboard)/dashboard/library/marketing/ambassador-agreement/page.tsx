"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { AMBASSADOR } from "@/lib/brand-contracts";

const COLOR = "#8B5CF6";

export default function AmbassadorAgreementPage() {
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
      title="Brand Ambassador Agreement"
      intro={`Long-term endorsement (typically 1–3 years) with co-branded releases, performance bonuses, ROFR. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="ambassador-agreement" />}
      next={{ href: "/dashboard/library/marketing/tour-sponsorship-deck", label: "Tour Sponsorship Deck" }}
    >
      <ContractScaffold contractId="ambassador-agreement">
      <div className="space-y-2 mb-6">
        {AMBASSADOR(govLaw, lawyerNote).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
