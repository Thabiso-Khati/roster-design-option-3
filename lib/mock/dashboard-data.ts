// ============================================================
// ROSTER V2 — Mock Dashboard Data
// ------------------------------------------------------------
// Frontend-only mock data for the dashboard rebuild. No DB.
// Replace with Supabase queries when we integrate.
// ============================================================

// ─── Artists ───────────────────────────────────────────────
export interface MockArtist {
  id: string;
  name: string;
  genre: string;
  country: string;
  countryFlag: string;
  avatarInitials: string;
  avatarColor: string;
  monthlyListeners: number;
  followers: number;
  trend: "up" | "down" | "flat";
  trendPct: number;
  nextMilestone?: string;
}

export const MOCK_ARTISTS: MockArtist[] = [
  {
    id: "a1",
    name: "Thandiswa N.",
    genre: "Afro-soul",
    country: "South Africa",
    countryFlag: "🇿🇦",
    avatarInitials: "TN",
    avatarColor: "#C9A84C",
    monthlyListeners: 184_203,
    followers: 52_118,
    trend: "up",
    trendPct: 12.4,
    nextMilestone: "200k listeners",
  },
  {
    id: "a2",
    name: "Kwame Mensah",
    genre: "Highlife / Afrobeats",
    country: "Ghana",
    countryFlag: "🇬🇭",
    avatarInitials: "KM",
    avatarColor: "#F59E0B",
    monthlyListeners: 71_420,
    followers: 18_902,
    trend: "up",
    trendPct: 6.1,
    nextMilestone: "First EP",
  },
  {
    id: "a3",
    name: "LULU",
    genre: "Amapiano",
    country: "South Africa",
    countryFlag: "🇿🇦",
    avatarInitials: "LU",
    avatarColor: "#8B5CF6",
    monthlyListeners: 412_007,
    followers: 91_540,
    trend: "up",
    trendPct: 23.8,
    nextMilestone: "Sold-out tour",
  },
];

// ─── Releases ──────────────────────────────────────────────
export interface MockRelease {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  type: "single" | "EP" | "album" | "mixtape";
  date: string; // ISO
  status: "planned" | "delivered" | "live";
  dsps: string[];
  distributor?: string;
}

export const MOCK_RELEASES: MockRelease[] = [
  {
    id: "r1",
    artistId: "a3",
    artistName: "LULU",
    title: "Sunday Morning",
    type: "single",
    date: "2026-05-02",
    status: "delivered",
    dsps: ["Spotify", "Apple Music", "Boomplay", "Audiomack"],
    distributor: "DistroKid",
  },
  {
    id: "r2",
    artistId: "a1",
    artistName: "Thandiswa N.",
    title: "Lightwork",
    type: "EP",
    date: "2026-06-13",
    status: "planned",
    dsps: ["Spotify", "Apple Music", "YouTube Music", "Tidal"],
    distributor: "Africori",
  },
  {
    id: "r3",
    artistId: "a2",
    artistName: "Kwame Mensah",
    title: "Accra → Lagos",
    type: "single",
    date: "2026-07-04",
    status: "planned",
    dsps: ["Spotify", "Apple Music", "Boomplay"],
  },
];

// ─── Reminders ─────────────────────────────────────────────
export interface MockReminder {
  id: string;
  title: string;
  dueDate: string; // ISO
  category: "legal" | "royalty" | "release" | "finance" | "admin";
  priority: "low" | "medium" | "high";
  done: boolean;
  relatedArtist?: string;
}

export const MOCK_REMINDERS: MockReminder[] = [
  {
    id: "rem1",
    title: "Countersign LULU's distribution agreement",
    dueDate: "2026-04-24",
    category: "legal",
    priority: "high",
    done: false,
    relatedArtist: "LULU",
  },
  {
    id: "rem2",
    title: "SAMRO Q2 royalty claims — submit before window closes",
    dueDate: "2026-06-30",
    category: "royalty",
    priority: "high",
    done: false,
  },
  {
    id: "rem3",
    title: "Book photographer for Thandiswa EP artwork",
    dueDate: "2026-05-01",
    category: "release",
    priority: "medium",
    done: false,
    relatedArtist: "Thandiswa N.",
  },
  {
    id: "rem4",
    title: "Review Kwame's publishing split on 'Accra → Lagos'",
    dueDate: "2026-04-28",
    category: "legal",
    priority: "medium",
    done: false,
    relatedArtist: "Kwame Mensah",
  },
  {
    id: "rem5",
    title: "Reconcile March DSP payout against statement",
    dueDate: "2026-04-30",
    category: "finance",
    priority: "low",
    done: false,
  },
];

