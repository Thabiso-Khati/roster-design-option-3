"use client";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";

const COLOR = "#22D3EE";

const CLAUSES = (govLaw: string, lawyerNote: string) => [
  {
    num: "1",
    title: "Grant of Rights",
    text:
      "Subject to payment of the License Fee, Licensor grants Licensee a non-exclusive (or exclusive, where stated) license to synchronize the Composition and/or Master Recording (\"Licensed Material\") in timed relation with the Production specified in Schedule A. The license includes the right to manufacture, reproduce, distribute, broadcast, transmit, exhibit and exploit the Production embodying the Licensed Material in the Media, Territory and Term set out in Schedule A.",
  },
  {
    num: "2",
    title: "Reservation of Rights",
    text:
      "All rights not expressly granted are reserved by Licensor. No right is granted to alter the Licensed Material (other than to edit length, fade, or sequence as required to fit the Production) without Licensor's prior written consent. Licensee acknowledges that Licensor (or its publisher / label) retains ownership of the underlying copyrights at all times.",
  },
  {
    num: "3",
    title: "License Fee",
    text:
      "Licensee shall pay Licensor the License Fee specified in Schedule A. Payment is due within thirty (30) days of full execution of this Agreement and prior to first broadcast / first public exploitation. The License Fee is the entire consideration payable for the rights granted, save for any back-end performance income payable through the relevant performing rights organisation.",
  },
  {
    num: "4",
    title: "Performing Rights",
    text:
      "Public performance income arising from the Production embodying the Licensed Material shall be collected by, and paid through, the relevant performing rights organisations (PROs) and shall be retained by Licensor's writers, performers and publishers. Licensee shall include the Licensed Material on the cue sheet for the Production and shall lodge the cue sheet with the relevant PRO within thirty (30) days of first broadcast.",
  },
  {
    num: "5",
    title: "Most-Favoured-Nation (MFN)",
    text:
      "Where indicated in Schedule A, Licensor shall receive treatment no less favourable than any other licensor of music for the Production with respect to fee, term, territory, media, credit, exclusivity and any other commercial term. If a more favourable term is granted to any other licensor, that term shall automatically apply to this Agreement and Licensee shall promptly issue an addendum reflecting the adjustment.",
  },
  {
    num: "6",
    title: "Credit",
    text:
      "Licensee shall accord Licensor credit in a form substantially as follows: \"[Song Title] performed by [Artist], written by [Writer(s)], courtesy of [Label / Publisher].\" Credit shall appear in the end titles of the Production and on any associated electronic press kit or website where music credits appear. Casual or inadvertent omission shall not constitute a material breach but shall be corrected on notice in subsequent prints / uploads where reasonably practicable.",
  },
  {
    num: "7",
    title: "Warranties",
    text:
      "Licensor warrants that: (i) it has the right to grant the rights granted herein; (ii) the Licensed Material does not infringe any third-party copyright, trademark, right of publicity or other right (subject to clearance of any sample or interpolation as separately disclosed); (iii) the splits set out in Schedule A reflect the agreed ownership shares of writers, performers and master owners. Licensor indemnifies Licensee against direct claims arising from breach of these warranties up to a cap equal to the License Fee.",
  },
  {
    num: "8",
    title: "Cue Sheet & Reporting",
    text:
      "Licensee shall provide Licensor with a copy of the broadcast / exhibition cue sheet within thirty (30) days of first broadcast or release of the Production. Where the Production is broadcast or exploited beyond the initial Media or Term in Schedule A, Licensee shall notify Licensor in advance and the parties shall negotiate in good faith for an extension at a fee no less than the original License Fee on a pro-rata basis.",
  },
  {
    num: "9",
    title: "Cutdowns, Trailers & Promotional Use",
    text:
      "Licensee may use the Licensed Material in trailers, teasers, promotional clips, behind-the-scenes content, social media posts and electronic press kits in support of the Production within the Term and Territory at no additional fee, provided such use is no longer than ninety (90) seconds and does not constitute a stand-alone musical work. Use of the Licensed Material as a stand-alone marketing piece (for example, a TikTok-only edit) requires Licensor's prior written consent.",
  },
  {
    num: "10",
    title: "Exclusivity",
    text:
      "Where Schedule A specifies exclusivity, Licensor shall not license the Licensed Material to any other production within the same Media and Territory for the Term. Otherwise the license is non-exclusive and Licensor retains the right to license the Licensed Material to any third party. Holds (option periods prior to license commencement) shall be in writing, time-bound, and shall not exceed thirty (30) days unless the parties otherwise agree.",
  },
  {
    num: "11",
    title: "Default & Termination",
    text:
      "Either party may terminate on thirty (30) days' written notice for material breach not cured within that period. Failure to pay the License Fee when due is deemed a material breach. On termination, Licensee shall cease all further exploitation of the Production embodying the Licensed Material; provided that bona-fide already-distributed copies and broadcasts shall be unaffected.",
  },
  {
    num: "12",
    title: "Governing Law & Disputes",
    text: `This Agreement is governed by the laws of ${govLaw}. Any dispute that cannot be resolved by good-faith negotiation between the parties shall be referred to mediation and, failing resolution, to arbitration under the rules of the Arbitration Foundation of Southern Africa (where ${govLaw} is South Africa) or the Lagos Court of Arbitration (where ${govLaw} is Nigeria), or such other body as the parties agree. Each party shall, before signing, consult ${lawyerNote} licensed in the relevant jurisdiction.`,
  },
  {
    num: "13",
    title: "Entire Agreement",
    text:
      "This Agreement, together with Schedule A, constitutes the entire agreement between the parties in relation to the licensing of the Licensed Material for the Production. No amendment is binding unless reduced to writing and signed by both parties.",
  },
];

