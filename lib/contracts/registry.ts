/**
 * ROSTER Contract Registry
 * ────────────────────────
 * Central catalog of every signable agreement on the platform. Powers:
 *   • The "Contract Library" page in Legal & Compliance (auto-listed)
 *   • The Send-for-signature wiring on each contract page
 *   • The Contract Fields Bar (which dynamic Term / Option / % fields apply)
 *
 * Adding a new contract = add an entry here, no UI changes elsewhere.
 */

export type ContractFieldType = "date" | "number" | "percentage" | "text" | "currency";

export interface ContractDynamicField {
  id: string;                       // unique within the contract (camelCase)
  label: string;                    // visible label (e.g. "Term — Start date")
  type: ContractFieldType;
  defaultValue?: string | number;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  /** Only show this field when another field has this value (simple toggle support) */
  showWhen?: { fieldId: string; equals: string | number | boolean };
}

export interface ContractRegistryEntry {
  id: string;                       // unique slug, used as localStorage key prefix
  title: string;                    // human title
  contractType: string;             // SendForSignature contractType (e.g. "Management Agreement")
  category: ContractCategory;       // grouping in the Library page
  route: string;                    // `/dashboard/library/...`
  parentModule: string;             // module display name
  parentColor: string;              // module color hex
  shortDescription: string;         // ~12 words for the card
  fields: ContractDynamicField[];   // applies to the editable bar
  /** If true, the page exists but Send-for-signature isn't wired yet (rare). */
  comingSoon?: boolean;
}

export type ContractCategory =
  | "Artist Onboarding"
  | "Recording & Production"
  | "Publishing & Songwriting"
  | "Sync Licensing"
  | "Live & Touring"
  | "Visual Production"
  | "Marketing & Brand"
  | "Legal & Confidentiality";

// ── shared field presets ────────────────────────────────────────────────
const TERM_START: ContractDynamicField = {
  id: "termStart",
  label: "Term — Start date",
  type: "date",
  helperText: "Effective date of the agreement.",
};

const TERM_END: ContractDynamicField = {
  id: "termEnd",
  label: "Term — End date",
  type: "date",
  helperText: "Initial term ends on this date.",
};

const OPTION_PERIOD: ContractDynamicField = {
  id: "optionPeriod",
  label: "Option period",
  type: "text",
  placeholder: "e.g. 2 × 12-month options at sender's election",
  helperText: "Optional term extensions, written in plain English.",
};

const TERRITORY: ContractDynamicField = {
  id: "territory",
  label: "Territory",
  type: "text",
  placeholder: "World / SA + NG / specific markets",
};

const GOVERNING_LAW: ContractDynamicField = {
  id: "governingLaw",
  label: "Governing law",
  type: "text",
  placeholder: "South Africa / Nigeria / etc.",
};

