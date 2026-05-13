-- ============================================================
-- Migration 025: Multi-tier subscription plan values
-- ------------------------------------------------------------
-- The subscriptions.plan column previously only accepted
-- 'monthly' | 'annual' (both mapped to Pro tier).
-- This migration expands the CHECK constraint so Agency and
-- Enterprise tiers can be stored with their billing cadence.
--
-- Plan value format: {tier}_{billing}
--   pro_monthly, pro_annual
--   agency_monthly, agency_annual
--   enterprise_monthly, enterprise_annual
--
-- Legacy values 'monthly' and 'annual' are kept for backward
-- compatibility — existing rows are NOT updated.
-- getUserTier (lib/vault/get-user-tier.ts) maps all these
-- values to their correct TierId.
-- ============================================================

-- 1. Drop the existing check constraint
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- 2. Add expanded constraint
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check CHECK (
    plan IN (
      -- legacy (Pro tier, single-plan era)
      'monthly',
      'annual',
      -- Pro (explicit)
      'pro_monthly',
      'pro_annual',
      -- Agency
      'agency_monthly',
      'agency_annual',
      -- Enterprise
      'enterprise_monthly',
      'enterprise_annual'
    )
  );
