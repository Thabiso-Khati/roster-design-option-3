"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { PHOTOGRAPHER } from "@/lib/visual-contracts";

const COLOR = "#A855F7";

export default function PhotographerAgreementPage() {
  const { country } = useLocale();
  const govLaw = getCountryResources(country).governingLaw ?? "the Republic of South Africa";

  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Contract"
      title="Photographer Agreement"
      intro={`Engagement of a photographer for press shoot, cover shoot, music video stills, or live photography. Full IP assignment to commissioner. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="photographer-agreement" />}
      next={{ href: "/dashboard/library/visual-production/dp-agreement", label: "DP / Cinematographer Agreement" }}
    >
      <ContractScaffold contractId="photographer-agreement">
      <div className="space-y-2 mb-6">
        {PHOTOGRAPHER(govLaw).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
