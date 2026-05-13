export const APP_NAME = "ROSTER";
export const APP_TAGLINE = "Grow Your Superstar Roster.";
export const APP_DESCRIPTION =
  "The all-in-one platform for music managers who are serious about building real careers — tools, masterclasses, and direct access to the people who've done it.";

// Legacy single-plan pricing (kept for backward compatibility)
export const PRICING = {
  monthly: {
    amount: 599,
    currency: "ZAR",
    label: "R599",
    period: "month",
    planCode: process.env.PAYSTACK_MONTHLY_PLAN_CODE || "",
  },
  annual: {
    amount: 5990,
    currency: "ZAR",
    label: "R5,990",
    period: "year",
    savings: "R1,198",
    planCode: process.env.PAYSTACK_ANNUAL_PLAN_CODE || "",
  },
};

// ─── Subscription Tiers ───────────────────────────────────────
export type TierId = "free" | "pro" | "agency" | "enterprise" | "enterprise_max";

export interface Tier {
  id: TierId;
  name: string;
  tagline: string;
  monthlyPrice: number;          // 0 for free
  annualPrice: number;           // 0 for free
  annualMonthly: number;         // effective monthly when billed annually
  annualSavings: number;         // total saved per year
  artists: number;               // 0 = not applicable
  seats: number;
  documents: number;             // -1 = unlimited
  documentCarryOver: boolean;    // renewing keeps saved documents
  freeTools: string[] | "all";   // tool slugs or "all"
  badge: string | null;
  highlight: boolean;            // renders the golden glow border
  cta: string;
  features: string[];
}

