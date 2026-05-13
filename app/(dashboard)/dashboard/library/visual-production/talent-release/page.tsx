"use client";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";

const COLOR = "#A855F7";

const CLAUSES = [
  { num: "1", title: "Engagement", text: "Talent is engaged on a per-day basis to appear in the Production identified below as a non-principal performer, extra or featured background. Engagement is for the shoot day(s) specified, with the right of Producer to call back for re-shoots within thirty (30) days at no additional fee." },
  { num: "2", title: "Day Rate", text: "Producer shall pay Talent the day rate specified in the call sheet. Payment is by EFT within 14 days of shoot, or as otherwise agreed in writing. Where the engagement involves more than 12 working hours on a single shoot day, an overtime rate of 1.5× per hour shall apply for hours beyond the 12th." },
  { num: "3", title: "Grant of Rights", text: "Talent grants Producer (and its licensees) the perpetual worldwide right to use Talent's image, likeness, performance and voice as captured during the Production, in connection with the Production and any associated promotional and marketing material. The grant covers all media now known or hereafter devised. No further fee shall be payable for any such use." },
  { num: "4", title: "No Right of Approval", text: "Talent waives the right to inspect or approve the use of the material. Editorial control rests with Producer and Commissioner. Where Talent is identifiable, Producer shall use reasonable efforts to seek consent prior to use in a context Talent could reasonably find objectionable." },
  { num: "5", title: "Conduct on Set", text: "Talent shall arrive on time, comply with crew direction, observe health and safety protocols, refrain from photography or recording on set without permission, and shall not publicly disclose proprietary aspects of the Production prior to Producer's official release." },
  { num: "6", title: "Indemnity & Release", text: "Talent releases Producer, Commissioner and the recording artist from any claim arising from use of the material, save where arising from gross negligence or wilful misconduct. Talent indemnifies Producer against any claim arising from breach of this Agreement, save the indemnity is capped at the day rate paid." },
  { num: "7", title: "Minors", text: "Where Talent is under 18, this Agreement is signed by a parent or legal guardian on behalf of the minor. Producer shall comply with applicable laws governing the engagement of minors on production sets, including hours, supervision and education requirements." },
];

const FIELDS = [
  { f: "Talent full name", note: "" },
  { f: "ID / passport number", note: "" },
  { f: "Date of birth", note: "" },
  { f: "Day rate (currency + amount)", note: "" },
  { f: "Production title + shoot date(s)", note: "" },
  { f: "Recording artist", note: "" },
  { f: "Talent signature + date", note: "Or parent / guardian if minor" },
];

export default function TalentReleasePage() {
  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Release"
      title="Talent / Extras Release"
      intro="Standard release for non-principal cast and extras. Sign before they step on set."
      next={{ href: "/dashboard/library/visual-production/location-release", label: "Location Release" }}
    >
      <div className="space-y-2 mb-6">
        {CLAUSES.map((c) => <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />)}
      </div>
      <div className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Signature block</p>
        <div className="space-y-2">
          {FIELDS.map((f) => (
            <div key={f.f} className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-b-0">
              <p className="text-sm font-semibold text-text-primary">{f.f}</p>
              <input className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand w-48 sm:w-64 flex-shrink-0" placeholder="—" />
            </div>
          ))}
        </div>
      </div>
      <Disclaimer kind="legal" />
    </ResourcePage>
  );
}
