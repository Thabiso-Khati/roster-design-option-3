"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { FEATURED_ARTIST } from "@/lib/recording-contracts";

const COLOR = "#10B981";

export default function FeaturedArtistAgreementPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const govLaw = res.governingLaw ?? "the Republic of South Africa";
  const lawyerNote = res.lawyerNote ?? "a qualified entertainment attorney";

  return (
    <ResourcePage
      parentHref="/dashboard/library/recording"
      parentLabel="Back to A&R, Recording & Production"
      color={COLOR}
      tag="Recording · Contract"
      title="Featured Artist Agreement"
      intro={`Guest performance terms — flat fee or master points, side-artist letter of direction (if signed elsewhere), credit, splits, music video. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="featured-artist-agreement" />}
      next={{ href: "/dashboard/library/recording/beat-lease-agreement", label: "Beat Lease Agreement" }}
    >
      <ContractScaffold contractId="featured-artist-agreement">
      <div className="space-y-2 mb-6">
        {FEATURED_ARTIST(govLaw, lawyerNote).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
