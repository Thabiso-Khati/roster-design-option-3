"use client";
import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, Printer } from "lucide-react";
import { SendForSignatureButton } from "@/components/sign/send-for-signature";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
// Agreement content lives in lib/agreements/ — use loadAgreement() from
// "@/lib/agreements" for lazy per-country loading in future refactors.
import { ALGERIA_CLAUSES, ALGERIA_SCHEDULE, ALGERIA_META } from "@/lib/agreements/algeria-agreement";
import { NIGERIA_CLAUSES, NIGERIA_SCHEDULE, NIGERIA_META } from "@/lib/agreements/nigeria-agreement";
import { KENYA_CLAUSES, KENYA_SCHEDULE, KENYA_META } from "@/lib/agreements/kenya-agreement";
import { GHANA_CLAUSES, GHANA_SCHEDULE, GHANA_META } from "@/lib/agreements/ghana-agreement";
import { TANZANIA_CLAUSES, TANZANIA_SCHEDULE, TANZANIA_META } from "@/lib/agreements/tanzania-agreement";
import { UGANDA_CLAUSES, UGANDA_SCHEDULE, UGANDA_META } from "@/lib/agreements/uganda-agreement";
import { ZIMBABWE_CLAUSES, ZIMBABWE_SCHEDULE, ZIMBABWE_META } from "@/lib/agreements/zimbabwe-agreement";
import { ETHIOPIA_CLAUSES, ETHIOPIA_SCHEDULE, ETHIOPIA_META } from "@/lib/agreements/ethiopia-agreement";
import { EGYPT_CLAUSES, EGYPT_SCHEDULE, EGYPT_META } from "@/lib/agreements/egypt-agreement";
import { MOROCCO_CLAUSES, MOROCCO_SCHEDULE, MOROCCO_META } from "@/lib/agreements/morocco-agreement";
import { COTE_DIVOIRE_CLAUSES, COTE_DIVOIRE_SCHEDULE, COTE_DIVOIRE_META } from "@/lib/agreements/cote-divoire-agreement";
import { CAMEROON_CLAUSES, CAMEROON_SCHEDULE, CAMEROON_META } from "@/lib/agreements/cameroon-agreement";
import { ANGOLA_CLAUSES, ANGOLA_SCHEDULE, ANGOLA_META } from "@/lib/agreements/angola-agreement";
import { SENEGAL_CLAUSES, SENEGAL_SCHEDULE, SENEGAL_META } from "@/lib/agreements/senegal-agreement";

const MODULE_COLOR = "#C9A84C";

interface SubClause {
  ref: string;
  text: string;
  sub?: { ref: string; text: string }[];
}

interface Clause {
  id: string;
  title: string;
  intro?: string;
  subclauses: SubClause[];
}

