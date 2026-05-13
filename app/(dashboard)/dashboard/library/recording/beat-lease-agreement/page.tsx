"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { BEAT_LEASE } from "@/lib/recording-contracts";

const COLOR = "#10B981";

export default function BeatLeaseAgreementPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const govLaw = res.governingLaw ?? "the Republic of South Africa";

  return (
    <ResourcePage
      parentHref="/dashboard/library/recording"
      parentLabel="Back to A&R, Recording & Production"
      color={COLOR}
      tag="Recording · Contract"
      title="Beat Lease Agreement"
      intro={`Three-tier beat licensing — Non-Exclusive Lease, Premium Lease, Exclusive Buyout. Critical for Afrobeats and Amapiano producers. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="beat-lease-agreement" />}
      next={{ href: "/dashboard/library/recording/sample-clearance", label: "Sample Clearance Form" }}
    >
      <ContractScaffold contractId="beat-lease-agreement">
      <div className="space-y-2 mb-6">
        {BEAT_LEASE(govLaw).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
