-- ============================================================
-- ROSTER — Migration 021: AI usage + cost logging (Phase 3 foundation)
-- Run this in Supabase SQL Editor (one-time) to add the tables that
-- enforce per-user AI budget caps and audit-log every AI call.
--
-- See /docs/phase-3-agentic-ai.md § 4 ("Per-user budget") for the
-- design rationale.
-- ============================================================

-- ── Per-user monthly AI budget ──────────────────────────────
-- One row per user. `monthly_budget_usd` is the cap (sane default $5);
-- `spent_usd` accumulates within the current month and resets at
-- `reset_at`. Plan-tiered budgets land in §4 of the design doc later.
create table public.ai_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_budget_usd numeric not null default 5.00,
  spent_usd numeric not null default 0,
  reset_at timestamptz not null default (
    date_trunc('month', now()) + interval '1 month'
  ),
  updated_at timestamptz not null default now()
);

-- ── Per-call audit log ──────────────────────────────────────
-- Every AI invocation creates one row here. Used for:
--   • Forensic debugging (which prompts went wrong)
--   • Cost analytics (which tools/users burn the most budget)
--   • Future agent memory (Tier A wave 2+)
create table public.ai_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Which tool / surface called the AI ("pitch-generate",
  -- "outreach-email", "hooks-generate", etc.). Free text — kept loose
  -- so adding a tool doesn't need a CHECK update.
  intent text not null,

  -- Token usage from the Anthropic response — we reconstruct cost
  -- on read so the costing function stays in app code, not SQL.
  model text not null,
  input_tokens int not null check (input_tokens >= 0),
  output_tokens int not null check (output_tokens >= 0),
  cost_usd numeric not null check (cost_usd >= 0),

  -- Whether the call returned successfully. Failed calls still log
  -- (so a user spamming bad input can be detected) but cost = 0.
  success boolean not null default true,
  error_message text,

  occurred_at timestamptz not null default now()
);

create index ai_calls_user_recent_idx
  on public.ai_calls (user_id, occurred_at desc);

create index ai_calls_user_intent_idx
  on public.ai_calls (user_id, intent);

-- ── Row-Level Security ──────────────────────────────────────
alter table public.ai_usage enable row level security;
alter table public.ai_calls enable row level security;

-- Users can read their own budget + history. Writes go through the
-- service role from /api/ai (the route updates spent_usd atomically
-- so client-side mutation is unsafe).
create policy "owner can read own budget"
  on public.ai_usage for select
  using (user_id = auth.uid());

create policy "owner can read own calls"
  on public.ai_calls for select
  using (user_id = auth.uid());

-- ── Auto-reset: when accumulated spend is read past reset_at,
--    the budget refreshes. Done in app code (lib/ai/budget.ts)
--    rather than a SQL trigger so the reset event is observable.

-- ── Auto-bump updated_at ────────────────────────────────────
create or replace function public.set_ai_usage_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ai_usage_set_updated_at
  before update on public.ai_usage
  for each row execute function public.set_ai_usage_updated_at();
