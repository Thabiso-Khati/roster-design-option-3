"use client";
import { useMemo, useState } from "react";
import { Calendar, FileText, Printer, ChevronRight } from "lucide-react";
import { ResourcePage, inputClass, labelClass, ClauseAccordion, useLocalState } from "@/components/library/module-shell";
import { useLocale } from "@/context/locale-context";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#C9A84C";

interface HoldFields {
  campName: string;
  hostCompany: string;
  hostAddress: string;
  songwriterName: string;
  songwriterAddress: string;
  startDate: string;
  endDate: string;
  city: string;
  countryGoverningLaw: string;
  perDiem: string;
  perDiemCurrency: string;
  hostsTravel: "Yes" | "No" | "Reimbursable up to a cap";
  hostsAccommodation: "Yes" | "No" | "Reimbursable up to a cap";
  splitDefault: string;
  exclusivityHours: string;
  killFee: string;
  signByDate: string;
  noticeEmail: string;
}

const blank = (countryDefault: string): HoldFields => ({
  campName: "",
  hostCompany: "",
  hostAddress: "",
  songwriterName: "",
  songwriterAddress: "",
  startDate: "",
  endDate: "",
  city: "",
  countryGoverningLaw: countryDefault,
  perDiem: "",
  perDiemCurrency: "ZAR",
  hostsTravel: "Reimbursable up to a cap",
  hostsAccommodation: "Yes",
  splitDefault: "Equal split among credited writers per the Standard Camp Splits Agreement (to be executed before any release)",
  exclusivityHours: "Camp days, 10:00–22:00 local time",
  killFee: "",
  signByDate: "",
  noticeEmail: "",
});

