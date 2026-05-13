"use client";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";

const COLOR = "#A855F7";

const CLAUSES = [
  { num: "1", title: "Grant of Rights", text: "Releasor irrevocably grants Producer (and its licensees, distributors, broadcasters, and successors) the worldwide, perpetual right to use Releasor's name, voice, image, likeness, biographical information and performance, captured in connection with the Production identified below, in any and all media now known or hereafter devised, for any commercial, promotional, editorial or archival purpose related to the Production and the recording artist." },
  { num: "2", title: "Consideration", text: "Releasor acknowledges receipt of full and final consideration as set out in the engagement letter or call sheet. No further compensation is payable for the rights granted herein, save for any agreed performance fee or per-day rate." },
  { num: "3", title: "Releasor's Obligations", text: "Releasor warrants that they are over 18, or where under 18, that a parent or legal guardian has co-signed this release. Releasor shall not act in a manner inconsistent with the rights granted, including but not limited to publishing competing or conflicting material from the same shoot day without Producer's written consent." },
  { num: "4", title: "Waiver of Inspection", text: "Releasor waives the right to inspect or approve the finished use of the material before publication. Releasor acknowledges that creative editorial decisions rest with Producer and the Commissioner." },
  { num: "5", title: "Release of Liability", text: "Releasor releases Producer, Commissioner and their respective officers, employees, agents and assigns from any claim arising from the use of the material, including claims for defamation, invasion of privacy, right of publicity, or emotional distress, save where caused by gross negligence or wilful misconduct." },
  { num: "6", title: "No Reversion", text: "The rights granted are unconditional and shall not revert to Releasor on termination, expiry, or any other event. This release is binding on Releasor's heirs, successors and assigns." },
  { num: "7", title: "Governing Law", text: "This release is governed by the laws of the country where the Production was filmed. Any dispute shall be resolved by the courts of that jurisdiction. Each party signs after having had the opportunity to obtain independent legal advice." },
];

const FIELDS = [
  { f: "Releasor full name", note: "Person being recorded" },
  { f: "ID / passport number", note: "" },
  { f: "Date of birth", note: "Confirms age of majority" },
  { f: "Production title", note: "Music video / film / shoot reference" },
  { f: "Recording artist", note: "" },
  { f: "Shoot date(s)", note: "" },
  { f: "Shoot location", note: "" },
  { f: "Producer / Production co", note: "" },
  { f: "Releasor signature + date", note: "" },
  { f: "Witness signature + date", note: "Or guardian signature if minor" },
];

export default function ImageLikenessReleasePage() {
  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Release"
      title="Image & Likeness Release"
      intro="Standard worldwide-perpetual release for principal talent appearing in a music video, photograph, or branded shoot. Sign before any frame is captured."
      next={{ href: "/dashboard/library/visual-production/talent-release", label: "Talent / Extras Release" }}
    >
      <div className="space-y-2 mb-6">
        {CLAUSES.map((c) => <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />)}
      </div>
      <div className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Signature block</p>
        <div className="space-y-2">
          {FIELDS.map((f) => (
            <div key={f.f} className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-b-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">{f.f}</p>
                {f.note && <p className="text-[11px] text-text-muted">{f.note}</p>}
              </div>
              <input className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand w-48 sm:w-64 flex-shrink-0" placeholder="—" />
            </div>
          ))}
        </div>
      </div>
      <Disclaimer kind="legal" />
    </ResourcePage>
  );
}
