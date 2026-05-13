-- ============================================================
-- ROSTER — JO:LA upcoming releases seed (optional)
-- ------------------------------------------------------------
-- Inserts the 4 known upcoming JO:LA releases so the pipeline
-- is populated on day 1. Safe to run BEFORE Spotify is connected
-- — artist_id is left null and we use the free-text artist_name
-- column. Once Spotify is connected and the artists table is
-- populated, run the BACKFILL block at the bottom to link the
-- releases to their artist_id FKs.
--
-- HOW TO RUN
--  1. Make sure migrations 012 (releases) and 013 (reminders)
--     have already been applied.
--  2. Replace `<YOUR_AUTH_UID>` below with your auth.users.id —
--     find it in Supabase → Authentication → Users.
--  3. Paste this whole file into the Supabase SQL Editor and run.
-- ============================================================

-- ── Releases ────────────────────────────────────────────────
insert into public.releases
  (user_id, artist_id, artist_name, title, type, release_date, status, dsps, distributor)
values
  -- De Mthuda — locked-in date
  ('<YOUR_AUTH_UID>', null, 'De Mthuda',
   'Untitled Release', 'single', '2026-06-26', 'planned',
   array['Spotify','Apple Music','YouTube Music','Tidal','Boomplay'],
   null),

  -- Inter B & Draad — TBC
  ('<YOUR_AUTH_UID>', null, 'Inter B & Draad',
   'Untitled Release', 'single', null, 'planned',
   array['Spotify','Apple Music','YouTube Music'],
   null),

  -- Tag Team — TBC
  ('<YOUR_AUTH_UID>', null, 'Tag Team',
   'Untitled Release', 'single', null, 'planned',
   array['Spotify','Apple Music','YouTube Music'],
   null),

  -- Zee_nhle — TBC
  ('<YOUR_AUTH_UID>', null, 'Zee_nhle',
   'Untitled Release', 'single', null, 'planned',
   array['Spotify','Apple Music','YouTube Music'],
   null);

-- ── BACKFILL (run after artists are seeded via Spotify) ─────
-- This links any release with a matching free-text artist_name
-- to the actual artists.id FK. Run it any time you add a new
-- artist to the roster.
--
-- update public.releases r
-- set artist_id = a.id
-- from public.artists a
-- where r.user_id = a.user_id
--   and r.artist_id is null
--   and r.artist_name is not null
--   and lower(r.artist_name) = lower(a.name);
