-- ============================================================
-- 046 — profiles: add ical_token for calendar feed subscriptions
-- ------------------------------------------------------------
-- Gives every user a stable, secret token for their personal
-- iCal feed at /api/calendar/feed/[token]
-- Token can be regenerated via PATCH /api/calendar/feed/token
-- to revoke old subscriptions.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ical_token text NOT NULL DEFAULT gen_random_uuid()::text;

-- Unique index so token lookups are O(1) and tokens can't collide
CREATE UNIQUE INDEX IF NOT EXISTS profiles_ical_token_idx
  ON public.profiles (ical_token);

COMMENT ON COLUMN public.profiles.ical_token IS
  'Secret token for the user''s iCal feed URL. Regenerating this token revokes all existing subscriptions.';