export default function SongwriterCampHoldLetterPage() {
  const { country } = useLocale();
  const [fields, setFields] = useLocalState<HoldFields>("roster_camp_hold_letter_v1", blank(country));
  useToolRestore("songwriter-camp-hold-letter", "roster_camp_hold_letter_v1", setFields);
  const [tab, setTab] = useState<"form" | "preview" | "clauses">("form");

  function update<K extends keyof HoldFields>(key: K, value: HoldFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  const today = new Date().toLocaleDateString();

  const clauses = useMemo(() => buildClauses(fields), [fields]);
  const previewLetter = useMemo(() => buildLetter(fields, today), [fields, today]);

  return (
    <ResourcePage
      parentHref="/dashboard/library/startup"
      parentLabel="Back to Onboarding"
      color={COLOR}
      tag="Onboarding · Songwriter Camp"
      title="Songwriter Camp Hold Letter"
      intro="Pre-NDA hold-and-pay letter that secures a songwriter's dates while you finalise full camp paperwork. Standard hold-and-pay structure: writer holds the dates, optional payment for the hold period, conversion to full engagement. Replaces the back-and-forth that loses bookings."
      toolbar={<><SaveButton toolSlug="songwriter-camp-hold-letter" storageKey={"roster_camp_hold_letter_v1"} title={`Songwriter Camp Hold Letter — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <button onClick={() => window.print()} className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-text-primary hover:bg-surface-2">
          <Printer size={14} /> Print / save PDF
        </button>
            </>
      }
      next={{ href: "/dashboard/library/startup/goal-setter", label: "Artist Goal-Setter" }}
    >
      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-border">
        {(["form", "clauses", "preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              tab === t ? "text-text-primary" : "border-transparent text-text-muted hover:text-text-primary"
            }`}
            style={tab === t ? { borderColor: COLOR, color: COLOR } : undefined}
          >
            {t === "form" ? "Fill in" : t === "clauses" ? "Read clauses" : "Preview letter"}
          </button>
        ))}
      </div>

      {tab === "form" && (
        <div className="space-y-5">
          <Section title="Camp + parties">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Camp name (working title)"><input className={inputClass} value={fields.campName} onChange={(e) => update("campName", e.target.value)} placeholder="e.g. Soweto Songwriting Sessions Vol. 3" /></Field>
              <Field label="Host company / label"><input className={inputClass} value={fields.hostCompany} onChange={(e) => update("hostCompany", e.target.value)} /></Field>
              <Field label="Host address"><input className={inputClass} value={fields.hostAddress} onChange={(e) => update("hostAddress", e.target.value)} /></Field>
              <Field label="Songwriter (full legal name)"><input className={inputClass} value={fields.songwriterName} onChange={(e) => update("songwriterName", e.target.value)} /></Field>
              <Field label="Songwriter address"><input className={inputClass} value={fields.songwriterAddress} onChange={(e) => update("songwriterAddress", e.target.value)} /></Field>
              <Field label="Notice email (host)"><input className={inputClass} value={fields.noticeEmail} onChange={(e) => update("noticeEmail", e.target.value)} placeholder="legal@..." /></Field>
            </div>
          </Section>

          <Section title="Dates + location">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Start date"><input type="date" className={inputClass} value={fields.startDate} onChange={(e) => update("startDate", e.target.value)} /></Field>
              <Field label="End date"><input type="date" className={inputClass} value={fields.endDate} onChange={(e) => update("endDate", e.target.value)} /></Field>
              <Field label="City"><input className={inputClass} value={fields.city} onChange={(e) => update("city", e.target.value)} placeholder="e.g. Johannesburg" /></Field>
              <Field label="Sign-by date"><input type="date" className={inputClass} value={fields.signByDate} onChange={(e) => update("signByDate", e.target.value)} /></Field>
            </div>
          </Section>

          <Section title="Money + provisions">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Per-diem amount"><input type="number" className={inputClass} value={fields.perDiem} onChange={(e) => update("perDiem", e.target.value)} placeholder="e.g. 1500" /></Field>
              <Field label="Per-diem currency"><input className={inputClass} value={fields.perDiemCurrency} onChange={(e) => update("perDiemCurrency", e.target.value)} placeholder="ZAR / NGN / GHS / etc." /></Field>
              <Field label="Kill fee (if camp cancels)"><input type="number" className={inputClass} value={fields.killFee} onChange={(e) => update("killFee", e.target.value)} placeholder="e.g. 50% of total per-diem" /></Field>
              <Field label="Travel covered?">
                <select className={inputClass} value={fields.hostsTravel} onChange={(e) => update("hostsTravel", e.target.value as HoldFields["hostsTravel"])}>
                  <option>Yes</option><option>No</option><option>Reimbursable up to a cap</option>
                </select>
              </Field>
              <Field label="Accommodation covered?">
                <select className={inputClass} value={fields.hostsAccommodation} onChange={(e) => update("hostsAccommodation", e.target.value as HoldFields["hostsAccommodation"])}>
                  <option>Yes</option><option>No</option><option>Reimbursable up to a cap</option>
                </select>
              </Field>
              <Field label="Governing law">
                <select className={inputClass} value={fields.countryGoverningLaw} onChange={(e) => update("countryGoverningLaw", e.target.value)}>
                  <option>South Africa</option>
                  <option>Nigeria</option>
                  <option>Ghana</option>
                  <option>Kenya</option>
                  <option>United Kingdom</option>
                  <option>United States</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Splits + exclusivity (placeholders for full agreement)">
            <Field label="Default split language">
              <textarea
                rows={3}
                className={inputClass}
                value={fields.splitDefault}
                onChange={(e) => update("splitDefault", e.target.value)}
              />
            </Field>
            <Field label="Exclusivity window (camp hours)">
              <input className={inputClass} value={fields.exclusivityHours} onChange={(e) => update("exclusivityHours", e.target.value)} />
            </Field>
          </Section>

          <button
            onClick={() => setTab("preview")}
            className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg"
            style={{ backgroundColor: COLOR, color: "white" }}
          >
            Preview letter <ChevronRight size={14} />
          </button>
        </div>
      )}

      {tab === "clauses" && (
        <div className="space-y-2">
          {clauses.map((c, i) => (
            <ClauseAccordion key={c.title} num={String(i + 1)} title={c.title} text={c.text} color={COLOR} />
          ))}
        </div>
      )}

      {tab === "preview" && (
        <div className="glass-card rounded-2xl p-8 print:p-0 print:shadow-none">
          <pre className="whitespace-pre-wrap font-serif text-text-primary leading-relaxed text-[15px]" style={{ fontFamily: "Georgia, serif" }}>
            {previewLetter}
          </pre>
        </div>
      )}

      <div
        className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3"
        style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}06` }}
      >
        <FileText size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLOR }} />
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Hold letter, not the full deal.</span> This holds the dates and provides for per-diem / kill fee. The split agreement, NDA, and master/composition rights paperwork must be executed before any work product is finalised or released. Use this letter to lock the writer; close the full paperwork in the days that follow.
        </p>
      </div>
    </ResourcePage>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function buildClauses(f: HoldFields): { title: string; text: string }[] {
  return [
    {
      title: "Hold of Dates",
      text: `${f.songwriterName || "[Songwriter]"} agrees to hold ${f.startDate || "[start date]"} through ${f.endDate || "[end date]"} (the "Camp Dates") exclusively for ${f.hostCompany || "[Host]"} in ${f.city || "[City]"}. During the Camp Dates, the Songwriter shall not engage in any other songwriting, recording, or co-writing activity that conflicts with full participation in the Camp.`,
    },
    {
      title: "Per Diem and Kill Fee",
      text: `${f.hostCompany || "[Host]"} shall pay ${f.songwriterName || "[Songwriter]"} a per diem of ${f.perDiem || "[amount]"} ${f.perDiemCurrency} per Camp day. If the Camp is cancelled by ${f.hostCompany || "[Host]"} less than seven (7) days before the start date, a kill fee of ${f.killFee || "[amount or 50% of total per-diem]"} shall be paid as full and final compensation for the held dates.`,
    },
    {
      title: "Travel and Accommodation",
      text: `${f.hostCompany || "[Host]"} shall ${f.hostsTravel === "Yes" ? "cover all reasonable travel expenses" : f.hostsTravel === "No" ? "NOT cover travel expenses (Songwriter to arrange and bear travel)" : "reimburse travel expenses up to a pre-agreed cap on production of valid receipts"}, and ${f.hostsAccommodation === "Yes" ? "provide accommodation" : f.hostsAccommodation === "No" ? "NOT provide accommodation (Songwriter to arrange and bear accommodation)" : "reimburse accommodation up to a pre-agreed cap on production of valid receipts"} for the duration of the Camp Dates.`,
    },
    {
      title: "Splits and IP Placeholder",
      text: `Splits, ownership, and IP for any compositions, beats, lyrics, or topline created during the Camp Dates shall be governed by a separate Standard Camp Splits Agreement, which the parties undertake to negotiate and execute in good faith before any work product is exploited or released. Default position pending that agreement: ${f.splitDefault}.`,
    },
    {
      title: "Exclusivity During Camp Hours",
      text: `During Camp hours (${f.exclusivityHours}), ${f.songwriterName || "[Songwriter]"} agrees to participate fully in Camp activities and not to engage in competing songwriting work for any third party. Outside Camp hours, the Songwriter is free to pursue other engagements.`,
    },
    {
      title: "Confidentiality",
      text: `All Camp activities, attendees, work product, and discussions are confidential. Neither party shall disclose any details to third parties, including on social media, without written consent of the other party. This obligation survives termination of this Hold Letter and continues for two (2) years after the Camp Dates.`,
    },
    {
      title: "Conversion to Full Agreement",
      text: `Both parties undertake to execute the full Camp Splits Agreement, NDA, and (where applicable) master / composition rights paperwork by no later than ${f.signByDate || "[sign-by date]"}. If full paperwork is not executed by that date, this Hold Letter shall remain the operative agreement governing the Camp Dates only, and any post-Camp work product shall not be exploited until full paperwork is signed.`,
    },
    {
      title: "Notices and Governing Law",
      text: `Notices to ${f.hostCompany || "[Host]"} shall be sent to ${f.noticeEmail || "[notice email]"}. This Hold Letter shall be governed by and construed in accordance with the laws of ${f.countryGoverningLaw}, and the parties submit to the exclusive jurisdiction of the courts of that jurisdiction.`,
    },
    {
      title: "Counterparts and E-signing",
      text: `This Hold Letter may be executed in counterparts and via electronic signature, each of which together shall constitute one and the same instrument. Email confirmation by both parties of agreement to these terms, prior to formal signature, shall be admissible as evidence of intention to be bound for the purposes of holding the dates.`,
    },
  ];
}

function buildLetter(f: HoldFields, today: string): string {
  return `${f.hostCompany || "[Host]"}
