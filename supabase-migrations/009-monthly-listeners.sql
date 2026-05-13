-- ============================================================
-- ROSTER — add monthly_listeners to artist_stats
-- ------------------------------------------------------------
-- Monthly listeners is a Spotify vanity metric that is NOT
-- exposed via the Web API (it's only in Spotify for Artists).
-- We store it as a user-entered number so managers can put the
-- EPK-worthy figure on their dashboard. Nullable because not
-- every artist will have it filled in.
-- ============================================================

alter table public.artist_stats
  add column if not exists monthly_listeners bigint;

-- Optional: keep new inserts consistent when sync writes followers
-- without touching monthly_listeners. We handle the carry-forward
-- in application code (see /api/artists/sync/route.ts) rather than
-- in a trigger, because application-level code is easier to debug.

comment on column public.artist_stats.monthly_listeners is
  'Manually entered Spotify monthly listeners. NULL when unknown.';
