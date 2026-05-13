-- ============================================================
-- ROSTER — Artist platform handles
-- ------------------------------------------------------------
-- Adds two nullable columns to `artists` so the nightly fetcher
-- knows where to look on each platform without re-resolving the
-- handle from the artist's name on every run.
--
--   audiomack_handle    — slug after audiomack.com/  (e.g. "burnaboy")
--   youtube_channel_id  — UC… channel id from YouTube
--
-- They start NULL on every existing row. The fetcher's
-- auto-resolve step fills them in on first successful lookup,
-- and they stick from then on. The Add Artist modal does NOT
-- expose these yet — adding a "connect platforms" UI is a
-- follow-up. This migration is just the persistence layer.
-- ============================================================

alter table public.artists
  add column if not exists audiomack_handle text,
  add column if not exists youtube_channel_id text;

comment on column public.artists.audiomack_handle is
  'Slug after https://audiomack.com/ — e.g. "burnaboy". Populated by the fetcher auto-resolve on first successful pull, NULL until then.';
comment on column public.artists.youtube_channel_id is
  'YouTube channel ID (starts with UC…). Populated by the fetcher auto-resolve via the Data API search endpoint, NULL until then.';
