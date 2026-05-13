"use client";
import { useLocale } from "@/context/locale-context";
import { ResourcePage, ClauseAccordion, Disclaimer } from "@/components/library/module-shell";

const COLOR = "#64748B";

const POPIA_GDPR_CLAUSES = (countryName: string, dpaName: string, regulator: string) => [
  { num: "1", title: "Who we are", text: `[Artist / Label / Manager Legal Name] (\"we\", \"us\", \"our\") collects, processes and stores personal information of fans, ticket buyers, mailing-list subscribers, employees, contractors and partners (\"you\") for the purposes set out in this policy. We are accountable to ${regulator} under the ${dpaName}.` },
  { num: "2", title: "What we collect", text: "We collect: (i) name, email, phone (newsletter / SMS sign-ups); (ii) location data (city for tour announcements); (iii) payment data (via our payment processor — we do not store full card details); (iv) device data (cookies, IP address) for analytics; (v) where you submit content for promotion (UGC), the content you submit and your social handle. We do not collect special-category data (health, biometric, genetic, religious, political, sexual orientation, race) save where you voluntarily disclose it." },
  { num: "3", title: "Lawful basis", text: "We rely on: (i) your consent (newsletter signup, SMS marketing, cookie use); (ii) contract performance (where you've bought a ticket / merch); (iii) legitimate interest (analytics, fraud prevention, audience profiling for marketing) — balanced against your privacy rights; (iv) legal obligation (tax / accounting records)." },
  { num: "4", title: "How we use it", text: "We use your data to: send you news, tour announcements, releases (with consent); fulfil orders (tickets, merch); recommend content; analyse aggregate engagement; comply with tax / legal requirements; defend against fraud; co-operate with lawful requests from regulators or courts." },
  { num: "5", title: "Sharing & third parties", text: "We share data with: (i) ticketing partners (e.g. Webtickets, Quicket, Eventbrite); (ii) payment processors (Paystack, Flutterwave, Stripe); (iii) email / SMS service providers (Resend, Mailchimp, Africa's Talking); (iv) analytics platforms (Spotify for Artists, Apple Music for Artists, Audiomack for Creators, Google Analytics); (v) record label / distributor / publisher administrators where we have a deal in place; (vi) legal / professional advisors. We require all third parties to maintain confidentiality and to process data only on our instructions." },
  { num: "6", title: "International transfers", text: `Where we transfer data outside ${countryName}, we rely on: adequacy decisions where they exist; Standard Contractual Clauses; or your explicit consent. By using our services, you acknowledge that data may be transferred internationally to the third parties listed in section 5 above.` },
  { num: "7", title: "How long we keep it", text: "We retain personal data for as long as you are subscribed to our list, or as required to fulfil a transaction (e.g. seven years for tax records on completed sales). We delete on request unless retention is required by law." },
  { num: "8", title: "Your rights", text: `You have the right to: (i) access the data we hold on you; (ii) correct inaccurate data; (iii) delete your data (\"right to be forgotten\"), subject to legal retention obligations; (iv) restrict or object to processing; (v) port your data to another service; (vi) withdraw consent at any time without affecting prior lawful processing; (vii) lodge a complaint with ${regulator}. To exercise any of these rights, email [privacy@yourartist.com]; we respond within 30 days.` },
  { num: "9", title: "Cookies", text: "We use functional, analytics and (where you consent) marketing cookies. You can manage cookie preferences via the banner on first visit and via your browser settings at any time. We document our cookie use in [link to cookie policy]." },
  { num: "10", title: "Security", text: "We protect your data with industry-standard measures including encryption in transit (HTTPS), at-rest encryption for our database, access controls, audit logs, and regular security review. In the event of a breach affecting your data, we will notify you and the regulator within 72 hours of becoming aware (where required by law)." },
  { num: "11", title: "Children", text: "We do not knowingly collect data from children under 18 without parental consent. If you believe we have collected data from a minor without consent, please email [privacy@yourartist.com] and we will delete it." },
  { num: "12", title: "Changes", text: "We may update this policy. We will notify you of material changes via the email address you've provided and via a banner on our website. Continued use after notice constitutes acceptance." },
  { num: "13", title: "Contact", text: "Privacy enquiries: [privacy@yourartist.com]. Data Protection Officer (where appointed): [DPO name + email]. Our supervisory authority is [regulator]." },
];

export default function POPIAGDPRTemplatePage() {
  const { country } = useLocale();

  const isSA = country === "South Africa" || !country;
  const dpaName = isSA ? "Protection of Personal Information Act, 2013 (POPIA)" : "Nigeria Data Protection Act, 2023 (NDPA)";
  const regulator = isSA ? "the Information Regulator of South Africa" : "the Nigeria Data Protection Commission (NDPC)";

  return (
    <ResourcePage
      parentHref="/dashboard/library/legal"
      parentLabel="Back to Legal"
      color={COLOR}
      tag="Legal · Privacy"
      title="Privacy Policy Template (Artist-Side)"
      intro={`Privacy policy for an artist's website / fan list / ticketing operation. Currently rendered for ${isSA ? "South Africa under POPIA" : "Nigeria under NDPA"}. Always review with a data-protection attorney before publishing.`}
    >
      <div className="space-y-2 mb-6">
        {POPIA_GDPR_CLAUSES(country || "South Africa", dpaName, regulator).map((c) => (
          <ClauseAccordion key={c.num} num={c.num} title={c.title} text={c.text} color={COLOR} />
        ))}
      </div>
      <Disclaimer kind="legal" />
    </ResourcePage>
  );
}
