"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { STYLIST } from "@/lib/visual-contracts";

const COLOR = "#A855F7";

export default function StylistAgreementPage() {
  const { country } = useLocale();
  const govLaw = getCountryResources(country).governingLaw ?? "the Republic of South Africa";

  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Contract"
      title="Stylist / Wardrobe Agreement"
      intro={`Engagement of a stylist for editorial, press, music video or live wardrobe. Covers garment sourcing, returns, alterations, look-book delivery. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="stylist-agreement" />}
      next={{ href: "/dashboard/library/visual-production/image-likeness-release", label: "Image & Likeness Release" }}
    >
      <ContractScaffold contractId="stylist-agreement">
      <div className="space-y-2 mb-6">
        {STYLIST(govLaw).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