// ── registry ────────────────────────────────────────────────────────────
export const CONTRACT_REGISTRY: ContractRegistryEntry[] = [
  // ── Artist Onboarding ──────────────────────────────────────────────────
  {
    id: "management-agreement",
    title: "Exclusive Artist Management Agreement",
    contractType: "Management Agreement",
    category: "Artist Onboarding",
    route: "/dashboard/library/startup/agreement",
    parentModule: "Onboarding New Artists",
    parentColor: "#C9A84C",
    shortDescription: "Full management deal — locale-aware, 13–21 clauses + First Schedule.",
    fields: [
      TERM_START,
      TERM_END,
      OPTION_PERIOD,
      TERRITORY,
      { id: "managerCommission", label: "Manager commission %", type: "percentage", defaultValue: 20, helperText: "Typically 15–25% on gross income from managed activities." },
      { id: "postTermCommission", label: "Post-term tail commission %", type: "percentage", defaultValue: 10, helperText: "Reduced commission on income from contracts signed during the term." },
      GOVERNING_LAW,
    ],
  },
  {
    id: "booking-agency-agreement",
    title: "Booking Agency Agreement",
    contractType: "Booking Agency Agreement",
    category: "Artist Onboarding",
    route: "/dashboard/library/startup/booking-agency-agreement",
    parentModule: "Onboarding New Artists",
    parentColor: "#C9A84C",
    shortDescription: "Exclusive agency deal — live, festivals, brand performance bookings.",
    fields: [
      TERM_START, TERM_END, OPTION_PERIOD, TERRITORY,
      { id: "bookingCommission", label: "Booking commission %", type: "percentage", defaultValue: 10, helperText: "Typically 10% domestic / 15% international." },
      { id: "internationalCommission", label: "International commission %", type: "percentage", defaultValue: 15 },
      GOVERNING_LAW,
    ],
  },
  {
    id: "independent-contractor-agreement",
    title: "Independent Contractor Agreement",
    contractType: "Independent Contractor Agreement",
    category: "Artist Onboarding",
    route: "/dashboard/library/startup/independent-contractor-agreement",
    parentModule: "Onboarding New Artists",
    parentColor: "#C9A84C",
    shortDescription: "Engage freelancers and service providers cleanly outside payroll.",
    fields: [
      TERM_START, TERM_END,
      { id: "rate", label: "Rate", type: "currency", placeholder: "e.g. ZAR 500/hr or ZAR 25,000 fixed" },
      { id: "scope", label: "Scope of services", type: "text", placeholder: "Brief description of deliverables" },
      GOVERNING_LAW,
    ],
  },

  // ── Recording & Production ────────────────────────────────────────────
  {
    id: "producer-agreement",
    title: "Producer Agreement",
    contractType: "Producer Agreement",
    category: "Recording & Production",
    route: "/dashboard/library/recording/producer-agreement",
    parentModule: "A&R, Recording & Production",
    parentColor: "#10B981",
    shortDescription: "Engage a producer with clear royalty + ownership terms.",
    fields: [
      TERM_START, TERM_END,
      { id: "producerFee", label: "Producer fee", type: "currency", placeholder: "e.g. ZAR 25,000 per master" },
      { id: "producerRoyalty", label: "Producer royalty %", type: "percentage", defaultValue: 3, helperText: "Typically 3–5% on net receipts; pro-rata for co-producers." },
      { id: "advanceRecoupment", label: "Advance recoupable from royalties?", type: "text", placeholder: "Yes — at 100% of net royalties until recouped" },
      GOVERNING_LAW,
    ],
  },
  {
    id: "mixing-engineer-agreement",
    title: "Mixing Engineer Agreement",
    contractType: "Mixing Engineer Agreement",
    category: "Recording & Production",
    route: "/dashboard/library/recording/mixing-engineer-agreement",
    parentModule: "A&R, Recording & Production",
    parentColor: "#10B981",
    shortDescription: "Mix engagement with deliverables, revisions, and credit.",
    fields: [
      TERM_START,
      { id: "mixFee", label: "Mix fee per song", type: "currency", placeholder: "e.g. ZAR 5,000 per song" },
      { id: "revisions", label: "Included revisions", type: "number", defaultValue: 2, helperText: "Number of free revisions before billable hours kick in." },
      { id: "mixerPoints", label: "Mixer points (royalty)", type: "percentage", defaultValue: 0, helperText: "Optional — typically 0 for fee-only mixes; 1% for royalty mixes." },
      GOVERNING_LAW,
    ],
  },
  {
    id: "mastering-engineer-agreement",
    title: "Mastering Engineer Agreement",
    contractType: "Mastering Engineer Agreement",
    category: "Recording & Production",
    route: "/dashboard/library/recording/mastering-engineer-agreement",
    parentModule: "A&R, Recording & Production",
    parentColor: "#10B981",
    shortDescription: "Mastering engagement — deliverable specs, revisions, ME credit.",
    fields: [
      TERM_START,
      { id: "masterFee", label: "Master fee per song", type: "currency", placeholder: "e.g. ZAR 1,500 per song" },
      { id: "albumDiscount", label: "Album-rate fee (10+ tracks)", type: "currency", placeholder: "Optional bulk pricing" },
      { id: "revisions", label: "Included revisions", type: "number", defaultValue: 1 },
      GOVERNING_LAW,
    ],
  },
  {
    id: "studio-booking-agreement",
    title: "Studio Booking Agreement",
    contractType: "Studio Booking",
    category: "Recording & Production",
    route: "/dashboard/library/recording/studio-booking-agreement",
    parentModule: "A&R, Recording & Production",
    parentColor: "#10B981",
    shortDescription: "Lock studio dates with clear payment, cancellation, and rider terms.",
    fields: [
      { id: "sessionStart", label: "Session start", type: "date" },
      { id: "sessionEnd", label: "Session end", type: "date" },
      { id: "hourlyRate", label: "Hourly rate", type: "currency", placeholder: "e.g. ZAR 800/hr" },
      { id: "minimumHours", label: "Minimum booking (hours)", type: "number", defaultValue: 4 },
      { id: "depositPercent", label: "Deposit %", type: "percentage", defaultValue: 50 },
      GOVERNING_LAW,
    ],
  },
  {
    id: "featured-artist-agreement",
    title: "Featured Artist Agreement",
    contractType: "Featured Artist Agreement",
    category: "Recording & Production",
    route: "/dashboard/library/recording/featured-artist-agreement",
    parentModule: "A&R, Recording & Production",
    parentColor: "#10B981",
    shortDescription: "Engage a featured artist with clear fee, splits, and credit.",
    fields: [
      TERM_START, TERRITORY,
      { id: "featureFee", label: "Feature fee", type: "currency", placeholder: "e.g. ZAR 50,000 fixed" },
      { id: "featureRoyalty", label: "Feature royalty share %", type: "percentage", defaultValue: 0, helperText: "Optional — typically 0 for fixed-fee features; 25–50% for royalty-share collabs." },
      { id: "writingShare", label: "Composition writing share %", type: "percentage", defaultValue: 0 },
      GOVERNING_LAW,
    ],
  },
  {
    id: "beat-lease-agreement",
    title: "Beat Lease Agreement",
    contractType: "Beat Lease Agreement",
    category: "Recording & Production",
    route: "/dashboard/library/recording/beat-lease-agreement",
    parentModule: "A&R, Recording & Production",
    parentColor: "#10B981",
    shortDescription: "Lease vs exclusive beat terms with usage caps and royalty options.",
    fields: [
      TERM_START, TERM_END,
      { id: "leaseFee", label: "Lease fee", type: "currency", placeholder: "e.g. ZAR 1,500" },
      { id: "isExclusive", label: "Exclusive lease?", type: "text", placeholder: "Yes / No" },
      { id: "usageCap", label: "Usage cap (streams / units)", type: "text", placeholder: "Up to 100,000 streams" },
      { id: "producerRoyalty", label: "Producer royalty if exclusive %", type: "percentage", defaultValue: 50 },
      GOVERNING_LAW,
    ],
  },

  // ── Publishing & Songwriting ──────────────────────────────────────────
  {
    id: "co-publishing-agreement",
    title: "Co-Publishing Agreement",
    contractType: "Co-Publishing Agreement",
    category: "Publishing & Songwriting",
    route: "/dashboard/library/publishing/co-publishing-agreement",
    parentModule: "Publishing and Songwriting",
    parentColor: "#06B6D4",
    shortDescription: "Co-pub split — writer share + admin pub share, with reversion options.",
    fields: [
      TERM_START, TERM_END, OPTION_PERIOD, TERRITORY,
      { id: "writerShare", label: "Writer share %", type: "percentage", defaultValue: 50 },
      { id: "publisherShare", label: "Publisher share %", type: "percentage", defaultValue: 50 },
      { id: "advance", label: "Advance", type: "currency", placeholder: "e.g. ZAR 100,000" },
      GOVERNING_LAW,
    ],
  },
  {
    id: "publishing-admin-agreement",
    title: "Publishing Admin Agreement",
    contractType: "Publishing Admin Agreement",
    category: "Publishing & Songwriting",
    route: "/dashboard/library/publishing/publishing-admin-agreement",
    parentModule: "Publishing and Songwriting",
    parentColor: "#06B6D4",
    shortDescription: "Pure admin deal — collection only, no ownership transfer.",
    fields: [
      TERM_START, TERM_END, TERRITORY,
      { id: "adminFee", label: "Admin fee %", type: "percentage", defaultValue: 15, helperText: "Typically 10–25% off the top." },
      { id: "advance", label: "Advance", type: "currency" },
      GOVERNING_LAW,
    ],
  },
  {
    id: "staff-writer-agreement",
    title: "Staff Writer Agreement",
    contractType: "Staff Writer Agreement",
    category: "Publishing & Songwriting",
    route: "/dashboard/library/publishing/staff-writer-agreement",
    parentModule: "Publishing and Songwriting",
    parentColor: "#06B6D4",
    shortDescription: "Exclusive writer deal with delivery commitments + advance.",
    fields: [
      TERM_START, TERM_END, OPTION_PERIOD,
      { id: "annualAdvance", label: "Annual advance", type: "currency", placeholder: "e.g. ZAR 200,000/year" },
      { id: "deliveryCommitment", label: "Delivery commitment per period", type: "text", placeholder: "12 commercially released compositions per year" },
      { id: "writerShare", label: "Writer share post-recoupment %", type: "percentage", defaultValue: 50 },
      GOVERNING_LAW,
    ],
  },
  {
    id: "cover-mech-license",
    title: "Cover Song / Mechanical License",
    contractType: "Mechanical License",
    category: "Publishing & Songwriting",
    route: "/dashboard/library/publishing/cover-mech-license",
    parentModule: "Publishing and Songwriting",
    parentColor: "#06B6D4",
    shortDescription: "License a cover song — mechanical rate, format, and credit.",
    fields: [
      { id: "songTitle", label: "Song title", type: "text" },
      { id: "originalWriter", label: "Original writer(s)", type: "text" },
      { id: "mechRate", label: "Mech royalty rate", type: "currency", placeholder: "e.g. USD 0.124 per unit (US statutory)" },
      { id: "minimumGuarantee", label: "Minimum guarantee", type: "currency", placeholder: "Optional advance against royalties" },
      TERRITORY,
      GOVERNING_LAW,
    ],
  },

  // ── Sync Licensing ────────────────────────────────────────────────────
  {
    id: "sync-license-agreement",
    title: "Sync License Agreement",
    contractType: "Sync License Agreement",
    category: "Sync Licensing",
    route: "/dashboard/library/sync/sync-license-agreement",
    parentModule: "Sync Licensing",
    parentColor: "#22D3EE",
    shortDescription: "Master + composition license for film, TV, ad, game, or trailer use.",
    fields: [
      { id: "songTitle", label: "Song title", type: "text" },
      { id: "production", label: "Production / project", type: "text", placeholder: "Film / show / brand campaign" },
      { id: "media", label: "Media (use type)", type: "text", placeholder: "TV broadcast / SVOD / theatrical / online" },
      TERRITORY,
      { id: "licenseTerm", label: "License term", type: "text", placeholder: "In perpetuity / 5 years / etc." },
      { id: "syncFee", label: "Sync fee (master)", type: "currency", placeholder: "e.g. USD 25,000" },
      { id: "compositionFee", label: "Comp fee (publishing)", type: "currency", placeholder: "MFN with master fee" },
      { id: "exclusivity", label: "Exclusivity %", type: "percentage", defaultValue: 0, helperText: "0 = non-exclusive; 100 = full exclusivity for the term." },
      GOVERNING_LAW,
    ],
  },

  // ── Live & Touring ────────────────────────────────────────────────────
  {
    id: "promoter-agreement",
    title: "Promoter Agreement",
    contractType: "Promoter Agreement",
    category: "Live & Touring",
    route: "/dashboard/library/touring/promoter-agreement",
    parentModule: "Live, Touring & Festivals",
    parentColor: "#F59E0B",
    shortDescription: "Show-by-show promoter deal — guarantee, door split, settlement.",
    fields: [
      { id: "showDate", label: "Show date", type: "date" },
      { id: "venue", label: "Venue", type: "text" },
      { id: "guarantee", label: "Guarantee", type: "currency", placeholder: "Flat fee paid regardless of door" },
      { id: "doorSplit", label: "Door split (artist) %", type: "percentage", defaultValue: 85, helperText: "Typically 80–90% to artist over breakeven." },
      { id: "promoterCut", label: "Promoter cut %", type: "percentage", defaultValue: 15 },
      GOVERNING_LAW,
    ],
  },

  // ── Visual Production ─────────────────────────────────────────────────
  {
    id: "director-agreement",
    title: "Director Agreement (Music Video)",
    contractType: "Director Agreement",
    category: "Visual Production",
    route: "/dashboard/library/visual-production/director-agreement",
    parentModule: "Visual Production and Operation",
    parentColor: "#A855F7",
    shortDescription: "Music video direction — engagement, deliverables, IP, credit.",
    fields: [
      TERM_START,
      { id: "directorFee", label: "Director fee", type: "currency" },
      { id: "deliveryDate", label: "Delivery date", type: "date" },
      { id: "revisions", label: "Included revisions", type: "number", defaultValue: 2 },
      { id: "creditCard", label: "Director credit card", type: "text", placeholder: "Directed by [Name]" },
      GOVERNING_LAW,
    ],
  },
  {
    id: "dp-agreement",
    title: "Director of Photography Agreement",
    contractType: "DP Agreement",
    category: "Visual Production",
    route: "/dashboard/library/visual-production/dp-agreement",
    parentModule: "Visual Production and Operation",
    parentColor: "#A855F7",
    shortDescription: "DP / cinematographer engagement — gear, days, creative role.",
    fields: [
      { id: "shootStart", label: "Shoot start", type: "date" },
      { id: "shootEnd", label: "Shoot end", type: "date" },
      { id: "dayRate", label: "Day rate", type: "currency" },
      { id: "shootDays", label: "Number of shoot days", type: "number" },
      GOVERNING_LAW,
    ],
  },
  {
    id: "photographer-agreement",
    title: "Photographer Agreement",
    contractType: "Photographer Agreement",
    category: "Visual Production",
    route: "/dashboard/library/visual-production/photographer-agreement",
    parentModule: "Visual Production and Operation",
    parentColor: "#A855F7",
    shortDescription: "Photo session — usage rights term, deliverables, kill fee.",
    fields: [
      { id: "shootDate", label: "Shoot date", type: "date" },
      { id: "photographerFee", label: "Photographer fee", type: "currency" },
      { id: "usageTerm", label: "Usage rights term", type: "text", placeholder: "1 year / In perpetuity for editorial" },
      { id: "imagesDelivered", label: "Final images delivered", type: "number", defaultValue: 30 },
      GOVERNING_LAW,
    ],
  },
  {
    id: "stylist-agreement",
    title: "Stylist Agreement",
    contractType: "Stylist Agreement",
    category: "Visual Production",
    route: "/dashboard/library/visual-production/stylist-agreement",
    parentModule: "Visual Production and Operation",
    parentColor: "#A855F7",
    shortDescription: "Wardrobe styling — pulls, fittings, returns, day rate.",
    fields: [
      { id: "shootStart", label: "Shoot start", type: "date" },
      { id: "shootEnd", label: "Shoot end", type: "date" },
      { id: "stylistFee", label: "Stylist fee", type: "currency" },
      { id: "wardrobeBudget", label: "Wardrobe budget", type: "currency" },
      GOVERNING_LAW,
    ],
  },

  // ── Marketing & Brand ─────────────────────────────────────────────────
  {
    id: "ambassador-agreement",
    title: "Ambassador Agreement",
    contractType: "Ambassador Agreement",
    category: "Marketing & Brand",
    route: "/dashboard/library/marketing/ambassador-agreement",
    parentModule: "Marketing, Brand and Content",
    parentColor: "#8B5CF6",
    shortDescription: "Long-term brand ambassador role with deliverables and exclusivity.",
    fields: [
      TERM_START, TERM_END,
      { id: "compensation", label: "Compensation", type: "currency", placeholder: "Annual fee" },
      { id: "performanceBonus", label: "Performance bonus %", type: "percentage", defaultValue: 0 },
      { id: "deliverablesPerPeriod", label: "Deliverables per period", type: "text", placeholder: "e.g. 4 social posts/month + 2 events/year" },
      { id: "exclusivity", label: "Category exclusivity", type: "text", placeholder: "Yes — beverage category" },
      GOVERNING_LAW,
    ],
  },
  {
    id: "brand-endorsement-agreement",
    title: "Brand Endorsement Agreement",
    contractType: "Brand Endorsement Agreement",
    category: "Marketing & Brand",
    route: "/dashboard/library/marketing/brand-endorsement-agreement",
    parentModule: "Marketing, Brand and Content",
    parentColor: "#8B5CF6",
    shortDescription: "One-off or campaign brand endorsement with usage rights.",
    fields: [
      TERM_START, TERM_END, TERRITORY,
      { id: "endorsementFee", label: "Endorsement fee", type: "currency" },
      { id: "exclusivityPercent", label: "Exclusivity %", type: "percentage", defaultValue: 100, helperText: "100 = full category exclusivity for term." },
      { id: "usageRightsTerm", label: "Usage rights term", type: "text", placeholder: "1 year from first use" },
      GOVERNING_LAW,
    ],
  },
  {
    id: "influencer-agreement",
    title: "Influencer Agreement",
    contractType: "Influencer Agreement",
    category: "Marketing & Brand",
    route: "/dashboard/library/marketing/influencer-agreement",
    parentModule: "Marketing, Brand and Content",
    parentColor: "#8B5CF6",
    shortDescription: "Per-post or campaign influencer terms with FTC disclosure.",
    fields: [
      TERM_START, TERM_END,
      { id: "perPostFee", label: "Per-post fee", type: "currency" },
      { id: "totalPosts", label: "Total posts", type: "number" },
      { id: "exclusivityWindow", label: "Exclusivity window", type: "text", placeholder: "e.g. 30 days no competing brand posts" },
      GOVERNING_LAW,
    ],
  },

  // ── Legal & Confidentiality ───────────────────────────────────────────
  {
    id: "nda-mutual",
    title: "Mutual NDA",
    contractType: "Mutual NDA",
    category: "Legal & Confidentiality",
    route: "/dashboard/library/legal/nda-mutual",
    parentModule: "Legal and Compliance",
    parentColor: "#64748B",
    shortDescription: "Two-way confidentiality for partner / collaborator discussions.",
    fields: [
      TERM_START,
      { id: "confidentialityYears", label: "Confidentiality period (years)", type: "number", defaultValue: 2 },
      { id: "purpose", label: "Permitted purpose", type: "text", placeholder: "Discussions concerning [project / opportunity]" },
      GOVERNING_LAW,
    ],
  },
  {
    id: "nda-one-way",
    title: "One-Way NDA",
    contractType: "One-Way NDA",
    category: "Legal & Confidentiality",
    route: "/dashboard/library/legal/nda-one-way",
    parentModule: "Legal and Compliance",
    parentColor: "#64748B",
    shortDescription: "Outbound confidentiality — for staff, contractors, songwriter camps.",
    fields: [
      TERM_START,
      { id: "confidentialityYears", label: "Confidentiality period (years)", type: "number", defaultValue: 2 },
      { id: "purpose", label: "Permitted purpose", type: "text" },
      GOVERNING_LAW,
    ],
  },
  {
    id: "data-processing-agreement",
    title: "Data Processing Agreement",
    contractType: "Data Processing Agreement",
    category: "Legal & Confidentiality",
    route: "/dashboard/library/legal/data-processing-agreement",
    parentModule: "Legal and Compliance",
    parentColor: "#64748B",
    shortDescription: "POPIA / NDPA / GDPR-aligned DPA between controller and processor.",
    fields: [
      { id: "effectiveDate", label: "Effective date", type: "date" },
      { id: "processingPurpose", label: "Processing purpose", type: "text", placeholder: "e.g. Email marketing, ticketing analytics" },
      { id: "dataCategories", label: "Categories of personal data", type: "text", placeholder: "Email, name, IP, demographic" },
      GOVERNING_LAW,
    ],
  },
];

// ── Lookups ─────────────────────────────────────────────────────────────
export function getContractById(id: string): ContractRegistryEntry | undefined {
  return CONTRACT_REGISTRY.find((c) => c.id === id);
}

export function getContractsByCategory(category: ContractCategory): ContractRegistryEntry[] {
  return CONTRACT_REGISTRY.filter((c) => c.category === category);
}

export const CONTRACT_CATEGORIES: ContractCategory[] = [
  "Artist Onboarding",
  "Recording & Production",
  "Publishing & Songwriting",
  "Sync Licensing",
  "Live & Touring",
  "Visual Production",
  "Marketing & Brand",
  "Legal & Confidentiality",
];
