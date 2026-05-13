"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";

const COLOR = "#A855F7";

const CLAUSES = (govLaw: string, lawyerNote: string) => [
  { num: "1", title: "Engagement", text: "Commissioner engages Director to direct, plan and supervise the production of one music video (the \"Video\") for the song specified in Schedule A. Director shall act as the creative lead, working with the production house and crew to deliver the Video in accordance with the approved Treatment and Production Brief." },
  { num: "2", title: "Deliverables & Timeline", text: "Director shall deliver: (i) a written Treatment within seven (7) days of signature; (ii) attendance and direction across pre-production, principal photography and post-production; (iii) a final master in the format specified (typically ProRes 4444 + H.264 deliverable); (iv) all raw footage, project files and stems, transferred to Commissioner. Final delivery shall be no later than the date in Schedule A." },
  { num: "3", title: "Director Fee", text: "Commissioner shall pay Director the Director Fee specified in Schedule A. Payment is structured as: 50% on full execution; 25% on commencement of principal photography; 25% on delivery of final master and all raw assets. Fee is inclusive of all pre-production, shoot-day and post-supervision services." },
  { num: "4", title: "Budget Authority", text: "Director shall manage the production within the agreed Production Budget set out in Schedule A. Any anticipated overrun shall be escalated to Commissioner in writing in advance. Without prior written approval, Director shall not commit Commissioner to any cost beyond the approved Production Budget." },
  { num: "5", title: "Ownership of Video & Assets", text: "All right, title and interest in and to the Video and all underlying assets (raw footage, project files, sound, edits, treatments, behind-the-scenes content, stills) shall vest exclusively in Commissioner upon creation, as a commissioned work for the purposes of applicable copyright law. To the extent any assignment is required to give effect to this clause, Director hereby irrevocably assigns to Commissioner all such rights, in perpetuity, throughout the world, free of any further consideration." },
  { num: "6", title: "Director Credit", text: "Commissioner shall accord Director credit substantially as: \"Directed by [Director Name].\" Credit shall appear on the Video's end card and on metadata fields where directors are credited (YouTube description, Vevo). Inadvertent credit error shall not be a material breach but shall be corrected on notice for prospective uploads." },
  { num: "7", title: "Warranties", text: "Director warrants: (i) the Treatment and the Video shall be original work, save for any third-party material that has been licensed in writing; (ii) all crew engagements, location agreements and talent releases shall be obtained in writing prior to shoot; (iii) Director carries professional indemnity insurance to a level commensurate with the production scale; (iv) Director shall comply with health, safety and labour requirements applicable to the shoot location." },
  { num: "8", title: "Indemnity", text: "Director shall indemnify Commissioner against any third-party claim arising from breach of the warranties above, up to a cap equal to the Director Fee. Where indemnity arises from a clearance Director undertook (location, talent, prop), the cap shall not apply." },
  { num: "9", title: "Force Majeure", text: "Neither party shall be in breach where performance is delayed or prevented by an event of force majeure (including without limitation acts of God, weather, civil unrest, strike, government order, pandemic, or public-health intervention). Affected party shall notify the other within seventy-two (72) hours of becoming aware. Where the event continues beyond fourteen (14) days, either party may terminate with no penalty save payment of fees due in respect of work performed up to the date of force majeure." },
  { num: "10", title: "Termination", text: "Either party may terminate on written notice for material breach not cured within ten (10) days. On termination by Commissioner without cause, Director shall be entitled to fees due in respect of services performed up to the date of termination plus 25% of the unbilled portion of the Director Fee. On termination for cause by Commissioner, no further fee shall be payable." },
  { num: "11", title: "Governing Law & Disputes", text: `This Agreement is governed by the laws of ${govLaw}. Any dispute that cannot be resolved by good-faith negotiation shall be referred to mediation and, failing resolution, to arbitration under the rules of the Arbitration Foundation of Southern Africa (where ${govLaw} is South Africa) or the Lagos Court of Arbitration (where ${govLaw} is Nigeria), or such other body as the parties agree. Each party shall, before signing, consult ${lawyerNote} licensed in the relevant jurisdiction.` },
];

export default function DirectorAgreementPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const govLaw = res.governingLaw ?? "the Republic of South Africa";
  const lawyerNote = res.lawyerNote ?? "a qualified entertainment attorney";

  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Contract"
      title="Director Agreement (Music Video)"
      intro={`Engagement of a music video director with full IP assignment to commissioner. Governing law for ${country}: ${govLaw}.`}
    
      toolbar={<ContractSendButton contractId="director-agreement" />}
      next={{ href: "/dashboard/library/visual-production/photographer-agreement", label: "Photographer Agreement" }}
    >
      <ContractScaffold contractId="director-agreement">
      <div className="space-y-2 mb-6">
        {CLAUSES(govLaw, lawyerNote).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