// ─── Today's Brief variations ─────────────────────────────
// Three hand-written variations that demonstrate tone.
// In production, these will be LLM-generated daily.

export interface BriefPrompt {
  label: "Pick up" | "Upcoming" | "Try this" | "Watch out";
  sentence: string;
  href?: string;
}

export interface DailyBrief {
  greeting: string;
  prompts: BriefPrompt[];
}

export const BRIEF_VARIATIONS: DailyBrief[] = [
  {
    greeting: "A quiet Wednesday to get things done.",
    prompts: [
      {
        label: "Pick up",
        sentence:
          "You're eight minutes from finishing Splits & Publishing Deep Dive.",
        href: "/dashboard/masterclasses",
      },
      {
        label: "Upcoming",
        sentence:
          "LULU's single Sunday Morning goes live in ten days — artwork approval still pending.",
        href: "/dashboard#releases",
      },
      {
        label: "Try this",
        sentence:
          "Thandi N. has two slots this week for split-sheet reviews. Worth booking before the EP lockdown.",
        href: "/dashboard/experts",
      },
    ],
  },
  {
    greeting: "Midweek. Your numbers look healthy.",
    prompts: [
      {
        label: "Pick up",
        sentence:
          "LULU's monthly listeners are up 23.8% — worth flagging to her for the tour pitch.",
        href: "/dashboard#artists",
      },
      {
        label: "Upcoming",
        sentence:
          "SAMRO's Q2 royalty claims window closes in ten weeks. No action today; calendared.",
        href: "/dashboard/library",
      },
      {
        label: "Watch out",
        sentence:
          "LULU's distribution agreement needs your countersignature by Friday.",
        href: "/dashboard#reminders",
      },
    ],
  },
  {
    greeting: "A clean slate and an open afternoon.",
    prompts: [
      {
        label: "Pick up",
        sentence:
          "Three resources you opened last week are still bookmarked and unread.",
        href: "/dashboard/library",
      },
      {
        label: "Try this",
        sentence:
          "A new masterclass dropped — Structuring a Sync Deal for a Global Catalog.",
        href: "/dashboard/masterclasses",
      },
      {
        label: "Upcoming",
        sentence:
          "Kwame's single drops in eleven weeks. Promo plan is still a blank doc.",
        href: "/dashboard#releases",
      },
    ],
  },
];

// ─── Industry Ticker events ───────────────────────────────
export type TickerType =
  | "deadline"
  | "opportunity"
  | "news"
  | "new-on-roster";

export interface TickerEvent {
  id: string;
  type: TickerType;
  headline: string;
  detail: string;
  country?: string;
  endsAt?: string; // ISO for deadline countdown
  href?: string;
  priority: "critical" | "normal";
}