${f.hostAddress || "[Host address]"}
Date: ${today}

To: ${f.songwriterName || "[Songwriter]"}
${f.songwriterAddress || "[Songwriter address]"}

Re: HOLD LETTER — ${f.campName || "[Camp Name]"} (${f.startDate || "[start]"} to ${f.endDate || "[end]"}, ${f.city || "[City]"})

Dear ${f.songwriterName || "[Songwriter]"},

This letter sets out the terms on which you agree to hold the dates ${f.startDate || "[start date]"} through ${f.endDate || "[end date]"} (the "Camp Dates") exclusively for participation in the songwriting camp identified above (the "Camp"), pending execution of the full Camp Splits Agreement and related paperwork.

1. HOLD OF DATES
You agree to hold the Camp Dates exclusively for ${f.hostCompany || "[Host]"}. During the Camp Dates you shall not engage in any other songwriting, recording, or co-writing activity that conflicts with full participation in the Camp.

2. PER DIEM
${f.hostCompany || "[Host]"} shall pay you a per diem of ${f.perDiem || "[amount]"} ${f.perDiemCurrency} per Camp day, payable within 14 days of the end of the Camp.

3. KILL FEE
If the Camp is cancelled by ${f.hostCompany || "[Host]"} less than seven (7) days before the start date, a kill fee of ${f.killFee || "[amount or 50% of total per-diem]"} shall be paid as full and final compensation for the held dates.

