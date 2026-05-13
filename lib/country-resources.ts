// ============================================================
// ROSTER — Country-Specific Music Industry Resources
// Top 15 African music markets (IFPI Global Music Report basis)
// ============================================================

export interface RightsOrg {
  name: string;
  abbr: string;
  url: string;
  note: string;
}

export interface IndustryBody {
  name: string;
  abbr?: string;
  url?: string;
  role: string;
}

export interface Distributor {
  name: string;
  url: string;
  note: string;
}

export interface Grant {
  name: string;
  url?: string;
  note: string;
}

export interface BroadcastRegulator {
  name: string;
  abbr: string;
  radioQuota: string;
  tvQuota: string;
  qualCriteria: string[];
  keyStations: string[];
  fundingNote: string;
}

export interface CountryResources {
  country: string;
  flag: string;
  currency: string;
  performanceRights: RightsOrg;
  mechanicalRights: RightsOrg | null;
  neighbouringRights: RightsOrg | null;
  industryBodies: IndustryBody[];
  keyDSPs: string[];
  distributors: Distributor[];
  grants: Grant[];
  taxNote: string;
  registerNote: string; // One-line summary of priority action
  // ── Extended localisation fields (optional — SA & Algeria have full data) ──
  isrcPrefix?: string;
  keyCities?: string[];
  governingLaw?: string;
  businessRegAbbr?: string;
  taxAuthorityAbbr?: string;
  taxAuthorityFull?: string;
  localContentLabel?: string;
  lawyerNote?: string;
  broadcastRegulator?: BroadcastRegulator;
  societiesChecklist?: string[];
  mediaChecklist?: string[];
  currencyName?: string;        // Full currency name, e.g. "Nigerian Naira"
}

// ============================================================
// Top 15 IFPI African Markets
// ============================================================

