-- ============================================================
-- Migration 026 — Enforce artist limit at the database level
-- ============================================================
-- The application already checks the artist count before
-- inserting, but a race condition (TOCTOU) allows two
-- simultaneous requests to both pass the check and both insert,
-- pushing a user past their tier limit.
--
-- This trigger runs BEFORE every INSERT on public.artists and
-- uses pg_advisory_xact_lock() to serialise concurrent inserts
-- for the same user_id. The lock is transaction-scoped and
-- releases automatically on COMMIT or ROLLBACK.
--
-- Run once in the Supabase SQL Editor.
-- ============================================================

-- ── Trigger function ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_artist_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- reads subscriptions table which has RLS
SET search_path = public  -- prevents search_path hijacking
AS $$
DECLARE
  v_plan    text;
  v_limit   integer;
  v_count   integer;
BEGIN
  -- Serialise concurrent inserts for this user.
  -- pg_advisory_xact_lock takes a transaction-level exclusive lock.
  -- Any other transaction trying to insert an artist for the same
  -- user_id will block here until this transaction commits/rolls back.
  PERFORM pg_advisory_xact_lock(('x' || md5(NEW.user_id::text))::bit(64)::bigint);

  -- Determine the user's active subscription tier.
  -- plan values: "pro_monthly", "pro_annual", "agency_monthly", etc.
  SELECT plan INTO v_plan
  FROM public.subscriptions
  WHERE user_id  = NEW.user_id
    AND status   = 'active'
  ORDER BY activated_at DESC NULLS LAST
  LIMIT 1;

  -- Map plan → artist limit (mirrors lib/constants.ts TIERS array)
  v_limit := CASE
    WHEN v_plan LIKE 'enterprise_%' THEN 20
    WHEN v_plan LIKE 'agency_%'     THEN 5
    WHEN v_plan LIKE 'pro_%'        THEN 2
    ELSE 0   -- free tier or no subscription row
  END;

  -- Free tier: block all inserts
  IF v_limit = 0 THEN
    RAISE EXCEPTION 'ARTIST_LIMIT_REACHED: Free accounts cannot add artists.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Count existing artists for this user (lock already held above)
  SELECT COUNT(*) INTO v_count
  FROM public.artists
  WHERE user_id = NEW.user_id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'ARTIST_LIMIT_REACHED: Plan limit of % artist(s) reached.', v_limit
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- ── Attach trigger to artists table ─────────────────────────

-- Drop first so re-running this migration is safe
DROP TRIGGER IF EXISTS enforce_artist_limit ON public.artists;

CREATE TRIGGER enforce_artist_limit
  BEFORE INSERT ON public.artists
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_artist_limit();

-- ── Comment ─────────────────────────────────────────────────

COMMENT ON FUNCTION public.enforce_artist_limit() IS
  'Enforces per-tier artist limits at the DB level. '
  'Uses pg_advisory_xact_lock to prevent TOCTOU races. '
  'Mirrors the limit values in lib/constants.ts TIERS array — '
  'keep both in sync when changing tier limits.';
