// ─────────────────────────────────────────────────────────────
// ROSTER — Senegal Exclusive Artist Management Agreement
// Governing law: Law No. 2008-09 of January 25, 2008 on Copyright and Related Rights
// ─────────────────────────────────────────────────────────────

export const SENEGAL_META = {
  flag: "🇸🇳",
  country: "Senegal",
  currency: "XOF",
  currencySymbol: "CFA",
  governingLaw: "the Republic of Senegal",
  lawReference: "Law No. 2008-09 of January 25, 2008 on Copyright and Related Rights",
  taxAuthority: "DGID",
  taxAuthorityFull: "Direction Générale des Impôts et des Domaines (DGID)",
  rightsBody: "BSDA",
  rightsBodyFull: "Bureau Sénégalais du Droit d'Auteur (BSDA)",
  businessReg: "APIX",
  businessRegFull: "APIX (Agence de Promotion des Investissements et des Grands Travaux)",
  arbitration: "Centre d'Arbitrage, de Médiation et de Conciliation de Dakar (CAMC-D) in Dakar",
  lawyerNote: "qualified Senegalese entertainment attorney",
  clauseCount: "21 clauses + First Schedule",
  signatoryIdLabel: "Artist ID / Passport No.",
  signatoryRegLabel: "APIX Registration No.",
  signatoryTaxLabel: "Numéro d'Identification National des Entreprises et Associations (NINEA)",
};

export interface ScheduleItem {
  ref: string;
  text: string;
}

export const SENEGAL_SCHEDULE: ScheduleItem[] = [
  { ref: "A", text: "Support to the ARTIST by MANAGEMENT — MANAGEMENT shall supply the following to the ARTIST, at no cost to the ARTIST, during the Term:" },
  { ref: "A.1", text: "A dedicated professional email address for the ARTIST's business communications during the Term." },
  { ref: "A.2", text: "Secure digital access (via HTTPS platform or equivalent) for the ARTIST to view itineraries, accounting statements, income records, and other documents periodically." },
  { ref: "A.3", text: "Monthly accounting statements itemising all Gross Income collected, Management Fee deducted, recoverable costs deducted, and Net Income paid to the ARTIST." },
  { ref: "B", text: "Costs to be Recovered by MANAGEMENT — During the Term, MANAGEMENT shall be entitled to deduct from Gross Income collected from the exploitation of the Artist's Services hereunder the following:" },
  { ref: "B.1", text: "A Management Fee of 20% (twenty per cent) of Gross Income arising from all live performance, appearance, endorsement, sponsorship, sync licensing, and personality rights engagements, subject to clauses B.5 to B.8 below." },
  { ref: "B.2", text: "A Management Fee of 20% (twenty per cent) of the ARTIST's record label income, received directly by the ARTIST." },
  { ref: "B.3", text: "A Management Fee of 20% (twenty per cent) of the ARTIST's music publishing income (including performance royalties from BSDA, mechanical royalties from the applicable mechanical society, neighbouring rights from BSDA, and sync fees), received directly by the ARTIST." },
  { ref: "B.4", text: "Any monies due to MANAGEMENT from the ARTIST, the receipt of which has been acknowledged in writing by the ARTIST or which are properly due under this Agreement." },
  { ref: "B.5", text: "Any legal or business affairs costs associated with third-party disputes and licence or other agreements generating income for the ARTIST and MANAGEMENT, prior to payment to either Party, as pre-approved by the ARTIST." },
  { ref: "B.6", text: "If MANAGEMENT secures and settles agreements in any single calendar month wherein combined receipts are CFA [First Threshold] or greater, the Management Fee for income above the First Threshold in that month shall be 22.5% (twenty-two point five per cent), subject to clauses B.7 and B.8 below." },
  { ref: "B.7", text: "If such combined monthly receipts are CFA [Second Threshold] or greater, the Management Fee for income above the Second Threshold in that month shall be 25% (twenty-five per cent), subject to clause B.8 below." },
  { ref: "B.8", text: "If such combined monthly receipts are CFA [Third Threshold] or greater, the Management Fee for income above the Third Threshold in that month shall be 30% (thirty per cent)." },
];

export interface SubClause {
  ref: string;
  text: string;
  sub?: { ref: string; text: string }[];
}

export interface Clause {
  id: string;
  title: string;
  intro?: string;
  subclauses: SubClause[];
}