const RESOURCES: Record<string, CountryResources> = {

  "Nigeria": {
    country: "Nigeria",
    flag: "🇳🇬",
    currency: "NGN",
    currencyName: "Nigerian Naira",
    performanceRights: {
      name: "Copyright Society of Nigeria",
      abbr: "COSON",
      url: "https://coson.org",
      note: "COSON collects public performance and broadcast royalties for composers, authors, and publishers in Nigeria. Register your compositions with COSON before release — membership is open to all Nigerian rights holders. COSON is affiliated with CISAC and distributes royalties bi-annually. Nigeria is the largest music market in sub-Saharan Africa.",
    },
    mechanicalRights: {
      name: "Musical Copyright Society of Nigeria",
      abbr: "MCSN",
      url: "https://mcsnnigeria.org",
      note: "MCSN handles mechanical reproduction rights in Nigeria — streaming, downloads, and physical formats. Register your compositions with MCSN to collect digital mechanical royalties from DSPs operating in Nigeria. COSON and MCSN registrations are separate processes.",
    },
    neighbouringRights: {
      name: "Artistes & Producers Rights Society of Nigeria",
      abbr: "ARPSON",
      url: "",
      note: "ARPSON collects neighbouring (master recording) rights for performers and producers in Nigeria. Register your sound recordings with ARPSON as performer and/or producer. Also register with AIRCO (African Independent Rights Collection Organisation) for pan-African and international neighbouring rights collection.",
    },
    industryBodies: [
      { name: "National Broadcasting Commission", abbr: "NBC", url: "https://nbc.gov.ng", role: "Broadcast regulator — oversees radio (40% local) and TV (80% local) content quotas in Nigeria" },
      { name: "Nigerian Copyright Commission", abbr: "NCC", url: "https://copyright.gov.ng", role: "Government copyright registration and enforcement under the Copyright Act 2022" },
      { name: "Corporate Affairs Commission", abbr: "CAC", url: "https://cac.gov.ng", role: "Business registration authority — register your music company or business name with the CAC" },
      { name: "Performing Musicians Association of Nigeria", abbr: "PMAN", url: "", role: "Musicians union — advocacy, welfare, and industry representation for Nigerian artists" },
      { name: "Association of Music Producers", abbr: "AMP", url: "", role: "Producers guild — advocacy for production credits and royalty entitlements" },
    ],
    keyDSPs: ["Boomplay", "Audiomack", "Spotify", "Apple Music", "YouTube Music", "TikTok"],
    distributors: [
      { name: "Africori", url: "https://africori.com", note: "Strongest pan-African footprint with Nigerian market expertise — priority for Boomplay, Audiomack, and West Africa coverage" },
      { name: "Audiomack for Artists", url: "https://audiomack.com/artists", note: "Free direct distribution to Audiomack — dominant free-streaming platform in Nigeria and Ghana" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Flat annual fee covering Boomplay, Spotify, Apple Music, and 150+ global DSPs" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Per-release fee model with strong African and global DSP coverage" },
      { name: "Amuse", url: "https://amuse.io", note: "Free tier available — growing Nigerian presence; good entry-level option for independent artists" },
    ],
    grants: [
      { name: "Bank of Industry — Creative Industry Financing Initiative", url: "https://boi.ng", note: "Low-interest loans and grants for Nigerian creative businesses including music production and touring" },
      { name: "Tony Elumelu Foundation", url: "https://tonyelumelufoundation.org", note: "Annual $5,000 seed capital for African entrepreneurs across all sectors including music" },
      { name: "Nigeria Creative Industry Fund (NIRSAL/BOI)", url: "https://boi.ng", note: "Federal government-backed financing for creative sector businesses in Nigeria" },
    ],
    taxNote: "Register your music business with the Corporate Affairs Commission (CAC) and obtain a Tax Identification Number (TIN) from the Federal Inland Revenue Service (FIRS). All music income — streaming, performance fees, royalties, sync — is taxable in Nigeria. Sole traders file annual PAYE returns; registered companies pay 30% corporate income tax. Consult a qualified Nigerian entertainment attorney before signing distribution or label contracts.",
    registerNote: "Priority: Register compositions with COSON (performance) and MCSN (mechanical); register recordings with ARPSON (neighbouring rights); register your business with the CAC.",

    // ── Extended fields ──────────────────────────────────────────
    isrcPrefix: "NG",
    keyCities: ["Lagos", "Abuja", "Port Harcourt", "Kano"],
    governingLaw: "the Federal Republic of Nigeria",
    businessRegAbbr: "CAC",
    taxAuthorityAbbr: "FIRS",
    taxAuthorityFull: "Federal Inland Revenue Service",
    localContentLabel: "Nigerian",
    lawyerNote: "qualified Nigerian entertainment attorney",

    broadcastRegulator: {
      name: "National Broadcasting Commission",
      abbr: "NBC",
      radioQuota: "Minimum 40% local Nigerian content",
      tvQuota: "Minimum 80% locally produced content",
      qualCriteria: [
        "R — Recorded in Nigeria — master recording made wholly or substantially in Nigeria",
        "A — Artist/Performer — recording performed principally by a Nigerian artist or group",
        "C — Composition — music composed by a Nigerian citizen or permanent resident",
        "L — Lyrics — where applicable, lyrics written by a Nigerian citizen or permanent resident",
        "S — Society registered — composition registered with COSON and/or MCSN; NG-prefix ISRC assigned to the recording",
      ],
      keyStations: [
        "Beat FM Lagos (99.9 FM)",
        "Cool FM Lagos (96.9 FM)",
        "Soundcity Radio (98.5 FM)",
        "Wazobia FM (94.1 FM)",
        "Rhythm FM (93.7 FM)",
        "Channels TV",
        "MTV Base Africa",
      ],
      fundingNote: "Nigeria is Africa's largest and most globally influential music market — Afrobeats originated here and now commands mainstream chart positions worldwide. The NBC's 40% radio quota and 80% TV quota create extensive guaranteed rotation for qualifying Nigerian releases. Beat FM, Cool FM, and Soundcity are Lagos's dominant urban stations and the primary radio gatekeepers for Afrobeats, Afropop, and R&B. Wazobia FM leads in Pidgin-language programming with mass-market reach. Submit radio packs 6 weeks before release; WhatsApp follow-up after 5 business days is standard and expected. Lagos is the creative centre — build relationships with Lagos-based pluggers, PRs, and playlist curators for maximum impact.",
    },

    societiesChecklist: [
      "COSON (Copyright Society of Nigeria) — register all compositions for performance royalties under the Copyright Act 2022; COSON is Nigeria's CISAC-affiliated performing rights organisation",
      "MCSN (Musical Copyright Society of Nigeria) — register compositions separately for mechanical rights; MCSN collects digital mechanical royalties from DSPs operating in Nigeria",
      "ARPSON (Artistes & Producers Rights Society of Nigeria) — register sound recordings as performer and/or producer for neighbouring rights collection on Nigerian radio and TV",
      "Assign NG-prefix ISRC codes — obtain via your distributor (Africori, DistroKid) or directly; one code per track, mandatory for broadcast tracking and royalty identification",
      "NCC (Nigerian Copyright Commission) — register key works at copyright.gov.ng under the Copyright Act 2022 for legal protection and enforcement",
      "AIRCO (African Independent Rights Collection Organisation) — register masters for pan-African neighbouring rights collection across African broadcast territories",
      "CAC (Corporate Affairs Commission) — register your music business name or company at cac.gov.ng before entering commercial contracts; required for formal banking and invoicing",
      "FIRS (Federal Inland Revenue Service) — obtain a TIN and register for tax; all streaming, royalty, and performance income is taxable in Nigeria",
    ],

    mediaChecklist: [
      "Boomplay editorial pitch — submit 3–4 weeks before release to Boomplay's Nigeria/West Africa editorial team; Boomplay is the dominant streaming platform in Nigeria",
      "Audiomack pitch — contact Audiomack's Nigeria editorial team; free-streaming model drives the highest play counts in the Nigerian market",
      "Spotify for Artists editorial pitch — submit at least 7 days before release; target Afrobeats, African Heat, and Afropop editorial playlists for maximum global reach",
      "Beat FM Lagos (99.9 FM) — Nigeria's leading Afrobeats and urban music station; submit WAV and press pack to the music director 6 weeks before release; WhatsApp follow-up after 5 business days",
      "Cool FM Lagos (96.9 FM) — premium urban station with strong Lagos and Abuja reach; important for English-language and crossover Afropop releases; submit to music director with one-sheet and streaming links",
      "Soundcity Radio (98.5 FM) and Soundcity TV — leading multimedia Afrobeats platform; submit for both radio rotation and Soundcity TV music video consideration simultaneously",
      "Wazobia FM (94.1 FM) — largest Pidgin-language station with mass-market Lagos reach; essential for releases targeting the broad Nigerian mainstream",
      "Rhythm FM (93.7 FM) — Lagos lifestyle and music station; strong for R&B, Afrobeats, and premium brand-adjacent releases",
      "Channels TV and MTV Base Africa — submit music video with full metadata and EPK for television rotation; MTV Base Africa gives pan-continental visibility from a Nigerian placement",
      "Lagos PR and playlist pluggers — engage a Lagos-based music PR or plugger for radio campaign management; local relationships are essential for Nigerian radio access",
      "Lagos and Abuja city data monitoring — check Lagos, Abuja, and Port Harcourt streaming performance weekly via Spotify for Artists and Boomplay Analytics",
      "NBC local content compliance — confirm release meets NBC criteria (recorded in Nigeria, Nigerian artist, COSON/MCSN registered) before submitting to radio or TV",
    ],
  },

  "South Africa": {
    country: "South Africa",
    flag: "🇿🇦",
    currency: "ZAR",
    currencyName: "South African Rand",
    performanceRights: {
      name: "South African Music Rights Organisation",
      abbr: "SAMRO",
      url: "https://samro.org.za",
      note: "Collect public performance royalties for composers, lyricists, and music publishers. Register your compositions online — membership is free. SAMRO distributes quarterly and collects reciprocally in 90+ countries via CISAC agreements.",
    },
    mechanicalRights: {
      name: "Composers, Authors and Publishers Association",
      abbr: "CAPASSO",
      url: "https://capasso.co.za",
      note: "Collect mechanical reproduction royalties (streaming, downloads, physical). Independent artists without a publisher can claim both the writer's share and publisher's share directly. CAPASSO works alongside SAMRO.",
    },
    neighbouringRights: {
      name: "South African Music Performance Rights Association",
      abbr: "SAMPRA",
      url: "https://sampra.co.za",
      note: "Collects neighbouring rights for recording artists and producers when sound recordings are broadcast or played publicly. Also register with AIRCO for international collection.",
    },
    industryBodies: [
      { name: "Recording Industry of South Africa", abbr: "RISA", url: "https://risa.org.za", role: "Record label association — gold/platinum certifications, industry data, lobby" },
      { name: "South African Guild of Actors", abbr: "SAGA", url: "", role: "Performer representation across film, TV, and music" },
      { name: "Music In Africa Foundation", url: "https://musicinafrica.net", role: "Pan-African industry resource, conference organiser, and development platform" },
      { name: "SA Music Week", url: "https://samusicweek.co.za", role: "Annual industry conference and networking event" },
    ],
    keyDSPs: ["Spotify", "Apple Music", "Boomplay", "YouTube Music", "TIDAL", "Deezer", "Audiomack"],
    distributors: [
      { name: "Africori", url: "https://africori.com", note: "Pan-African distributor, strong SA relationships and local support" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Flat annual fee, unlimited releases globally" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Per-release pricing with SA Rand payment support" },
      { name: "Amuse", url: "https://amuse.io", note: "Free tier available; good for independent starters" },
    ],
    grants: [
      { name: "National Arts Council (NAC)", url: "https://nac.org.za", note: "Grants for SA artists and arts organisations — apply per funding window" },
      { name: "Mapungubwe Institute (MISTRA)", url: "https://mistra.org.za", note: "Research and development grants for creative industries" },
      { name: "NFVF Music Fund", url: "https://nfvf.co.za", note: "National Film and Video Foundation — funds projects with a visual component" },
      { name: "SAMRO Foundation", url: "https://samrofoundation.org.za", note: "Bursaries, scholarships, and development grants for SA music practitioners" },
    ],
    taxNote: "Register your music business with CIPC (cipc.co.za). Tax administered by SARS (sars.gov.za). If earnings exceed R83,100/year, register for provisional tax (IRP6). VAT registration required once turnover exceeds R1 million/year.",
    registerNote: "Priority: Register with SAMRO (performance), CAPASSO (mechanical), and SAMPRA (neighbouring) — three separate organisations.",
    isrcPrefix: "ZA",
    keyCities: ["Johannesburg", "Cape Town", "Durban", "Pretoria"],
    governingLaw: "the laws of the Republic of South Africa",
    businessRegAbbr: "CIPC",
    taxAuthorityAbbr: "SARS",
    taxAuthorityFull: "South African Revenue Service",
    localContentLabel: "South African",
    lawyerNote: "South African entertainment lawyer",
    broadcastRegulator: {
      name: "Independent Communications Authority of South Africa",
      abbr: "ICASA",
      radioQuota: "20% commercial / 40% SABC & community",
      tvQuota: "55% (SABC)",
      qualCriteria: [
        "Sound — the master recording was made wholly or substantially in South Africa",
        "Artist — the recording is performed principally by a South African artist or group",
        "Expression — the music and/or lyrics are written or composed by a South African",
        "Language — performed in a South African language or substantially reflects South African cultural identity",
      ],
      keyStations: [
        "SABC public radio (Ukhozi FM, 5FM, Metro FM, Motsweding FM, Umhlobo Wenene)",
        "YFM — Johannesburg youth / urban",
        "Kaya 959 — Johannesburg adult urban",
        "East Coast Radio — Durban and KZN",
        "Cape Talk / CapeFM — Western Cape",
        "Community radio network (300+ stations nationwide)",
      ],
      fundingNote: "SABC airplay represents mass-market exposure that paid streaming advertising cannot replicate. Ukhozi FM reaches over 7 million weekly listeners. Qualifying as SA local content also unlocks SABC competition and development pipelines.",
    },
    societiesChecklist: [
      "SAMRO — register all compositions for performance royalties",
      "CAPASSO — mechanical royalty registration for South Africa",
      "SAMPRA — register master recordings for neighbouring rights",
      "RISA — label/distributor membership and ISRC registration",
      "POSA — if you operate a publishing entity",
      "SoundExchange (USA) — for digital performance royalties from US streaming and satellite radio",
      "PPL (UK) — for neighbouring rights in the United Kingdom",
      "MCSK (Kenya) — if releasing into the East African market",
      "COSON (Nigeria) — for music performed or broadcast in Nigeria",
      "GHAMRO (Ghana) — for music performed or broadcast in Ghana",
      "All song titles registered and confirmed on collecting society portals",
    ],
    mediaChecklist: [
      "Press release written and distributed to SA media",
      "Interview pitches sent to podcasts, radio stations, and digital media outlets",
      "Radio plugger has audio files, one-sheet, and bio",
      "Physical radio servicing list confirmed (where applicable)",
      "Digital radio servicing completed via email or platform (SubmitHub, Groover)",
      "Community radio strategy mapped (SABC regional, YFM, 5FM, Kaya, Metro FM)",
      "African market radio plan confirmed for key markets (Nigeria, Kenya, Ghana)",
      "Music video delivered to Channel O, MTV Base Africa, and relevant digital channels",
      "Sync and licensing pitches submitted to relevant supervisors and libraries",
    ],
  },

  "Egypt": {
    country: "Egypt",
    flag: "🇪🇬",
    currency: "EGP",
    currencyName: "Egyptian Pound",
    performanceRights: {
      name: "Egyptian Center for Authors Rights",
      abbr: "ECAD",
      url: "http://ecad.com.eg",
      note: "Collects performance royalties for composers, lyricists, and publishers in Egypt. Register your works and membership with ECAD to collect from live shows, radio, TV, and public venues. Egypt is a CISAC member territory — royalties are exchanged with 90+ international societies worldwide.",
    },
    mechanicalRights: {
      name: "Egyptian Center for Authors Rights",
      abbr: "ECAD",
      url: "http://ecad.com.eg",
      note: "ECAD handles both performance and mechanical rights in Egypt. Register once to collect across both royalty streams. Mechanical rights for digital platforms are actively developing — also register with a BIEM-affiliated society to capture international mechanical income.",
    },
    neighbouringRights: {
      name: "Egyptian Music Producers Association",
      abbr: "EMPA",
      url: "",
      note: "EMPA administers neighbouring (master recording) rights for producers and performers in Egypt. Register your sound recordings with EMPA. For international collection, PPL (UK) and SCPP (France) have reciprocal agreements covering Egyptian recordings in Europe. AIRCO handles pan-African neighbouring rights collection.",
    },
    industryBodies: [
      { name: "Egyptian Musicians Syndicate", url: "", role: "Official musicians union — membership required for live performance licences in Egypt" },
      { name: "General Authority for Investment and Free Zones", abbr: "GAFI", url: "https://gafi.gov.eg", role: "Business registration and foreign investment authority — register your music company through GAFI" },
      { name: "National Telecom Regulatory Authority", abbr: "NTRA", url: "https://www.ntra.gov.eg", role: "Broadcast regulator overseeing radio and TV local-content quotas (40% Arabic/local content)" },
      { name: "Cairo International Film Festival", url: "https://cairofilmfest.org", role: "Key sync licensing opportunity — placements here open pan-Arab distribution channels" },
    ],
    keyDSPs: ["Anghami", "Boomplay", "Audiomack", "Spotify", "Apple Music", "YouTube Music", "Deezer"],
    distributors: [
      { name: "Anghami for Artists", url: "https://anghami.com", note: "Leading Arab-world streaming platform — priority for MENA market reach; 70M+ users across the Arab world" },
      { name: "Africori", url: "https://africori.com", note: "Strong MENA + Africa footprint; handles Boomplay, Audiomack, and regional stores" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Covers Anghami, Spotify, Apple Music and 150+ global DSPs — affordable flat-fee model" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Established global distributor with Anghami and Middle East store coverage" },
    ],
    grants: [
      { name: "Egyptian Ministry of Culture — Music Support Fund", url: "https://moculture.gov.eg", note: "State grants and subsidised studio access for Egyptian musicians through the Ministry of Culture" },
      { name: "Arab Fund for Arts and Culture (AFAC)", url: "https://arabculturefund.org", note: "Regional fund supporting Arab artists — music projects, albums, and touring eligible" },
    ],
    taxNote: "Register your music business with the Egyptian Tax Authority (ETA) and obtain a Tax Registration Number (TRN). Income tax applies to all Egyptian-source earnings. Foreign royalties repatriated to Egypt may be subject to withholding tax — consult a qualified Egyptian entertainment attorney.",
    registerNote: "Priority: Register with ECAD for performance and mechanical rights; register recordings with EMPA for neighbouring rights; ensure all works are in the CISAC system for international collection.",

    // ── Extended fields ──────────────────────────────────────────
    isrcPrefix: "EG",
    keyCities: ["Cairo", "Alexandria", "Giza", "Sharm El-Sheikh"],
    governingLaw: "the Arab Republic of Egypt",
    businessRegAbbr: "GAFI",
    taxAuthorityAbbr: "ETA",
    taxAuthorityFull: "Egyptian Tax Authority",
    localContentLabel: "Egyptian",
    lawyerNote: "qualified Egyptian entertainment attorney",

    broadcastRegulator: {
      name: "National Telecom Regulatory Authority",
      abbr: "NTRA",
      radioQuota: "Minimum 40% Arabic and local Egyptian content",
      tvQuota: "Minimum 40% Arabic and local content",
      qualCriteria: [
        "E — Egyptian origin — track must be composed, written, or performed by an Egyptian national or permanent resident",
        "A — Arabic-language — lyrics sung primarily in Arabic (Egyptian, Levantine, or Classical Arabic dialects all qualify)",
        "P — Produced in Egypt — principal recording, mixing, or mastering completed at a licensed Egyptian studio",
        "R — Registered rights — work registered with ECAD and/or EMPA; ISRC code assigned (EG- prefix)",
        "C — Cultural contribution — track demonstrates connection to Egyptian or pan-Arab cultural heritage; assessed case-by-case by NTRA",
      ],
      keyStations: [
        "ERTU Nile FM",
        "Nogoom FM",
        "Nile TV",
        "Melody Hits",
        "Mazzika TV",
        "Radio Masr",
        "Nogoum El-Ghad",
      ],
      fundingNote: "Egypt is Africa's largest Arabic-speaking music market and the historic hub of Arab pop (sha'bi, mahraganat, classic Arabic pop). The NTRA 40% Arabic/local content quota creates strong playlist and rotation opportunities for Egyptian-language releases. Cairo and Alexandria are home to major recording studios, label offices, and live venues. Anghami and Boomplay dominate streaming; WhatsApp-based promotion and YouTube remain powerful discovery channels. A bilingual (Arabic/English) press kit maximises coverage across local and pan-Arab media.",
    },

    societiesChecklist: [
      "ECAD (Egyptian Center for Authors Rights) — register all compositions for performance royalties; ECAD is Egypt's CISAC member society and exchanges royalties with 90+ international societies",
      "ECAD — register mechanical rights (same organisation handles performance and mechanical in Egypt — one registration covers both streams)",
      "EMPA (Egyptian Music Producers Association) — register your master recordings for neighbouring rights collection on Egyptian radio and TV broadcasts",
      "Assign EG-prefix ISRC codes — ECAD and your distributor (Africori, DistroKid) can assign codes; mandatory for broadcast tracking and royalty identification",
      "Ensure CISAC linkage — confirm your ECAD membership connects your catalogue to the global CISAC network for international performance royalty exchange",
      "International mechanical rights — register with a BIEM-affiliated society (e.g., MCPS-UK or SACEM-FR) to capture digital mechanical royalties from international DSPs",
      "AIRCO (African Independent Rights Collection Organisation) — register masters for pan-African neighbouring rights collection across African broadcast territories",
      "Egyptian Musicians Syndicate — obtain syndicate membership; required for legal live performance bookings and venue access in Egypt",
    ],

    mediaChecklist: [
      "Anghami editorial pitch — submit 4 weeks before release to Anghami's Arab editorial team; Anghami is the dominant Arabic-language streaming platform with 70M+ MENA users",
      "Boomplay Egypt pitch — submit 3–4 weeks before release to Boomplay's Egypt/Africa editorial team; strong Egyptian and East African user base",
      "Audiomack Arabic pitch — submit to Audiomack's North Africa/MENA editorial channel; growing Egyptian user base and strong algorithmic discoverability",
      "Nogoom FM — Egypt's most listened-to pop/Arabic music station; submit via official website or local radio plugger and follow up after 5 business days",
      "Nile FM — targets younger bilingual Egyptian audiences; strong for English-Arabic crossover material; submit promotional pack to programming team",
      "Mazzika TV & Melody Hits — Egypt's two leading music video channels; submit official video with Arabic metadata and EPK for rotation consideration",
      "YouTube Egypt — upload music video with Arabic title, description, and tags targeted at EG audience; activate official YouTube artist channel for algorithmic boost",
      "WhatsApp & TikTok — build a Cairo/Alexandria-based WhatsApp broadcast list and run Arabic TikTok hashtag campaigns; key organic discovery channels in Egypt",
      "Arabic press — pitch Masrawy Entertainment, El-Watan News Music section, and Dot Masr with bilingual (Arabic/English) press releases 2–3 weeks before release",
      "Ramadan sync opportunities — submit catalogue to Egyptian drama production houses for Ramadan series sync; Cairo International Film Festival also opens pan-Arab sync doors",
      "NTRA compliance check — confirm release meets 40% Arabic/local content criteria before radio/TV pitching; ensure Egyptian production credits, Arabic lyrics metadata, and ECAD registration are in place",
    ],
  },

  "Kenya": {
    country: "Kenya",
    flag: "🇰🇪",
    currency: "KES",
    currencyName: "Kenyan Shilling",
    performanceRights: {
      name: "Music Copyright Society of Kenya",
      abbr: "MCSK",
      url: "https://mcsk.net",
      note: "MCSK collects performance and mechanical royalties for composers, lyricists, and publishers in Kenya. Register your compositions with MCSK before release — membership is open to all Kenyan rights holders. MCSK is a CISAC member territory and exchanges royalties internationally through the CISAC reciprocal network.",
    },
    mechanicalRights: {
      name: "Music Copyright Society of Kenya",
      abbr: "MCSK",
      url: "https://mcsk.net",
      note: "MCSK handles both performance and mechanical rights in Kenya — one registration covers both royalty streams. No separate mechanical society. Ensure all songwriter credits, co-writer splits, and publisher information are complete under the Copyright Act (Cap 130) of 2001.",
    },
    neighbouringRights: {
      name: "Performers Rights Society of Kenya",
      abbr: "PRISK",
      url: "https://prisk.co.ke",
      note: "PRISK collects neighbouring (master recording) rights for performing artists and record producers in Kenya. Register as a performer and/or producer with PRISK separately from your MCSK composition registration. Also register with AIRCO for pan-African neighbouring rights collection.",
    },
    industryBodies: [
      { name: "Communications Authority of Kenya", abbr: "CA", url: "https://ca.go.ke", role: "Broadcast regulator — oversees radio and TV local content quotas (40% radio, 40% TV) in Kenya" },
      { name: "Kenya Copyright Board", abbr: "KECOBO", url: "https://copyright.go.ke", role: "Government copyright registration and enforcement under the Copyright Act (Cap 130)" },
      { name: "Business Registration Service", abbr: "BRS", url: "https://brs.go.ke", role: "Business registration authority — register your music company or sole proprietorship with BRS before entering commercial contracts" },
      { name: "Music Kenya", url: "", role: "Industry association representing Kenyan music stakeholders — networking, advocacy, and industry events" },
      { name: "Mdundo", url: "https://mdundo.com", role: "East African music platform with Kenya-first content strategy — important for mobile download market" },
    ],
    keyDSPs: ["Boomplay", "Audiomack", "Spotify", "Apple Music", "YouTube Music", "TikTok", "Mdundo"],
    distributors: [
      { name: "Africori", url: "https://africori.com", note: "Strongest pan-African footprint with East Africa expertise — priority for Boomplay, Audiomack, and Kenya/East Africa coverage" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Flat annual fee covering Boomplay, Spotify, Apple Music, and 150+ global DSPs" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Per-release fee model with solid global DSP coverage and transparent royalty reporting" },
      { name: "Mdundo for Artists", url: "https://mdundo.com", note: "East Africa-focused platform; strong mobile download market in Kenya — good supplementary channel" },
      { name: "Amuse", url: "https://amuse.io", note: "Free tier available — growing African presence; good entry-level option for independent artists" },
    ],
    grants: [
      { name: "Kenya Cultural Centre Fund", url: "https://kenyaculturalcentre.go.ke", note: "Government support for cultural and artistic projects in Kenya" },
      { name: "British Council Kenya — Arts Grants", url: "https://britishcouncil.org/kenya", note: "Kenya-UK creative sector development grants — international touring, residencies, and co-productions" },
      { name: "Hivos East Africa — Creative Economy Fund", url: "https://hivos.org", note: "Regional fund supporting East African creative industries including music, with focus on digital innovation" },
    ],
    taxNote: "Register with the Kenya Revenue Authority (KRA) via itax.kra.go.ke and obtain a Personal Identification Number (PIN). All music income — streaming, performance fees, royalties, sync — is taxable in Kenya. Register your business entity with BRS (Business Registration Service). M-Pesa is the dominant payment method for live fees — always confirm in a written contract. Consult a qualified Kenyan entertainment attorney before signing distribution or label deals.",
    registerNote: "Priority: Register compositions with MCSK (performance + mechanical) and as a performer/producer with PRISK (neighbouring rights); register your business with BRS and obtain a KRA PIN.",

    // ── Extended fields ──────────────────────────────────────────
    isrcPrefix: "KE",
    keyCities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru"],
    governingLaw: "the Republic of Kenya",
    businessRegAbbr: "BRS",
    taxAuthorityAbbr: "KRA",
    taxAuthorityFull: "Kenya Revenue Authority",
    localContentLabel: "Kenyan",
    lawyerNote: "qualified Kenyan entertainment attorney",

    broadcastRegulator: {
      name: "Communications Authority of Kenya",
      abbr: "CA",
      radioQuota: "Minimum 40% local Kenyan content",
      tvQuota: "Minimum 40% locally produced content",
      qualCriteria: [
        "R — Recorded in Kenya — master recording made wholly or substantially in Kenya",
        "A — Artist/Performer — recording performed principally by a Kenyan artist or group",
        "C — Composition — music composed by a Kenyan citizen or permanent resident",
        "L — Lyrics — where applicable, lyrics written by a Kenyan citizen or permanent resident",
        "M — MCSK registered — composition registered with MCSK and KE-prefix ISRC assigned to the recording",
      ],
      keyStations: [
        "Radio Citizen (98.4 FM)",
        "Kiss FM Kenya (100.3 FM)",
        "Capital FM Kenya (98.4 FM)",
        "Hot 96 FM",
        "NRG Radio",
        "NTV Kenya",
        "KTN Home",
      ],
      fundingNote: "Kenya's CA 40% local content quota is one of the highest in East Africa, creating strong guaranteed rotation for qualifying Kenyan releases. Nairobi is East Africa's music industry hub — Radio Citizen, Kiss FM, and Capital FM together reach millions weekly across the country. Hot 96 and NRG Radio target younger, urban audiences and are key for Afrobeats, gengetone, and contemporary Kenyan pop. Submit radio packs 6 weeks before release; WhatsApp follow-up after 5 business days is standard and expected. M-Pesa payment for live fees and studio sessions is the market norm — always confirm amounts in writing.",
    },

    societiesChecklist: [
      "MCSK (Music Copyright Society of Kenya) — register all compositions for performance royalties under the Copyright Act (Cap 130) of 2001; MCSK is Kenya's CISAC member society",
      "MCSK — register mechanical rights (same organisation handles both performance and mechanical in Kenya — one registration covers both streams)",
      "PRISK (Performers Rights Society of Kenya) — register as a performer and/or record producer for neighbouring rights collection on Kenyan radio and TV broadcasts",
      "Assign KE-prefix ISRC codes — obtain via your distributor (Africori, DistroKid) or directly through MCSK; one code per track, mandatory for broadcast tracking and royalty identification",
      "KECOBO (Kenya Copyright Board) — register key works for legal copyright protection and enforcement; strengthens your position in rights disputes",
      "AIRCO (African Independent Rights Collection Organisation) — register masters for pan-African neighbouring rights collection across African broadcast territories",
      "BRS (Business Registration Service) — register your music business entity at brs.go.ke before entering commercial contracts; required for formal invoicing and banking",
      "KRA (Kenya Revenue Authority) — register at itax.kra.go.ke, obtain a PIN, and file annual tax returns on all music income",
    ],

    mediaChecklist: [
      "Boomplay editorial pitch — submit 3–4 weeks before release to Boomplay's Kenya/East Africa editorial team; Boomplay is the dominant streaming platform in East Africa",
      "Audiomack pitch — contact Audiomack's East Africa editorial channel; strong Kenyan user base with free-streaming model driving high play counts",
      "Spotify for Artists editorial pitch — submit at least 7 days before release; target Afrobeats, African Heat, and East Africa-focused editorial playlists",
      "Radio Citizen (98.4 FM) — highest-reach Kenyan radio station; submit WAV and press pack to the music director 6 weeks before release; WhatsApp follow-up after 5 business days",
      "Kiss FM Kenya (100.3 FM) — leading urban contemporary station; strong for Afrobeats, gengetone, and international crossover; submit to music director with streaming links and one-sheet",
      "Capital FM Kenya — premium urban audience; strong for polished Afropop and international-sounding releases; essential for brand partnership credibility",
      "Hot 96 FM and NRG Radio — youth-focused Nairobi stations with high social media engagement; ideal for new release launches and artist interviews",
      "NTV Kenya and KTN Home — leading TV channels for music video rotation; submit high-resolution video with full metadata and EPK for programming consideration",
      "Nairobi city data monitoring — check Nairobi, Mombasa, and Kisumu streaming performance weekly via Spotify for Artists and Boomplay Analytics to identify organic traction",
      "Gengetone and Afrobeats TikTok push — TikTok is a primary discovery channel for Kenyan music; run targeted Kenyan and East African hashtag campaigns around release week",
      "CA local content compliance — confirm release meets CA 40% qualification criteria (recorded in Kenya, Kenyan artist, MCSK registered) before submitting to radio or TV",
    ],
  },

  "Ghana": {
    country: "Ghana",
    flag: "🇬🇭",
    currency: "GHS",
    currencyName: "Ghanaian Cedi",
    performanceRights: {
      name: "Ghana Music Rights Organisation",
      abbr: "GHAMRO",
      url: "https://ghamro.org",
      note: "GHAMRO collects performance royalties for composers, lyricists, publishers, and performers in Ghana. Register your compositions and recordings with GHAMRO before release. Ghana is a CISAC associate territory — royalties are exchanged with international societies. Membership is open to all Ghanaian rights holders.",
    },
    mechanicalRights: {
      name: "Ghana Music Rights Organisation",
      abbr: "GHAMRO",
      url: "https://ghamro.org",
      note: "GHAMRO handles mechanical rights alongside performance rights in Ghana — one registration covers both royalty streams. Ensure all songwriter credits, co-writer splits, and publisher information are complete when registering. Under the Copyright Act 2005 (Act 690), mechanical rights attach automatically to original compositions.",
    },
    neighbouringRights: {
      name: "Ghana Music Rights Organisation",
      abbr: "GHAMRO",
      url: "https://ghamro.org",
      note: "GHAMRO also administers neighbouring (master recording) rights for performers and producers in Ghana. Register as both a performer and producer where applicable. For international neighbouring rights collection, also register with AIRCO (African Independent Rights Collection Organisation).",
    },
    industryBodies: [
      { name: "Copyright Office of Ghana", url: "https://copyright.gov.gh", role: "Government copyright registration — register works under the Copyright Act 2005 (Act 690) for legal protection and enforcement" },
      { name: "National Communications Authority", abbr: "NCA", url: "https://nca.org.gh", role: "Broadcast regulator — oversees radio and TV local content quotas (20–25% radio, 30% TV)" },
      { name: "Musicians Union of Ghana", abbr: "MUSIGA", url: "", role: "Musicians union — welfare, advocacy, and live performance regulation; membership recommended for all professional artists" },
      { name: "Registrar-General's Department", abbr: "RGD", url: "https://rgd.gov.gh", role: "Business registration — register your music company or sole proprietorship with the RGD before entering commercial contracts" },
      { name: "Ghana Music Awards Authority", url: "", role: "Organises Ghana Music Awards — key industry recognition platform and promotional vehicle" },
    ],
    keyDSPs: ["Boomplay", "Audiomack", "Spotify", "Apple Music", "YouTube Music", "TikTok"],
    distributors: [
      { name: "Africori", url: "https://africori.com", note: "Strongest pan-African footprint with local offices — priority for Boomplay, Audiomack, and Ghana/West Africa coverage" },
      { name: "Audiomack for Artists", url: "https://audiomack.com/artists", note: "Free direct artist distribution with strong Ghana and West Africa presence — good entry-level option" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Flat annual fee covering all major DSPs including Boomplay, Spotify, Apple Music, and 150+ global stores" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Per-release fee model; solid global DSP coverage and transparent royalty reporting" },
      { name: "Amuse", url: "https://amuse.io", note: "Free tier available — growing African presence; good for independent starters" },
    ],
    grants: [
      { name: "Ghana Film Authority — Creative Fund", url: "https://ghanafilmauthority.gov.gh", note: "Grants for creative projects with audio-visual components — music video production and film score work eligible" },
      { name: "British Council Ghana — Arts Grants", url: "https://britishcouncil.org/ghana", note: "UK-Ghana creative sector development funding — international touring, residencies, and co-productions" },
      { name: "MUSIGA Welfare & Development Fund", url: "", note: "Musicians Union of Ghana development support for members — emergency assistance and professional development" },
    ],
    taxNote: "Register with the Ghana Revenue Authority (GRA) and obtain a Tax Identification Number (TIN). All music income — streaming, performance fees, royalties, sync — is taxable in Ghana. Register your business entity with the Registrar-General's Department (RGD). Always consult a qualified Ghanaian entertainment attorney before signing distribution or label contracts.",
    registerNote: "Priority: Register with GHAMRO for performance, mechanical, and neighbouring rights — all in one organisation; register your business with RGD and obtain a GRA TIN.",

    // ── Extended fields ──────────────────────────────────────────
    isrcPrefix: "GH",
    keyCities: ["Accra", "Kumasi", "Takoradi", "Tamale"],
    governingLaw: "the Republic of Ghana",
    businessRegAbbr: "RGD",
    taxAuthorityAbbr: "GRA",
    taxAuthorityFull: "Ghana Revenue Authority",
    localContentLabel: "Ghanaian",
    lawyerNote: "qualified Ghanaian entertainment attorney",

    broadcastRegulator: {
      name: "National Communications Authority",
      abbr: "NCA",
      radioQuota: "Minimum 20–25% Ghanaian local music content",
      tvQuota: "Minimum 30% locally produced content",
      qualCriteria: [
        "R — Recorded in Ghana — master recording made wholly or substantially in Ghana at a licensed studio",
        "A — Artist/Performer — recording performed principally by a Ghanaian artist or group",
        "C — Composition — music composed by a Ghanaian citizen or permanent resident",
        "L — Lyrics — where applicable, lyrics written by a Ghanaian citizen or permanent resident",
        "G — GHAMRO registered — composition and recording registered with GHAMRO; GH-prefix ISRC assigned",
      ],
      keyStations: [
        "Joy FM (99.7)",
        "Peace FM",
        "Asaase Radio 99.5",
        "Citi FM 97.3",
        "Adom FM 106.3",
        "Hitz FM 103.9",
        "GTV (Ghana Television)",
      ],
      fundingNote: "Ghana's NCA quota of 20–25% on radio creates consistent rotation opportunities for qualifying Ghanaian releases. Joy FM, Peace FM, and Adom FM are among the highest-reach stations in Accra with national penetration. Hitz FM and Asaase Radio target younger, Afrobeats/Afropop-oriented audiences — ideal for contemporary releases. Community and regional stations often apply higher local content thresholds, making them accessible entry points for independent artists building a broadcast track record. Submit to radio 6 weeks before release; a WhatsApp follow-up after 5 business days is standard practice in the Ghanaian market.",
    },

    societiesChecklist: [
      "GHAMRO (Ghana Music Rights Organisation) — register all compositions for performance royalties under the Copyright Act 2005 (Act 690); GHAMRO is Ghana's CISAC associate society",
      "GHAMRO — register mechanical rights (same organisation handles both performance and mechanical in Ghana — one registration covers both streams)",
      "GHAMRO — register master recordings for neighbouring rights as performer and/or producer",
      "Assign GH-prefix ISRC codes — obtain via your distributor (Africori, DistroKid) or directly through GHAMRO; one code per track, mandatory for broadcast tracking and royalty identification",
      "Copyright Office of Ghana — register key works under the Copyright Act 2005 (Act 690) for legal protection and enforcement; strengthens your position in any rights dispute",
      "AIRCO (African Independent Rights Collection Organisation) — register masters for pan-African neighbouring rights collection across African broadcast territories",
      "MUSIGA (Musicians Union of Ghana) — obtain membership; recommended for live performance access and professional advocacy",
      "RGD (Registrar-General's Department) — register your music business entity before entering commercial contracts; required for formal invoicing and banking",
      "GRA (Ghana Revenue Authority) — obtain a TIN and register for income tax; all streaming, royalty, and performance income is taxable",
    ],

    mediaChecklist: [
      "Boomplay editorial pitch — submit 3–4 weeks before release to Boomplay's Ghana/West Africa editorial team; Boomplay is Africa's largest streaming platform with dominant Ghana market share",
      "Audiomack pitch — contact Audiomack's West Africa editorial channel; strong Ghanaian user base with free-streaming model driving high play counts",
      "Spotify for Artists editorial pitch — submit at least 7 days before release date via Spotify for Artists dashboard; target Afrobeats, Afropop, and African Heat playlists",
      "Joy FM (99.7 Accra) — submit 6 weeks before release; Joy FM is Ghana's highest-reach English/Afropop station; contact the music director with a one-sheet, WAV, and streaming link",
      "Hitz FM (103.9) — targets younger Ghanaian audience; strong for Afrobeats and contemporary Ghanaian pop; submit radio pack 6 weeks out and WhatsApp follow up after 5 business days",
      "Adom FM (106.3) — largest Twi-language station; essential for Twi-language or highlife releases and mass Ghanaian audience penetration",
      "Peace FM — national reach, broad demographic; strong for highlife, gospel, and Ghanaian pop; submit promotional pack to programming team",
      "Asaase Radio (99.5) — contemporary, youth-focused Accra station; good for Afrobeats and urban releases; growing digital audience",
      "GTV music video submission — Ghana Television accepts music video submissions for rotation on GTV; submit high-resolution video with full metadata and credits",
      "Check Ghana city data weekly — monitor Accra, Kumasi, and Takoradi streaming performance in Spotify for Artists and Boomplay Analytics to identify organic traction",
      "NCA local content compliance — confirm your release meets NCA qualification criteria (recorded in Ghana, Ghanaian artist, GHAMRO registered) before submitting to radio or TV",
    ],
  },

  "Tanzania": {
    country: "Tanzania",
    flag: "🇹🇿",
    currency: "TZS",
    currencyName: "Tanzanian Shilling",
    performanceRights: {
      name: "Copyright Society of Tanzania",
      abbr: "COSOTA",
      url: "https://cosota.go.tz",
      note: "COSOTA is Tanzania's government-mandated CMO collecting performance and mechanical royalties for composers, authors, and publishers. Register your compositions with COSOTA before release — membership is open to Tanzanian and foreign rights holders. COSOTA is a CISAC member and exchanges royalties internationally. Rights are protected under the Copyright and Neighbouring Rights Act 1999 (Act No. 7 of 1999, revised 2002).",
    },
    mechanicalRights: {
      name: "Copyright Society of Tanzania",
      abbr: "COSOTA",
      url: "https://cosota.go.tz",
      note: "COSOTA handles mechanical rights alongside performance rights in Tanzania — one registration covers both royalty streams. Register all works on COSOTA's portal with complete songwriter credits, co-writer splits, and publisher details before commercial release.",
    },
    neighbouringRights: {
      name: "Tanzania Music Rights Association",
      abbr: "TAMRA",
      url: "",
      note: "TAMRA (Tanzania Music Rights Association) collects neighbouring rights for performers and producers in Tanzania. Register as a performer and/or producer with TAMRA separately from your COSOTA composition registration. Also register with AIRCO (African Independent Rights Collection Organisation) for pan-African and international neighbouring rights collection.",
    },
    industryBodies: [
      { name: "Tanzania Communications Regulatory Authority", abbr: "TCRA", url: "https://tcra.go.tz", role: "Broadcast regulator — oversees radio and TV local content quotas (40% radio, 40% TV) in Tanzania" },
      { name: "Business Registrations and Licensing Agency", abbr: "BRELA", url: "https://brela.go.tz", role: "Business registration authority — register your music company or business name with BRELA before commercial contracting" },
      { name: "Tanzania Revenue Authority", abbr: "TRA", url: "https://tra.go.tz", role: "Tax authority — register for TIN and file annual returns on all music income" },
      { name: "Chama cha Wasanii Tanzania", url: "", role: "Artists and musicians association — advocacy, welfare, and industry representation" },
      { name: "Baraza la Sanaa la Taifa (BASATA)", url: "https://bact.go.tz", role: "National arts council — cultural funding, event licensing, and artist development programmes" },
    ],
    keyDSPs: ["Boomplay", "Audiomack", "Spotify", "Apple Music", "YouTube Music", "TikTok", "Mdundo"],
    distributors: [
      { name: "Africori", url: "https://africori.com", note: "Strongest pan-African footprint with East Africa expertise — priority for Boomplay, Audiomack, and Tanzania/East Africa coverage" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Flat annual fee covering Boomplay, Spotify, Apple Music, and 150+ global DSPs" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Per-release fee model with solid global DSP coverage and transparent royalty reporting" },
      { name: "Mdundo for Artists", url: "https://mdundo.com", note: "East Africa-focused platform with strong Tanzania and Kenya mobile download market — good supplementary channel" },
      { name: "Amuse", url: "https://amuse.io", note: "Free tier available — growing East African presence; good entry-level option for independent artists" },
    ],
    grants: [
      { name: "BASATA — Tanzania Arts Council Fund", url: "https://bact.go.tz", note: "Government arts and cultural development grants through Baraza la Sanaa la Taifa — studio, touring, and project funding" },
      { name: "British Council Tanzania", url: "https://britishcouncil.org/tanzania", note: "Tanzania-UK creative sector development grants — international touring, residencies, and co-productions" },
    ],
    taxNote: "Register with the Tanzania Revenue Authority (TRA) at tra.go.tz and obtain a Tax Identification Number (TIN). All music income — streaming, performance fees, royalties, sync — is taxable in Tanzania. Register your business entity with BRELA (Business Registrations and Licensing Agency). Consult a qualified Tanzanian entertainment attorney before signing distribution or label contracts.",
    registerNote: "Priority: Register compositions with COSOTA (performance + mechanical) and as a performer/producer with TAMRA (neighbouring rights); register your business with BRELA and obtain a TRA TIN.",

    // ── Extended fields ──────────────────────────────────────────
    isrcPrefix: "TZ",
    keyCities: ["Dar es Salaam", "Arusha", "Mwanza", "Zanzibar City"],
    governingLaw: "the United Republic of Tanzania",
    businessRegAbbr: "BRELA",
    taxAuthorityAbbr: "TRA",
    taxAuthorityFull: "Tanzania Revenue Authority",
    localContentLabel: "Tanzanian",
    lawyerNote: "qualified Tanzanian entertainment attorney",

    broadcastRegulator: {
      name: "Tanzania Communications Regulatory Authority",
      abbr: "TCRA",
      radioQuota: "Minimum 40% local Tanzanian content",
      tvQuota: "Minimum 40% locally produced content",
      qualCriteria: [
        "R — Recorded in Tanzania — master recording made wholly or substantially in Tanzania",
        "A — Artist/Performer — recording performed principally by a Tanzanian artist or group",
        "C — Composition — music composed by a Tanzanian citizen or permanent resident",
        "L — Lyrics — where applicable, lyrics written by a Tanzanian citizen or permanent resident; Swahili-language recordings carry strong cultural qualification",
        "S — Society registered — composition registered with COSOTA and TZ-prefix ISRC assigned to the recording",
      ],
      keyStations: [
        "Radio One Tanzania (89.9 FM)",
        "Wasafi FM (104.1 FM)",
        "Clouds FM (89.4 FM)",
        "Kiss FM Tanzania (96.1 FM)",
        "ITV Tanzania",
        "Clouds TV",
        "Wasafi TV",
      ],
      fundingNote: "Tanzania is East Africa's second-largest music market and the home of bongo flava — Swahili-language hip-hop and Afropop that dominates regional charts. The TCRA 40% quota creates strong guaranteed rotation for qualifying Tanzanian releases. Wasafi FM and Clouds FM are the dominant Dar es Salaam stations for bongo flava and contemporary Tanzanian music. Radio One has a broader national reach. Wasafi TV and Clouds TV are the essential television channels for music video rotation. Swahili-language releases enjoy the strongest local content qualification and the widest organic audience across Tanzania and the East African Swahili-speaking belt. Submit radio packs 6 weeks before release; WhatsApp follow-up after 5 business days is standard.",
    },

    societiesChecklist: [
      "COSOTA (Copyright Society of Tanzania) — register all compositions for performance royalties under the Copyright and Neighbouring Rights Act 1999 (Act No. 7 of 1999); COSOTA is Tanzania's CISAC member society",
      "COSOTA — register mechanical rights (same organisation handles both performance and mechanical in Tanzania — one registration covers both streams)",
      "TAMRA (Tanzania Music Rights Association) — register as performer and/or producer for neighbouring rights collection on Tanzanian radio and TV broadcasts",
      "Assign TZ-prefix ISRC codes — obtain via your distributor (Africori, DistroKid) or directly through COSOTA; one code per track, mandatory for broadcast tracking and royalty identification",
      "AIRCO (African Independent Rights Collection Organisation) — register masters for pan-African neighbouring rights collection across African broadcast territories",
      "BRELA (Business Registrations and Licensing Agency) — register your music business entity at brela.go.tz before entering commercial contracts; required for formal invoicing and banking",
      "TRA (Tanzania Revenue Authority) — obtain a TIN and register for tax at tra.go.tz; all streaming, royalty, and performance income is taxable in Tanzania",
    ],

    mediaChecklist: [
      "Boomplay editorial pitch — submit 3–4 weeks before release to Boomplay's Tanzania/East Africa editorial team; Boomplay is the dominant streaming platform in Tanzania",
      "Audiomack pitch — contact Audiomack's East Africa editorial channel; free-streaming model drives high play counts among Tanzanian audiences",
      "Spotify for Artists editorial pitch — submit at least 7 days before release; target Afrobeats, African Heat, and East Africa-focused playlists",
      "Wasafi FM (104.1 FM) — Tanzania's leading bongo flava station; submit WAV and Swahili-language press pack to the music director 6 weeks before release; WhatsApp follow-up after 5 business days",
      "Clouds FM (89.4 FM) — major Dar es Salaam station with strong youth audience; essential for bongo flava and contemporary Tanzanian pop; submit to music director with one-sheet and streaming links",
      "Radio One Tanzania (89.9 FM) — broad national reach with diverse music programming; important for mainstream and crossover Tanzanian releases",
      "Kiss FM Tanzania (96.1 FM) — urban contemporary station in Dar es Salaam; strong for English-language and international-crossover releases",
      "Wasafi TV and Clouds TV — Tanzania's two dominant music video channels; submit high-resolution video with Swahili metadata and EPK for rotation consideration",
      "ITV Tanzania — national TV broadcaster; submit music video and EPK for programming consideration and interview opportunities",
      "Dar es Salaam city data monitoring — check Dar es Salaam, Arusha, and Mwanza streaming performance weekly via Spotify for Artists and Boomplay Analytics",
      "Swahili content strategy — Swahili-language releases and social media content (Swahili hashtags on TikTok and Instagram) reach the widest Tanzanian and East African Swahili-speaking audience",
      "TCRA local content compliance — confirm release meets TCRA criteria (recorded in Tanzania, Tanzanian artist, COSOTA registered) before submitting to radio or TV",
    ],
  },

  "Ethiopia": {
    country: "Ethiopia",
    flag: "🇪🇹",
    currency: "ETB",
    currencyName: "Ethiopian Birr",
    performanceRights: {
      name: "Ethiopian Copyrights and Neighbouring Rights Protection Office",
      abbr: "ECRIP",
      url: "https://eipo.gov.et",
      note: "ECRIP registers and protects compositions for performance royalties in Ethiopia under the Copyright and Neighbouring Rights Protection Proclamation No. 410/2004. Register your works with ECRIP before release. The collective management framework is developing — also register internationally to capture global streaming royalties through CISAC reciprocal collection.",
    },
    mechanicalRights: {
      name: "Ethiopian Copyrights and Neighbouring Rights Protection Office",
      abbr: "ECRIP",
      url: "https://eipo.gov.et",
      note: "ECRIP handles mechanical rights alongside performance rights in Ethiopia — one registration covers both streams. Supplement with your digital distributor's DSP agreements to ensure mechanical royalties are captured on global platforms.",
    },
    neighbouringRights: {
      name: "Ethiopian Copyrights and Neighbouring Rights Protection Office",
      abbr: "ECRIP",
      url: "https://eipo.gov.et",
      note: "ECRIP also administers neighbouring rights for performers and record producers in Ethiopia. Register as a performer or record maker. Supplement with AIRCO for pan-African cross-border collection and PPL for UK neighbouring rights.",
    },
    industryBodies: [
      { name: "Ethiopian Broadcasting Authority", abbr: "EBA", url: "https://eba.gov.et", role: "National broadcast regulator — issues licences and enforces the 60% local content quota on all licensed radio and TV broadcasters" },
      { name: "Ethiopian Intellectual Property Office", abbr: "EIPO", url: "https://eipo.gov.et", role: "Trademark and copyright administration — register your artist brand and creative works" },
      { name: "Trade and Business Registration Bureau", abbr: "TBRB", url: "", role: "Business registration — formalise your management company or music business entity through the TBRB" },
      { name: "Ethiopian Music Industry Association", url: "", role: "Emerging industry association for Ethiopian music professionals — networking and advocacy" },
    ],
    keyDSPs: ["Boomplay", "Audiomack", "YouTube Music", "Spotify", "Apple Music"],
    distributors: [
      { name: "Africori", url: "https://africori.com", note: "Pan-African distributor with East Africa expertise — recommended first choice for Ethiopia market reach" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Global DSP coverage at flat annual fee — good for volume releases" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Per-release fee model — reliable global distribution with detailed royalty reporting" },
      { name: "Amuse", url: "https://amuse.io", note: "Free tier available — growing platform for independent starters" },
    ],
    grants: [
      { name: "Ethiopian Ministry of Culture and Tourism", url: "https://mct.gov.et", note: "Government cultural development support — eligibility requires Ethiopian citizenship or residency and documented artistic output" },
      { name: "Music In Africa Foundation — Sound Connects Fund", url: "https://www.musicinafrica.net/sound-connects-fund", note: "Open to African artists and music businesses. Supports projects with demonstrable community and industry impact across the continent" },
    ],
    taxNote: "Register with the Ethiopian Revenue and Customs Authority (ERCA) — your Tax Identification Number (TIN) is required for all formal contracts and invoices. Music income, management commissions, and performance fees are all taxable in Ethiopia. Register your music business entity through the Trade and Business Registration Bureau (TBRB). Keep all invoices and supporting records for a minimum of 5 years.",
    registerNote: "Priority: Register compositions and performances with ECRIP (performance + mechanical + neighbouring rights — one registration covers all three). ISRC prefix: ET. Broadcast quota: 60% local content (EBA). Key markets: Addis Ababa, Dire Dawa, Mekelle, Gondar.",
    isrcPrefix: "ET",
    keyCities: ["Addis Ababa", "Dire Dawa", "Mekelle", "Gondar"],
    governingLaw: "the Federal Democratic Republic of Ethiopia",
    businessRegAbbr: "TBRB",
    taxAuthorityAbbr: "ERCA",
    taxAuthorityFull: "Ethiopian Revenue and Customs Authority",
    localContentLabel: "Ethiopian",
    lawyerNote: "qualified Ethiopian entertainment attorney",
    broadcastRegulator: {
      name: "Ethiopian Broadcasting Authority",
      abbr: "EBA",
      radioQuota: "Minimum 60% local Ethiopian content",
      tvQuota: "Minimum 60% local content",
      qualCriteria: [
        "Recording — the master recording was made wholly or substantially in Ethiopia",
        "Artist/Performer — the recording is performed principally by an Ethiopian artist or group",
        "Music/Composition — the music was composed by an Ethiopian citizen or permanent resident",
        "Lyrics — the lyrics were written by an Ethiopian citizen or permanent resident (where applicable)",
      ],
      keyStations: [
        "EBC — Ethiopian Broadcasting Corporation (national public broadcaster, radio + TV)",
        "Fana FM (Addis Ababa — high-reach national commercial radio with wide regional reach)",
        "Sheger FM 102.1 (Addis Ababa — major urban commercial station, strong youth audience)",
        "Radio Fana (Addis Ababa — one of the most widely listened-to national stations)",
        "ETV — Ethiopian Television (national public TV)",
        "Kana TV (popular private TV channel — significant music video programming)",
      ],
      fundingNote: "With a 60% local content quota, qualifying as Ethiopian music gives you mandatory access to the most influential broadcast market in the Horn of Africa. EBC and Fana FM together reach millions across all regions and language communities. Ethiopia is a multi-language market — Amharic, Oromo, Tigrinya, and Somali-language recordings all qualify and can unlock distinct regional audiences. Register all compositions with ECRIP before submitting to radio or TV.",
    },
    societiesChecklist: [
      "ECRIP (Ethiopian Copyrights and Neighbouring Rights Protection Office) — register all compositions for performance royalties under Proclamation No. 410/2004",
      "ECRIP — register mechanical rights (same organisation handles performance and mechanical in Ethiopia — one registration covers both)",
      "ECRIP — register as a performer for neighbouring rights (ECRIP also administers neighbouring rights for performers and record producers)",
      "SoundExchange (USA) — for digital performance royalties from US streaming services and satellite radio (SiriusXM)",
      "PPL (UK) — for neighbouring rights collection in the United Kingdom",
      "AIRCO — register with the African Independent Rights Collection Organisation for pan-African neighbouring rights collection",
      "Use your digital distributor to ensure streaming mechanical royalties are captured on all global DSPs",
      "All song titles registered and confirmed with ECRIP before release date",
    ],
    mediaChecklist: [
      "Research the programming director or music director at each target EBA-licensed station before making contact",
      "Submit radio materials to EBC and major stations (Fana FM, Sheger FM) minimum 6 weeks before target airdate",
      "Submit to regional stations in Dire Dawa, Mekelle, and Gondar for broad national coverage across language communities",
      "Include one-sheet, artist bio, streaming links, and WAV/MP3 file with every radio submission",
      "WhatsApp follow-up is appropriate and expected in Ethiopia after 5 business days of no response to an email submission",
      "Submit music video to ETV and Kana TV for television music programming consideration",
      "Pitch to Boomplay and Audiomack editorial — priority digital platforms for Ethiopia market reach",
      "Confirm ECRIP registration is active and all compositions are correctly registered before any media push",
    ],
  },

  "Morocco": {
    country: "Morocco",
    flag: "🇲🇦",
    currency: "MAD",
    currencyName: "Moroccan Dirham",
    performanceRights: {
      name: "Bureau Marocain du Droit d'Auteur",
      abbr: "BMDA",
      url: "https://bmda.ma",
      note: "BMDA collects performance royalties for composers, authors, and publishers in Morocco. Register your compositions before release. Morocco is a CISAC member territory — royalties are exchanged internationally with 90+ societies through the CISAC reciprocal network.",
    },
    mechanicalRights: {
      name: "Bureau Marocain du Droit d'Auteur",
      abbr: "BMDA",
      url: "https://bmda.ma",
      note: "BMDA handles mechanical rights alongside performance rights in Morocco — one registration covers both royalty streams. Register all compositions with full songwriter credits and publisher details under Law No. 2-00 on Copyright and Related Rights (2000, amended 2006).",
    },
    neighbouringRights: {
      name: "Bureau Marocain du Droit d'Auteur",
      abbr: "BMDA",
      url: "https://bmda.ma",
      note: "BMDA also manages neighbouring (master recording) rights for performers and producers in Morocco. Register as a performer and/or producer with BMDA. Also register with AIRCO for pan-African neighbouring rights collection.",
    },
    industryBodies: [
      { name: "Haute Autorité de la Communication Audiovisuelle", abbr: "HACA", url: "https://haca.ma", role: "Broadcast regulator — oversees radio and TV local content quotas (40% Arabic/Amazigh radio, 50% TV) in Morocco" },
      { name: "Centre Régional d'Investissement", abbr: "CRI", url: "https://invest.gov.ma", role: "Business registration authority — register your music company through the CRI one-stop window" },
      { name: "Moroccan Ministry of Culture", url: "https://minculture.gov.ma", role: "Cultural funding, artist support programmes, and music industry policy" },
      { name: "L'Boulevard Festival", url: "https://boulevard.ma", role: "Morocco's leading urban music festival — key industry showcase and sync/licensing gateway" },
    ],
    keyDSPs: ["Boomplay", "Audiomack", "Spotify", "Apple Music", "YouTube Music", "TikTok", "Deezer", "Anghami"],
    distributors: [
      { name: "Africori", url: "https://africori.com", note: "Strongest pan-African and North Africa footprint — priority for Boomplay, Audiomack, and Morocco/Maghreb coverage" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Flat annual fee covering Boomplay, Spotify, Apple Music, Anghami, and 150+ global DSPs" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Per-release fee model with solid global and MENA DSP coverage including Anghami" },
      { name: "Anghami for Artists", url: "https://anghami.com", note: "Arab-world's leading streaming platform — essential for pan-MENA reach from Morocco" },
      { name: "Amuse", url: "https://amuse.io", note: "Free tier available — growing African and MENA presence; good entry-level option" },
    ],
    grants: [
      { name: "Moroccan Centre for Cinematography (CCM)", url: "https://ccm.ma", note: "Funds creative projects with a visual component — music video production eligible" },
      { name: "Ministry of Culture Creative Fund", url: "https://minculture.gov.ma", note: "Annual grants for Moroccan music artists and cultural projects" },
      { name: "Institut Français Maroc", url: "https://if-maroc.org", note: "French cultural institute offering co-production support, residencies, and touring grants for Moroccan musicians" },
    ],
    taxNote: "Register with the Direction Générale des Impôts (DGI) and obtain your Identifiant Commun de l'Entreprise (ICE). Music income is subject to professional tax (Taxe Professionnelle) and income tax (IR). Formal company structures (SARL) are advisable for commercial music businesses. Consult a qualified Moroccan entertainment attorney before signing distribution or label contracts.",
    registerNote: "Priority: Register with BMDA for performance, mechanical, and neighbouring rights — one organisation covers all three in Morocco; register your business through the CRI.",

    // ── Extended fields ──────────────────────────────────────────
    isrcPrefix: "MA",
    keyCities: ["Casablanca", "Rabat", "Marrakech", "Fez"],
    governingLaw: "the Kingdom of Morocco",
    businessRegAbbr: "CRI",
    taxAuthorityAbbr: "DGI",
    taxAuthorityFull: "Direction Générale des Impôts",
    localContentLabel: "Moroccan",
    lawyerNote: "qualified Moroccan entertainment attorney",

    broadcastRegulator: {
      name: "Haute Autorité de la Communication Audiovisuelle",
      abbr: "HACA",
      radioQuota: "Minimum 40% Arabic and Amazigh content",
      tvQuota: "Minimum 50% local Moroccan content",
      qualCriteria: [
        "R — Recorded in Morocco — master recording made wholly or substantially in Morocco",
        "A — Artist/Performer — recording performed principally by a Moroccan artist or group",
        "L — Language — lyrics sung in Arabic (Darija/Modern Standard) or Amazigh (Tamazight); French-language recordings assessed case-by-case",
        "C — Composition — music composed by a Moroccan citizen or permanent resident",
        "B — BMDA registered — composition and recording registered with BMDA; MA-prefix ISRC assigned",
      ],
      keyStations: [
        "Radio Mars (92.4 FM)",
        "Hit Radio (96.0 FM)",
        "Medi 1 Radio",
        "Radio Aswat",
        "2M TV",
        "Al Aoula (RTM)",
        "Medi 1 TV",
      ],
      fundingNote: "Morocco is Africa's most connected music market to Europe and the Arab world. HACA's 40% Arabic/Amazigh radio quota and 50% TV quota create strong guaranteed rotation for qualifying Moroccan releases. Hit Radio and Radio Mars are Casablanca's dominant urban stations targeting younger Moroccan audiences — essential for Afro-Arab, rap, and contemporary Moroccan pop. Medi 1 Radio has bilingual (Arabic/French) reach across the Maghreb and into Europe. Submit radio packs 6 weeks before release; a WhatsApp or email follow-up after 5 business days is standard practice. French-language and Arabic-language press kits both serve the Moroccan market.",
    },

    societiesChecklist: [
      "BMDA (Bureau Marocain du Droit d'Auteur) — register all compositions for performance royalties under Law No. 2-00 on Copyright and Related Rights; BMDA is Morocco's CISAC member society",
      "BMDA — register mechanical rights (same organisation handles both performance and mechanical in Morocco — one registration covers both streams)",
      "BMDA — register master recordings for neighbouring rights as performer and/or producer",
      "Assign MA-prefix ISRC codes — obtain via your distributor (Africori, DistroKid) or directly through BMDA; one code per track, mandatory for broadcast tracking and royalty identification",
      "AIRCO (African Independent Rights Collection Organisation) — register masters for pan-African neighbouring rights collection across African broadcast territories",
      "CRI (Centre Régional d'Investissement) — register your music business entity before entering commercial contracts; required for formal invoicing and banking in Morocco",
      "DGI (Direction Générale des Impôts) — register and obtain your ICE (Identifiant Commun de l'Entreprise); all streaming, royalty, and performance income is taxable in Morocco",
    ],

    mediaChecklist: [
      "Boomplay editorial pitch — submit 3–4 weeks before release to Boomplay's North Africa/Morocco editorial team; growing rapidly in the Maghreb",
      "Audiomack pitch — contact Audiomack's North Africa editorial channel; free-streaming model drives strong play counts among Moroccan audiences",
      "Spotify for Artists editorial pitch — submit at least 7 days before release; target Arabic music, Afrobeats, and North Africa-focused playlists",
      "Hit Radio (96.0 FM) — Morocco's leading urban music station targeting 15–35 demographic in Casablanca and beyond; submit radio pack to music director 6 weeks before release",
      "Radio Mars (92.4 FM) — leading commercial station with national reach; essential for Moroccan pop, rap, and urban releases; follow up by WhatsApp after 5 business days",
      "Medi 1 Radio — bilingual (Arabic/French) Moroccan station with reach across the Maghreb and into France/Spain; important for international crossover positioning",
      "2M TV — Morocco's most-watched private TV channel; submit music video with Arabic/French metadata and EPK for rotation in 2M music programming",
      "Al Aoula (RTM) — Morocco's national broadcaster with widest geographic reach; essential for Amazigh-language and heritage-rooted Moroccan releases",
      "L'Boulevard Festival submission — submit artist profile for consideration to Morocco's premier urban festival; placement drives press coverage, industry relationships, and sync opportunities",
      "Casablanca and Rabat city data — monitor Casablanca, Rabat, and Marrakech streaming performance weekly via Spotify for Artists to identify organic traction",
      "TikTok Moroccan content strategy — TikTok (Arabic and Darija hashtag targeting) and Instagram Reels are primary discovery channels for Moroccan youth; plan coordinated content around release week",
      "HACA local content compliance — confirm release meets HACA criteria (recorded in Morocco, Moroccan artist, Arabic/Amazigh lyrics, BMDA registered) before submitting to radio or TV",
    ],
  },

  "Algeria": {
    country: "Algeria",
    flag: "🇩🇿",
    currency: "DZD",
    currencyName: "Algerian Dinar",
    performanceRights: {
      name: "Office National des Droits d'Auteur et des Droits Voisins",
      abbr: "ONDA",
      url: "https://onda.dz",
      note: "Algeria's national copyright and neighbouring rights collective management organisation. ONDA collects performance, mechanical, and neighbouring rights royalties. Register your compositions and recordings with ONDA.",
    },
    mechanicalRights: {
      name: "Office National des Droits d'Auteur et des Droits Voisins",
      abbr: "ONDA",
      url: "https://onda.dz",
      note: "ONDA handles mechanical rights in Algeria alongside performance rights. One registration covers both streams. Algeria has CISAC membership — international royalties flow through ONDA.",
    },
    neighbouringRights: {
      name: "Office National des Droits d'Auteur et des Droits Voisins",
      abbr: "ONDA",
      url: "https://onda.dz",
      note: "ONDA manages neighbouring rights for performing artists and producers in Algeria. One registration covers performance, mechanical, and neighbouring rights.",
    },
    industryBodies: [
      { name: "Ministère de la Culture et des Arts", url: "https://minculture.gov.dz", role: "Government ministry overseeing arts funding and cultural policy" },
    ],
    keyDSPs: ["Anghami", "Spotify", "Deezer", "YouTube Music", "Apple Music", "Boomplay"],
    distributors: [
      { name: "Anghami for Artists", url: "https://anghami.com", note: "Leading MENA streaming platform — priority for Algerian market" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Global DSP coverage" },
    ],
    grants: [
      { name: "Ministry of Culture Arts Fund", url: "https://minculture.gov.dz", note: "Government grants for Algerian cultural and musical projects" },
    ],
    taxNote: "Register with the Direction Générale des Impôts (DGI). Income from music activity is taxable in Algeria. Artists may benefit from cultural sector tax exemptions — consult an Algerian entertainment accountant.",
    registerNote: "Priority: Register with ONDA — one organisation covers performance, mechanical, and neighbouring rights in Algeria.",
    isrcPrefix: "DZ",
    keyCities: ["Algiers", "Oran", "Constantine", "Annaba"],
    governingLaw: "the People's Democratic Republic of Algeria and the Law No. 03-05 of July 19, 2003 on Copyright and Related Rights",
    businessRegAbbr: "CNRC",
    taxAuthorityAbbr: "DGI",
    taxAuthorityFull: "Direction Générale des Impôts",
    localContentLabel: "Algerian",
    lawyerNote: "qualified Algerian entertainment attorney",
    broadcastRegulator: {
      name: "Autorité de Régulation de l'Audiovisuel",
      abbr: "ARAV",
      radioQuota: "Minimum 60% local Algerian content",
      tvQuota: "Minimum 60% local content",
      qualCriteria: [
        "Recording — the master recording was made wholly or substantially in Algeria",
        "Artist/Performer — the recording is performed principally by an Algerian artist or group",
        "Music/Composition — the music was composed by an Algerian citizen or permanent resident",
        "Lyrics — the lyrics were written by an Algerian citizen or permanent resident (where applicable)",
      ],
      keyStations: [
        "Radio Algérienne — national public broadcaster (Chaîne 1, Chaîne 2, Chaîne 3)",
        "Regional radio stations in Oran, Constantine, Annaba",
        "Community and regional radio — high local content requirements, accessible for independent artists",
      ],
      fundingNote: "With a 60% local content quota, qualifying as Algerian local content unlocks substantial radio access across the country. Station programmers are incentivised to play qualifying local music to meet their licence obligations.",
    },
    societiesChecklist: [
      "ONDA — register all compositions for performance royalties (Office National des Droits d'Auteur et des Droits Voisins)",
      "ONDA — register recordings for mechanical rights (same organisation covers both streams)",
      "ONDA — register recordings for neighbouring rights (one registration covers all three streams)",
      "Ensure ISRC codes carry the DZ country prefix",
      "SoundExchange (USA) — for digital performance royalties from US streaming and satellite radio",
      "PPL (UK) — for neighbouring rights in the United Kingdom",
      "Ensure CISAC membership via ONDA is active for international reciprocal collection",
      "All song titles registered and confirmed on ONDA portal before release day",
    ],
    mediaChecklist: [
      "Press release written and distributed to Algerian media",
      "Interview pitches sent to podcasts, radio stations, and digital media outlets",
      "Radio plugger briefed with audio files, one-sheet, and bio",
      "Submit to ARAV-compliant radio stations in Algeria at minimum 6 weeks before target airdate",
      "Community and regional radio strategy mapped (Algiers, Oran, Constantine, Annaba)",
      "Boomplay and Audiomack editorial pitch submitted — key platforms for Algeria",
      "Music video delivered to relevant Algerian and North African digital channels",
      "Sync and licensing pitches submitted to relevant supervisors and libraries",
    ],
  },

  "Côte d'Ivoire": {
    country: "Côte d'Ivoire",
    flag: "🇨🇮",
    currency: "XOF",
    currencyName: "West African CFA Franc",
    performanceRights: {
      name: "Bureau Ivoirien du Droit d'Auteur",
      abbr: "BURIDA",
      url: "https://burida.ci",
      note: "BURIDA collects performance royalties for composers, authors, and publishers in Côte d'Ivoire. Register your compositions and recordings before release. Côte d'Ivoire is a CISAC member territory — royalties are exchanged internationally through the CISAC reciprocal network.",
    },
    mechanicalRights: {
      name: "Bureau Ivoirien du Droit d'Auteur",
      abbr: "BURIDA",
      url: "https://burida.ci",
      note: "BURIDA handles mechanical rights alongside performance rights in Côte d'Ivoire — one registration covers both royalty streams. Ensure all songwriter credits, co-writer splits, and publisher information are complete. Rights attach under Law No. 2016-555 on Literary and Artistic Property.",
    },
    neighbouringRights: {
      name: "Bureau Ivoirien du Droit d'Auteur",
      abbr: "BURIDA",
      url: "https://burida.ci",
      note: "BURIDA also administers neighbouring (master recording) rights for performers and producers in Côte d'Ivoire. Register as both performer and producer where applicable. For international neighbouring rights collection, also register with AIRCO (African Independent Rights Collection Organisation).",
    },
    industryBodies: [
      { name: "Conseil National des Telecommunications", abbr: "CNT", url: "", role: "Broadcast regulator — oversees radio and TV local content quotas (25% radio, 40% TV) in Côte d'Ivoire" },
      { name: "Centre de Promotion des Investissements en Côte d'Ivoire", abbr: "CEPICI", url: "https://cepici.gouv.ci", role: "One-stop business registration centre — register your music company or sole proprietorship through CEPICI" },
      { name: "Ministère de la Culture et de la Francophonie", url: "https://culture.gouv.ci", role: "Government ministry overseeing cultural funding, policy, and artist support programmes" },
      { name: "Association des Professionnels du Spectacle de Côte d'Ivoire", abbr: "APSPCI", url: "", role: "Music and entertainment industry professional association — networking and advocacy" },
    ],
    keyDSPs: ["Boomplay", "Audiomack", "Spotify", "Apple Music", "YouTube Music", "TikTok", "Deezer"],
    distributors: [
      { name: "Africori", url: "https://africori.com", note: "Strongest pan-African and francophone Africa footprint with local offices — priority for Boomplay, Audiomack, and West Africa coverage" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Flat annual fee covering all major DSPs including Boomplay, Spotify, Apple Music, and 150+ global stores" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Per-release fee model with solid global DSP coverage and transparent royalty reporting" },
      { name: "Amuse", url: "https://amuse.io", note: "Free tier available — growing African presence; good entry-level option for independent artists" },
    ],
    grants: [
      { name: "Fonds de Développement de la Culture et des Arts (FDCA)", url: "https://culture.gouv.ci", note: "Government cultural development fund for Ivorian artists — studio, touring, and project funding available" },
      { name: "Institut Français Côte d'Ivoire", url: "https://institutfrancais-cotedivoire.com", note: "French cultural centre offering residencies, co-production support, and touring grants for Ivorian musicians" },
    ],
    taxNote: "Register your music business with CEPICI (Centre de Promotion des Investissements en Côte d'Ivoire). All music income — streaming, performance fees, royalties, sync — is taxable and administered by the DGI (Direction Générale des Impôts). Consult a qualified Ivorian entertainment attorney before signing distribution or label contracts.",
    registerNote: "Priority: Register with BURIDA for performance, mechanical, and neighbouring rights — one organisation covers all three streams in Côte d'Ivoire; register your business through CEPICI.",

    // ── Extended fields ──────────────────────────────────────────
    isrcPrefix: "CI",
    keyCities: ["Abidjan", "Yamoussoukro", "Bouaké", "San-Pédro"],
    governingLaw: "the Republic of Côte d'Ivoire",
    businessRegAbbr: "CEPICI",
    taxAuthorityAbbr: "DGI",
    taxAuthorityFull: "Direction Générale des Impôts",
    localContentLabel: "Ivorian",
    lawyerNote: "qualified Ivorian entertainment attorney",

    broadcastRegulator: {
      name: "Conseil National des Telecommunications",
      abbr: "CNT",
      radioQuota: "Minimum 25% local Ivorian music content",
      tvQuota: "Minimum 40% locally produced content",
      qualCriteria: [
        "R — Recorded in Côte d'Ivoire — master recording made wholly or substantially in Côte d'Ivoire",
        "A — Artist/Performer — recording performed principally by an Ivorian artist or group",
        "C — Composition — music composed by an Ivorian citizen or permanent resident",
        "L — Lyrics — where applicable, lyrics written by an Ivorian citizen or permanent resident",
        "B — BURIDA registered — composition and recording registered with BURIDA; CI-prefix ISRC assigned",
      ],
      keyStations: [
        "RTI 1 (Radiodiffusion Télévision Ivoirienne)",
        "Fréquence 2",
        "Radio Côte d'Ivoire",
        "NCI (Nouvelle Chaîne Ivoirienne)",
        "Life TV",
        "Nostalgie Abidjan 100.1",
        "Radio JAM",
      ],
      fundingNote: "Côte d'Ivoire is the creative capital of francophone West Africa and the birthplace of Coupé-Décalé and Zouglou. The CNT 25% radio quota guarantees consistent rotation slots for qualifying Ivorian releases. RTI 1 and Fréquence 2 provide national reach, while Nostalgie Abidjan and Radio JAM target urban, younger audiences in Abidjan. Submit radio packs 6 weeks before release; a WhatsApp follow-up after 5 business days is standard practice in the Ivorian market. French-language press kits are essential — English-only materials are routinely deprioritised by francophone programme directors.",
    },

    societiesChecklist: [
      "BURIDA (Bureau Ivoirien du Droit d'Auteur) — register all compositions for performance royalties under Law No. 2016-555 on Literary and Artistic Property; BURIDA is Côte d'Ivoire's CISAC member society",
      "BURIDA — register mechanical rights (same organisation handles both performance and mechanical in Côte d'Ivoire — one registration covers both streams)",
      "BURIDA — register master recordings for neighbouring rights as performer and/or producer",
      "Assign CI-prefix ISRC codes — obtain via your distributor (Africori, DistroKid) or directly through BURIDA; one code per track, mandatory for broadcast tracking and royalty identification",
      "AIRCO (African Independent Rights Collection Organisation) — register masters for pan-African neighbouring rights collection across African broadcast territories",
      "CEPICI (Centre de Promotion des Investissements en Côte d'Ivoire) — register your music business entity before entering commercial contracts; required for formal invoicing and banking",
      "DGI (Direction Générale des Impôts) — register for tax and obtain your taxpayer identification number; all streaming, royalty, and performance income is taxable in Côte d'Ivoire",
    ],

    mediaChecklist: [
      "Boomplay editorial pitch — submit 3–4 weeks before release to Boomplay's West Africa editorial team; Boomplay is the dominant streaming platform across francophone West Africa",
      "Audiomack pitch — contact Audiomack's West Africa editorial channel; free-streaming model drives high play counts among Ivorian audiences",
      "Spotify for Artists editorial pitch — submit at least 7 days before release via Spotify for Artists; target Afrobeats, Coupé-Décalé, and African Heat playlists",
      "RTI 1 and Fréquence 2 — national broadcast reach; submit French-language radio pack 6 weeks before release to the music director; follow up by WhatsApp after 5 business days",
      "Nostalgie Abidjan (100.1) — targets urban Abidjan audiences; strong for contemporary Ivorian pop and international Afrobeats crossover; submit promotional pack to programming team",
      "Radio JAM — youth-oriented Abidjan station with strong engagement among 18–35 demographic; important for new release launches and interview opportunities",
      "NCI (Nouvelle Chaîne Ivoirienne) — leading private TV channel; submit music video with French metadata and EPK for rotation consideration on NCI music programming",
      "Life TV — music-focused television channel in Côte d'Ivoire; submit high-resolution video with full French-language credits for playlist rotation",
      "French-language press — pitch key Ivorian media: Fraternité Matin, L'Intelligent d'Abidjan, and Abidjan.net entertainment section with French-language press releases 2–3 weeks before release",
      "TikTok and Instagram strategy — TikTok (French and Ivorian hashtag targeting) and Instagram Reels are primary discovery channels for Ivorian youth; plan a consistent content calendar around release week",
      "CNT local content compliance — confirm your release meets CNT qualification criteria (recorded in Côte d'Ivoire, Ivorian artist, BURIDA registered) before submitting to radio or TV",
    ],
  },

  "Cameroon": {
    country: "Cameroon",
    flag: "🇨🇲",
    currency: "XAF",
    currencyName: "Central African CFA Franc",
    performanceRights: {
      name: "Société Camerounaise des Droits d'Auteurs et Droits Voisins",
      abbr: "SOCAM",
      url: "https://socam.cm",
      note: "Collects performance and mechanical royalties for composers, authors, and publishers in Cameroon. Register your works with SOCAM before release. Cameroon is a CISAC member — SOCAM exchanges royalties internationally through the reciprocal network.",
    },
    mechanicalRights: {
      name: "Société Camerounaise des Droits d'Auteurs et Droits Voisins",
      abbr: "SOCAM",
      url: "https://socam.cm",
      note: "SOCAM handles mechanical rights alongside performance rights in Cameroon. One registration covers both streams. Digital mechanical rights from streaming platforms are collected through SOCAM's DSP agreements.",
    },
    neighbouringRights: {
      name: "Société Camerounaise des Droits d'Auteurs et Droits Voisins",
      abbr: "SOCAM",
      url: "https://socam.cm",
      note: "SOCAM also manages neighbouring rights for performers and record producers in Cameroon. Register as a performer or maker. Supplement with AIRCO for cross-border neighbouring rights collection across Africa.",
    },
    industryBodies: [
      { name: "Ministère des Arts et de la Culture", abbr: "MINAC", url: "https://minac.cm", role: "Government arts and culture ministry — artist registration, grants, and cultural development funding" },
      { name: "Conseil National de la Communication", abbr: "CNC", url: "https://cnc.cm", role: "National broadcast regulator — issues licences and enforces local content quotas on all radio and TV broadcasters" },
      { name: "Centre de Formalités de Création des Entreprises", abbr: "CFCE", url: "", role: "Business registration — formalise your management company or music business entity through the CFCE one-stop shop" },
      { name: "Cameroon Music Academy", url: "", role: "Industry development and artist showcase platform — key visibility event for the Cameroonian music industry" },
    ],
    keyDSPs: ["Boomplay", "Audiomack", "Spotify", "Apple Music", "YouTube Music"],
    distributors: [
      { name: "Africori", url: "https://africori.com", note: "Pan-African distributor with strongest local support for Francophone African markets including Cameroon — recommended first choice for Cameroon market reach" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Global DSP coverage at flat annual fee — good for volume releases" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Per-release fee model — reliable global distribution with detailed royalty reporting" },
      { name: "Amuse", url: "https://amuse.io", note: "Free tier available — growing platform for independent starters" },
    ],
    grants: [
      { name: "Ministère des Arts et de la Culture (MINAC) Arts Fund", url: "https://minac.cm", note: "Government grants for Cameroonian artistic projects — eligibility requires Cameroonian citizenship or residency and documentation of artistic output" },
      { name: "Music In Africa Foundation — Sound Connects Fund", url: "https://www.musicinafrica.net/sound-connects-fund", note: "Open to African artists and music businesses. Supports projects with demonstrable community and industry impact across the continent" },
    ],
    taxNote: "Register with the Direction Générale des Impôts (DGI) — your Numéro Unique d'Identification (NUIT) is required for all formal contracts and invoices. Music income, management commissions, and performance fees are all taxable in Cameroon. Register your music business entity through the Centre de Formalités de Création des Entreprises (CFCE). Keep all invoices and supporting records for a minimum of 5 years.",
    registerNote: "Priority: Register with SOCAM (performance + mechanical + neighbouring rights — one registration covers all three). ISRC prefix: CM. Broadcast quota: 30% local content (CNC). Key markets: Douala, Yaoundé, Bamenda.",
    isrcPrefix: "CM",
    keyCities: ["Douala", "Yaoundé", "Bamenda", "Bafoussam"],
    governingLaw: "the Republic of Cameroon",
    businessRegAbbr: "CFCE",
    taxAuthorityAbbr: "DGI",
    taxAuthorityFull: "Direction Générale des Impôts",
    localContentLabel: "Cameroonian",
    lawyerNote: "qualified Cameroonian entertainment attorney",
    broadcastRegulator: {
      name: "Conseil National de la Communication",
      abbr: "CNC",
      radioQuota: "Minimum 30% local Cameroonian content",
      tvQuota: "Minimum 30% local content",
      qualCriteria: [
        "Recording — the master recording was made wholly or substantially in Cameroon",
        "Artist/Performer — the recording is performed principally by a Cameroonian artist or group",
        "Music/Composition — the music was composed by a Cameroonian citizen or permanent resident",
        "Lyrics — the lyrics were written by a Cameroonian citizen or permanent resident (where applicable)",
      ],
      keyStations: [
        "CRTV — Cameroon Radio Television (national public broadcaster, radio + TV)",
        "Equinoxe FM (Douala/Yaoundé — major commercial radio with national reach)",
        "Magic FM (Douala — high-reach youth-focused commercial radio)",
        "Sky One Radio (Douala — commercial station, strong in urban markets)",
        "Canal 2 International (major private TV — significant music video programming)",
        "Vision 4 TV (Yaoundé-based private TV — national distribution and music programming)",
      ],
      fundingNote: "With a 30% local content quota, qualifying as Cameroonian music gives you mandatory access to the most influential broadcast market in Central Africa. CRTV alone reaches millions across all regions and language communities. Cameroon is a bilingual market — French-language and English-language recordings both qualify, and bilingual releases can unlock audiences across both communities simultaneously. Register all compositions with SOCAM before submitting to radio or TV.",
    },
    societiesChecklist: [
      "SOCAM (Société Camerounaise des Droits d'Auteurs et Droits Voisins) — register all compositions for performance royalties",
      "SOCAM — register mechanical rights (same organisation handles performance and mechanical in Cameroon — one registration covers both)",
      "SOCAM — register as a performer for neighbouring rights (SOCAM also administers neighbouring rights for performers and record producers)",
      "SoundExchange (USA) — for digital performance royalties from US streaming services and satellite radio (SiriusXM)",
      "PPL (UK) — for neighbouring rights collection in the United Kingdom",
      "AIRCO — register with the African Independent Rights Collection Organisation for pan-African neighbouring rights collection",
      "Ensure SOCAM has active CISAC membership status for international reciprocal collection across all CISAC-affiliated territories",
      "All song titles registered and confirmed with SOCAM before release date",
    ],
    mediaChecklist: [
      "Research the programming director or music director at each target CNC-licensed station before making contact",
      "Submit radio materials to CRTV and major commercial stations (Equinoxe FM, Magic FM) minimum 6 weeks before target airdate",
      "Submit to regional stations in Douala, Yaoundé, Bamenda, and Bafoussam for broad national coverage across language communities",
      "Include one-sheet, artist bio, streaming links, and WAV/MP3 file with every radio submission",
      "WhatsApp follow-up is appropriate and expected in Cameroon after 5 business days of no response to an email submission",
      "Submit music video to Canal 2 International and Vision 4 TV for television music programming consideration",
      "Pitch to Boomplay and Audiomack editorial — priority digital platforms for Cameroon market reach",
      "Confirm SOCAM registration is active and all compositions are correctly registered before any media push",
    ],
  },

  "Uganda": {
    country: "Uganda",
    flag: "🇺🇬",
    currency: "UGX",
    currencyName: "Ugandan Shilling",
    performanceRights: {
      name: "Uganda Performing Rights Society",
      abbr: "UPRS",
      url: "https://uprs.co.ug",
      note: "Collects public performance and mechanical royalties for composers, authors, and publishers in Uganda. Register all compositions with UPRS before release. Uganda has bilateral agreements with several African PROs enabling cross-border royalty collection through the CISAC reciprocal network. Rights are protected under the Copyright and Neighbouring Rights Act 2006.",
    },
    mechanicalRights: {
      name: "Uganda Performing Rights Society",
      abbr: "UPRS",
      url: "https://uprs.co.ug",
      note: "UPRS handles both performance and mechanical rights in Uganda. Digital mechanical collection is still developing — also register with international mechanical societies (e.g. MCPS/PRS via PPL, or DistroKid's publishing admin) to capture streaming mechanical royalties on global DSPs.",
    },
    neighbouringRights: {
      name: "Uganda Recording Industry Association",
      abbr: "URIA",
      url: "",
      note: "URIA represents performers and producers of sound recordings for neighbouring rights in Uganda. Also register with AIRCO (African Independent Rights Collecting Organisation) for international neighbouring rights collection. Maintain accurate ISRC records for all releases to ensure royalty tracking across platforms and territories.",
    },
    industryBodies: [
      { name: "Uganda Registration Services Bureau", abbr: "URSB", url: "https://ursb.go.ug", role: "Business registration, copyright registration, and intellectual property filings in Uganda" },
      { name: "Uganda Musicians Association", abbr: "UMA", url: "", role: "Musicians union — advocacy, welfare, and artist development" },
      { name: "Uganda Communications Commission", abbr: "UCC", url: "https://ucc.co.ug", role: "Broadcast regulator — enforces local content quotas on radio and television" },
    ],
    keyDSPs: ["Boomplay", "Audiomack", "Spotify", "YouTube Music", "Apple Music", "TikTok"],
    distributors: [
      { name: "Africori", url: "https://africori.com", note: "East Africa presence with dedicated Uganda support" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Global DSP coverage with publishing admin add-on" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Reliable global distribution and royalty reporting" },
      { name: "Amuse", url: "https://amuse.io", note: "Free-tier distribution with East Africa reach" },
    ],
    grants: [
      { name: "Uganda National Cultural Centre", url: "https://uncc.go.ug", note: "Government arts funding, residency programmes, and production support" },
    ],
    taxNote: "Register with the Uganda Revenue Authority (URA) at ura.go.ug. All music income is subject to income tax. VAT registration is required once turnover exceeds the URA threshold. Register your business entity with the Uganda Registration Services Bureau (URSB) at ursb.go.ug.",
    registerNote: "Priority: Register compositions and membership with UPRS for performance and mechanical royalties. Register sound recordings with URIA for neighbouring rights. File your business with URSB and obtain a URA TIN.",
    isrcPrefix: "UG",
    keyCities: ["Kampala", "Entebbe", "Gulu", "Mbarara"],
    governingLaw: "the Republic of Uganda",
    businessRegAbbr: "URSB",
    taxAuthorityAbbr: "URA",
    taxAuthorityFull: "Uganda Revenue Authority",
    localContentLabel: "Ugandan",
    lawyerNote: "qualified Ugandan entertainment attorney",
    broadcastRegulator: {
      name: "Uganda Communications Commission",
      abbr: "UCC",
      radioQuota: "Minimum 30% local Ugandan content on licensed radio stations",
      tvQuota: "Minimum 30% locally produced content across licensed television schedules",
      qualCriteria: [
        "R — Recorded in Uganda by a Ugandan artist or with predominantly Ugandan musicians",
        "A — Artist must be a Ugandan citizen or permanent resident",
        "C — Composition (music and/or lyrics) authored by a Ugandan national",
        "L — Language: Ugandan-language recordings (Luganda, Acholi, Runyankole, Swahili, etc.) carry stronger qualification",
        "X — Cross-border co-productions may qualify if the majority of creative and production work is Ugandan",
      ],
      keyStations: [
        "Radio Simba 97.3 FM — Kampala commercial flagship",
        "CBS FM 88.8 — Buganda-language dominant reach across Central Uganda",
        "Capital FM 91.3 — Kampala top-40 and Afrobeats",
        "Radio One 90.0 — News and urban music, Kampala",
        "Dembe FM 90.4 — Eastern Uganda reach",
        "NBS Radio — Multi-genre with strong Afrobeats playlist",
        "NTV Uganda — Leading national TV with music programming",
        "Spark TV — Youth-focused urban music TV",
      ],
      fundingNote: "Uganda's music economy is anchored in Kampala, which hosts the majority of studios, promoters, and live venues. Afrobeats, Afropop, and Luganda-language urban music dominate commercial radio. The UCC enforces local content rules under the Uganda Communications Act, and broadcasters are required to maintain logs for compliance audits. Registering with UPRS and ensuring your recordings carry proper ISRC codes is essential for royalty collection across both radio play and digital streaming.",
    },
    societiesChecklist: [
      "UPRS — register all compositions for performance and mechanical royalties; membership open to composers, authors, and publishers resident in Uganda",
      "URIA — register sound recordings for neighbouring rights; keep ISRC codes on all releases for accurate tracking",
      "AIRCO — register internationally for cross-border neighbouring rights collection outside Uganda",
      "URSB — file copyright registration for sound recordings and musical works at ursb.go.ug",
    ],
    mediaChecklist: [
      "Radio campaign — submit to station music directors 4–6 weeks before release; priority targets: Radio Simba, CBS FM, Capital FM, Radio One",
      "TV placement — pitch music videos to NTV Uganda and Spark TV 3–4 weeks before release date",
      "Boomplay Uganda — submit for editorial playlist consideration via the Boomplay for Artists portal",
      "Audiomack — pitch to Audiomack Africa editors 2–3 weeks before release for playlist inclusion",
      "TikTok sound page — ensure your track is live on TikTok Uganda before launch for influencer seeding",
      "UCC compliance — confirm all radio-ready masters meet UCC broadcast technical specifications before submission",
    ],
  },

  "Senegal": {
    country: "Senegal",
    flag: "🇸🇳",
    currency: "XOF",
    currencyName: "West African CFA Franc",
    performanceRights: {
      name: "Bureau Sénégalais du Droit d'Auteur",
      abbr: "BSDA",
      url: "https://bsda.sn",
      note: "BSDA collects performance royalties for composers, authors, and publishers in Senegal. Register your compositions before release — membership is open to all Senegalese rights holders. Senegal is a CISAC member territory and exchanges royalties internationally through the CISAC reciprocal network. Rights are protected under Law No. 2008-09 of January 25, 2008 on Copyright and Related Rights.",
    },
    mechanicalRights: {
      name: "Bureau Sénégalais du Droit d'Auteur",
      abbr: "BSDA",
      url: "https://bsda.sn",
      note: "BSDA handles mechanical rights alongside performance rights in Senegal — one registration covers both royalty streams. Ensure all songwriter credits, co-writer splits, and publisher information are complete when registering.",
    },
    neighbouringRights: {
      name: "Bureau Sénégalais du Droit d'Auteur",
      abbr: "BSDA",
      url: "https://bsda.sn",
      note: "BSDA also administers neighbouring (master recording) rights for performers and producers in Senegal. Register as both performer and producer where applicable. Also register with AIRCO (African Independent Rights Collection Organisation) for pan-African and international neighbouring rights collection.",
    },
    industryBodies: [
      { name: "Conseil National de Régulation de l'Audiovisuel", abbr: "CNRA", url: "https://cnra.sn", role: "Broadcast regulator — oversees radio and TV local content quotas (25% radio, 40% TV) in Senegal" },
      { name: "Agence de Promotion des Investissements et des Grands Travaux", abbr: "APIX", url: "https://investinsenegal.com", role: "Business registration and investment promotion authority — register your music company through APIX" },
      { name: "Ministère de la Culture et du Patrimoine Historique", url: "https://culture.gouv.sn", role: "Government ministry — cultural funding, artist development programmes, and music industry policy" },
      { name: "Union des Artistes Musiciens du Sénégal", abbr: "UAMS", url: "", role: "Musicians union — welfare, advocacy, and live performance regulation for Senegalese artists" },
    ],
    keyDSPs: ["Boomplay", "Audiomack", "Spotify", "Apple Music", "YouTube Music", "TikTok"],
    distributors: [
      { name: "Africori", url: "https://africori.com", note: "Strongest pan-African and francophone West Africa footprint — priority for Boomplay, Audiomack, and Senegal/ECOWAS coverage" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Flat annual fee covering Boomplay, Spotify, Apple Music, and 150+ global DSPs" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Per-release fee model with solid global DSP coverage and transparent royalty reporting" },
      { name: "Amuse", url: "https://amuse.io", note: "Free tier available — growing West African presence; good entry-level option for independent artists" },
    ],
    grants: [
      { name: "Fonds de Promotion Culturelle du Sénégal", url: "https://culture.gouv.sn", note: "Government cultural promotion fund for Senegalese artists — studio, touring, and project grants" },
      { name: "Institut Français Sénégal", url: "https://institutfrancais-senegal.com", note: "French cultural institute offering co-production support, residencies, and touring grants for Senegalese musicians" },
      { name: "UEMOA Cultural Development Fund", url: "", note: "Regional ECOWAS/UEMOA fund supporting West African cultural industries including music production and export" },
    ],
    taxNote: "Register with the Direction Générale des Impôts et des Domaines (DGID) and obtain your Numéro d'Identification National (NINEA). All music income — streaming, performance fees, royalties, sync — is taxable in Senegal. Register your business entity with APIX (Agence de Promotion des Investissements et des Grands Travaux). Consult a qualified Senegalese entertainment attorney before signing distribution or label contracts.",
    registerNote: "Priority: Register with BSDA for performance, mechanical, and neighbouring rights — one organisation covers all three in Senegal; register your business with APIX and obtain a DGID NINEA.",

    // ── Extended fields ──────────────────────────────────────────
    isrcPrefix: "SN",
    keyCities: ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor"],
    governingLaw: "the Republic of Senegal",
    businessRegAbbr: "APIX",
    taxAuthorityAbbr: "DGID",
    taxAuthorityFull: "Direction Générale des Impôts et des Domaines",
    localContentLabel: "Senegalese",
    lawyerNote: "qualified Senegalese entertainment attorney",

    broadcastRegulator: {
      name: "Conseil National de Régulation de l'Audiovisuel",
      abbr: "CNRA",
      radioQuota: "Minimum 25% local Senegalese music content",
      tvQuota: "Minimum 40% locally produced content",
      qualCriteria: [
        "R — Recorded in Senegal — master recording made wholly or substantially in Senegal",
        "A — Artist/Performer — recording performed principally by a Senegalese artist or group",
        "C — Composition — music composed by a Senegalese citizen or permanent resident",
        "L — Lyrics — where applicable, lyrics written by a Senegalese citizen or permanent resident",
        "B — BSDA registered — composition and recording registered with BSDA; SN-prefix ISRC assigned",
      ],
      keyStations: [
        "RFM Sénégal (Radio Futurs Médias)",
        "Zik FM 98.5",
        "7FM",
        "Sud FM",
        "RTS (Radiodiffusion Télévision Sénégalaise)",
        "TFM (Télévision Futurs Médias)",
        "2STV",
      ],
      fundingNote: "Senegal is West Africa's leading cultural hub and the birthplace of mbalax, sabar, and Afro-fusion — globally respected music traditions that carry strong CNRA local content credentials by default. The 25% radio quota guarantees consistent rotation slots for qualifying Senegalese releases. RFM and Zik FM are Dakar's dominant urban stations, while RTS provides national reach across all regions. TFM and 2STV are the leading TV platforms for music video rotation. Submit radio packs 6 weeks before release; French-language press kits are essential — WhatsApp follow-up after 5 business days is standard practice in the Senegalese market.",
    },

    societiesChecklist: [
      "BSDA (Bureau Sénégalais du Droit d'Auteur) — register all compositions for performance royalties under Law No. 2008-09 of January 25, 2008; BSDA is Senegal's CISAC member society",
      "BSDA — register mechanical rights (same organisation handles both performance and mechanical in Senegal — one registration covers both streams)",
      "BSDA — register master recordings for neighbouring rights as performer and/or producer",
      "Assign SN-prefix ISRC codes — obtain via your distributor (Africori, DistroKid) or directly through BSDA; one code per track, mandatory for broadcast tracking and royalty identification",
      "AIRCO (African Independent Rights Collection Organisation) — register masters for pan-African neighbouring rights collection across African broadcast territories",
      "APIX (Agence de Promotion des Investissements et des Grands Travaux) — register your music business entity before entering commercial contracts; required for formal invoicing and banking",
      "DGID (Direction Générale des Impôts et des Domaines) — obtain your NINEA tax identification number; all streaming, royalty, and performance income is taxable in Senegal",
    ],

    mediaChecklist: [
      "Boomplay editorial pitch — submit 3–4 weeks before release to Boomplay's West Africa editorial team; Boomplay is the dominant streaming platform across francophone West Africa",
      "Audiomack pitch — contact Audiomack's West Africa editorial channel; free-streaming model drives high play counts among Senegalese audiences",
      "Spotify for Artists editorial pitch — submit at least 7 days before release; target Afrobeats, African Heat, and World Music editorial playlists for international reach",
      "RFM Sénégal — Dakar's highest-reach music and talk station; submit French-language radio pack to the music director 6 weeks before release; WhatsApp follow-up after 5 business days",
      "Zik FM (98.5) — leading urban music station in Dakar targeting younger Senegalese audience; essential for Afropop, mbalax-fusion, and contemporary releases",
      "7FM — popular Dakar station with strong music programming; submit promotional pack to the programming team; important for new artist launches",
      "Sud FM — national reach with a broad Senegalese demographic; strong for mbalax, traditional Senegalese music, and mainstream francophone pop",
      "TFM (Télévision Futurs Médias) — leading private TV channel in Senegal; submit music video with French-language metadata and EPK for rotation consideration",
      "2STV — music-focused TV platform; important for music video exposure to younger Senegalese audiences in Dakar and secondary cities",
      "RTS (Radiodiffusion Télévision Sénégalaise) — national broadcaster with widest geographic reach; essential for traditional and culturally rooted Senegalese releases",
      "French-language press outreach — pitch key Senegalese media: Le Soleil, L'Observateur, and Dakar Actu entertainment section with French-language press releases 2–3 weeks before release",
      "CNRA local content compliance — confirm release meets CNRA criteria (recorded in Senegal, Senegalese artist, BSDA registered) before submitting to radio or TV",
    ],
  },

  "Angola": {
    country: "Angola",
    flag: "🇦🇴",
    currency: "AOA",
    currencyName: "Angolan Kwanza",
    performanceRights: {
      name: "Sociedade Angolana de Autores",
      abbr: "SADIA",
      url: "https://sadia.ao",
      note: "Angola's collective management organisation for authors' rights. Register your compositions with SADIA for performance and mechanical royalties. SADIA collects on radio, TV, live venues, and streaming. Angola's CMO framework is still developing — also register internationally for full global collection.",
    },
    mechanicalRights: {
      name: "Sociedade Angolana de Autores",
      abbr: "SADIA",
      url: "https://sadia.ao",
      note: "SADIA handles mechanical rights alongside performance rights in Angola. One registration covers both streams. Digital mechanical collection is still developing — register with an international publisher or admin deal to capture full streaming income globally.",
    },
    neighbouringRights: {
      name: "Instituto Angolano dos Direitos de Autor",
      abbr: "IADA",
      url: "https://iada.ao",
      note: "IADA oversees copyright and neighbouring rights functions in Angola. Register as a performer and producer. Also register with AIRCO (African Independent Rights Collection Organisation) for international cross-border neighbouring rights collection.",
    },
    industryBodies: [
      { name: "Ministério da Cultura", url: "https://mincult.gov.ao", role: "Government ministry — cultural development, arts funding, and music industry regulation" },
      { name: "Instituto Angolano das Comunicações", abbr: "INACOM", url: "https://inacom.gov.ao", role: "Broadcast regulator — enforces 30% local content quota on licensed radio and TV stations" },
      { name: "Guichet Único da Empresa", abbr: "GUE", url: "https://gue.gov.ao", role: "One-stop business registration portal — register your music business entity here" },
      { name: "Angola Music Awards", url: "", role: "Annual awards platform — industry exposure and recognition" },
    ],
    keyDSPs: ["Boomplay", "Audiomack", "Spotify", "Apple Music", "YouTube Music"],
    distributors: [
      { name: "Africori", url: "https://africori.com", note: "Pan-African distributor — strongest local support for Angolan market" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Flat annual fee — good for volume releases to all major DSPs" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Per-release fee model — reliable global distribution" },
      { name: "Amuse", url: "https://amuse.io", note: "Free tier available — growing African DSP coverage" },
    ],
    grants: [
      { name: "Fundo Nacional para a Cultura", url: "https://mincult.gov.ao", note: "Government national culture fund for Angolan artistic and music projects" },
      { name: "Music In Africa Foundation — Sound Connects Fund", url: "https://musicinafrica.net/directory-categories/funding", note: "Pan-African grant and capacity-building support for music organisations in SADC countries" },
    ],
    taxNote: "Register with the Administração Geral Tributária (AGT) at agt.minfin.gov.ao. Music income is subject to income tax (IRT — Imposto sobre o Rendimento do Trabalho). Register your business entity through the Guichet Único da Empresa (GUE). Retain all invoices and receipts — touring income, performance fees, streaming royalties, and sync fees are all taxable.",
    registerNote: "Priority: Register with SADIA (performance + mechanical) and IADA (neighbouring rights). ISRC prefix: AO. Broadcast quota: 30% (INACOM).",
    // ── Extended localisation fields ──
    isrcPrefix: "AO",
    keyCities: ["Luanda", "Huambo", "Lobito", "Benguela"],
    governingLaw: "the Republic of Angola",
    businessRegAbbr: "GUE",
    taxAuthorityAbbr: "AGT",
    taxAuthorityFull: "Administração Geral Tributária",
    localContentLabel: "Angolan",
    lawyerNote: "qualified Angolan entertainment attorney",
    broadcastRegulator: {
      name: "Instituto Angolano das Comunicações",
      abbr: "INACOM",
      radioQuota: "Minimum 30% local Angolan content",
      tvQuota: "Minimum 30% local content",
      qualCriteria: [
        "Recording — the master recording was made wholly or substantially in Angola",
        "Artist/Performer — the recording is performed principally by an Angolan artist or group",
        "Music/Composition — the music was composed by an Angolan citizen or permanent resident",
        "Lyrics — the lyrics were written by an Angolan citizen or permanent resident (where applicable)",
      ],
      keyStations: [
        "RNA — Rádio Nacional de Angola (national public broadcaster)",
        "Rádio Luanda (Luanda-based major commercial station)",
        "Rádio Ngola Yetu (national Angolan-language programming)",
        "Rádio Eclésia (Luanda — significant reach and cultural influence)",
        "TV Zimbo (major commercial TV with music video programming)",
        "TPA — Televisão Pública de Angola (national public TV)",
      ],
      fundingNote: "With a 30% local content quota, qualifying as Angolan local content gives you guaranteed access to national and regional radio rotation across Angola. Station programmers are incentivised to play qualifying local music to meet their INACOM licence obligations.",
    },
    societiesChecklist: [
      "SADIA (Sociedade Angolana de Autores) — register all compositions for performance royalties",
      "SADIA — register mechanical rights (same organisation handles both in Angola)",
      "IADA (Instituto Angolano dos Direitos de Autor) — register master recordings for neighbouring rights",
      "SoundExchange (USA) — for digital performance royalties from US streaming and satellite radio",
      "PPL (UK) — for neighbouring rights in the United Kingdom",
      "AIRCO — register with the African Independent Rights Collection Organisation for pan-African neighbouring rights collection",
      "Ensure SADIA has active CISAC membership for international reciprocal collection",
      "All song titles registered and confirmed on SADIA portal before release",
    ],
    mediaChecklist: [
      "Research programming director or music director at each target INACOM-licensed station",
      "Submit radio materials to national stations (RNA, Rádio Luanda, Rádio Eclésia) minimum 6 weeks before target airdate",
      "Submit to community and regional stations in Huambo, Lobito, and Benguela for provincial coverage",
      "Include one-sheet, artist bio, streaming links, and WAV/MP3 file with every radio submission",
      "WhatsApp follow-up is appropriate and expected in Angola after 5 business days of no response",
      "Submit music video to TV Zimbo and TPA for television music programming consideration",
      "Pitch to Boomplay and Audiomack editorial — priority platforms for Angola market reach",
      "Confirm SADIA registration is active and compositions are correctly registered before any media push",
    ],
  },

  "Zimbabwe": {
    country: "Zimbabwe",
    flag: "🇿🇼",
    currency: "ZWG",
    currencyName: "Zimbabwe Gold",
    performanceRights: {
      name: "Zimbabwe Music Rights Association",
      abbr: "ZIMURA",
      url: "https://zimura.org",
      note: "Zimbabwe's collective management organisation for composers, authors, and publishers. Register all compositions with ZIMURA before release — membership is open to all Zimbabwean rights holders. ZIMURA is a CISAC member and exchanges royalties internationally through the CISAC reciprocal network. Rights are protected under the Copyright and Neighbouring Rights Act (Chapter 26:05).",
    },
    mechanicalRights: {
      name: "Zimbabwe Music Rights Association",
      abbr: "ZIMURA",
      url: "https://zimura.org",
      note: "ZIMURA handles mechanical rights alongside performance rights — one registration covers both. Ensure all composition metadata (co-writer splits, publisher details, ISWC) is complete before submission. For digital mechanical royalties on global DSPs, also register with an international mechanical society or use a publishing admin service.",
    },
    neighbouringRights: {
      name: "Zimbabwe Music Rights Association",
      abbr: "ZIMURA",
      url: "https://zimura.org",
      note: "ZIMURA administers neighbouring rights for performers and producers of sound recordings in Zimbabwe. Register all releases with ISRC codes to ensure accurate tracking and collection. Also register with AIRCO for international cross-border neighbouring rights collection outside Zimbabwe.",
    },
    industryBodies: [
      { name: "Zimbabwe Investment and Development Agency", abbr: "ZIDA", url: "https://zida.gov.zw", role: "Business registration for companies and sole traders in Zimbabwe" },
      { name: "Broadcasting Authority of Zimbabwe", abbr: "BAZ", url: "https://baz.co.zw", role: "Broadcast regulator — enforces 75% local content quotas on radio and television" },
      { name: "Zimbabwe Copyright Office", url: "https://zimcopy.org.zw", role: "Government copyright registration — protect compositions and recordings legally" },
      { name: "Music Industry Association of Zimbabwe", abbr: "MIAZ", url: "", role: "Industry association — advocacy, development, and live performance support" },
    ],
    keyDSPs: ["Boomplay", "Spotify", "YouTube Music", "Apple Music", "Audiomack", "TikTok"],
    distributors: [
      { name: "Africori", url: "https://africori.com", note: "Pan-African reach with strong Southern Africa presence" },
      { name: "DistroKid", url: "https://distrokid.com", note: "Global DSP coverage with publishing admin add-on" },
      { name: "TuneCore", url: "https://tunecore.com", note: "Reliable global distribution and royalty reporting" },
      { name: "Amuse", url: "https://amuse.io", note: "Free-tier distribution with African market reach" },
    ],
    grants: [
      { name: "National Arts Council of Zimbabwe (NACZ)", url: "https://nacz.org.zw", note: "Government grants and development support for Zimbabwean artists and arts organisations" },
    ],
    taxNote: "Register with the Zimbabwe Revenue Authority (ZIMRA) at zimra.co.zw. All music income is subject to income tax. VAT registration may be required once turnover exceeds the ZIMRA threshold. Register your business entity with the Zimbabwe Investment and Development Agency (ZIDA) at zida.gov.zw. Ensure annual returns are filed on time — penalties apply for late filing.",
    registerNote: "Priority: Register compositions and recordings with ZIMURA for performance, mechanical, and neighbouring rights. Register your business with ZIDA and obtain a ZIMRA tax number. Ensure all releases carry ISRC codes (prefix: ZW).",
    isrcPrefix: "ZW",
    keyCities: ["Harare", "Bulawayo", "Mutare", "Gweru"],
    governingLaw: "the Republic of Zimbabwe",
    businessRegAbbr: "ZIDA",
    taxAuthorityAbbr: "ZIMRA",
    taxAuthorityFull: "Zimbabwe Revenue Authority",
    localContentLabel: "Zimbabwean",
    lawyerNote: "qualified Zimbabwean entertainment attorney",
    broadcastRegulator: {
      name: "Broadcasting Authority of Zimbabwe",
      abbr: "BAZ",
      radioQuota: "Minimum 75% local Zimbabwean music content on all licensed radio stations",
      tvQuota: "Minimum 75% locally produced content across licensed television schedules",
      qualCriteria: [
        "R — Recorded: The master recording was made wholly or substantially in Zimbabwe",
        "A — Artist / Performer: The recording is performed principally by a Zimbabwean artist or group",
        "C — Composition: The music was composed by a Zimbabwean citizen or permanent resident",
        "L — Lyrics: Where applicable, lyrics were written by a Zimbabwean citizen or permanent resident",
        "X — Cross-border co-productions may qualify if the majority of creative and production work is Zimbabwean",
      ],
      keyStations: [
        "ZBC Radio Zimbabwe — national public broadcaster, highest reach across all provinces",
        "Star FM 93.4 — Harare's leading commercial station, urban and Afrobeats",
        "Power FM 90.8 — urban music and talk, strong Harare youth audience",
        "Capitalk FM 100.4 — Harare commercial, contemporary Zimbabwean music focus",
        "Diamond FM — Bulawayo flagship commercial station",
        "Skyz Metro FM — Bulawayo urban and contemporary",
        "ZBC TV — national television broadcaster, music video programming",
        "ZTN (Zimbabwe Television Network) — national TV with music content",
      ],
      fundingNote: "Zimbabwe's 75% local content quota on radio is one of the highest on the continent, creating guaranteed playlist space for qualifying Zimbabwean releases. The Broadcasting Authority of Zimbabwe enforces this under the Broadcasting Services Act, and stations are required to maintain broadcast logs for compliance auditing. Harare is the commercial music hub with the majority of studios, labels, and promoters. Afrobeats, urban grooves, and Zimdancehall are the dominant formats on commercial radio. Registering with ZIMURA and ensuring all releases carry ISRC codes is essential to collect broadcast royalties from the BAZ quota-driven airplay your music receives.",
    },
    societiesChecklist: [
      "ZIMURA — register all compositions for performance and mechanical royalties; one registration covers both; membership open to composers, authors, publishers, performers, and producers resident in Zimbabwe",
      "ZIMURA — register sound recordings for neighbouring rights as performer or producer; attach ISRC codes to all submissions",
      "AIRCO — register internationally for cross-border neighbouring rights collection outside Zimbabwe",
      "ZIDA — register your management company or sole trader business at zida.gov.zw before signing commercial agreements",
    ],
    mediaChecklist: [
      "Radio campaign — submit to music directors 6 weeks before release; priority targets: ZBC Radio Zimbabwe, Star FM, Power FM, Capitalk FM",
      "TV placement — pitch music videos to ZBC TV and ZTN 4 weeks before release; include HD master and press materials",
      "Boomplay Zimbabwe — submit for editorial playlist consideration via the Boomplay for Artists portal 2–3 weeks before release",
      "Audiomack Africa — pitch to Audiomack Africa editors 2–3 weeks before release for playlist inclusion",
      "Spotify editorial — submit via Spotify for Artists at least 7 days before release date",
      "BAZ compliance — confirm all radio-ready masters meet BAZ broadcast technical specifications before station submission",
    ],
  },

};

// ============================================================
// Lookup helpers
// ============================================================

/** Get resources for a country, falling back to South Africa */
export function getCountryResources(country: string | null | undefined): CountryResources {
  if (!country) return RESOURCES["South Africa"];
  return RESOURCES[country] ?? RESOURCES["South Africa"];
}

/** Get just the performance rights org for a country */
export function getPerformanceRightsOrg(country: string | null | undefined): RightsOrg {
  return getCountryResources(country).performanceRights;
}

/** Check if we have specific data for this country */
export function hasCountryData(country: string | null | undefined): boolean {
  if (!country) return false;
  return country in RESOURCES;
}

/** List of all supported countries */
export const SUPPORTED_COUNTRIES = Object.keys(RESOURCES);

export default RESOURCES;