4. TRAVEL & ACCOMMODATION
Travel: ${f.hostsTravel}. Accommodation: ${f.hostsAccommodation}.

5. SPLITS / IP PLACEHOLDER
Splits, ownership, and IP for any work product created during the Camp Dates shall be governed by a separate Standard Camp Splits Agreement, to be executed by ${f.signByDate || "[sign-by date]"}. Pending that agreement, the default position is: ${f.splitDefault}.

6. EXCLUSIVITY DURING CAMP HOURS
${f.exclusivityHours}. Outside Camp hours, you are free to pursue other engagements.

7. CONFIDENTIALITY
All Camp activities, attendees, work product, and discussions are confidential for two (2) years after the Camp Dates.

8. CONVERSION TO FULL AGREEMENT
Both parties undertake to execute full paperwork (Splits Agreement, NDA, rights paperwork) by ${f.signByDate || "[sign-by date]"}.

9. GOVERNING LAW & NOTICES
This Hold Letter is governed by the laws of ${f.countryGoverningLaw}. Notices to ${f.hostCompany || "[Host]"}: ${f.noticeEmail || "[notice email]"}.

Please countersign below to confirm your agreement.

Yours sincerely,



______________________________
For and on behalf of
${f.hostCompany || "[Host]"}


AGREED AND ACCEPTED:



______________________________
${f.songwriterName || "[Songwriter]"}
Date: ____________________
`;
}