export const SENEGAL_CLAUSES: Clause[] = [
  {
    id: "1",
    title: "Definitions and Interpretation",
    subclauses: [
      {
        ref: "1.1",
        text: "General Rules of Interpretation",
        sub: [
          { ref: "1.1.1", text: "Unless the context clearly indicates otherwise, words importing the singular shall include the plural and vice versa, words importing natural persons shall include juristic persons and vice versa, and words importing one gender shall include the other genders." },
          { ref: "1.1.2", text: "The headings in this Agreement are inserted for convenience only and shall not be considered in the interpretation or construction hereof." },
        ],
      },
      {
        ref: "1.2",
        text: "Key Definitions",
        sub: [
          { ref: "Acts", text: "The Law No. 2008-09 of January 25, 2008 on Copyright and Related Rights, as amended, and all regulations promulgated thereunder, and includes all applicable performers' protection legislation in Senegal governing the rights of performing artists and producers of sound recordings." },
          { ref: "Artist's Services", text: "All activities, whether direct or indirect, relating to the ARTIST's abilities, skills, and potential to produce, publish, record, programme, perform, sing, act, dance, model, endorse, merchandise, broadcast, author, and otherwise exploit the ARTIST's personality rights, creative abilities, performance capacity, and output in all media and formats, whether now known or hereafter devised." },
          { ref: "Gross Income", text: "All income generated by the exploitation of the Artist's Services, excluding any amounts paid by a purchaser in respect of production, transport, or other verifiable third-party costs incurred to deliver the Artist's Services, and excluding value-added tax or equivalent indirect tax in Senegal." },
          { ref: "Management Fee", text: "The fee specified in the First Schedule to this Agreement." },
          { ref: "Net Income", text: "The income accruing to the ARTIST after deduction of the Management Fee in accordance with the First Schedule, prior to deduction of any tax payable by the ARTIST." },
          { ref: "New Media", text: "All digital, internet, and electronic formats, domains, media, and carriers, including social media and networks, chat platforms, streaming services, websites, and all other digital community, corporate, and organisational networks, including without limitation YouTube, Spotify, Boomplay, Audiomack, Apple Music, Instagram, TikTok, X (formerly Twitter), Facebook, and all equivalent or successor platforms." },
          { ref: "BSDA", text: "The Bureau Sénégalais du Droit d'Auteur, the performing rights organisation with jurisdiction in Senegal, responsible for collecting and distributing performance and composition royalties, and also responsible for collecting neighbouring rights royalties for performing artists and producers of sound recordings in Senegal." },
          { ref: "DGID", text: "The Direction Générale des Impôts et des Domaines, the tax authority responsible for administering income tax, VAT, and other fiscal obligations in Senegal." },
          { ref: "Personality Rights", text: "All rights in and to the name, image, likeness, voice, depiction, characterisation, and stage name of the ARTIST." },
          { ref: "Territory", text: "The world." },
          { ref: "Term", text: "The period specified in clause 10 of this Agreement." },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Grant of Rights",
    subclauses: [
      { ref: "2.1.1", text: "To manage and represent the ARTIST as detailed herein, and to advise, guide, and direct the ARTIST in respect of all aspects relating to the Artist's Services." },
      { ref: "2.1.2", text: "To advise the ARTIST on market conditions and orientation, including but not limited to: business operating structure and knowledge; technical and production issues; repertoire and creative direction; trends and market intelligence; public profile and image; networking and industry relationships; lifestyle considerations; best practice in the Senegal music industry; market communication and New Media strategy; customer and audience orientation; and collaborations, features, and co-productions." },
      { ref: "2.1.3", text: "To organise all logistics in respect of clauses 2.1.1 and 2.1.2 above." },
      {
        ref: "2.1.4",
        text: "To perform, and to use all reasonable endeavours in the performance of, the following in relation to the Artist's Services:",
        sub: [
          { ref: "2.1.4.1", text: "Marketing, selling, agenting, sourcing, quoting, negotiating, and securing performance contracts for the ARTIST's live performances, including shows, concerts, and festival appearances." },
          { ref: "2.1.4.2", text: "Marketing, selling, agenting, sourcing, quoting, negotiating, and securing appearance contracts for the ARTIST's personal appearances, media appearances, and promotional engagements." },
          { ref: "2.1.4.3", text: "Marketing, selling, agenting, sourcing, quoting, negotiating, and securing personality rights contracts for commercial and non-commercial engagements involving the ARTIST's Personality Rights in all media, formats, and domains." },
          { ref: "2.1.4.4", text: "Marketing, selling, agenting, sourcing, quoting, negotiating, and securing New Media and social network contracts and relationships for commercial and non-commercial engagements involving the ARTIST's Personality Rights." },
          { ref: "2.1.4.5", text: "Implementing all contracts referred to in clauses 2.1.4.1 to 2.1.4.4 (inclusive), including the collection of all payments thereunder." },
          { ref: "2.1.4.6", text: "Liaising, negotiating, and coordinating relationships and agreements with the ARTIST's record label, music publisher, and digital distributor." },
          { ref: "2.1.4.7", text: "Researching and facilitating all travel logistics in respect of the ARTIST's engagements (provided that MANAGEMENT shall not be responsible for the ARTIST's transportation between the ARTIST's personal residence and any local departure point)." },
          { ref: "2.1.4.8", text: "Ensuring, insofar as is reasonably practicable, that technical equipment and production requirements are met in accordance with the ARTIST's production and technical rider." },
          { ref: "2.1.4.9", text: "Promoting and publicising the ARTIST's name and talents to purchasers, promoters, brands, and industry stakeholders in Senegal and internationally." },
          { ref: "2.1.4.10", text: "Providing the ARTIST with complete itinerary details prior to any travel for engagements." },
          { ref: "2.1.4.11", text: "Conducting all business correspondence on the ARTIST's behalf in relation to the services hereunder." },
          { ref: "2.1.4.12", text: "Cooperating with the ARTIST's auditors, business advisors, and legal counsel as and when required." },
          { ref: "2.1.4.13", text: "Liaising with relevant authorities in respect of visa and work permit requirements for cross-border travel and engagements, and ensuring such requirements are met and cleared for all performances hereunder." },
          { ref: "2.1.4.14", text: "Maintaining adequate bookkeeping, accounting, and audit systems in compliance with applicable laws in respect of all receipts collected on the ARTIST's behalf hereunder." },
          { ref: "2.1.4.15", text: "Collecting all receipts in respect of all contracts issued hereunder, accounting to the ARTIST monthly in arrears." },
          { ref: "2.1.4.16", text: "Liaising and directing the preparation of the ARTIST's accounts receivable and accounts payable, in conjunction with auditors, and maintaining proper books and accounts in accordance with DGID regulations." },
          { ref: "2.1.4.17", text: "Liaising with the ARTIST's record label and music publisher in respect of any obligations arising therefrom." },
          { ref: "2.1.4.18", text: "Managing and conducting all communications in respect of the Artist's Services, and liaising with any third-party queries or claims in respect thereof." },
          { ref: "2.1.4.19", text: "Facilitating and coordinating all logistics and arrangements with the ARTIST in respect of the ARTIST's professional commitments." },
          { ref: "2.1.4.20", text: "Liaising with the ARTIST's business affairs advisors in respect of all agreements involving the ARTIST's copyrights and other intellectual property rights." },
        ],
      },
      { ref: "2.2", text: "To the extent permitted by law, the rights granted in clause 2.1.4 above are granted by the ARTIST to MANAGEMENT by way of an exclusive licence." },
      { ref: "2.3", text: "For purposes of efficiency and transparency, MANAGEMENT shall be entitled to communicate with the ARTIST using secure digital platforms and HTTPS login systems as referenced in the First Schedule." },
    ],
  },
  {
    id: "3",
    title: "Limitations of the Grant of Rights",
    subclauses: [
      { ref: "3.1", text: "Use of the ARTIST's Personality Rights for product and service endorsements, associations, and relationships — requires ARTIST's prior written approval before MANAGEMENT negotiates any such use." },
      { ref: "3.2", text: "Notwithstanding MANAGEMENT's liaison and negotiation responsibilities with the ARTIST's music publisher, publishing rights in and to musical, dramatic, and literary works authored and created by the ARTIST during the Term are subject to a separate publishing agreement as contemplated in clause 4.2.7 below." },
      { ref: "3.3", text: "Notwithstanding MANAGEMENT's liaison and negotiation responsibilities with the ARTIST's record label, sound recording rights in and to the ARTIST's performances on any sound recording made during the Term are subject to a separate artist agreement as contemplated in clause 4.2.8 below." },
      { ref: "3.4", text: "MANAGEMENT shall have no rights to represent the ARTIST in respect of the ARTIST's personal banking, medical, private insurance matters, or obligations to DGID (which remain the ARTIST's direct personal responsibility)." },
    ],
  },
  {
    id: "4",
    title: "Warranties and Representations",
    subclauses: [
      {
        ref: "4.1",
        text: "The ARTIST hereby warrants, represents, and undertakes to MANAGEMENT that:",
        sub: [
          { ref: "4.1.1", text: "The ARTIST has the full right, power, and authority to enter into this Agreement and to grant to MANAGEMENT the rights herein set forth, and shall not derogate from such grant during the Term." },
          { ref: "4.1.2", text: "There is no suit, action, claim, or other legal or administrative proceeding pending or threatened that might directly or indirectly affect any services to be rendered hereunder or impair MANAGEMENT's ability to exercise the rights granted hereunder." },
          { ref: "4.1.3", text: "All provisions hereunder affecting the ARTIST shall be binding on any company or business entity owned, controlled, or affiliated with the ARTIST, in whole or in part, directly or indirectly." },
          { ref: "4.1.4", text: "The ARTIST shall not, during the Term, offer any of the exclusive rights granted to MANAGEMENT hereunder to any third party in any manner that excludes, prejudices, or deprives MANAGEMENT thereof, whether intentionally or otherwise." },
          { ref: "4.1.5", text: "The ARTIST shall fulfil all third-party obligations detailed, organised, or facilitated by MANAGEMENT hereunder, including all scheduled performances, appearances, and media commitments." },
          { ref: "4.1.6", text: "Mutual trust between the Parties is essential to the productivity, success, and sustainability of this Agreement." },
          { ref: "4.1.7", text: "The ARTIST shall not unreasonably withhold any consent reasonably requested by MANAGEMENT in furtherance of the Artist's career." },
          { ref: "4.1.8", text: "All performances by the ARTIST and grants of rights to MANAGEMENT hereunder are subject to the provisions of the Acts." },
        ],
      },
      {
        ref: "4.2",
        text: "MANAGEMENT hereby warrants, represents, and undertakes to the ARTIST that:",
        sub: [
          { ref: "4.2.1", text: "MANAGEMENT has the full right, power, and authority to enter into this Agreement and to perform the obligations herein set forth, and shall not derogate therefrom." },
          { ref: "4.2.2", text: "There is no suit, action, claim, or other legal or administrative proceeding pending or threatened that might directly or indirectly affect any services to be rendered hereunder or impair the ARTIST's rights hereunder." },
          { ref: "4.2.3", text: "All provisions hereunder affecting MANAGEMENT shall be binding on any company or business entity owned, controlled, or affiliated with MANAGEMENT, in whole or in part, directly or indirectly." },
          { ref: "4.2.4", text: "MANAGEMENT shall maintain, during the Term, proper books of account in accordance with generally accepted accounting principles applicable in Senegal and in compliance with all applicable laws and DGID regulations." },
          { ref: "4.2.5", text: "Mutual trust between the Parties is essential to the productivity, success, and sustainability of this Agreement." },
          { ref: "4.2.6", text: "MANAGEMENT shall not unreasonably withhold any consent reasonably requested by the ARTIST." },
          { ref: "4.2.7", text: "The works of the ARTIST are published pursuant to a separate publishing agreement, and all related incomes accruing to the ARTIST as author, composer, and arranger shall form part of Gross Income hereunder; all responsibilities and obligations thereunder shall be directly between the ARTIST and the music publisher and shall not form part of this Agreement." },
          { ref: "4.2.8", text: "The works of the ARTIST are recorded pursuant to a separate artist recording agreement, and all related incomes accruing to the ARTIST as a performer on recordings shall form part of Gross Income hereunder; all responsibilities and obligations thereunder shall be directly between the ARTIST and the record label and shall not form part of this Agreement." },
          { ref: "4.2.9", text: "All performances by the ARTIST and grants of rights hereunder are subject to the provisions of the Acts." },
        ],
      },
    ],
  },
  {
    id: "5",
    title: "Artist and Management Relationship — Legal",
    subclauses: [
      { ref: "5.1", text: "Nothing in this Agreement shall constitute or be deemed to constitute a partnership between the Parties. The ARTIST, in performing any services hereunder, shall be deemed an independent contractor, and nothing herein shall constitute the ARTIST as an agent or employee of MANAGEMENT, nor shall it constitute MANAGEMENT as a partner or employee of the ARTIST." },
    ],
  },
  {
    id: "6",
    title: "Management's Undertaking",
    subclauses: [
      { ref: "6.1", text: "Marketing and promotion of the ARTIST's name, recordings, and live performances." },
      { ref: "6.2", text: "Valuation, negotiation, and settlement of performance and appearance fees at market-competitive rates." },
      { ref: "6.3", text: "Planning and implementation of ongoing promotional and marketing activities on the ARTIST's behalf with buyers, music distributors, promoters, and similar entities, with MANAGEMENT liaising directly therewith." },
      {
        ref: "6.4",
        text: "The broadening of the ARTIST's profile in the Senegal market and regionally, with specific emphasis on:",
        sub: [
          { ref: "6.4.1", text: "New Media and social networking opportunities, including digital content strategy." },
          { ref: "6.4.2", text: "Sponsorship, association, and endorsement opportunities with brands active in Senegal and across the Senegalese market." },
          { ref: "6.4.3", text: "Growth of the ARTIST's New Media following and engagement metrics." },
          { ref: "6.4.4", text: "Collaborations, features, and co-productions with other artists in Senegal and regionally." },
          { ref: "6.4.5", text: "Personality rights licensing across all categories." },
          { ref: "6.4.6", text: "Jingle, advertising, and synchronisation opportunities with Senegal and international brands." },
          { ref: "6.4.7", text: "Merchandise design, production, and distribution opportunities." },
          { ref: "6.4.8", text: "Songwriting, production, and programming opportunities." },
        ],
      },
      { ref: "6.5", text: "The facilitation, with the ARTIST's record company and distributor, of in-store promotions, store visits, and personal appearances at music industry retail outlets, radio stations, media platforms, and similar venues." },
      { ref: "6.6", text: "All other marketing activities the general purpose of which is to further the ARTIST's career and maximise the commercial value of the Artist's Services." },
    ],
  },
  {
    id: "7",
    title: "Artist's Personality Rights",
    subclauses: [
      { ref: "7.1", text: "The ARTIST hereby agrees and irrevocably consents, during the Term only, to MANAGEMENT's exclusive right to use (in connection with the marketing, promotion, and publicity of the ARTIST and the Artist's Services) and to licence (for commercial and non-commercial purposes) the ARTIST's Personality Rights, including the exclusive licensing thereof for all uses envisaged by this Agreement. Such use shall be at no cost or liability to MANAGEMENT and is essential for the operation of this Agreement. This consent includes use in New Media and the internet, and is granted to MANAGEMENT by way of exclusive licence." },
      { ref: "7.2", text: "Notwithstanding anything to the contrary herein, the ARTIST, having conceived and created their professional name, is the sole and exclusive owner thereof as at the Effective Date, whether registered as a trade mark or not, and MANAGEMENT's rights in respect of the ARTIST's Personality Rights are solely as a licensee during the Term and do not constitute any assignment of the ARTIST's ownership of their stage name or associated trade marks." },
    ],
  },
  {
    id: "8",
    title: "Sale and Use of the Artist's Services Outside Senegal",
    subclauses: [
      { ref: "8.1", text: "The Parties agree that regional and international opportunities for the deployment of the Artist's Services, although not easily secured, are vital to the growth of the ARTIST's career and are a priority for MANAGEMENT." },
      { ref: "8.2", text: "MANAGEMENT shall, in the ordinary course of business, address and, where commercially viable, secure all demand for the Artist's Services in international markets." },
      { ref: "8.3", text: "Depending on the ARTIST's professional growth, the Parties may agree during the Term that it is prudent to engage third-party booking agencies, agents, or sub-managers on a territorial basis to book performances and appearances in specific markets outside Senegal. Any such appointment requires the ARTIST's prior written consent." },
      { ref: "8.4", text: "If appropriate, prudent, and reasonable, MANAGEMENT shall, after consultation with the ARTIST, determine how best to accommodate any such third-party territorial representation costs. In the event MANAGEMENT appoints a dedicated territorial booking agent for the ARTIST, the fees payable to such agent shall, like VAT, be excluded from 'Gross Income' hereunder." },
    ],
  },
  {
    id: "9",
    title: "Artist Career Growth and the Impact of Growth",
    subclauses: [
      { ref: "9.1", text: "The Parties acknowledge and agree that the primary purpose of this Agreement is the sustained growth of the ARTIST's career, and that success in achieving this purpose may alter the commercial circumstances existing at the Effective Date." },
      {
        ref: "9.2",
        text: "Growth of the ARTIST's career hereunder is understood in three dimensions:",
        sub: [
          { ref: "9.2.1", text: "Public stature and market relevance — locally, nationally, regionally across Africa, and internationally." },
          { ref: "9.2.2", text: "Professionalism and artistic development as a performing artist." },
          { ref: "9.2.3", text: "Income generated from the Artist's Services." },
        ],
      },
      { ref: "9.3", text: "In respect of clause 9.2.1, growth is determined primarily by market demand for the ARTIST (driven by the ARTIST's work, recordings, and live performances) and secondarily by the ARTIST's New Media following and engagement. The ARTIST's personal attention to New Media is critical, as decisions by advertisers, brands, and event promoters to engage the ARTIST are often directly influenced by such metrics." },
      { ref: "9.4", text: "In respect of clause 9.2.2, growth in professionalism is observable through positive media presence, punctuality, responsiveness, stage performance quality, and the ARTIST's personal development. The ARTIST is encouraged to invest time in professional development." },
      { ref: "9.5", text: "Upon the Gross Income accruing to the ARTIST first exceeding CFA [threshold] per month on a consistent basis for three (3) consecutive months, the ARTIST shall, in consultation with MANAGEMENT and MANAGEMENT's advisors, review and, if appropriate, corporatise the ARTIST's commercial affairs to ensure statutory compliance and tax efficiency in Senegal as required by DGID." },
    ],
  },
  {
    id: "10",
    title: "Term",
    subclauses: [
      { ref: "10.1", text: "The Term of this Agreement shall be four (4) years commencing on the Effective Date, subject to the option in clause 10.2 below." },
      { ref: "10.2", text: "MANAGEMENT shall have the option to renew this Agreement upon expiry of the initial four (4) year period for a further period of four (4) years, exercisable by written notice delivered to the ARTIST not less than sixty (60) days prior to the expiry of the initial period. Such option may only be exercised if MANAGEMENT has fulfilled all material obligations hereunder during the preceding period." },
      { ref: "10.3", text: "If the Parties wish to continue their professional relationship after the option period (if exercised), they shall negotiate in good faith, having regard to the commercial circumstances prevailing at that time and the income generated for the ARTIST during the preceding period." },
    ],
  },
  {
    id: "11",
    title: "Accounts and Payments",
    subclauses: [
      { ref: "11.1", text: "In respect of the exploitation of the Artist's Services by MANAGEMENT and MANAGEMENT's exclusive right to collect income generated thereby, MANAGEMENT shall be entitled to the fees set out in the First Schedule hereto, which shall become due and payable only as provided therein and hereinbelow." },
      { ref: "11.2", text: "MANAGEMENT shall maintain proper books and records of account in respect of all marketing and sales of the Artist's Services hereunder, in accordance with applicable Senegal accounting standards and DGID requirements." },
      { ref: "11.3", text: "The rates in the First Schedule shall be calculated on one hundred percent (100%) of the Gross Income received by or credited to MANAGEMENT (or the ARTIST, as applicable) directly and identifiably attributable to the ARTIST in the Territory, after deduction only of: (i) VAT and other similar indirect taxes required to be deducted in any part of the Territory; and (ii) technical and production costs paid directly to third parties and not recoverable from the purchaser." },
      { ref: "11.4", text: "MANAGEMENT shall pay the ARTIST, in accordance with the First Schedule, the ARTIST's share of Gross Income actually received by MANAGEMENT, subject to: (i) prior recoupment by MANAGEMENT, at its discretion, of any monies advanced, loaned, or otherwise provided to the ARTIST; (ii) settlement of any tax obligations payable by the ARTIST; (iii) deduction of any actual transport, travel, communication, and entertainment costs not covered by third parties and pre-approved by the ARTIST; and (iv) monthly payment to the ARTIST in arrears of all Net Income." },
      { ref: "11.5", text: "Any income received by MANAGEMENT as a deposit for a future performance or engagement by the ARTIST shall be held in trust until such performance or engagement is completed, and shall not constitute Gross Income hereunder until the relevant obligation is fulfilled." },
      { ref: "11.6", text: "All statements and accounts rendered by MANAGEMENT to the ARTIST shall be binding on the ARTIST and not subject to objection unless specific written objection, stating the basis thereof in reasonable detail, is given to MANAGEMENT within three (3) years from the date of rendering." },
      { ref: "11.7", text: "The ARTIST shall have the right, at the ARTIST's expense, to engage independent registered auditors, attorneys, or business advisors to examine MANAGEMENT's books and records relating to the marketing and sales of the Artist's Services hereunder, during reasonable business hours and on reasonable prior written notice, but not more than once per calendar year." },
      { ref: "11.8", text: "If such examination establishes an underpayment to the ARTIST exceeding CFA [threshold] for the period examined, MANAGEMENT shall pay the reasonable and direct professional costs of the examination (excluding travel, accommodation, and subsistence), not exceeding CFA [cap amount]." },
      { ref: "11.9", text: "For the avoidance of doubt, MANAGEMENT shall be entitled, during the Term, to collect one hundred percent (100%) of income in respect of the Artist's Services or any exploitation thereof, subject to clauses 4.2.7 and 4.2.8 (in which cases the ARTIST receives income directly from the music publisher or record label as applicable)." },
    ],
  },
  {
    id: "12",
    title: "Post-Term Commissions (Sunset Clause)",
    subclauses: [
      { ref: "12.1", text: "Notwithstanding any termination or expiry of this Agreement, MANAGEMENT shall be entitled to receive commissions on all Gross Income attributable to the Artist's Services derived from or in connection with any contracts, engagements, agreements, recordings, compositions, works, projects, or other exploits that were substantially negotiated, secured, initiated, or entered into during the Term (collectively, 'During-Term Exploits')." },
      {
        ref: "12.2",
        text: "Such post-Term commissions shall be calculated at the following reduced rates, applied to Gross Income from During-Term Exploits only:",
        sub: [
          { ref: "12.2.1", text: "For the first year following termination or expiry: 20% (twenty per cent)." },
          { ref: "12.2.2", text: "For the second year following termination or expiry: 15% (fifteen per cent)." },
          { ref: "12.2.3", text: "For the third year following termination or expiry: 10% (ten per cent)." },
          { ref: "12.2.4", text: "For the fourth year following termination or expiry: 5% (five per cent)." },
          { ref: "12.2.5", text: "For the fifth year following termination or expiry: 5% (five per cent)." },
          { ref: "12.2.6", text: "Thereafter: 0% (zero per cent)." },
        ],
      },
      {
        ref: "12.3",
        text: "For the avoidance of doubt:",
        sub: [
          { ref: "12.3.1", text: "Post-Term commissions shall be computed, deducted, and paid in the same manner as the Management Fee during the Term, mutatis mutandis, including application of the definitions of Gross Income and permitted deductions hereunder." },
          { ref: "12.3.2", text: "The ARTIST shall procure that all third parties paying Gross Income from During-Term Exploits pay such amounts directly to MANAGEMENT (or as MANAGEMENT may direct) to facilitate deduction of post-Term commissions." },
          { ref: "12.3.3", text: "The ARTIST's accounting, reporting, and audit obligations hereunder shall continue to apply in respect of Gross Income subject to post-Term commissions for so long as such commissions remain payable." },
          { ref: "12.3.4", text: "This clause shall survive termination or expiry of this Agreement and shall be binding on the ARTIST and any successor, assignee, or affiliated entity of the ARTIST." },
        ],
      },
    ],
  },
  {
    id: "13",
    title: "Media",
    subclauses: [
      { ref: "13.1", text: "The Parties agree that media generally, and New Media specifically, are critical for the ARTIST's communication with fans and industry stakeholders in Senegal and internationally, and are central to the growth of the Artist's Services." },
      { ref: "13.2", text: "The Parties further agree that media interactions carry risks, as public statements may be used adversely against the ARTIST or MANAGEMENT." },
      { ref: "13.3", text: "Given the ongoing nature of media interactions relating to the ARTIST and the Artist's Services, the ARTIST undertakes, to the best of their ability, to: (i) understand and apply the principles of effective media engagement, including responding directly and constructively to questions; (ii) remain informed on current affairs in the Senegal music industry to respond appropriately and credibly; (iii) present professionally for face-to-face, broadcast, or live digital interactions; (iv) be considerate, respectful, and courteous to interviewers and media representatives; and (v) be punctual for all scheduled media engagements and communicate any delays to MANAGEMENT immediately." },
      { ref: "13.4", text: "All significant media engagements, interviews, and public statements that may materially affect the ARTIST's commercial relationships shall be coordinated with MANAGEMENT in advance where practicable." },
    ],
  },
  {
    id: "14",
    title: "Tax",
    subclauses: [
      { ref: "14.1", text: "The Parties shall comply with all DGID (Direction Générale des Impôts et des Domaines) regulations concerning the ARTIST's income tax and any other deductions required under the laws of the Republic of Senegal." },
      { ref: "14.2", text: "The Parties agree to remain compliant at all times during the Term with all DGID regulations concerning the ARTIST's Net Income, including making requisite deductions, timely payments to DGID, filing all required forms and returns, and maintaining accurate records." },
      { ref: "14.3", text: "The ARTIST acknowledges that, as a public figure, any breach of DGID regulations or outstanding tax liability may have material and adverse consequences for the ARTIST's professional reputation and career in Senegal, notwithstanding the terms of this Agreement." },
      { ref: "14.4", text: "TVA is administered by DGID at the current statutory rate applicable in Senegal." },
    ],
  },
  {
    id: "15",
    title: "Notices",
    subclauses: [
      { ref: "15.1", text: "Any notice required or permitted hereunder shall be in writing and may be served: (i) by prepaid registered or recorded delivery post to the address of the receiving Party, deemed served seven (7) days after posting; (ii) by hand delivery to such address, deemed served on the date of delivery and acknowledgement; or (iii) by email to such email address, with a read-receipt requested, deemed served on the date of transmission if no delivery failure notification is received within 24 hours." },
      { ref: "15.2", text: "Either Party may change their contact address or email address during the Term by written notice to the other in accordance with this clause." },
    ],
  },
  {
    id: "16",
    title: "Force Majeure",
    subclauses: [
      { ref: "16.1", text: "If a Party's material performance hereunder is substantially delayed, rendered impossible, or impracticable due to any act of God, fire, earthquake, flood, strike, civil commotion, pandemic, epidemic, governmental acts or restrictions, actions of any relevant performers' association affecting the ARTIST, MANAGEMENT, or the entertainment industry in Senegal generally, thereby materially hampering MANAGEMENT's exploitation of rights hereunder, the affected Party may, upon prompt written notice to the other, suspend its obligations for the duration thereof." },
      { ref: "16.2", text: "The Term shall be extended by a period equal to any such suspension. Any suspension arising from interference with MANAGEMENT's normal business operations (as opposed to the music industry generally in Senegal) shall not exceed six (6) months in aggregate, after which either Party may terminate this Agreement on thirty (30) days' written notice without further liability for the period of suspension." },
    ],
  },
  {
    id: "17",
    title: "Governing Law",
    subclauses: [
      { ref: "17.1", text: "This Agreement shall be governed by and construed in accordance with the laws of the Republic of Senegal applicable to contracts executed and to be performed wholly therein." },
      { ref: "17.2", text: "The Parties agree that any dispute arising from or in connection with this Agreement shall first be submitted to good-faith negotiation for a period of thirty (30) days. Failing resolution, the dispute shall be submitted to binding arbitration before the Centre d'Arbitrage, de Médiation et de Conciliation de Dakar (CAMC-D) in Dakar, whose award shall be final and binding." },
      { ref: "17.3", text: "All terms relating to music herein shall have the meanings ascribed thereto in the Acts." },
    ],
  },
  {
    id: "18",
    title: "Indemnity",
    subclauses: [
      { ref: "18.1", text: "The ARTIST shall indemnify and hold harmless MANAGEMENT from and against any demands, losses, claims, proceedings, damages, costs, and expenses (including reasonable legal fees) arising from any claim inconsistent with, or due to any breach of, the ARTIST's representations, warranties, grants, undertakings, covenants, or agreements hereunder. MANAGEMENT shall not compromise or settle any third-party claim touching on the ARTIST's rights without the ARTIST's prior written consent, which shall not be unreasonably withheld or delayed." },
      { ref: "18.2", text: "MANAGEMENT shall indemnify and hold harmless the ARTIST from and against any demands, losses, claims, proceedings, damages, costs, and expenses (including reasonable legal fees) arising from any claim inconsistent with, or due to any breach of, MANAGEMENT's representations, warranties, grants, undertakings, or agreements hereunder. The ARTIST shall not compromise or settle any third-party claim without MANAGEMENT's prior written consent, which shall not be unreasonably withheld or delayed." },
    ],
  },
  {
    id: "19",
    title: "Assignment",
    subclauses: [
      { ref: "19.1", text: "The ARTIST shall not assign, encumber, transfer, or otherwise dispose of any rights hereunder (including copyright, performance, personality, and related rights) to any third party during the Term without MANAGEMENT's prior written consent." },
      { ref: "19.2", text: "MANAGEMENT may assign its rights hereunder to any entity that controls, is controlled by, or is under common control with MANAGEMENT, upon reasonable prior written notice to the ARTIST, provided such assignment does not diminish the quality or standard of services due to the ARTIST. MANAGEMENT may not assign this Agreement to an unrelated third party without the ARTIST's prior written consent." },
    ],
  },
  {
    id: "20",
    title: "Termination and Breach",
    subclauses: [
      { ref: "20.1", text: "Either Party may forthwith terminate the Term by written notice to the other if the other Party enters into liquidation (other than voluntary liquidation for the purpose of reconstruction or reorganisation), compounds with its creditors, or has a trustee, administrator, or receiver appointed over all or a substantial part of its assets, which appointment is not discharged within thirty (30) days." },
      { ref: "20.2", text: "If MANAGEMENT materially defaults in the performance of any material provision hereof (including accounting, payment, and reporting obligations) and such default (if capable of remedy) continues for thirty (30) days after receipt of written notice from the ARTIST specifying the default in reasonable detail, the ARTIST may terminate the Term by further written notice to MANAGEMENT." },
      { ref: "20.3", text: "If the ARTIST materially defaults in the performance of any material provision hereof (including obligations to appear, perform, fulfil media commitments, and not to undermine MANAGEMENT's exclusive rights) and such default (if capable of remedy) continues for thirty (30) days after receipt of written notice from MANAGEMENT specifying the default in reasonable detail, MANAGEMENT may terminate the Term by further written notice to the ARTIST." },
      { ref: "20.4", text: "Termination hereunder shall not affect, impede, or release either Party from rights and obligations that have already accrued, nor shall it cancel or terminate any assignments of rights made during the Term. All post-termination obligations — including the Post-Term Commission provisions in clause 12 and payment of accrued fees — shall survive termination and remain fully enforceable." },
    ],
  },
  {
    id: "21",
    title: "Miscellaneous",
    subclauses: [
      { ref: "21.1", text: "A waiver by either Party of any term or condition hereof in any instance shall not be deemed a waiver of that term for any future instance. All rights, remedies, undertakings, and obligations herein are cumulative and none shall limit any other right or remedy available to either Party." },
      { ref: "21.2", text: "This Agreement constitutes the entire agreement between the Parties and supersedes all prior agreements, representations, negotiations, and understandings, whether written or oral, concerning the subject matter hereof. No modification or variation hereof shall be effective unless in writing and signed by both Parties." },
      { ref: "21.3", text: "Nothing herein shall constitute a partnership, joint venture, or employment relationship between the Parties, and neither Party shall be bound by any act or omission of the other except as expressly provided in this Agreement." },
      { ref: "21.4", text: "If any provision hereof or the application thereof to any particular circumstance is adjudged invalid, unlawful, or unenforceable by a court of competent jurisdiction or an arbitral tribunal, such judgment shall not affect the remainder of this Agreement, which shall continue in full force and effect as if the invalid provision had not been included." },
      { ref: "21.5", text: "This Agreement may be executed in counterparts, including by valid electronic signature, each of which shall constitute an original, and all counterparts together shall constitute one and the same agreement." },
    ],
  },
];
