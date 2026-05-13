"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { MASTERING_ENGINEER } from "@/lib/recording-contracts";

const COLOR = "#10B981";

export default function MasteringEngineerAgreementPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const govLaw = res.governingLaw ?? "the Republic of South Africa";

  return (
    <ResourcePage
      parentHref="/dashboard/library/recording"
      parentLabel="Back to A&R, Recording & Production"
      color={COLOR}
      tag="Recording · Contract"
      title="Mastering Engineer Agreement"
      intro={`Loudness targets, Apple Digital Master compliance, recall window, ownership transfer. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="mastering-engineer-agreement" />}
      next={{ href: "/dashboard/library/recording/featured-artist-agreement", label: "Featured Artist Agreement" }}
    >
      <ContractScaffold contractId="mastering-engineer-agreement">
      <div className="space-y-2 mb-6">
        {MASTERING_ENGINEER(govLaw).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