const SA_CLAUSES: Clause[] = [
  {
    id: "1",
    title: "Definitions and Interpretation",
    subclauses: [
      {
        ref: "1.1",
        text: "Interpretation",
        sub: [
          { ref: "1.1.1", text: "Unless the context clearly requires otherwise, words in the singular include the plural and vice versa; words denoting natural persons include juristic persons and vice versa; words denoting one gender include all genders; and references to any statute include any amendment, re-enactment, or subordinate legislation made thereunder." },
          { ref: "1.1.2", text: "Clause headings are inserted for convenience of reference only and shall not affect the interpretation of this Agreement." },
          { ref: "1.1.3", text: "Any reference to \"reasonable endeavours\" means the degree of effort that a reasonable person in the same position would exercise, having regard to their own commercial interests." },
        ],
      },
      {
        ref: "1.2",
        text: "Key Definitions",
        sub: [
          { ref: "Acts", text: "The Copyright Act 98 of 1978, the Performers' Protection Act 11 of 1967, the Electronic Communications Act 36 of 2005, and the Consumer Protection Act 68 of 2008, as amended from time to time." },
          { ref: "Artist's Services", text: "All professional, creative, and commercial activities arising from the Artist's abilities and public profile, including performing, recording, songwriting, producing, acting, modelling, endorsing, broadcasting, and otherwise exploiting the Artist's talent and Personality Rights in all media and formats, whether now known or hereafter devised." },
          { ref: "Digital Platforms", text: "All streaming services, short-form video platforms, social networks, and content-sharing applications, including but not limited to Spotify, Apple Music, Boomplay, Audiomack, YouTube Music, TikTok, Instagram, YouTube (including Shorts), Deezer, Amazon Music, Meta platforms, and any successor or equivalent platforms." },
          { ref: "Gross Income", text: "All revenue generated from the exploitation of the Artist's Services in the Territory during the Term, inclusive of performance fees, recording income, publishing income, brand partnership fees, merchandise income, Digital Platform royalties and monetisation, sync licensing fees, and any other income attributable to the Artist's Services. Excludes VAT, verifiable production and technical costs charged directly by a third party." },
          { ref: "Management Fee", text: "The fee payable to Management as set out in the First Schedule." },
          { ref: "Net Income", text: "The amount payable to the Artist after deduction of the Management Fee and any other permitted deductions, calculated on Gross Income actually received and cleared by Management." },
          { ref: "Personality Rights", text: "All rights subsisting in the Artist's name, likeness, image, voice, signature, stage name, and other identifying characteristics, whether or not registered as intellectual property." },
          { ref: "SAMRO", text: "The South African Music Rights Organisation, or such successor body as may administer performing rights and mechanical rights in South Africa." },
          { ref: "SAMPRA", text: "The South African Master Performers Association, or such successor body as may administer neighbouring rights in respect of sound recordings in South Africa." },
          { ref: "Territory", text: "The world, unless expressly limited to a specific jurisdiction in any schedule or addendum hereto." },
          { ref: "Term", text: "The duration of this Agreement as specified in clause 11." },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Appointment and Grant of Rights",
    subclauses: [
      {
        ref: "2.1",
        text: "Exclusive Appointment",
        sub: [
          { ref: "2.1.1", text: "The Artist hereby exclusively appoints Management, for the Term and throughout the Territory, to manage, represent, advise, and act on the Artist's behalf in respect of all matters relating to the Artist's Services, subject to the limitations set out in clause 3." },
          { ref: "2.1.2", text: "The Artist acknowledges that the exclusive nature of this appointment is essential to Management's ability to plan, invest, and execute a coherent long-term career strategy." },
        ],
      },
      {
        ref: "2.2",
        text: "Scope of Management Services",
        sub: [
          { ref: "2.2.1", text: "Advising the Artist on all aspects of career development, including market positioning, creative direction, repertoire, collaborations, and professional conduct." },
          { ref: "2.2.2", text: "Identifying, negotiating, and securing performance, appearance, and touring contracts throughout the Territory." },
          { ref: "2.2.3", text: "Identifying, negotiating, and securing brand partnership, endorsement, and Personality Rights licensing agreements." },
          { ref: "2.2.4", text: "Identifying, negotiating, and securing New Media and Digital Platform contracts, including content monetisation, platform partnerships, and sponsored content arrangements." },
          { ref: "2.2.5", text: "Liaising and coordinating with the Artist's record label, music publisher, booking agent, publicist, legal counsel, accountants, and other professional team members." },
          { ref: "2.2.6", text: "Overseeing travel logistics for all engagements, including international touring, visa coordination, and itinerary management, save that Management shall not be responsible for transporting the Artist between the Artist's place of residence and the nearest departure point." },
          { ref: "2.2.7", text: "Maintaining accurate books and records of all income received and disbursed in connection with the Artist's Services, in accordance with generally accepted accounting principles and SARS requirements." },
          { ref: "2.2.8", text: "Collecting all income attributable to the Artist's Services in the Territory during the Term." },
          { ref: "2.2.9", text: "Handling all business correspondence and third-party queries relating to the Artist's Services." },
          { ref: "2.2.10", text: "Monitoring the Artist's digital footprint across all New Media platforms and coordinating digital strategy with the Artist and relevant service providers." },
          { ref: "2.2.11", text: "Facilitating the registration and ongoing maintenance of the Artist's works with SAMRO, SAMPRA, and any applicable international rights organisation." },
        ],
      },
      {
        ref: "2.3",
        text: "Licence of Personality Rights",
        sub: [
          { ref: "2.3.1", text: "The Artist irrevocably consents, for the duration of the Term only, to Management's exclusive right to use and licence the Artist's Personality Rights for purposes of marketing, promoting, and commercially exploiting the Artist's Services as contemplated in this Agreement." },
          { ref: "2.3.2", text: "Such consent extends to use in all media, including New Media and Digital Platforms, and is granted by way of an exclusive licence for the Term." },
          { ref: "2.3.3", text: "The Artist confirms that the stage name and professional alias by which the Artist is known is the Artist's sole property, whether or not registered as a trade mark, and that Management's exercise of rights hereunder does not vest any ownership thereof in Management." },
        ],
      },
    ],
  },
  {
    id: "3",
    title: "Limitations on the Grant of Rights",
    subclauses: [
      {
        ref: "3.1",
        text: "Prior Written Approval Required",
        sub: [
          { ref: "3.1.1", text: "Any product or service endorsement, brand partnership, or association that requires use of the Artist's Personality Rights or name." },
          { ref: "3.1.2", text: "Any publishing rights in compositions authored by the Artist, which shall remain subject to a separate publishing agreement." },
          { ref: "3.1.3", text: "Any sound recording or audiovisual work rights, which shall remain subject to a separate recording agreement." },
          { ref: "3.1.4", text: "Any assignment, licensing, or other disposition of the Artist's Personality Rights beyond the scope of ordinary promotional activity contemplated in this Agreement." },
          { ref: "3.1.5", text: "Any use of the Artist's likeness or voice in connection with artificial intelligence-generated content, deepfakes, synthetic media, or similar technologies." },
        ],
      },
      {
        ref: "3.2",
        text: "Excluded Matters, Management has no authority to act on behalf of the Artist in respect of",
        sub: [
          { ref: "3.2.1", text: "The Artist's obligations to SARS or any other tax authority." },
          { ref: "3.2.2", text: "The Artist's personal banking, insurance, or medical arrangements." },
          { ref: "3.2.3", text: "Any matter expressly reserved to the Artist under this Agreement." },
        ],
      },
    ],
  },
  {
    id: "4",
    title: "Representations, Warranties, and Undertakings",
    subclauses: [
      {
        ref: "4.1",
        text: "Artist's Warranties",
        sub: [
          { ref: "4.1.1", text: "The Artist has full legal capacity and authority to enter into this Agreement and to grant the rights set out herein." },
          { ref: "4.1.2", text: "No third-party claim, litigation, or dispute exists or is threatened that could materially affect the Artist's Services or Management's exercise of rights hereunder." },
          { ref: "4.1.3", text: "The Artist shall not, during the Term, grant to any third party any right that conflicts with, diminishes, or derogates from the exclusive rights granted to Management herein." },
          { ref: "4.1.4", text: "All obligations and restrictions imposed on the Artist hereunder shall be binding equally on any company, trust, or entity through which the Artist conducts business." },
          { ref: "4.1.5", text: "The Artist shall fulfil all commitments organised or facilitated by Management under this Agreement with professionalism and punctuality." },
          { ref: "4.1.6", text: "The Artist shall not unreasonably withhold any consent required under this Agreement." },
          { ref: "4.1.7", text: "The Artist shall maintain conduct and a public profile consistent with sustaining commercial relationships and the integrity of this Agreement." },
        ],
      },
      {
        ref: "4.2",
        text: "Management's Warranties",
        sub: [
          { ref: "4.2.1", text: "Management has full legal capacity and authority to enter into this Agreement and to perform all obligations herein." },
          { ref: "4.2.2", text: "Management shall maintain, throughout the Term, proper books of account in accordance with generally accepted accounting principles in South Africa." },
          { ref: "4.2.3", text: "Management shall act in good faith and in the Artist's best commercial interests in all dealings relating to the Artist's Services." },
          { ref: "4.2.4", text: "Management shall not unreasonably withhold any consent required under this Agreement." },
          { ref: "4.2.5", text: "Management shall promptly disclose to the Artist any actual or potential conflict of interest." },
          { ref: "4.2.6", text: "Income from publishing agreements shall accrue to the Artist directly from the relevant publisher and shall form part of Gross Income hereunder; the obligations under any publishing agreement shall remain solely between the Artist and the publisher." },
          { ref: "4.2.7", text: "Income from recording agreements shall accrue to the Artist directly from the relevant record label and shall form part of Gross Income hereunder; the obligations under any recording agreement shall remain solely between the Artist and the label." },
        ],
      },
    ],
  },
  {
    id: "5",
    title: "The Management Relationship",
    subclauses: [
      { ref: "5.1", text: "Independent Contractor Status, Nothing in this Agreement constitutes or shall be deemed to constitute a partnership, joint venture, or employment relationship between the Parties. The Artist shall at all times be an independent contractor for all purposes, including for SARS classification." },
      {
        ref: "5.2",
        text: "Management's Undertaking to Develop the Artist's Career",
        sub: [
          { ref: "a", text: "Actively marketing the Artist's Services to promoters, festivals, brands, and media across South Africa, the African continent, and internationally." },
          { ref: "b", text: "Growing the Artist's digital audience and engagement across all relevant New Media platforms." },
          { ref: "c", text: "Identifying and facilitating sync licensing, advertising, and brand partnership opportunities." },
          { ref: "d", text: "Securing collaboration and feature opportunities with established artists to broaden the Artist's reach." },
          { ref: "e", text: "Facilitating merchandise, touring, and ancillary income opportunities." },
          { ref: "f", text: "Coordinating with radio and DSP playlist teams to maximise the Artist's discovery and airplay." },
        ],
      },
      {
        ref: "5.3",
        text: "Career Growth Milestones",
        sub: [
          { ref: "a", text: "Market reach and audience development, measured by streaming figures, New Media engagement, and demand for live performances." },
          { ref: "b", text: "Professional development and conduct, including stage performance quality, media proficiency, and industry reputation." },
          { ref: "c", text: "Financial growth, measured by the trajectory of Gross Income generated over successive quarters." },
          { ref: "5.3.2", text: "When the Artist's Gross Income first exceeds R150,000.00 per month on a sustained three-month basis, the Parties shall, in consultation with an accountant, review the Artist's business structure with a view to incorporating a suitable entity for tax efficiency and statutory compliance." },
        ],
      },
    ],
  },
  {
    id: "6",
    title: "Digital Platforms, New Media, and Emerging Technologies",
    subclauses: [
      {
        ref: "6.1",
        text: "Digital Strategy",
        sub: [
          { ref: "6.1.1", text: "The Parties acknowledge that Digital Platforms are the primary channels through which the Artist's music is discovered, consumed, and monetised in 2026, and that proactive, consistent engagement with these platforms is essential to the viability of this Agreement." },
          { ref: "6.1.2", text: "Management shall maintain an active digital strategy for the Artist, covering short-form video content (TikTok, Instagram Reels, YouTube Shorts), streaming performance optimisation, editorial playlist pitching, and New Media audience growth." },
        ],
      },
      {
        ref: "6.2",
        text: "Content ID and Royalty Capture",
        sub: [
          { ref: "6.2.1", text: "Management shall ensure, in cooperation with the Artist's distributor, that all of the Artist's sound recordings are registered with YouTube Content ID and TikTok Sound monetisation systems, and that all relevant claiming and monetisation options are activated." },
          { ref: "6.2.2", text: "Income generated from Content ID claims, TikTok Sound royalties, Meta Sound Collection, and similar digital monetisation mechanisms shall form part of Gross Income hereunder." },
        ],
      },
      {
        ref: "6.3",
        text: "Artificial Intelligence and Synthetic Media",
        sub: [
          { ref: "6.3.1", text: "The use of the Artist's voice, likeness, or any sound recording embodying the Artist's performance in connection with artificial intelligence-generated content, AI voice cloning, synthetic media, deepfakes, or similar technologies is strictly prohibited without the Artist's prior written consent and the execution of a separate agreement specifically addressing such use." },
          { ref: "6.3.2", text: "Management shall monitor, and where possible take action against, any unauthorised AI exploitation of the Artist's Personality Rights or performances." },
        ],
      },
      {
        ref: "6.4",
        text: "User-Generated Content, The Parties agree that User-Generated Content incorporating the Artist's recordings represents a significant organic discovery tool and shall not be routinely blocked, provided that such content does not damage the Artist's brand or generate revenue for third parties beyond what is captured through Content ID and similar systems.",
      },
    ],
  },
  {
    id: "7",
    title: "Pan-African and International Operations",
    subclauses: [
      { ref: "7.1", text: "Strategic Importance, Both Parties acknowledge the commercial and strategic importance of the African continent as a market, and the challenges specific to operating across multiple African jurisdictions, including currency volatility, infrastructure limitations, fragmented digital payment systems, and varying intellectual property enforcement standards." },
      {
        ref: "7.2",
        text: "Cross-Border Bookings and Payments",
        sub: [
          { ref: "7.2.1", text: "All international booking fees shall, where possible, be denominated in USD, EUR, or GBP, to mitigate ZAR exchange rate exposure. Management shall advise the Artist on currency hedging where material amounts are involved." },
          { ref: "7.2.2", text: "For bookings in African markets where payment infrastructure is limited, Management shall make reasonable endeavours to secure payment via international wire transfer, Payoneer, Wise, or similar mechanisms, and shall document all payment arrangements in writing." },
          { ref: "7.2.3", text: "Management shall be responsible for ensuring that all withholding tax obligations in foreign jurisdictions are identified in advance of any international engagement, and that appropriate provisions are included in all cross-border contracts." },
        ],
      },
      {
        ref: "7.3",
        text: "Visa and Travel Documentation",
        sub: [
          { ref: "7.3.1", text: "Management shall coordinate all visa applications and travel documentation required for international engagements. The Artist undertakes to maintain a valid South African passport with a minimum of twelve (12) months' validity at all times, and to provide all required documentation promptly upon request." },
          { ref: "7.3.2", text: "Visa application and related travel document costs shall be recoverable by Management in accordance with the First Schedule." },
        ],
      },
      { ref: "7.4", text: "Pan-African DSP Strategy, Management shall include Boomplay, Audiomack, and Deezer as priority platforms in all release and pitching strategies, recognising their dominant market positions in East Africa, West Africa, and Francophone Africa respectively." },
    ],
  },
  {
    id: "8",
    title: "Accounts, Fees, and Payment",
    subclauses: [
      { ref: "8.1", text: "Management's Right to Collect, Management shall be entitled, throughout the Term, to collect one hundred per cent (100%) of all Gross Income attributable to the Artist's Services in the Territory, subject to the exceptions in clauses 4.2.6 and 4.2.7." },
      {
        ref: "8.2",
        text: "Management Fee",
        sub: [
          { ref: "8.2.1", text: "Management shall be entitled to deduct the Management Fee as set out in the First Schedule from Gross Income before remitting Net Income to the Artist." },
          { ref: "8.2.2", text: "The Management Fee shall be calculated on Gross Income actually received and cleared by Management, after deduction only of: (a) VAT and equivalent consumption taxes required to be deducted in any applicable jurisdiction; (b) Verifiable third-party production and technical costs directly attributable to a specific engagement and not covered by the purchaser." },
        ],
      },
      {
        ref: "8.3",
        text: "Payment to the Artist",
        sub: [
          { ref: "8.3.1", text: "Management shall remit Net Income to the Artist on a monthly basis in arrears, within fifteen (15) business days of month-end, subject to recoupment of advances, retention of disputed amounts, and deduction of verified transport, travel, accommodation, and communication costs not reimbursed by a third party." },
          { ref: "8.3.2", text: "Any income received as a deposit for a future performance shall be held in trust by Management and shall not constitute Gross Income until the relevant performance has been completed." },
        ],
      },
      {
        ref: "8.4",
        text: "Accounting and Audit Rights",
        sub: [
          { ref: "8.4.1", text: "Management shall maintain complete and accurate books of account in respect of all Gross Income received and all deductions made hereunder." },
          { ref: "8.4.2", text: "Management shall render monthly income statements to the Artist no later than fifteen (15) business days following each month-end." },
          { ref: "8.4.3", text: "All statements rendered shall be deemed accepted unless specific written objection is raised by the Artist within thirty-six (36) months of the date of the relevant statement." },
          { ref: "8.4.4", text: "The Artist may, not more than once per calendar year and at the Artist's own cost, appoint an independent registered accountant or auditor to inspect Management's books and records relevant to this Agreement, on reasonable prior written notice and during normal business hours." },
          { ref: "8.4.5", text: "If such inspection discloses an underpayment to the Artist exceeding R15,000.00 for the period under review, Management shall reimburse the reasonable direct costs of the inspection, up to a maximum of R20,000.00." },
        ],
      },
      {
        ref: "8.5",
        text: "Post-Term Commission (Sunset Clause)",
        sub: [
          { ref: "8.5.1", text: "Following the expiry or termination of this Agreement, Management shall remain entitled to receive commissions on Gross Income derived from all contracts, recordings, compositions, brand partnerships, and exploits that were substantially negotiated, initiated, or executed during the Term, at the following reducing rates: Year 1: 20% · Year 2: 15% · Year 3: 10% · Year 4: 5% · Year 5: 5% · Thereafter: 0%." },
          { ref: "8.5.2", text: "Post-Term commissions shall not apply to any new contracts, agreements, or exploits entered into by the Artist after the date of expiry or termination." },
          { ref: "8.5.3", text: "The Artist shall procure that all third parties paying income from During-Term Exploits remit such amounts to Management (or as Management directs) to enable collection of post-Term commissions. This obligation survives expiry or termination of this Agreement." },
        ],
      },
    ],
  },
  {
    id: "9",
    title: "Media Conduct and Public Profile",
    subclauses: [
      { ref: "9.1", text: "The Role of Media, The Parties acknowledge that the Artist's public profile is built and sustained through consistent, considered engagement with media in all its forms, and that the digital environment of 2026 means that any public statement, post, or interaction may be permanently recorded and widely distributed." },
      {
        ref: "9.2",
        text: "Artist's Media Obligations, The Artist undertakes, to the best of their ability, to",
        sub: [
          { ref: "9.2.1", text: "Engage with all media interactions, including social media, press interviews, podcast appearances, and live streaming, with professionalism, courtesy, and awareness of their public role." },
          { ref: "9.2.2", text: "Maintain their social media accounts actively, consistently, and in a manner aligned with the agreed brand positioning." },
          { ref: "9.2.3", text: "Notify Management promptly of any media request, controversy, or public incident that may require a coordinated response." },
          { ref: "9.2.4", text: "Observe punctuality and communicate any delays or difficulties in advance of any media or public engagement." },
          { ref: "9.2.5", text: "Avoid making any public statement that could constitute defamation, hate speech, or any other unlawful communication under South African law." },
        ],
      },
    ],
  },
  {
    id: "10",
    title: "Taxation and Regulatory Compliance",
    subclauses: [
      {
        ref: "10.1",
        text: "Tax Obligations",
        sub: [
          { ref: "10.1.1", text: "Both Parties shall at all times maintain compliance with all applicable SARS regulations, including income tax, VAT, and PAYE where applicable, throughout the Term." },
          { ref: "10.1.2", text: "The Artist acknowledges that, as a public figure, any failure to comply with SARS obligations may cause material damage to the Artist's commercial relationships and professional reputation, independent of any consequences under this Agreement." },
          { ref: "10.1.3", text: "Management shall ensure that all income payments to the Artist are accompanied by accurate tax documentation, and shall cooperate fully with the Artist's appointed tax practitioner or accountant." },
          { ref: "10.1.4", text: "The Artist accepts sole responsibility for all income tax, provisional tax, and related obligations arising from Net Income paid by Management, and undertakes to comply with all filing and payment deadlines prescribed by SARS." },
        ],
      },
    ],
  },
  {
    id: "11",
    title: "Term and Renewal",
    subclauses: [
      { ref: "11.1", text: "Initial Term, This Agreement shall commence on the Effective Date and shall continue for a period of three (3) years, unless terminated earlier in accordance with clause 12." },
      { ref: "11.2", text: "Renewal Option, Management shall have the option to renew this Agreement for a further period of three (3) years by written notice delivered to the Artist not less than sixty (60) days prior to the expiry of the Initial Term, provided that the Artist is not in material breach at the time of such notice." },
      { ref: "11.3", text: "Post-Option Continuation, If the Parties wish to continue their relationship following the expiry of the option period, they shall negotiate in good faith the terms of a successor agreement, having regard to the Artist's career position at that time." },
    ],
  },
  {
    id: "12",
    title: "Termination and Post-Term Obligations",
    subclauses: [
      { ref: "12.1", text: "Insolvency Events, Either Party may terminate this Agreement immediately by written notice if the other Party is placed under provisional or final liquidation, business rescue, sequestration, or any analogous insolvency procedure, and such process is not discharged within thirty (30) days." },
      { ref: "12.2", text: "Material Breach by Management, If Management commits a material breach (including any failure to account or pay), and such breach (where capable of remedy) is not remedied within thirty (30) days of written notice, the Artist may terminate this Agreement by written notice, effective immediately upon receipt." },
      { ref: "12.3", text: "Material Breach by Artist, If the Artist commits a material breach (including any failure to perform confirmed engagements or to comply with the exclusivity obligations herein), and such breach (where capable of remedy) is not remedied within thirty (30) days of written notice, Management may terminate this Agreement by written notice, effective immediately upon receipt." },
      {
        ref: "12.4",
        text: "Effect of Termination",
        sub: [
          { ref: "12.4.1", text: "Termination shall not release either Party from obligations accrued prior to the effective date of termination, nor from obligations expressed to survive termination, including the post-Term commission obligations in clause 8.5." },
          { ref: "12.4.2", text: "On termination, each Party shall promptly return or destroy all confidential information belonging to the other Party, except as required to be retained by law." },
        ],
      },
    ],
  },
  {
    id: "13",
    title: "General Provisions",
    subclauses: [
      { ref: "13.1", text: "Notices, All notices required or permitted under this Agreement shall be in writing and may be delivered by: (a) prepaid registered post, deemed delivered seven (7) days after posting; (b) hand delivery, deemed delivered on the date of delivery against written acknowledgement; (c) email, deemed delivered on transmission provided no undelivered notification is received within twenty-four (24) hours." },
      { ref: "13.2", text: "Force Majeure, Neither Party shall be liable for any delay or failure to perform their obligations hereunder to the extent caused by events beyond their reasonable control, including acts of God, natural disasters, civil unrest, governmental orders, pandemic or epidemic declarations. If such circumstances persist for more than ninety (90) consecutive days, either Party may terminate this Agreement by written notice, without liability, save for obligations accrued prior to the force majeure event." },
      { ref: "13.3", text: "Governing Law and Jurisdiction, This Agreement shall be governed by and construed in accordance with the laws of the Republic of South Africa. The Parties submit to the non-exclusive jurisdiction of the High Court of South Africa, Gauteng Division, Johannesburg. Prior to commencing any legal proceedings, the Parties shall attempt to resolve any dispute by good faith negotiation for a period of not less than twenty-one (21) days following written notice of the dispute." },
      { ref: "13.4", text: "Confidentiality, Each Party undertakes to keep confidential all proprietary or commercially sensitive information of the other Party disclosed during the Term, and not to disclose such information to any third party without the prior written consent of the disclosing Party, except as required by law." },
      { ref: "13.5", text: "Indemnity, The Artist shall indemnify and hold Management harmless against all losses, claims, damages, and legal costs arising from any breach by the Artist of the Artist's representations, warranties, or obligations hereunder. Management shall indemnify and hold the Artist harmless against all losses, claims, damages, and legal costs arising from any breach by Management of Management's representations, warranties, or obligations hereunder." },
      { ref: "13.6", text: "Assignment, The Artist shall not assign, transfer, or encumber any rights or obligations under this Agreement without Management's prior written consent. Management may assign its rights and obligations to a successor entity upon reasonable prior written notice to the Artist, provided that such assignment does not materially reduce the standard of services delivered to the Artist." },
      { ref: "13.7", text: "Entire Agreement, This Agreement, together with the First Schedule, constitutes the entire agreement between the Parties relating to its subject matter and supersedes all prior discussions, representations, and agreements whether oral or written. No variation shall be effective unless in writing and signed by both Parties." },
      { ref: "13.8", text: "Severability, If any provision of this Agreement is found to be invalid, illegal, or unenforceable by a competent court, such provision shall be severed and the remaining provisions shall continue in full force and effect." },
      { ref: "13.9", text: "Waiver, A failure or delay by either Party to exercise any right or remedy under this Agreement shall not constitute a waiver of that or any other right or remedy. No waiver shall be effective unless made in writing." },
    ],
  },
];

const SA_SCHEDULE = {
  title: "First Schedule, Fees, Support Services, and Recoverable Costs",
  sections: [
    {
      label: "A, Support Provided by Management to the Artist",
      note: "Management shall supply the following to the Artist at no direct cost to the Artist during the Term:",
      items: [
        "A dedicated business email address for all professional communications relating to the Artist's Services during the Term.",
        "Secure access to a management portal or shared cloud workspace where the Artist may review itineraries, income statements, contracts, and other records.",
        "Facilitation of SAMRO and SAMPRA registration for all new works created during the Term.",
        "Basic digital profile optimisation across key streaming and social platforms at the commencement of the Term.",
      ],
    },
    {
      label: "B, Management Fee Structure",
      note: "Management shall be entitled to deduct the following from Gross Income received on behalf of the Artist:",
      table: [
        { category: "Live performance income", rate: "20% of Gross Income" },
        { category: "Brand partnership & endorsement income", rate: "20% of Gross Income" },
        { category: "Record label income (received directly by Artist)", rate: "20% of Gross Income" },
        { category: "Music publishing income (received directly by Artist)", rate: "20% of Gross Income" },
        { category: "Digital Platform royalties and monetisation", rate: "20% of Gross Income" },
        { category: "Sync licensing and advertising income", rate: "20% of Gross Income" },
        { category: "Merchandise income", rate: "15% of Gross Income" },
        { category: "Monthly Gross Income exceeding R1,000,000.00", rate: "22.5% for that month" },
        { category: "Monthly Gross Income exceeding R2,000,000.00", rate: "25% for that month" },
        { category: "Monthly Gross Income exceeding R5,000,000.00", rate: "27.5% for that month" },
      ],
    },
    {
      label: "C, Costs Recoverable by Management",
      note: "In addition to the Management Fee, Management shall be entitled to recover the following costs from Gross Income prior to calculating Net Income:",
      items: [
        "Visa, work permit, and travel documentation fees incurred for international engagements.",
        "Legal and business affairs costs directly associated with disputes, licensing, or contract negotiations that generate income for the Artist, with prior written notification to the Artist.",
        "Verified transport, accommodation, and communication costs not covered by a third-party purchaser, incurred directly in connection with the Artist's engagements.",
        "Any other cost specifically agreed in writing by both Parties in advance.",
      ],
      footer: "All recoverable costs shall be substantiated by documentary evidence and detailed in the monthly income statement.",
    },
  ],
};

/** Returns true for definition-style refs like "Acts", "SAMRO", "Artist's Services" */
function isDefKey(ref: string): boolean {
  if (ref.includes(" ")) return true; // e.g. "Artist's Services"
  if (/^\d/.test(ref)) return false;  // e.g. "2.1.4"
  if (ref.length === 1) return false;  // e.g. "a", "b"
  return /^[A-Z]/.test(ref);          // e.g. "Acts", "SAMRO", "BSDA"
}

function ClauseAccordion({ clause, open, onToggle }: { clause: Clause; open: boolean; onToggle: () => void }) {
  return (
    <div id={`clause-${clause.id}`} className="glass-card rounded-xl overflow-hidden">

      {/* ── Accordion header ─────────────────────────────────── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-0 min-w-0">
          {/* Fixed-width clause number — right-aligned so "1"–"21" all line up */}
          <span
            className="text-xs font-black w-8 text-right flex-shrink-0 tabular-nums pr-3"
            style={{ color: MODULE_COLOR }}
          >
            {clause.id}
          </span>
          {/* Hairline divider */}
          <span className="w-px h-4 flex-shrink-0 mr-3 opacity-30" style={{ backgroundColor: MODULE_COLOR }} />
          <span className="font-bold text-text-primary leading-snug">{clause.title}</span>
        </div>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* ── Expanded body ────────────────────────────────────── */}
      {open && (
        <div className="border-t border-border divide-y divide-border/60">
          {clause.subclauses.map((sub) => (
            <div key={sub.ref} className="px-5 py-3.5">

              {isDefKey(sub.ref) ? (
                /* Definition entry — term inline with body text */
                <p className="text-sm text-text-muted leading-relaxed">
                  <span className="font-bold text-text-primary mr-1">
                    &ldquo;{sub.ref}&rdquo;
                  </span>
                  {sub.text}
                </p>
              ) : (
                /* Numbered sub-clause — fixed-width ref column */
                <div className="flex gap-0">
                  <span
                    className="text-xs font-black flex-shrink-0 w-20 text-right tabular-nums pt-0.5 pr-4"
                    style={{ color: MODULE_COLOR }}
                  >
                    {sub.ref}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary leading-relaxed">{sub.text}</p>

                    {/* Nested sub-items */}
                    {sub.sub && (
                      <div
                        className="mt-3 pl-4 space-y-2.5 border-l-2"
                        style={{ borderColor: `${MODULE_COLOR}25` }}
                      >
                        {sub.sub.map((item) => (
                          isDefKey(item.ref) ? (
                            /* Definition at sub-sub level */
                            <p key={item.ref} className="text-sm text-text-muted leading-relaxed">
                              <span className="font-semibold text-text-primary mr-1">
                                &ldquo;{item.ref}&rdquo;
                              </span>
                              {item.text}
                            </p>
                          ) : (
                            /* Numbered sub-sub item — fixed-width ref column */
                            <div key={item.ref} className="flex gap-0">
                              <span
                                className="text-xs font-bold flex-shrink-0 w-16 text-right tabular-nums pt-0.5 pr-3"
                                style={{ color: `${MODULE_COLOR}AA` }}
                              >
                                {item.ref}
                              </span>
                              <p className="text-sm text-text-muted leading-relaxed flex-1">{item.text}</p>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgreementPage() {
  const { country, sym } = useLocale();
  const res = getCountryResources(country);
  const isAlgeria = country === "Algeria";
  const isNigeria = country === "Nigeria";
  const isKenya = country === "Kenya";
  const isGhana = country === "Ghana";
  const isTanzania = country === "Tanzania";
  const isUganda = country === "Uganda";
  const isZimbabwe = country === "Zimbabwe";
  const isEthiopia = country === "Ethiopia";
  const isEgypt = country === "Egypt";
  const isMorocco = country === "Morocco";
  const isCoteDIvoire = country === "Côte d'Ivoire";
  const isCameroon = country === "Cameroon";
  const isAngola = country === "Angola";
  const isSenegal = country === "Senegal";
  const isSA = country === "South Africa";
  const isDedicatedAgreement = isAlgeria || isNigeria || isKenya || isGhana || isTanzania || isUganda || isZimbabwe || isEthiopia || isEgypt || isMorocco || isCoteDIvoire || isCameroon || isAngola || isSenegal;

  // ── For non-Algeria countries: localise the SA base agreement ──────────────
  const proAbbr        = res.performanceRights.abbr;
  const mechAbbr       = res.mechanicalRights?.abbr ?? proAbbr;
  const neighbourAbbr  = res.neighbouringRights?.abbr ?? proAbbr;
  const taxAbbr        = res.taxAuthorityAbbr ?? "SARS";
  const busRegAbbr     = res.businessRegAbbr ?? "CIPC";
  const govLaw         = res.governingLaw ?? "the Republic of South Africa";
  const lawyerNote     = res.lawyerNote ?? "qualified entertainment attorney";

  const loc = useCallback((text: string): string => text
    .replace(/\bSAMRO\b(?:\s*\([^)]*\))?/g, proAbbr)
    .replace(/\bCAPASSO\b(?:\s*\([^)]*\))?/g, mechAbbr)
    .replace(/\bSAMPRA\b(?:\s*\([^)]*\))?/g, neighbourAbbr)
    .replace(/\bSARS\b/g, taxAbbr)
    .replace(/\bCIPC\b/g, busRegAbbr)
    .replace(/the Republic of South Africa/g, govLaw)
    .replace(/Republic of South Africa/g, govLaw)
    .replace(/laws of South Africa\b/g, `laws of ${country}`)
    .replace(/High Court of South Africa, Gauteng Division, Johannesburg/g, `the courts of ${country}`)
    .replace(/South African passport/g, `${country} passport`)
    .replace(/\bSouth African\b/g, country)
    .replace(/\bSouth Africa\b/g, country)
    .replace(/(?:the )?Copyright Act 98 of 1978/g, "the Copyright Act")
    .replace(/(?:the )?Performers['']?\s*Protection Act 11 of 1967/g, "the applicable performers' protection legislation")
    .replace(/(?:the )?Electronic Communications Act 36 of 2005/g, "the applicable electronic communications legislation")
    .replace(/(?:the )?Consumer Protection Act 68 of 2008/g, "the applicable consumer protection legislation")
    .replace(/(?:the )?Income Tax Act 58 of 1962/g, "the applicable income tax legislation")
    .replace(/(?:the )?National Credit Act 34 of 2005/g, "the applicable credit legislation")
    .replace(/Arbitration Foundation of Southern Africa(?:\s*\([^)]*\))?/g, "the applicable arbitration body")
    .replace(/\bIRP6\b/g, "the applicable provisional tax return")
    .replace(/\bZAR\b/g, res.currency ?? "ZAR")
    .replace(/\bR(\d[\d,]*(?:\.\d{2})?)\b/g, `${sym}\u00A0$1`)
  , [proAbbr, mechAbbr, neighbourAbbr, taxAbbr, busRegAbbr, govLaw, country, sym, res.currency]);

  // ── Resolve which clauses to display ──────────────────────────────────────
  const activeClauses: Clause[] = useMemo(() => {
    if (isAlgeria) return ALGERIA_CLAUSES;
    if (isNigeria) return NIGERIA_CLAUSES;
    if (isKenya) return KENYA_CLAUSES;
    if (isGhana) return GHANA_CLAUSES;
    if (isTanzania) return TANZANIA_CLAUSES;
    if (isUganda) return UGANDA_CLAUSES;
    if (isZimbabwe) return ZIMBABWE_CLAUSES;
    if (isEthiopia) return ETHIOPIA_CLAUSES;
    if (isEgypt) return EGYPT_CLAUSES;
    if (isMorocco) return MOROCCO_CLAUSES;
    if (isCoteDIvoire) return COTE_DIVOIRE_CLAUSES;
    if (isCameroon) return CAMEROON_CLAUSES;
    if (isAngola) return ANGOLA_CLAUSES;
    if (isSenegal) return SENEGAL_CLAUSES;
    return SA_CLAUSES.map(clause => ({
      ...clause,
      subclauses: clause.subclauses.map(sub => ({
        ...sub,
        text: loc(sub.text),
        sub: sub.sub?.map(item => ({ ...item, text: loc(item.text) })),
      })),
    }));
  }, [isAlgeria, isNigeria, isKenya, isGhana, isTanzania, isUganda, isZimbabwe, isEthiopia, isEgypt, isMorocco, isCoteDIvoire, isCameroon, isAngola, isSenegal, loc]);

  // ── Schedule rendering ─────────────────────────────────────────────────────
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [openClauses, setOpenClauses] = useState<Set<string>>(new Set(["1"]));

  const localizedSASchedule = useMemo(() => ({
    ...SA_SCHEDULE,
    sections: SA_SCHEDULE.sections.map(sec => ({
      ...sec,
      note: loc(sec.note),
      items: sec.items?.map(loc),
      table: sec.table?.map(row => ({ ...row, category: loc(row.category), rate: loc(row.rate) })),
      footer: sec.footer ? loc(sec.footer) : undefined,
    })),
  }), [loc]);

  const toggleClause = (id: string) =>
    setOpenClauses(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const scrollToClause = (id: string) => {
    setOpenClauses(prev => new Set(Array.from(prev).concat(id)));
    setTimeout(() => {
      document.getElementById(`clause-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // ── Algeria-specific header info ───────────────────────────────────────────
  const headerLaw = isAlgeria
    ? `Prepared under ${ALGERIA_META.lawReference}, governing copyright and related rights in ${ALGERIA_META.governingLaw}.`
    : isNigeria
    ? `Prepared under the ${NIGERIA_META.lawReference}, governing copyright and related rights in ${NIGERIA_META.governingLaw}.`
    : isKenya
    ? `Prepared under the ${KENYA_META.lawReference}, governing copyright and related rights in ${KENYA_META.governingLaw}.`
    : isGhana
    ? `Prepared under the ${GHANA_META.lawReference}, governing copyright and related rights in ${GHANA_META.governingLaw}.`
    : isTanzania
    ? `Prepared under the ${TANZANIA_META.lawReference}, governing copyright and related rights in ${TANZANIA_META.governingLaw}.`
    : isUganda
    ? `Prepared under the ${UGANDA_META.lawReference}, governing copyright and related rights in ${UGANDA_META.governingLaw}.`
    : isZimbabwe
    ? `Prepared under the ${ZIMBABWE_META.lawReference}, governing copyright and related rights in ${ZIMBABWE_META.governingLaw}.`
    : isEthiopia
    ? `Prepared under the ${ETHIOPIA_META.lawReference}, governing copyright and related rights in ${ETHIOPIA_META.governingLaw}.`
    : isEgypt
    ? `Prepared under the ${EGYPT_META.lawReference}, governing copyright and related rights in ${EGYPT_META.governingLaw}.`
    : isMorocco
    ? `Prepared under the ${MOROCCO_META.lawReference}, governing copyright and related rights in ${MOROCCO_META.governingLaw}.`
    : isCoteDIvoire
    ? `Prepared under the ${COTE_DIVOIRE_META.lawReference}, governing copyright and related rights in ${COTE_DIVOIRE_META.governingLaw}.`
    : isCameroon
    ? `Prepared under the ${CAMEROON_META.lawReference}, governing copyright and related rights in ${CAMEROON_META.governingLaw}.`
    : isAngola
    ? `Prepared under the ${ANGOLA_META.lawReference}, governing copyright and related rights in ${ANGOLA_META.governingLaw}.`
    : isSenegal
    ? `Prepared under the ${SENEGAL_META.lawReference}, governing copyright and related rights in ${SENEGAL_META.governingLaw}.`
    : loc("Prepared under the Copyright Act 98 of 1978, the Performers\u2019 Protection Act 11 of 1967, the Electronic Communications Act 36 of 2005, and the Consumer Protection Act 68 of 2008.");

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/startup" className="hover:text-text-primary transition-colors">Onboarding New Artists</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Management Agreement</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: "#C9A84C25" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: MODULE_COLOR }}>
              {res.flag} {res.country} · 2026 Edition
            </p>
            <h1 className="text-2xl font-black text-text-primary mb-2">Exclusive Artist Management Agreement</h1>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">{headerLaw}</p>
            {isAlgeria && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{ALGERIA_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{ALGERIA_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{ALGERIA_META.currency}</span>
              </div>
            )}
            {isNigeria && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{NIGERIA_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{NIGERIA_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{NIGERIA_META.currency}</span>
              </div>
            )}
            {isKenya && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{KENYA_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{KENYA_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{KENYA_META.currency}</span>
              </div>
            )}
            {isGhana && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{GHANA_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{GHANA_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{GHANA_META.currency}</span>
              </div>
            )}
            {isTanzania && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{TANZANIA_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{TANZANIA_META.neighbouringRights}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{TANZANIA_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{TANZANIA_META.currency}</span>
              </div>
            )}
            {isUganda && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{UGANDA_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{UGANDA_META.neighbouringRights}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{UGANDA_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{UGANDA_META.currency}</span>
              </div>
            )}
            {isZimbabwe && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{ZIMBABWE_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{ZIMBABWE_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{ZIMBABWE_META.currency}</span>
              </div>
            )}
            {isEthiopia && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{ETHIOPIA_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{ETHIOPIA_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{ETHIOPIA_META.currency}</span>
              </div>
            )}
            {isEgypt && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{EGYPT_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{EGYPT_META.neighbouringRights}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{EGYPT_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{EGYPT_META.currency}</span>
              </div>
            )}
            {isMorocco && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{MOROCCO_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{MOROCCO_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{MOROCCO_META.currency}</span>
              </div>
            )}
            {isCoteDIvoire && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{COTE_DIVOIRE_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{COTE_DIVOIRE_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{COTE_DIVOIRE_META.currency}</span>
              </div>
            )}
            {isCameroon && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{CAMEROON_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{CAMEROON_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{CAMEROON_META.currency}</span>
              </div>
            )}
            {isAngola && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{ANGOLA_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{ANGOLA_META.neighbouringRights}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{ANGOLA_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{ANGOLA_META.currency}</span>
              </div>
            )}
            {isSenegal && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{SENEGAL_META.rightsBody}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{SENEGAL_META.taxAuthority}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{SENEGAL_META.currency}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {activeClauses.map(c => (
                <button key={c.id} onClick={() => scrollToClause(c.id)}
                  className="text-[10px] font-black tabular-nums min-w-[2.75rem] text-center px-2 py-0.5 rounded transition-all hover:brightness-125 hover:scale-105"
                  style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>§{c.id}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SendForSignatureButton
              contractType="Management Agreement"
              contractTitle={`Exclusive Artist Management Agreement (${res.country})`}
              getContractHtml={() => {
                const el = document.getElementById("contract-printable");
                return el ? el.innerHTML : "";
              }}
              contractMetadata={{ country: res.country, edition: "2026" }}
              color={MODULE_COLOR}
            />
            <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80" style={{ backgroundColor: `${MODULE_COLOR}20`, color: MODULE_COLOR, border: `1px solid ${MODULE_COLOR}30` }}><Printer size={15}/><span className="hidden sm:inline">Save as PDF</span></button>
          </div>
        </div>
      </div>

      {/* Legal notice */}
      <div className="glass-card rounded-xl p-4 mb-4 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.2)", backgroundColor: "rgba(239,68,68,0.04)" }}>
        <span className="text-base flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold" style={{ color: "#EF4444" }}>Legal notice.</span> This agreement is a template for reference and education. Before signing any management agreement, both parties are strongly advised to seek independent legal counsel from a {isAlgeria ? ALGERIA_META.lawyerNote : isNigeria ? NIGERIA_META.lawyerNote : isKenya ? KENYA_META.lawyerNote : isGhana ? GHANA_META.lawyerNote : isTanzania ? TANZANIA_META.lawyerNote : isUganda ? UGANDA_META.lawyerNote : isZimbabwe ? ZIMBABWE_META.lawyerNote : isEthiopia ? ETHIOPIA_META.lawyerNote : isEgypt ? EGYPT_META.lawyerNote : isMorocco ? MOROCCO_META.lawyerNote : isCoteDIvoire ? COTE_DIVOIRE_META.lawyerNote : isCameroon ? CAMEROON_META.lawyerNote : isAngola ? ANGOLA_META.lawyerNote : isSenegal ? SENEGAL_META.lawyerNote : lawyerNote}. This document constitutes the entire agreement between the Parties when signed and should not be modified without legal advice.
        </p>
      </div>

      {/* Algeria context banner */}
      {isAlgeria && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇩🇿</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Algeria · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is drafted under <span className="font-semibold text-text-primary">{ALGERIA_META.lawReference}</span>. Rights registration is through <span className="font-semibold text-text-primary">{ALGERIA_META.rightsBody}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{ALGERIA_META.taxAuthority}</span>. Business registration references <span className="font-semibold text-text-primary">{ALGERIA_META.businessReg}</span>. Disputes are referred to <span className="font-semibold text-text-primary">{ALGERIA_META.arbitration}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Nigeria context banner */}
      {isNigeria && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇳🇬</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Nigeria · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is governed by the <span className="font-semibold text-text-primary">{NIGERIA_META.lawReference}</span>. Performance &amp; composition royalties are collected by <span className="font-semibold text-text-primary">{NIGERIA_META.rightsBodyFull}</span>. Mechanical royalties via <span className="font-semibold text-text-primary">{NIGERIA_META.mechanicalRights} (MCSN)</span>. Neighbouring rights via <span className="font-semibold text-text-primary">{NIGERIA_META.neighbouringRights}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{NIGERIA_META.taxAuthorityFull}</span>. Business registration references <span className="font-semibold text-text-primary">{NIGERIA_META.businessRegFull}</span>. Disputes are referred to <span className="font-semibold text-text-primary">{NIGERIA_META.arbitration}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Kenya context banner */}
      {isKenya && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇰🇪</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Kenya · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is governed by the <span className="font-semibold text-text-primary">{KENYA_META.lawReference}</span>. Performance &amp; composition royalties are collected by <span className="font-semibold text-text-primary">{KENYA_META.rightsBodyFull}</span>. Neighbouring rights via <span className="font-semibold text-text-primary">{KENYA_META.neighbouringRightsFull}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{KENYA_META.taxAuthorityFull}</span>. Business registration references <span className="font-semibold text-text-primary">{KENYA_META.businessRegFull}</span>. Disputes are referred to <span className="font-semibold text-text-primary">{KENYA_META.arbitration}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Ghana context banner */}
      {isGhana && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇬🇭</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Ghana · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is governed by the <span className="font-semibold text-text-primary">{GHANA_META.lawReference}</span>. Performance, composition, and neighbouring rights royalties are collected by <span className="font-semibold text-text-primary">{GHANA_META.rightsBodyFull}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{GHANA_META.taxAuthorityFull}</span>. Business registration references the <span className="font-semibold text-text-primary">{GHANA_META.businessRegFull}</span>. Disputes are referred to the <span className="font-semibold text-text-primary">{GHANA_META.arbitration}</span> in Accra.
            </p>
          </div>
        </div>
      )}

      {/* Tanzania context banner */}
      {isTanzania && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇹🇿</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Tanzania · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is governed by the <span className="font-semibold text-text-primary">{TANZANIA_META.lawReference}</span>. Performance &amp; composition royalties are collected by <span className="font-semibold text-text-primary">{TANZANIA_META.rightsBodyFull}</span>. Neighbouring rights via <span className="font-semibold text-text-primary">{TANZANIA_META.neighbouringRightsFull}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{TANZANIA_META.taxAuthorityFull}</span>. Business registration references <span className="font-semibold text-text-primary">{TANZANIA_META.businessRegFull}</span>. Disputes are referred to the <span className="font-semibold text-text-primary">{TANZANIA_META.arbitrationFull}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Uganda context banner */}
      {isUganda && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇺🇬</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Uganda · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is governed by the <span className="font-semibold text-text-primary">{UGANDA_META.lawReference}</span>. Performance &amp; composition royalties are collected by <span className="font-semibold text-text-primary">{UGANDA_META.rightsBodyFull}</span>. Neighbouring rights via <span className="font-semibold text-text-primary">{UGANDA_META.neighbouringRightsFull}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{UGANDA_META.taxAuthorityFull}</span>. Business registration references <span className="font-semibold text-text-primary">{UGANDA_META.businessRegFull}</span>. Disputes are referred to the <span className="font-semibold text-text-primary">{UGANDA_META.arbitration}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Zimbabwe context banner */}
      {isZimbabwe && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇿🇼</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Zimbabwe · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is governed by the <span className="font-semibold text-text-primary">{ZIMBABWE_META.lawReference}</span>. Performance, composition, and neighbouring rights royalties are collected by <span className="font-semibold text-text-primary">{ZIMBABWE_META.rightsBodyFull}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{ZIMBABWE_META.taxAuthorityFull}</span>. Business registration references <span className="font-semibold text-text-primary">{ZIMBABWE_META.businessRegFull}</span>. Disputes are referred to the <span className="font-semibold text-text-primary">{ZIMBABWE_META.arbitration}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Ethiopia context banner */}
      {isEthiopia && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇪🇹</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Ethiopia · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is governed by the <span className="font-semibold text-text-primary">{ETHIOPIA_META.lawReference}</span>. Performance, composition, and neighbouring rights royalties are collected by <span className="font-semibold text-text-primary">{ETHIOPIA_META.rightsBodyFull}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{ETHIOPIA_META.taxAuthorityFull}</span>. Business registration references <span className="font-semibold text-text-primary">{ETHIOPIA_META.businessRegFull}</span>. Disputes are referred to the <span className="font-semibold text-text-primary">{ETHIOPIA_META.arbitration}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Morocco context banner */}
      {isMorocco && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇲🇦</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Morocco · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is governed by the <span className="font-semibold text-text-primary">{MOROCCO_META.lawReference}</span>. Performance, composition, and neighbouring rights royalties are collected by <span className="font-semibold text-text-primary">{MOROCCO_META.rightsBodyFull}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{MOROCCO_META.taxAuthorityFull}</span>. Business registration references <span className="font-semibold text-text-primary">{MOROCCO_META.businessRegFull}</span>. Disputes are referred to the <span className="font-semibold text-text-primary">{MOROCCO_META.arbitration}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Côte d'Ivoire context banner */}
      {isCoteDIvoire && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇨🇮</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Côte d&apos;Ivoire · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is governed by the <span className="font-semibold text-text-primary">{COTE_DIVOIRE_META.lawReference}</span>. Performance, composition, and neighbouring rights royalties are collected by <span className="font-semibold text-text-primary">{COTE_DIVOIRE_META.rightsBodyFull}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{COTE_DIVOIRE_META.taxAuthorityFull}</span>. Business registration references <span className="font-semibold text-text-primary">{COTE_DIVOIRE_META.businessRegFull}</span>. Disputes are referred to the <span className="font-semibold text-text-primary">{COTE_DIVOIRE_META.arbitration}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Cameroon context banner */}
      {isCameroon && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇨🇲</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Cameroon · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is governed by the <span className="font-semibold text-text-primary">{CAMEROON_META.lawReference}</span>. Performance, composition, and neighbouring rights royalties are collected by <span className="font-semibold text-text-primary">{CAMEROON_META.rightsBodyFull}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{CAMEROON_META.taxAuthorityFull}</span>. Business registration references <span className="font-semibold text-text-primary">{CAMEROON_META.businessRegFull}</span>. Disputes are referred to <span className="font-semibold text-text-primary">{CAMEROON_META.arbitration}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Angola context banner */}
      {isAngola && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇦🇴</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Angola · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is governed by the <span className="font-semibold text-text-primary">{ANGOLA_META.lawReference}</span>. Performance and composition royalties are collected by <span className="font-semibold text-text-primary">{ANGOLA_META.rightsBodyFull}</span>. Neighbouring rights are collected by <span className="font-semibold text-text-primary">{ANGOLA_META.neighbouringRightsFull}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{ANGOLA_META.taxAuthorityFull}</span>. Business registration references <span className="font-semibold text-text-primary">{ANGOLA_META.businessRegFull}</span>. Disputes are referred to <span className="font-semibold text-text-primary">{ANGOLA_META.arbitration}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Senegal context banner */}
      {isSenegal && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇸🇳</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Senegal · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is governed by the <span className="font-semibold text-text-primary">{SENEGAL_META.lawReference}</span>. Performance, composition, and neighbouring rights royalties are collected by <span className="font-semibold text-text-primary">{SENEGAL_META.rightsBodyFull}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{SENEGAL_META.taxAuthorityFull}</span>. Business registration references <span className="font-semibold text-text-primary">{SENEGAL_META.businessRegFull}</span>. Disputes are referred to <span className="font-semibold text-text-primary">{SENEGAL_META.arbitration}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Egypt context banner */}
      {isEgypt && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">🇪🇬</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>Egypt · Governing Law</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This agreement is governed by the <span className="font-semibold text-text-primary">{EGYPT_META.lawReference}</span>. Performance &amp; composition royalties are collected by <span className="font-semibold text-text-primary">{EGYPT_META.rightsBodyFull}</span>. Neighbouring rights via <span className="font-semibold text-text-primary">{EGYPT_META.neighbouringRightsFull}</span>. Tax compliance is governed by <span className="font-semibold text-text-primary">{EGYPT_META.taxAuthorityFull}</span>. Business registration references <span className="font-semibold text-text-primary">{EGYPT_META.businessRegFull}</span>. Disputes are referred to the <span className="font-semibold text-text-primary">{EGYPT_META.arbitration}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Non-SA localisation context banner (for non-SA, non-dedicated-agreement countries) */}
      {!isSA && !isDedicatedAgreement && (
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: `${MODULE_COLOR}25`, backgroundColor: `${MODULE_COLOR}06` }}>
          <span className="text-base flex-shrink-0">{res.flag}</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: MODULE_COLOR }}>{res.country} Context Note</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This template was prepared with South African law as its base. If you are operating in {res.country}, key adaptations will be required: references to the Copyright Act 98 of 1978 and South African Acts should be replaced with applicable {res.country} legislation. Rights registration should reference <span className="font-semibold text-text-primary">{proAbbr}</span> ({res.performanceRights.name}) rather than SAMRO/SAMPRA. Governing law should specify {res.governingLaw ?? res.country}. Have a {lawyerNote} review and adapt this template before use.
            </p>
          </div>
        </div>
      )}

      {/* Parties box */}
      <div className="glass-card rounded-xl p-5 mb-8" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
        <p className="text-xs font-black uppercase tracking-widest text-brand mb-4">Contracting Parties</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg p-4 space-y-1" style={{ backgroundColor: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
            <p className="text-xs font-black uppercase tracking-wider text-brand">The Management Company</p>
            <p className="text-sm text-text-primary font-semibold">[Management Company Name]</p>
            <p className="text-xs text-text-muted">
              {isAlgeria ? `${ALGERIA_META.signatoryRegLabel} · Address · Email` : isNigeria ? `${NIGERIA_META.signatoryRegLabel} · Address · Email` : isKenya ? `${KENYA_META.signatoryRegLabel} · Address · Email` : isGhana ? `${GHANA_META.signatoryRegLabel} · Address · Email` : isTanzania ? `${TANZANIA_META.signatoryRegLabel} · Address · Email` : isUganda ? `${UGANDA_META.signatoryRegLabel} · Address · Email` : isZimbabwe ? `${ZIMBABWE_META.signatoryRegLabel} · Address · Email` : isEthiopia ? `${ETHIOPIA_META.signatoryRegLabel} · Address · Email` : isEgypt ? `${EGYPT_META.signatoryRegLabel} · Address · Email` : isMorocco ? `${MOROCCO_META.signatoryRegLabel} · Address · Email` : isCoteDIvoire ? `${COTE_DIVOIRE_META.signatoryRegLabel} · Address · Email` : isCameroon ? `${CAMEROON_META.signatoryRegLabel} · Address · Email` : isAngola ? `${ANGOLA_META.signatoryRegLabel} · Address · Email` : isSenegal ? `${SENEGAL_META.signatoryRegLabel} · Address · Email` : "Registration No. · Physical Address · Email"}
            </p>
            <p className="text-xs text-text-muted italic">hereinafter &quot;MANAGEMENT&quot;</p>
          </div>
          <div className="rounded-lg p-4 space-y-1" style={{ backgroundColor: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
            <p className="text-xs font-black uppercase tracking-wider text-brand">The Artist</p>
            <p className="text-sm text-text-primary font-semibold">[Artist Full Legal Name]</p>
            <p className="text-xs text-text-muted">
              {isAlgeria ? `${ALGERIA_META.signatoryIdLabel} · Address · Email` : isNigeria ? `${NIGERIA_META.signatoryIdLabel} · Address · Email` : isKenya ? `${KENYA_META.signatoryIdLabel} · Address · Email` : isGhana ? `${GHANA_META.signatoryIdLabel} · Address · Email` : isTanzania ? `${TANZANIA_META.signatoryIdLabel} · Address · Email` : isUganda ? `${UGANDA_META.signatoryIdLabel} · ${UGANDA_META.signatoryTaxLabel} · Address · Email` : isZimbabwe ? `${ZIMBABWE_META.signatoryIdLabel} · ${ZIMBABWE_META.signatoryTaxLabel} · Address · Email` : isEthiopia ? `${ETHIOPIA_META.signatoryIdLabel} · ${ETHIOPIA_META.signatoryTaxLabel} · Address · Email` : isEgypt ? `${EGYPT_META.signatoryIdLabel} · ${EGYPT_META.signatoryTaxLabel} · Address · Email` : isMorocco ? `${MOROCCO_META.signatoryIdLabel} · ${MOROCCO_META.signatoryTaxLabel} · Address · Email` : isCoteDIvoire ? `${COTE_DIVOIRE_META.signatoryIdLabel} · ${COTE_DIVOIRE_META.signatoryTaxLabel} · Address · Email` : isCameroon ? `${CAMEROON_META.signatoryIdLabel} · ${CAMEROON_META.signatoryTaxLabel} · Address · Email` : isAngola ? `${ANGOLA_META.signatoryIdLabel} · ${ANGOLA_META.signatoryTaxLabel} · Address · Email` : isSenegal ? `${SENEGAL_META.signatoryIdLabel} · ${SENEGAL_META.signatoryTaxLabel} · Address · Email` : "ID No. · Residential Address · Email"}
            </p>
            <p className="text-xs text-text-muted italic">hereinafter &quot;ARTIST&quot;</p>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-4 leading-relaxed">
          <span className="font-semibold text-text-primary">Effective Date:</span> ___________________________ &nbsp;|&nbsp; This Agreement constitutes the entire and exclusive arrangement between the Parties with respect to the management of the Artist&apos;s professional career. Both Parties are advised to seek independent legal counsel before signing.
        </p>
      </div>

      {/* Clauses */}
      <div id="contract-printable" className="space-y-3 mb-8">
        {activeClauses.map(clause => (
          <ClauseAccordion
            key={clause.id}
            clause={clause}
            open={openClauses.has(clause.id)}
            onToggle={() => toggleClause(clause.id)}
          />
        ))}
      </div>

      {/* First Schedule */}
      <div className="glass-card rounded-xl overflow-hidden mb-8">
        <button
          onClick={() => setScheduleOpen(o => !o)}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-black flex-shrink-0" style={{ color: MODULE_COLOR }}>FS</span>
            <span className="font-bold text-text-primary">First Schedule — Fees, Support &amp; Recoverable Costs</span>
          </div>
          <ChevronDown
            size={16}
            className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${scheduleOpen ? "rotate-180" : ""}`}
          />
        </button>

        {scheduleOpen && (
          <div className="px-5 pb-6 pt-2 border-t border-border space-y-6">
            {(isAlgeria || isNigeria || isKenya || isGhana || isTanzania || isUganda || isZimbabwe || isEthiopia || isEgypt || isMorocco || isCoteDIvoire || isCameroon || isAngola || isSenegal) ? (
              // ── Dedicated-agreement countries: aligned schedule ───────────
              <div className="divide-y divide-border/60">
                {(isAlgeria ? ALGERIA_SCHEDULE : isNigeria ? NIGERIA_SCHEDULE : isKenya ? KENYA_SCHEDULE : isGhana ? GHANA_SCHEDULE : isUganda ? UGANDA_SCHEDULE : isZimbabwe ? ZIMBABWE_SCHEDULE : isEthiopia ? ETHIOPIA_SCHEDULE : isEgypt ? EGYPT_SCHEDULE : isMorocco ? MOROCCO_SCHEDULE : isCoteDIvoire ? COTE_DIVOIRE_SCHEDULE : isCameroon ? CAMEROON_SCHEDULE : isAngola ? ANGOLA_SCHEDULE : isSenegal ? SENEGAL_SCHEDULE : TANZANIA_SCHEDULE).map((item, i) => {
                  const isSection = !item.ref.includes(".");
                  return isSection ? (
                    /* Section header — e.g. "A" or "B" */
                    <div key={i} className={`flex items-start gap-0 py-3.5 ${i > 0 ? "pt-5" : ""}`}>
                      <span
                        className="text-xs font-black w-12 text-right flex-shrink-0 tabular-nums pr-3 pt-0.5"
                        style={{ color: MODULE_COLOR }}
                      >
                        {item.ref}
                      </span>
                      <span className="w-px h-4 flex-shrink-0 mr-3 mt-0.5 opacity-30" style={{ backgroundColor: MODULE_COLOR }} />
                      <p className="text-sm font-bold text-text-primary leading-relaxed flex-1">{item.text}</p>
                    </div>
                  ) : (
                    /* Schedule item — e.g. "A.1", "B.6" */
                    <div key={i} className="flex gap-0 py-3">
                      <span
                        className="text-xs font-bold w-12 text-right flex-shrink-0 tabular-nums pr-3 pt-0.5"
                        style={{ color: `${MODULE_COLOR}AA` }}
                      >
                        {item.ref}
                      </span>
                      <p className="text-sm text-text-muted leading-relaxed flex-1 pl-3 border-l border-border/50">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              // ── SA / other countries schedule ─────────────────────────────
              localizedSASchedule.sections.map((sec) => (
                <div key={sec.label} className="space-y-3">
                  <div className="flex items-start gap-0">
                    <span className="text-xs font-black w-12 text-right flex-shrink-0 tabular-nums pr-3 pt-0.5" style={{ color: MODULE_COLOR }}>
                      {sec.label.split(",")[0]}
                    </span>
                    <span className="w-px h-4 flex-shrink-0 mr-3 mt-0.5 opacity-30" style={{ backgroundColor: MODULE_COLOR }} />
                    <p className="text-sm font-bold text-text-primary flex-1">{sec.label.split(",").slice(1).join(",").trim()}</p>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed pl-[4.5rem]">{sec.note}</p>

                  {sec.items && (
                    <div className="space-y-2 mb-1">
                      {sec.items.map((item, i) => (
                        <div key={i} className="flex gap-0">
                          <span className="text-xs font-bold flex-shrink-0 w-12 text-right tabular-nums pr-3 pt-0.5" style={{ color: `${MODULE_COLOR}AA` }}>({String.fromCharCode(97 + i)})</span>
                          <p className="text-sm text-text-muted leading-relaxed flex-1 pl-3 border-l border-border/50">{item}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {sec.table && (
                    <div className="rounded-xl overflow-hidden border border-border">
                      <div className="grid grid-cols-2 px-4 py-2" style={{ backgroundColor: `${MODULE_COLOR}10` }}>
                        <p className="text-xs font-black uppercase tracking-wider" style={{ color: MODULE_COLOR }}>Income Category</p>
                        <p className="text-xs font-black uppercase tracking-wider text-right" style={{ color: MODULE_COLOR }}>Management Fee Rate</p>
                      </div>
                      {sec.table.map((row, i) => (
                        <div key={i} className={`grid grid-cols-2 px-4 py-2.5 gap-2 ${i < sec.table!.length - 1 ? "border-b border-border" : ""}`}>
                          <p className="text-xs text-text-primary leading-relaxed">{row.category}</p>
                          <p className="text-xs font-semibold text-right" style={{ color: MODULE_COLOR }}>{row.rate}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {sec.footer && (
                    <p className="text-xs text-text-muted italic mt-3 leading-relaxed">{sec.footer}</p>
                  )}
                </div>
              ))
            )}

            {/* Applicable legislation */}
            <div className="rounded-lg p-3" style={{ backgroundColor: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
              <p className="text-xs text-text-muted leading-relaxed">
                <span className="font-semibold text-brand">Applicable legislation:</span>{" "}
                {isAlgeria
                  ? `${ALGERIA_META.lawReference} · Décret exécutif No. 97-10 du 4 Janvier 1997 (performing arts) · Code de Commerce Algérien (business registration) · ${ALGERIA_META.taxAuthority} regulations (fiscal obligations)`
                  : isNigeria
                  ? `${NIGERIA_META.lawReference} · Companies and Allied Matters Act 2020 (CAMA) · Federal Inland Revenue Service (Establishment) Act · Finance Act 2023 · ${NIGERIA_META.rightsBody} regulations (performance royalties) · ${NIGERIA_META.mechanicalRights} rules (mechanical royalties) · ${NIGERIA_META.neighbouringRights} rules (neighbouring rights)`
                  : isKenya
                  ? `${KENYA_META.lawReference} · Business Registration Service Act (Cap 499) · Kenya Revenue Authority Act (Cap 469) · ${KENYA_META.rightsBody} regulations (performance & composition royalties) · ${KENYA_META.neighbouringRights} rules (neighbouring rights) · Tax Procedures Act 2015`
                  : isGhana
                  ? `${GHANA_META.lawReference} · Companies Act 2019 (Act 992) · Ghana Revenue Authority Act 2009 (Act 791) · ${GHANA_META.rightsBody} regulations (performance, composition & neighbouring rights) · Internal Revenue Act 2000 (Act 592) · VAT Act 2013 (Act 870)`
                  : isTanzania
                  ? `${TANZANIA_META.lawReference} · Companies Act 2002 · Tanzania Revenue Authority Act 1995 · ${TANZANIA_META.rightsBody} regulations (performance & composition royalties) · ${TANZANIA_META.neighbouringRights} rules (neighbouring rights) · Income Tax Act 2004`
                  : isEthiopia
                  ? `${ETHIOPIA_META.lawReference} · Trade and Business Registration Bureau (TBRB) regulations (business registration) · ${ETHIOPIA_META.taxAuthorityFull} regulations (fiscal obligations) · ${ETHIOPIA_META.rightsBodyFull} regulations (performance, composition & neighbouring rights)`
                  : isEgypt
                  ? `${EGYPT_META.lawReference} · GAFI regulations (business registration) · ${EGYPT_META.taxAuthorityFull} regulations (fiscal obligations & VAT) · ${EGYPT_META.rightsBodyFull} (performance & composition royalties) · ${EGYPT_META.neighbouringRightsFull} (neighbouring rights)`
                  : isMorocco
                  ? `${MOROCCO_META.lawReference} · CRI regulations (business registration) · ${MOROCCO_META.taxAuthorityFull} regulations (fiscal obligations & TVA) · ${MOROCCO_META.rightsBodyFull} (performance, composition & neighbouring rights)`
                  : isCoteDIvoire
                  ? `${COTE_DIVOIRE_META.lawReference} · CEPICI regulations (business registration) · ${COTE_DIVOIRE_META.taxAuthorityFull} regulations (fiscal obligations & TVA) · ${COTE_DIVOIRE_META.rightsBodyFull} (performance, composition & neighbouring rights)`
                  : isCameroon
                  ? `${CAMEROON_META.lawReference} · ${CAMEROON_META.businessRegFull} regulations (business registration) · ${CAMEROON_META.taxAuthorityFull} regulations (fiscal obligations & TVA) · ${CAMEROON_META.rightsBodyFull} (performance, composition & neighbouring rights)`
                  : isAngola
                  ? `${ANGOLA_META.lawReference} · ${ANGOLA_META.businessRegFull} (business registration) · ${ANGOLA_META.taxAuthorityFull} regulations (fiscal obligations & IVA) · ${ANGOLA_META.rightsBodyFull} (performance & composition royalties) · ${ANGOLA_META.neighbouringRightsFull} (neighbouring rights)`
                  : isSenegal
                  ? `${SENEGAL_META.lawReference} · ${SENEGAL_META.businessRegFull} (business registration) · ${SENEGAL_META.taxAuthorityFull} regulations (fiscal obligations & TVA) · ${SENEGAL_META.rightsBodyFull} (performance, composition & neighbouring rights)`
                  : isSA
                  ? "Copyright Act 98 of 1978 · Performers\u2019 Protection Act 11 of 1967 · Electronic Communications Act 36 of 2005 · Consumer Protection Act 68 of 2008 · National Credit Act 34 of 2005 · Income Tax Act 58 of 1962"
                  : `The Copyright Act · The applicable performers\u2019 protection legislation · The applicable electronic communications legislation · The applicable consumer protection legislation · The applicable credit legislation · The applicable income tax legislation — as enacted in ${country}`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Signature block */}
      <div className="glass-card rounded-xl p-5 mb-8" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
        <p className="text-xs font-black uppercase tracking-widest text-brand mb-4">Signatures</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {["For and on behalf of [Management Company Name]", "For and on behalf of the Artist"].map((label) => (
            <div key={label} className="space-y-3">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wide">{label}</p>
              <div className="space-y-2">
                {["Signature", "Full Name & Title", "Date · Place of Signing"].map((field) => (
                  <div key={field}>
                    <p className="text-xs text-text-muted mb-1">{field}</p>
                    <div className="h-8 rounded border-b border-dashed border-brand/30"/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Back link */}
      <Link href="/dashboard/library/startup"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Onboarding New Artists
      </Link>
    </div>
  );
}
