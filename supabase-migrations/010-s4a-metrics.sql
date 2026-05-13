-- ============================================================
-- ROSTER — S4A (Spotify for Artists) metric columns
-- ------------------------------------------------------------
-- Adds manual-entry columns for three dashboard-only metrics
-- that are NOT available in the public Spotify Web API:
--   • monthly_active_listeners  — "MAL" in S4A
--   • new_active_listeners      — users who first engaged this period
--   • super_listeners           — Spotify's "super fan" cohort
--
-- All three are bigint · nullable. Same carry-forward pattern
-- as monthly_listeners: the user pastes from S4A into the pencil
-- Edit modal, and we snapshot every time they save.
-- ============================================================

alter table public.artist_stats
  add column if not exists monthly_active_listeners bigint,
  add column if not exists new_active_listeners     bigint,
  add column if not exists super_listeners          bigint;

comment on column public.artist_stats.monthly_active_listeners is
  'Manually entered Spotify for Artists "Monthly Active Listeners". NULL when unknown.';
comment on column public.artist_stats.new_active_listeners is
  'Manually entered Spotify for Artists "New Active Listeners". NULL when unknown.';
comment on column public.artist_stats.super_listeners is
  'Manually entered Spotify for Artists "Super Listeners". NULL when unknown.';
