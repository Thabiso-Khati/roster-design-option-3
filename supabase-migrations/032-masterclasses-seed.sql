-- ============================================================
-- ROSTER — Migration 032: Masterclasses seed (12 lessons)
-- ------------------------------------------------------------
-- Inserts the initial curriculum into the masterclasses table.
-- Safe to re-run — uses ON CONFLICT DO NOTHING.
--
-- To attach a video once it's recorded:
--   UPDATE masterclasses SET vimeo_id = '<your_vimeo_id>' WHERE id = '<uuid>';
--   UPDATE masterclasses SET thumbnail_url = '<url>' WHERE id = '<uuid>';
-- ============================================================

-- Ensure the masterclasses table exists with required columns.
-- (Assumes the table was created by the initial schema migration.)
ALTER TABLE public.masterclasses
  ADD COLUMN IF NOT EXISTS vimeo_id      text,
  ADD COLUMN IF NOT EXISTS instructor_name  text,
  ADD COLUMN IF NOT EXISTS instructor_title text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS category      text,
  ADD COLUMN IF NOT EXISTS is_published  boolean NOT NULL DEFAULT false;

-- ── Seed 12 lessons ──────────────────────────────────────────

INSERT INTO public.masterclasses
  (id, title, description, instructor_name, instructor_title, thumbnail_url, vimeo_id, duration_seconds, category, is_published)
VALUES

-- ── Business & Legal ──────────────────────────────────────────
(
  'seed-1',
  'Negotiating Your First Record Deal',
  'Deal structures, advances, royalty rates, reversion clauses, and the specific language you need before you sign anything. Real contracts reviewed live.',
  'Entertainment Attorney', 'Music Law, Johannesburg',
  NULL, NULL, 2820, 'startup', true
),
(
  'seed-7',
  'Working with Managers, Agents & Lawyers',
  'What each role actually does, how commissions work, how to spot a bad deal, and how to build a team around you before you can afford one.',
  'Veteran Artist Manager', 'Artist Management, Cape Town',
  NULL, NULL, 2520, 'startup', true
),
(
  'seed-10',
  'Setting Up Your Music Business Correctly',
  'PTY vs. sole trader, VAT registration, business bank accounts, trademark protection, and what every artist needs to have in place before they blow up.',
  'Music Business Accountant', 'Accounting & Compliance, Durban',
  NULL, NULL, 2400, 'startup', true
),

-- ── Touring & Live ───────────────────────────────────────────
(
  'seed-2',
  'Tour Budgeting from Scratch',
  'Build a real tour budget — venues, riders, travel, crew, accommodation, per diems. How to stay profitable on a 6-date regional tour and scale from there.',
  'Senior Tour Manager', 'Live Events, Pan-Africa',
  NULL, NULL, 3720, 'touring', true
),
(
  'seed-8',
  'Booking Live Shows: From Local to Continental',
  'How to approach promoters, build a show history, negotiate guarantees vs. door splits, and grow from club gigs to festival headliner status.',
  'Booking Agent', 'Live Bookings, Lagos & Accra',
  NULL, NULL, 3120, 'touring', true
),

-- ── Recording & Production ───────────────────────────────────
(
  'seed-5',
  'Distributing Your Music Like a Label',
  'Digital distribution, Spotify for Artists playlist pitching, Apple Music editorial, TikTok Sound, and release strategy — done at label standard.',
  'Label Manager', 'A&R & Distribution, Accra',
  NULL, NULL, 2580, 'recording', true
),
(
  'seed-11',
  'Recording Your First Professional EP',
  'Studio booking, session preparation, working with a producer, mixing and mastering budgets, and what separates an amateur recording from a radio-ready one.',
  'Record Producer', 'Production & Engineering, Nairobi',
  NULL, NULL, 3060, 'recording', true
),

-- ── Marketing & Audience ─────────────────────────────────────
(
  'seed-3',
  'Building an Artist Brand in Africa',
  'Authentic brand identity that works across African markets and travels globally — visual identity, tone of voice, fan narrative, and the story behind the music.',
  'Creative Director', 'Artist Branding, Lagos',
  NULL, NULL, 2280, 'marketing', true
),
(
  'seed-6',
  'Social Media Strategy for African Artists',
  'Platform-by-platform breakdown: TikTok viral mechanics, Instagram growth, YouTube monetisation, and Facebook for older audiences. What the algorithm rewards.',
  'Digital Marketing Lead', 'Social & Digital, Nairobi',
  NULL, NULL, 2040, 'marketing', true
),
(
  'seed-12',
  'Press, PR & Getting Media Coverage',
  'How to write a press release, approach journalists, pitch to playlists, and build media relationships — without a PR agency budget.',
  'Music Publicist', 'PR & Media, Johannesburg',
  NULL, NULL, 1980, 'marketing', true
),

-- ── Money & Royalties ────────────────────────────────────────
(
  'seed-4',
  'Royalty Registration Masterclass',
  'Step-by-step walkthrough of SAMRO, CAPASSO, RISA, MCSK, COSON, and how to register internationally so your money follows the music wherever it plays.',
  'Music Royalties Expert', 'Publishing & Rights, Cape Town',
  NULL, NULL, 3300, 'money', true
),
(
  'seed-9',
  'The African Sync Licensing Opportunity',
  'How sync licensing works, who buys music (film, TV, ads, games), how to pitch your catalogue, and how to price a sync deal when you''re just starting out.',
  'Sync Licensing Consultant', 'Sync & Licensing, Johannesburg',
  NULL, NULL, 2760, 'money', true
)

ON CONFLICT (id) DO NOTHING;
