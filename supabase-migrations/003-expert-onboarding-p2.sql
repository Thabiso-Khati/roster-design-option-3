-- ============================================================
-- ROSTER — Expert self-service onboarding (Phase 2)
-- ------------------------------------------------------------
-- Adds columns to store Paystack subaccount display metadata so
-- the expert dashboard can show "Connected to Standard Bank
-- ending in 4567" without re-hitting Paystack.
--
-- paystack_subaccount_code already exists (created in the
-- original schema) — we just augment with ID + display fields.
-- ============================================================

alter table public.experts
  add column if not exists paystack_subaccount_id bigint,
  add column if not exists paystack_bank_name text,
  add column if not exists paystack_bank_code text,
  add column if not exists paystack_account_last4 text,
  add column if not exists paystack_account_name text,
  add column if not exists paystack_connected_at timestamptz;

-- Index for fast "all connected experts" lookups (e.g. payout ops)
create index if not exists experts_paystack_connected_idx
  on public.experts (paystack_connected_at)
  where paystack_connected_at is not null;
