"use client";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";

const COLOR = "#A855F7";

const CLAUSES = [
  { num: "1", title: "Permission", text: "Owner grants Producer permission to use the Location described below for filming, photography, audio recording, and related production activity in connection with the Production identified herein, on the date(s) specified, including reasonable rigging, take-down, and turnaround periods." },
  { num: "2", title: "Location Fee", text: "Producer shall pay Owner the Location Fee specified in Schedule A. Fee covers exclusive access during the agreed shoot window. Out-of-hours, holiday, or extended-day surcharges shall apply only as specified in Schedule A. Producer shall pay any utility charges (electricity, water) incurred above ordinary daily use." },
  { num: "3", title: "Insurance", text: "Producer shall maintain public liability insurance of not less than the amount specified in Schedule A and shall name Owner as an additional insured for the duration of the shoot. A copy of the insurance certificate shall be provided to Owner not less than 48 hours prior to the first shoot day." },
  { num: "4", title: "Condition & Reinstatement", text: "Owner and Producer shall conduct a written condition-and-fittings inspection at the start and end of each shoot day. Producer shall return the Location to its original condition save for fair wear and tear. Where damage occurs, Producer shall be responsible for repair or replacement at like-for-like cost." },
  { num: "5", title: "Use of Footage & Likeness of Property", text: "Owner grants Producer the perpetual worldwide right to use the Location's appearance (interior and exterior) in the Production and all promotional and marketing material associated with the recording artist and the Production. Owner waives any right to inspect or approve the final cut. Where Owner's property includes recognisable identifiers (signage, logos), Producer shall use reasonable efforts to obscure or replace at Owner's request." },
  { num: "6", title: "Indemnity", text: "Producer indemnifies Owner against any claim arising from the conduct of the production crew on the Location, save where arising from gross negligence or wilful misconduct of Owner. Owner indemnifies Producer against claims arising from undisclosed defects, hazards, or liens against the Location." },
  { num: "7", title: "Cancellation", text: "Where Producer cancels at least 7 days prior to first shoot day, no fee is payable. Within 7 days, 50% of the Location Fee shall be payable. Within 48 hours of first shoot day, the full Location Fee shall be payable. Force majeure provisions apply." },
  { num: "8", title: "Governing Law", text: "This Agreement is governed by the laws of the country where the Location is situated. Disputes shall be resolved by mediation, and failing that, arbitration." },
];

const FIELDS = [
  { f: "Owner / authorised representative", note: "Person with authority to grant access" },
  { f: "Location address", note: "Full street address" },
  { f: "Production title", note: "" },
  { f: "Shoot date(s) + hours", note: "Including rig / turnaround" },
  { f: "Location Fee (currency + amount)", note: "" },
  { f: "Public liability insurance amount", note: "" },
  { f: "Owner signature + date", note: "" },
  { f: "Producer signature + date", note: "" },
];

export default function LocationReleasePage() {
  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Release"
      title="Location Release"
      intro="Property owner permission for filming on a private location. Always written. Always before crew arrives."
      next={{ href: "/dashboard/library/visual-production/vendor-database", label: "Vendor Database" }}
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
