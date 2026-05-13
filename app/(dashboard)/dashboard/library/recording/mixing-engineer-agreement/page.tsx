"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { MIXING_ENGINEER } from "@/lib/recording-contracts";

const COLOR = "#10B981";

export default function MixingEngineerAgreementPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const govLaw = res.governingLaw ?? "the Republic of South Africa";

  return (
    <ResourcePage
      parentHref="/dashboard/library/recording"
      parentLabel="Back to A&R, Recording & Production"
      color={COLOR}
      tag="Recording · Contract"
      title="Mixing Engineer Agreement"
      intro={`Per-mix fee, revisions, deliverables (stems, instrumental, acapella, TV mix), ownership transfer, credit. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="mixing-engineer-agreement" />}
      next={{ href: "/dashboard/library/recording/mastering-engineer-agreement", label: "Mastering Engineer Agreement" }}
    >
      <ContractScaffold contractId="mixing-engineer-agreement">
      <div className="space-y-2 mb-6">
        {MIXING_ENGINEER(govLaw).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
