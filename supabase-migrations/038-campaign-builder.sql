-- ============================================================
-- ROSTER Migration 038 — Campaign Builder
-- ------------------------------------------------------------
-- The Campaign Builder is the strategic campaign planning tool:
-- it takes the artist's current context, their goal/budget/markets,
-- and their own creative input, then uses AI to produce a full
-- personalised campaign plan (budget allocation, channel breakdown,
-- timeline, owned-media integration, risk flags).
--
-- This is SEPARATE from fan_campaigns (035) which handles
-- WhatsApp/email broadcast execution.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.artist_campaigns (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Campaign identity
  title               text        NOT NULL,   -- e.g. "Midnight Rain EP — June 2026"

  -- Context snapshot captured at creation time
  -- Contains: monthly_listeners, social_score, momentum, fan_crm_count,
  --           wa_count, release_date, release_title, days_to_release
  context_snapshot    jsonb       NOT NULL DEFAULT '{}',

  -- The three goal-declaration questions
  goal                text        NOT NULL
                      CHECK (goal IN ('streams', 'tickets', 'awareness', 'merch')),
  budget_zar          integer     NOT NULL CHECK (budget_zar > 0),
  markets             text[]      NOT NULL DEFAULT '{}',

  -- Artist's own story / creative input (the texture + nuance layer)
  story               text,       -- "What's this release about?"
  assets_in_hand      text,       -- "What do you already have in motion?"
  creative_vision     text,       -- "Any specific campaign ideas?"

  -- AI-generated campaign plan
  -- Full JSON structure — see /api/campaigns/README for schema
  plan                jsonb,

  -- Lifecycle
  status              text        NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'generating', 'ready', 'active', 'completed')),

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS artist_campaigns_user_id_idx
  ON public.artist_campaigns (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS artist_campaigns_status_idx
  ON public.artist_campaigns (user_id, status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_artist_campaigns_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS artist_campaigns_updated_at ON public.artist_campaigns;
CREATE TRIGGER artist_campaigns_updated_at
  BEFORE UPDATE ON public.artist_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_artist_campaigns_updated_at();

-- RLS
ALTER TABLE public.artist_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artist_campaigns_select" ON public.artist_campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "artist_campaigns_insert" ON public.artist_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "artist_campaigns_update" ON public.artist_campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "artist_campaigns_delete" ON public.artist_campaigns
  FOR DELETE USING (auth.uid() = user_id);
