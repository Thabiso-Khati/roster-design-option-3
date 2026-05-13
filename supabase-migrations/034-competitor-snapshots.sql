-- ============================================================
-- 034 — competitor_snapshots
-- ------------------------------------------------------------
-- Stores one row per competitor-lookup per user so that:
--   1. We have the raw platform numbers for auditing.
--   2. We can compute Momentum as a delta between the current
--      pull and the previous one (same logic as artist scoring).
--
-- Indexed on (user_id, artist_name, snapped_at DESC) so the
-- "fetch previous snapshot" query stays sub-millisecond even
-- with thousands of rows.
-- ============================================================

CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_name          text        NOT NULL,            -- normalised to lower-trim

  -- Spotify signals
  spotify_id           text,
  spotify_popularity   integer,                         -- 0–100 direct from API
  spotify_followers    bigint,

  -- YouTube signals
  youtube_channel_id   text,
  youtube_subscribers  bigint,
  youtube_views        bigint,                          -- lifetime total, for delta math

  -- Computed ROSTER scores at time of snapshot
  reach_score          integer     NOT NULL DEFAULT 0,
  engagement_score     integer     NOT NULL DEFAULT 0,
  momentum_score       integer     NOT NULL DEFAULT 0,
  platform_count       integer     NOT NULL DEFAULT 0,  -- how many sources contributed

  snapped_at           timestamptz NOT NULL DEFAULT now()
);

-- Fast lookup: "give me the most recent snapshot for user X and artist Y"
CREATE INDEX IF NOT EXISTS competitor_snapshots_user_name_idx
  ON competitor_snapshots (user_id, artist_name, snapped_at DESC);

-- RLS: users can only see their own rows
ALTER TABLE competitor_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own competitor snapshots"
  ON competitor_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own competitor snapshots"
  ON competitor_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);
