// ============================================================
// ROSTER — Masterclasses seed curriculum
// 12 lessons shown when the DB has no published masterclasses yet.
// ============================================================

export interface SeedMasterclass {
  id: string;
  title: string;
  description: string;
  instructor_name: string;
  instructor_title: string;
  thumbnail_url: null;
  vimeo_id: string;
  duration_seconds: number;
  category: string;
  is_published: boolean;
}

export const SEED_MASTERCLASSES: SeedMasterclass[] = [
  // ── Business & Legal ──────────────────────────────────────
  {
    id: "seed-1", category: "startup", is_published: true, vimeo_id: "",
    title: "Negotiating Your First Record Deal",
    description: "Deal structures, advances, royalty rates, reversion clauses, and the specific language you need before you sign anything. Real contracts reviewed live.",
    instructor_name: "Entertainment Attorney", instructor_title: "Music Law, Johannesburg",
    thumbnail_url: null, duration_seconds: 2820,
  },
  {
    id: "seed-7", category: "startup", is_published: true, vimeo_id: "",
    title: "Working with Managers, Agents & Lawyers",
    description: "What each role actually does, how commissions work, how to spot a bad deal, and how to build a team around you before you can afford one.",
    instructor_name: "Veteran Artist Manager", instructor_title: "Artist Management, Cape Town",
    thumbnail_url: null, duration_seconds: 2520,
  },
  {
    id: "seed-10", category: "startup", is_published: true, vimeo_id: "",
    title: "Setting Up Your Music Business Correctly",
    description: "PTY vs. sole trader, VAT registration, business bank accounts, trademark protection, and what every artist needs to have in place before they blow up.",
    instructor_name: "Music Business Accountant", instructor_title: "Accounting & Compliance, Durban",
    thumbnail_url: null, duration_seconds: 2400,
  },

  // ── Touring & Live ───────────────────────────────────────
  {
    id: "seed-2", category: "touring", is_published: true, vimeo_id: "",
    title: "Tour Budgeting from Scratch",
    description: "Build a real tour budget — venues, riders, travel, crew, accommodation, per diems. How to stay profitable on a 6-date regional tour and scale from there.",
    instructor_name: "Senior Tour Manager", instructor_title: "Live Events, Pan-Africa",
    thumbnail_url: null, duration_seconds: 3720,
  },
  {
    id: "seed-8", category: "touring", is_published: true, vimeo_id: "",
    title: "Booking Live Shows: From Local to Continental",
    description: "How to approach promoters, build a show history, negotiate guarantees vs. door splits, and grow from club gigs to festival headliner status.",
    instructor_name: "Booking Agent", instructor_title: "Live Bookings, Lagos & Accra",
    thumbnail_url: null, duration_seconds: 3120,
  },

  // ── Recording & Production ───────────────────────────────
  {
    id: "seed-5", category: "recording", is_published: true, vimeo_id: "",
    title: "Distributing Your Music Like a Label",
    description: "Digital distribution, Spotify for Artists playlist pitching, Apple Music editorial, TikTok Sound, and release strategy — done at label standard.",
    instructor_name: "Label Manager", instructor_title: "A&R & Distribution, Accra",
    thumbnail_url: null, duration_seconds: 2580,
  },
  {
    id: "seed-11", category: "recording", is_published: true, vimeo_id: "",
    title: "Recording Your First Professional EP",
    description: "Studio booking, session preparation, working with a producer, mixing and mastering budgets, and what separates an amateur recording from a radio-ready one.",
    instructor_name: "Record Producer", instructor_title: "Production & Engineering, Nairobi",
    thumbnail_url: null, duration_seconds: 3060,
  },

  // ── Marketing & Audience ─────────────────────────────────
  {
    id: "seed-3", category: "marketing", is_published: true, vimeo_id: "",
    title: "Building an Artist Brand in Africa",
    description: "Authentic brand identity that works across African markets and travels globally — visual identity, tone of voice, fan narrative, and the story behind the music.",
    instructor_name: "Creative Director", instructor_title: "Artist Branding, Lagos",
    thumbnail_url: null, duration_seconds: 2280,
  },
  {
    id: "seed-6", category: "marketing", is_published: true, vimeo_id: "",
    title: "Social Media Strategy for African Artists",
    description: "Platform-by-platform breakdown: TikTok viral mechanics, Instagram growth, YouTube monetisation, and Facebook for older audiences. What the algorithm rewards.",
    instructor_name: "Digital Marketing Lead", instructor_title: "Social & Digital, Nairobi",
    thumbnail_url: null, duration_seconds: 2040,
  },
  {
    id: "seed-12", category: "marketing", is_published: true, vimeo_id: "",
    title: "Press, PR & Getting Media Coverage",
    description: "How to write a press release, approach journalists, pitch to playlists, and build media relationships — without a PR agency budget.",
    instructor_name: "Music Publicist", instructor_title: "PR & Media, Johannesburg",
    thumbnail_url: null, duration_seconds: 1980,
  },

  // ── Money & Royalties ────────────────────────────────────
  {
    id: "seed-4", category: "money", is_published: true, vimeo_id: "",
    title: "Royalty Registration Masterclass",
    description: "Step-by-step walkthrough of SAMRO, CAPASSO, RISA, MCSK, COSON, and how to register internationally so your money follows the music wherever it plays.",
    instructor_name: "Music Royalties Expert", instructor_title: "Publishing & Rights, Cape Town",
    thumbnail_url: null, duration_seconds: 3300,
  },
  {
    id: "seed-9", category: "money", is_published: true, vimeo_id: "",
    title: "The African Sync Licensing Opportunity",
    description: "How sync licensing works, who buys music (film, TV, ads, games), how to pitch your catalogue, and how to price a sync deal when you're just starting out.",
    instructor_name: "Sync Licensing Consultant", instructor_title: "Sync & Licensing, Johannesburg",
    thumbnail_url: null, duration_seconds: 2760,
  },
];

/** Map keyed by id for O(1) lookup */
export const SEED_MAP: Record<string, SeedMasterclass> =
  Object.fromEntries(SEED_MASTERCLASSES.map(s => [s.id, s]));
