"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { STUDIO_BOOKING } from "@/lib/recording-contracts";

const COLOR = "#10B981";

export default function StudioBookingAgreementPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const govLaw = res.governingLaw ?? "the Republic of South Africa";

  return (
    <ResourcePage
      parentHref="/dashboard/library/recording"
      parentLabel="Back to A&R, Recording & Production"
      color={COLOR}
      tag="Recording · Contract"
      title="Studio Booking Agreement"
      intro={`Studio lockout, deposit, multitrack ownership, conduct, force-majeure refunds. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="studio-booking-agreement" />}
      next={{ href: "/dashboard/library/recording/producer-agreement", label: "Producer Agreement" }}
    >
      <ContractScaffold contractId="studio-booking-agreement">
      <div className="space-y-2 mb-6">
        {STUDIO_BOOKING(govLaw).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
