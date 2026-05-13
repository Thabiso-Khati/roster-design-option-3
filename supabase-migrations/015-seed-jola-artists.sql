-- ============================================================
-- ROSTER — JO:LA roster seed (Spotify-free)
-- ------------------------------------------------------------
-- Seeds the 6 JO:LA artists by name only. NO Spotify dependency
-- — works while we wait on Spotify's extended-quota approval.
-- The artists table already has spotify_artist_id and
-- spotify_url declared nullable, so this is a clean fit.
--
-- Once Spotify is approved we'll either:
--   (a) update each row in place with its spotify_artist_id +
--       spotify_url + image_url, or
--   (b) build a Settings UI button "Match this artist on Spotify"
--       that pops the search modal and patches the row.
--
-- Optionally seeds an initial artist_stats snapshot with
-- placeholder zeros so the dashboard widget renders properly.
-- You can update these manually anytime via the artist row's
-- "Edit stats" button.
--
-- HOW TO RUN
--  1. Make sure migrations 007 (artists) and 009 (monthly_listeners)
--     have already been applied. They should be — they're older.
--  2. Replace `<YOUR_AUTH_UID>` below with your auth.users.id
--     (find it in Supabase → Authentication → Users → click your
--     user → copy the id field).
--  3. Paste this whole file into the Supabase SQL Editor and run.
-- ============================================================

-- ── Step 1: insert the 6 artists ────────────────────────────
insert into public.artists
  (user_id, name, country, country_flag, spotify_artist_id, spotify_url)
values
  ('<YOUR_AUTH_UID>', 'De Mthuda',       'South Africa', '🇿🇦', null, null),
  ('<YOUR_AUTH_UID>', 'Inter B & Draad', 'South Africa', '🇿🇦', null, null),
  ('<YOUR_AUTH_UID>', 'Rea Gopane',      'South Africa', '🇿🇦', null, null),
  ('<YOUR_AUTH_UID>', 'Tag Team',        'South Africa', '🇿🇦', null, null),
  ('<YOUR_AUTH_UID>', 'Zee_nhle',        'South Africa', '🇿🇦', null, null),
  ('<YOUR_AUTH_UID>', 'PJ Star',         'South Africa', '🇿🇦', null, null);

-- ── Step 2 (optional): seed initial stats snapshots ─────────
-- Inserts one artist_stats row per artist with followers = 0
-- and monthly_listeners = null. This makes the artists widget
-- render cleanly instead of showing dashes everywhere. Skip
-- this block if you'd rather edit each one manually first.
--
-- The brief engine looks at the last TWO snapshots to compute
-- delta %, so it won't flag momentum until you record a second
-- snapshot — which is exactly what we want when starting from
-- an empty baseline.
insert into public.artist_stats (artist_id, followers, monthly_listeners)
select id, 0, null
from public.artists
where user_id = '<YOUR_AUTH_UID>'
  and name in (
    'De Mthuda',
    'Inter B & Draad',
    'Rea Gopane',
    'Tag Team',
    'Zee_nhle',
    'PJ Star'
  );

-- ── Step 3 (optional): record real numbers if you have them ─
-- Uncomment and edit these if you have current monthly listener
-- counts to drop in. Each statement appends a NEW snapshot; it
-- doesn't overwrite the placeholder zero, so once we have two
-- snapshots the brief engine will start computing deltas.
--
-- insert into public.artist_stats (artist_id, followers, monthly_listeners)
-- select id, 0, 1240000  -- replace with real numbers
-- from public.artists
-- where user_id = '<YOUR_AUTH_UID>' and name = 'De Mthuda';
--
-- insert into public.artist_stats (artist_id, followers, monthly_listeners)
-- select id, 0, 580000
-- from public.artists
-- where user_id = '<YOUR_AUTH_UID>' and name = 'Inter B & Draad';
--
-- (...etc for the other four)
