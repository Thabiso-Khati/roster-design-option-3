-- ============================================================
-- ROSTER — Migration 033: Per-artist TikTok OAuth tokens
-- ------------------------------------------------------------
-- Mirrors the pattern used for spotify_tokens but keyed per
-- ARTIST (not per user) because each roster artist connects
-- their own TikTok account.
--
-- Prerequisites:
--   - TikTok Developer app approved + credentials in .env.local
--   - migration 007-artists.sql already run
-- ============================================================

-- ── 1. artist_tiktok_tokens ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.artist_tiktok_tokens (
  artist_id             uuid        PRIMARY KEY
                                    REFERENCES public.artists(id) ON DELETE CASCADE,
  open_id               text        NOT NULL,          -- TikTok per-app stable user ID
  union_id              text,                          -- present in some developer app groups
  display_name          text,                          -- TikTok @username (refreshed on each fetch)
  scope                 text        NOT NULL,          -- space-separated approved scopes
  access_token          text        NOT NULL,
  refresh_token         text        NOT NULL,
  expires_at            timestamptz NOT NULL,          -- access_token expiry (~1 day)
  refresh_expires_at    timestamptz NOT NULL,          -- refresh_token expiry (~1 year)
  connected_at          timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artist_tiktok_tokens_open_id_idx
  ON public.artist_tiktok_tokens (open_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_tiktok_tokens_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS tiktok_tokens_updated_at ON public.artist_tiktok_tokens;
CREATE TRIGGER tiktok_tokens_updated_at
  BEFORE UPDATE ON public.artist_tiktok_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_tiktok_tokens_updated_at();

-- RLS: only the workspace owner who owns the artist may read/delete tokens.
-- Inserts/updates are always done via admin client in server-side API routes.
ALTER TABLE public.artist_tiktok_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tiktok_tokens_select ON public.artist_tiktok_tokens;
CREATE POLICY tiktok_tokens_select ON public.artist_tiktok_tokens
  FOR SELECT USING (
    artist_id IN (
      SELECT id FROM public.artists
      WHERE user_id = my_workspace_owner_id()
    )
  );

DROP POLICY IF EXISTS tiktok_tokens_delete ON public.artist_tiktok_tokens;
CREATE POLICY tiktok_tokens_delete ON public.artist_tiktok_tokens
  FOR DELETE USING (
    artist_id IN (
      SELECT id FROM public.artists
      WHERE user_id = my_workspace_owner_id()
    )
  );

-- ── 2. Denormalised open_id column on artists ────────────────
-- Allows the fetcher orchestrator to skip the tokens JOIN when
-- loading the artists list — if this is NULL, TikTok fetcher is skipped.

ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS tiktok_open_id      text,
  ADD COLUMN IF NOT EXISTS tiktok_display_name text;