export const MOCK_TICKER: TickerEvent[] = [
  {
    id: "t1",
    type: "deadline",
    headline: "SAMRO Q2 royalty claims close",
    detail:
      "South African Music Rights Organisation is accepting Q2 performance claim submissions. Register all live and broadcast performances before the window closes.",
    country: "ZA",
    endsAt: "2026-06-30",
    priority: "critical",
  },
  {
    id: "t2",
    type: "opportunity",
    headline: "Sauti za Busara 2027 applications open",
    detail:
      "The pan-African music festival on Zanzibar has opened artist applications. Accepting submissions from across the continent. Selected artists receive travel, accommodation, and a performance fee.",
    country: "TZ",
    endsAt: "2026-08-15",
    priority: "normal",
  },
  {
    id: "t3",
    type: "opportunity",
    headline: "Music In Africa ACCES 2026 conference submissions",
    detail:
      "Applications for showcase artists and panel speakers at the ACCES conference in Nairobi are now open. Focus on live performance and industry development.",
    country: "KE",
    endsAt: "2026-07-01",
    priority: "normal",
  },
  {
    id: "t4",
    type: "deadline",
    headline: "MUSICDigi.ng catalog registration window",
    detail:
      "COSON's supplementary catalog registration period for Nigerian rights holders. Works must be registered with full split sheets.",
    country: "NG",
    endsAt: "2026-05-15",
    priority: "critical",
  },
  {
    id: "t5",
    type: "opportunity",
    headline: "Sync brief — Netflix docuseries, African artists",
    detail:
      "A Netflix-commissioned docuseries is sourcing instrumental and vocal pieces from African composers. Advance and backend split on placement.",
    endsAt: "2026-05-20",
    priority: "normal",
  },
  {
    id: "t6",
    type: "new-on-roster",
    headline: "New expert: Chidi Okonkwo (publishing, Lagos)",
    detail:
      "15 years at Sony/ATV Africa. Specialises in sub-publishing deals and cross-territory collections. Booking calendar open.",
    href: "/dashboard/experts",
    priority: "normal",
  },
  {
    id: "t7",
    type: "news",
    headline: "Spotify expands direct payouts in Francophone Africa",
    detail:
      "Streaming platform rolls out direct bank payouts to artists in Senegal, Côte d'Ivoire, and Cameroon — removing the reliance on intermediary distributors.",
    priority: "normal",
  },
  {
    id: "t8",
    type: "deadline",
    headline: "AFRIMA 2026 submission deadline",
    detail:
      "All-Africa Music Awards submissions for the 2026 edition. Releases from the eligibility period now being considered.",
    endsAt: "2026-05-10",
    priority: "critical",
  },
  {
    id: "t9",
    type: "new-on-roster",
    headline: "New masterclass: Structuring a Sync Deal for a Global Catalog",
    detail:
      "A 48-minute masterclass on how to negotiate sync terms when your catalog spans multiple territories. With Lebo Mashile and Marcus Gad.",
    href: "/dashboard/masterclasses",
    priority: "normal",
  },
  {
    id: "t10",
    type: "opportunity",
    headline: "Goethe-Institut Music Residency — 2026 intake",
    detail:
      "Three-month music residency in Berlin for artists and producers from the African continent. Full stipend and studio access provided.",
    endsAt: "2026-09-01",
    priority: "normal",
  },
];

// ─── Learning Compass recommendations ─────────────────────
export interface LearningRecommendation {
  kind: "masterclass" | "expert";
  title: string;
  because: string;
  cta: string;
  href: string;
  meta: string;
}

export const MOCK_RECOMMENDATIONS: LearningRecommendation[] = [
  {
    kind: "masterclass",
    title: "Structuring a Sync Deal for a Global Catalog",
    because:
      "You just finished the Publishing module, and a Netflix sync brief is live in your ticker.",
    cta: "Watch 48 min",
    href: "/dashboard/masterclasses",
    meta: "With Lebo Mashile · 48 min",
  },
  {
    kind: "expert",
    title: "Book Chidi Okonkwo",
    because:
      "You have three releases in the next 90 days. Chidi has structured sub-publishing for over 200 catalogs.",
    cta: "View availability",
    href: "/dashboard/experts",
    meta: "Publishing · Lagos · R1,800 / 60 min",
  },
];

// ─── Utility: relative time ───────────────────────────────
export function formatDaysUntil(isoDate: string): string {
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = then.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `in ${days} days`;
  if (days < 60) return `in ${Math.round(days / 7)} weeks`;
  return `in ${Math.round(days / 30)} months`;
}

export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}k`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

// ─── Greeting by time of day ──────────────────────────────
export function getTimeGreeting(
  name: string,
  hour: number = new Date().getHours(),
): string {
  if (hour < 5) return `It's late, ${name}.`;
  if (hour < 12) return `Good morning, ${name}.`;
  if (hour < 17) return `Afternoon, ${name}.`;
  if (hour < 21) return `Evening, ${name}.`;
  return `Winding down, ${name}.`;
}

// ─── Daily brief picker (rotates by date) ─────────────────
export function pickBriefForToday(): DailyBrief {
  const idx = new Date().getDate() % BRIEF_VARIATIONS.length;
  return BRIEF_VARIATIONS[idx];
}
