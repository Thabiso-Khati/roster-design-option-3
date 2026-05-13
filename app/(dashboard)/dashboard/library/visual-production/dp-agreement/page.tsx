"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { DP } from "@/lib/visual-contracts";

const COLOR = "#A855F7";

export default function DPAgreementPage() {
  const { country } = useLocale();
  const govLaw = getCountryResources(country).governingLaw ?? "the Republic of South Africa";

  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Contract"
      title="DP / Cinematographer Agreement"
      intro={`Engagement of a Director of Photography for music video, BTS shoot, or branded content. Full IP assignment, raw footage handover. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="dp-agreement" />}
      next={{ href: "/dashboard/library/visual-production/stylist-agreement", label: "Stylist / Wardrobe Agreement" }}
    >
      <ContractScaffold contractId="dp-agreement">
      <div className="space-y-2 mb-6">
        {DP(govLaw).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
