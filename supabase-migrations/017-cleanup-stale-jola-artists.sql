-- ============================================================
-- ROSTER — Cleanup stale JO:LA artist seed
-- ------------------------------------------------------------
-- The 6 SQL-seeded artists from migration 015 had spotify_artist_id
-- = NULL and got rendered without action icons in the Roster widget
-- (the gate has since been fixed in the UI). Plus the Add Artist
-- modal didn't have a manual mode at the time, so the user couldn't
-- manage them. This migration nukes those rows so the user can
-- re-add them through the now-fixed UI flow.
--
-- Cascade behaviour (already declared in earlier migrations):
--   • artist_stats   → ON DELETE CASCADE  → child snapshots gone
--   • releases       → ON DELETE SET NULL → release.artist_id zeroed,
--                                            row stays, link relinked
--                                            after re-adding in UI
--
-- HOW TO RUN
--   Paste into Supabase → SQL Editor → Run.
-- ============================================================

delete from public.artists
where user_id = '8541dd5a-a54f-4422-8077-67505df9c882'
  and spotify_artist_id is null
  and name in (
    'De Mthuda',
    'Inter B & Draad',
    'Rea Gopane',
    'Tag Team',
    'Zee_nhle',
    'PJ Star'
  );

-- Verify: should return zero matching null-Spotify JO:LA rows
select id, name, spotify_artist_id, created_at
from public.artists
where user_id = '8541dd5a-a54f-4422-8077-67505df9c882'
order by created_at desc;
