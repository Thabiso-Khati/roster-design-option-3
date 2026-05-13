"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { SINGLE_SONG_ASSIGNMENT } from "@/lib/publishing-contracts";

const COLOR = "#06B6D4";

export default function SingleSongAssignmentPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const govLaw = res.governingLaw ?? "the Republic of South Africa";
  const lawyerNote = res.lawyerNote ?? "a qualified entertainment attorney";

  return (
    <ResourcePage
      parentHref="/dashboard/library/publishing"
      parentLabel="Back to Publishing"
      color={COLOR}
      tag="Publishing · Contract"
      title="Single Song Assignment"
      intro={`Single-track publishing transfer. Songwriter assigns 100% of publisher share to Publisher; retains writer share. Governing law for ${country}: ${govLaw}.`}
      next={{ href: "/dashboard/library/publishing/cue-sheet", label: "Cue Sheet Template" }}
    >
      <div className="space-y-2 mb-6">
        {SINGLE_SONG_ASSIGNMENT(govLaw, lawyerNote).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
    </ResourcePage>
  );
}