export const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Start learning at no cost.",
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthly: 0,
    annualSavings: 0,
    artists: 0,
    seats: 1,
    documents: 0,
    documentCarryOver: false,
    freeTools: ["tour-budget", "cashflow-forecast"],
    badge: null,
    highlight: false,
    cta: "Get Started Free",
    features: [
      "Full access to Learn module",
      "2 work tools: Tour Budget & Cash Flow",
      "See the full platform (no saving)",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For the solo manager on the rise.",
    monthlyPrice: 599,
    annualPrice: 5990,
    annualMonthly: 499,
    annualSavings: 1198,
    artists: 2,
    seats: 1,
    documents: 50,
    documentCarryOver: false,
    freeTools: "all",
    badge: "Most Popular",
    highlight: true,
    cta: "Start Pro",
    features: [
      "Manage up to 2 artists",
      "1 user seat",
      "Full toolkit — all 6 modules",
      "50 saved documents",
      "All masterclasses",
      "Expert booking directory",
      "Email support",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    tagline: "For growing management companies.",
    monthlyPrice: 1299,
    annualPrice: 12990,
    annualMonthly: 1082,
    annualSavings: 2598,
    artists: 5,
    seats: 3,
    documents: -1,
    documentCarryOver: false,
    freeTools: "all",
    badge: "Best Value / Seat",
    highlight: false,
    cta: "Start Agency",
    features: [
      "Manage up to 5 artists",
      "3 user seats (R433/seat)",
      "Full toolkit — all 6 modules",
      "Unlimited saved documents",
      "All masterclasses",
      "Priority email support",
      "Monthly or annual billing",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For established companies with serious rosters.",
    monthlyPrice: 4999,
    annualPrice: 49990,
    annualMonthly: 4166,
    annualSavings: 9998,
    artists: 20,
    seats: 10,
    documents: -1,
    documentCarryOver: true,
    freeTools: "all",
    badge: null,
    highlight: false,
    cta: "Start Enterprise",
    features: [
      "Manage up to 20 artists",
      "10 user seats",
      "Full toolkit — all 6 modules",
      "Unlimited documents + carry over on renewal",
      "Dedicated account manager",
      "4-hour support SLA (business hours)",
      "2-hour private onboarding session",
      "Quarterly business review call",
      "Invoice billing available",
      "Annual contract preferred",
    ],
  },
  {
    id: "enterprise_max",
    name: "Enterprise Max",
    tagline: "Unlimited scale. No ceilings.",
    monthlyPrice: 15999,
    annualPrice: 159990,            // 10 months — save R31,998/year
    annualMonthly: 13333,           // effective monthly billed annually
    annualSavings: 31998,
    artists: -1,                    // unlimited
    seats: 30,
    documents: -1,
    documentCarryOver: true,
    freeTools: "all",
    badge: "Unlimited",
    highlight: false,
    cta: "Start Enterprise Max",
    features: [
      "Unlimited artists",
      "30 user seats",
      "Full toolkit — all modules",
      "Unlimited documents + carry over on renewal",
      "5 TB Vault storage",
      "Dedicated account manager",
      "2-hour support SLA (business hours)",
      "White-glove onboarding session",
      "Monthly business review call",
      "Invoice billing available",
      "Custom contract terms available",
    ],
  },
];

export const BOOKING_COMMISSION = 0.2; // 20%

export const SESSION_DURATIONS = [
  { label: "30 min", minutes: 30 },
  { label: "45 min", minutes: 45 },
  { label: "60 min / 1 hr", minutes: 60 },
  { label: "120 min / 2 hrs", minutes: 120 },
];

export const MODULES = [
  {
    id: "onboarding",
    slug: "startup",
    title: "Onboarding New Artists",
    subtitle: "Your First Move",
    description:
      "Your first signing sets the tone for everything. Get the agreement right, complete the full onboarding checklist, and build a partnership where you and your artist know exactly where you stand from day one.",
    color: "#C9A84C",
    folder: "ONBOARDING",
    resourceCount: 0,
  },
  {
    id: "live",
    slug: "touring",
    title: "Live, Touring & Festivals",
    subtitle: "Shows That Pay",
    description:
      "From the first booking email to sell-out night: book shows, run the rider, manage the tour, handle settlement, and bring your team home with money in the bank.",
    color: "#F59E0B",
    folder: "LIVE",
    resourceCount: 0,
  },
  {
    id: "ar-recording",
    slug: "recording",
    title: "A&R, Recording & Production",
    subtitle: "Make It Right",
    description:
      "From the demo to the master: studio bookings, producer & engineer agreements, beat licenses, sample clearance, master delivery specs, and the A&R pipeline that finds your next artist.",
    color: "#10B981",
    folder: "RECORDING",
    resourceCount: 0,
  },
  {
    id: "distribution",
    slug: "distribution",
    title: "Distribution and DSPs",
    subtitle: "Get It Out",
    description:
      "Pick the right distributor, deliver clean metadata, hit every QC mark, pitch every editor, and audit what landed where. The release-day infrastructure.",
    color: "#0EA5E9",
    folder: "DISTRIBUTION",
    resourceCount: 0,
  },
  {
    id: "marketing",
    slug: "marketing",
    title: "Marketing, Brand and Content",
    subtitle: "Get Heard",
    description:
      "Radio, playlists, social media, release day, brand partnerships, sponsorship: all of it needs a strategy. These tools show you what to do, in what order, so your artist gets in front of the right people at the right moment.",
    color: "#8B5CF6",
    folder: "MARKETING",
    resourceCount: 0,
  },
  {
    id: "visual",
    slug: "visual-production",
    title: "Visual Production and Operation",
    subtitle: "Look the Part",
    description:
      "Music videos, photography, design and the operations that ship them: treatments, briefs, budgets, call sheets, director and DP agreements, releases, and cover-art QC.",
    color: "#A855F7",
    folder: "VISUAL",
    resourceCount: 0,
  },
  {
    id: "pr",
    slug: "pr-press",
    title: "PR, Press and Awards",
    subtitle: "Tell Your Story",
    description:
      "Press releases, interviews, premieres, podcast pitches and awards submissions — every campaign earns its own narrative. Templates and trackers across the African and global press circuit.",
    color: "#F472B6",
    folder: "PR",
    resourceCount: 0,
  },
  {
    id: "fan",
    slug: "fan-crm",
    title: "Fan, CRM and Audience",
    subtitle: "Own the Audience",
    description:
      "First-party data is the next moat. Build the email list, the WhatsApp broadcasts, the VIP tiers, and the survey loop so your fanbase compounds release after release.",
    color: "#EF4444",
    folder: "FAN",
    resourceCount: 0,
  },
  {
    id: "sync",
    slug: "sync",
    title: "Sync Licensing",
    subtitle: "Songs in Pictures",
    description:
      "Pitch one-sheets, music supervisor outreach, sync license agreements, MFN comparators, quote letters — the highest-margin licensing lever for catalogue artists.",
    color: "#22D3EE",
    folder: "SYNC",
    resourceCount: 0,
  },
  {
    id: "publishing",
    slug: "publishing",
    title: "Publishing and Songwriting",
    subtitle: "Own What You Write",
    description:
      "Your songs are assets. Register them, split them, license them, and make sure every PRO and MRO knows about every work. What you don't document, you don't own.",
    color: "#06B6D4",
    folder: "PUBLISHING",
    resourceCount: 0,
  },
  {
    id: "royalties",
    slug: "royalties",
    title: "Royalties",
    subtitle: "Collect What's Owed",
    description:
      "Statement reconciliation, advance recoupment, registration trackers across PRO/MRO/neighbouring rights, royalty audits, and black-box recovery. The money you earned but haven't been paid.",
    color: "#EAB308",
    folder: "ROYALTIES",
    resourceCount: 0,
  },
  {
    id: "finance",
    slug: "money",
    title: "Finance and Tax",
    subtitle: "Run the Books",
    description:
      "Bookkeeping, P&Ls, cash flow, invoices, VAT/PAYE/withholding by country, foreign currency, grants and funding. The accounting layer beneath the music business.",
    color: "#EC4899",
    folder: "FINANCE",
    resourceCount: 0,
  },
  {
    id: "merch",
    slug: "merchandise",
    title: "Merchandise and D2C",
    subtitle: "Direct to Fans",
    description:
      "Manufacturer agreements, drop strategy, channel decision, tour-table inventory and settlement, returns policy, and the bundle-pricing math that makes merch the most profitable revenue stream.",
    color: "#FB923C",
    folder: "MERCH",
    resourceCount: 0,
  },
  {
    id: "legal",
    slug: "legal",
    title: "Legal and Compliance",
    subtitle: "Cover Yourself",
    description:
      "NDAs, releases, trademark and copyright trackers, POPIA/GDPR compliance, cease-and-desist and DMCA templates, e-signature workflow. The legal stack outside specific deal types.",
    color: "#64748B",
    folder: "LEGAL",
    resourceCount: 0,
  },
  {
    id: "vault",
    slug: "vault",
    title: "Vault",
    subtitle: "Everything in One Place",
    description:
      "The encrypted, versioned home for every signed contract, every approved master, every brand asset and every key document. Your single source of truth.",
    color: "#475569",
    folder: "VAULT",
    resourceCount: 0,
  },
];

export const NAV_LINKS = [
  { label: "Platform", href: "/#platform" },
  { label: "Masterclasses", href: "/#masterclasses" },
  { label: "Experts", href: "/#experts" },
  { label: "Pricing", href: "/pricing" },
];