const SCHEDULE = [
  { f: "Composition Title", note: "Plus all alternate titles" },
  { f: "Master Recording (Title / Performer / Length / ISRC)", note: "Identifies the specific master being licensed" },
  { f: "Production (Title / Format / Episode #)", note: "TV / film / ad / game / trailer" },
  { f: "Use Type (Background / Featured / Visual Vocal / End Title)", note: "Affects fee" },
  { f: "Duration of Use (seconds + cue sheet stamps)", note: "Most quotes scale by duration tier" },
  { f: "Term", note: "Years / In perpetuity" },
  { f: "Territory", note: "World / SA + NG / specific markets" },
  { f: "Media", note: "All Media / Linear TV / Streaming SVOD / AVOD / Theatrical / DVD / In-flight / Game / Web" },
  { f: "Exclusivity", note: "Non-exclusive / Exclusive within Media / Industry-exclusive" },
  { f: "MFN Status", note: "Yes / No / MFN with named other tracks" },
  { f: "License Fee — Master", note: "Currency, amount, due-date" },
  { f: "License Fee — Composition", note: "Currency, amount, due-date" },
  { f: "Splits", note: "Master and writer shares with PRO affiliations" },
  { f: "Hold Period", note: "Days from agreement to license commencement" },
];

export default function SyncLicenseAgreementPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const govLaw = res.governingLaw ?? "the Republic of South Africa";
  const lawyerNote = res.lawyerNote ?? "a qualified entertainment attorney";

  return (
    <ResourcePage
      parentHref="/dashboard/library/sync"
      parentLabel="Back to Sync"
      color={COLOR}
      tag="Sync · Contract"
      title="Sync License Agreement"
      intro={`Master + composition synchronization license. Governing law for ${country}: ${govLaw}. Always have ${lawyerNote} review before signing.`}
    
      toolbar={<ContractSendButton contractId="sync-license-agreement" />}
      next={{ href: "/dashboard/library/sync/sync-quote-letter", label: "Sync Quote Letter" }}
    >
      <ContractScaffold contractId="sync-license-agreement">
      <div className="space-y-2 mb-6">
        {CLAUSES(govLaw, lawyerNote).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>
          Schedule A — Deal Terms
        </p>
        <p className="text-xs text-text-muted mb-4">
          Fill these in for every license. Always written, always signed.
        </p>
        <div className="space-y-2">
          {SCHEDULE.map((s) => (
            <div key={s.f} className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-b-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">{s.f}</p>
                <p className="text-[11px] text-text-muted leading-relaxed">{s.note}</p>
              </div>
              <input
                className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand w-48 sm:w-64 flex-shrink-0"
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </div>

      <Disclaimer kind="legal" />
          </ContractScaffold>
    </ResourcePage>
  );
}
