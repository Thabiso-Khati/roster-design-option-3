-- ============================================================
-- ROSTER — Multi-platform artist metrics (long format)
-- ------------------------------------------------------------
-- This is the foundation of ROSTER's native scoring engine.
-- It replaces the wide-and-Spotify-only `artist_stats` table for
-- everything beyond the legacy follower/popularity snapshot.
--
-- Shape: one row per (artist, platform, metric, snapshot_at).
--
-- That long format means we can add a new platform — or a new
-- metric on an existing platform — without an ALTER TABLE. The
-- scoring engine reads the latest value per (platform, metric)
-- per artist and folds it into three composite scores:
--
--   Reach        — how many people the artist's work reached
--   Momentum     — how fast the numbers are moving
--   Engagement   — how DEEP the connection is (paid support,
--                  listening time, shares, etc.) — bot-resistant
--
-- We are NOT dropping `artist_stats` yet. It continues to back
-- the Spotify-specific snapshot until the scoring engine is the
-- source of truth for every surface. A follow-up migration will
-- deprecate it once the new flow is fully wired.
--
-- ── Initial platform set (locked with the user) ──────────────
--   spotify, youtube, audiomack, boomplay,
--   tiktok, instagram, mdundo, deezer
--
-- ── Source provenance (drives trust-weighting later) ─────────
--   manual         — user typed it in via the Update Stats modal
--   spotify_api    — server-side public Spotify Web API pull
--   spotify_oauth  — Spotify for Artists per-artist OAuth
--   youtube_api    — server-side YouTube Data API pull
--   audiomack_api  — server-side Audiomack public API pull
--   tiktok_oauth   — TikTok Creator per-artist OAuth
--   boomplay_api / instagram_api / mdundo_api / deezer_api —
--                    reserved for when those integrations ship
--
-- ── Metric naming convention ─────────────────────────────────
-- Lowercase snake_case, NOT platform-prefixed — the (platform,
-- metric) tuple is the natural key. So we store
--   { platform: 'spotify', metric: 'streams' }
-- not
--   { metric: 'spotify_streams' }
-- The UI applies the platform prefix when it needs to.
-- ============================================================

create table public.artist_platform_metrics (
  id uuid default gen_random_uuid() primary key,
  artist_id uuid references public.artists(id) on delete cascade not null,
  platform text not null,
  metric text not null,
  value numeric not null,
  source text not null default 'manual',
  snapshot_at timestamptz default now() not null,
  created_at timestamptz default now() not null,

  -- Whitelist platforms so a typo can't silently land junk rows
  -- the scoring engine has no idea what to do with.
  constraint artist_platform_metrics_platform_check check (
    platform in (
      'spotify', 'youtube', 'audiomack', 'boomplay',
      'tiktok', 'instagram', 'mdundo', 'deezer'
    )
  ),

  -- Same idea for source — protects us from "where did this number
  -- come from?" being unanswerable later.
  constraint artist_platform_metrics_source_check check (
    source in (
      'manual',
      'spotify_api', 'spotify_oauth',
      'youtube_api',
      'audiomack_api',
      'tiktok_oauth', 'tiktok_api',
      'instagram_api',
      'boomplay_api',
      'mdundo_api',
      'deezer_api'
    )
  ),

  -- All metrics ROSTER tracks are non-negative (counts or 0–100
  -- percentages). A negative value would be junk input.
  constraint artist_platform_metrics_value_check check (value >= 0)
);

-- "Latest value per (artist, platform, metric)" is the dominant
-- read pattern (every scoring-engine call needs it), so the
-- composite index is ordered so a single index seek + DESC scan
-- gets us the answer.
create index artist_platform_metrics_lookup_idx
  on public.artist_platform_metrics
  (artist_id, platform, metric, snapshot_at desc);

-- Secondary index for "show me the last 90 days of every metric
-- on this artist" — useful for the trend chart.
create index artist_platform_metrics_artist_time_idx
  on public.artist_platform_metrics
  (artist_id, snapshot_at desc);

alter table public.artist_platform_metrics enable row level security;

-- Read policy mirrors the artist_stats one: users see metrics
-- only for artists they own.
create policy "Users can view metrics for own artists"
  on public.artist_platform_metrics
  for select using (
    artist_id in (select id from public.artists where user_id = auth.uid())
  );

-- All writes happen through service-role API routes, so we
-- intentionally do NOT add user-facing insert/update/delete
-- policies. That keeps the write path auditable.

-- Convenience view: latest snapshot per (artist, platform, metric).
-- The scoring engine queries this so we don't repeat the DISTINCT
-- ON pattern in every code path that needs "current" numbers.
create or replace view public.artist_platform_metrics_latest as
  select distinct on (artist_id, platform, metric)
    artist_id,
    platform,
    metric,
    value,
    source,
    snapshot_at
  from public.artist_platform_metrics
  order by artist_id, platform, metric, snapshot_at desc;

-- The view inherits the table's RLS, so it's safe to expose.

comment on table public.artist_platform_metrics is
  'Long-format time-series of every metric ROSTER tracks across DSPs and socials. One row per (artist, platform, metric, snapshot). Read latest per tuple to feed the Reach/Momentum/Engagement scoring engine.';
comment on column public.artist_platform_metrics.platform is
  'Lowercased platform key. See the platform CHECK constraint for the canonical list.';
comment on column public.artist_platform_metrics.metric is
  'Lowercased snake_case metric key, scoped to the platform (e.g. ''streams'', ''monthly_listeners'', ''ugc_playlist_adds'', ''supporters'', ''sound_uses'').';
comment on column public.artist_platform_metrics.value is
  'Numeric value. Counts (streams, followers, supporters) are integers stored as numeric; percentages live on a 0-100 scale.';
comment on column public.artist_platform_metrics.source is
  'Provenance — drives the trust-weighting in the scoring engine. ''manual'' = user-entered, the rest are auto-pulled.';
comment on view public.artist_platform_metrics_latest is
  'Latest snapshot per (artist, platform, metric). Read this when you only need current numbers; query the base table for time series.';
