-- ============================================================
-- ROSTER — Expert dashboard RLS fix
-- ------------------------------------------------------------
-- The original `experts` SELECT policy is:
--   "Anyone can view active experts" using (is_active = true)
-- That's correct for the public directory, but it means a paused
-- or mid-onboarding expert can't read their OWN row from the
-- dashboard. Result: /dashboard/expert renders the "You're not
-- an expert yet" empty state for anyone whose row is inactive,
-- including every newly-claimed profile before they Go Live.
--
-- Fix: add a second SELECT policy that lets the owner read their
-- own row regardless of is_active. Postgres ORs multiple policies
-- together, so public viewers still only see active experts, but
-- the owner always sees themselves.
--
-- Idempotent: safe to re-run.
-- ============================================================

-- Add owner SELECT policy (parallel to the existing public one)
drop policy if exists "Experts can view their own row" on public.experts;
create policy "Experts can view their own row"
  on public.experts
  for select
  using (auth.uid() = user_id);

-- Same gotcha applies to expert_sessions — the existing policy
-- "Anyone can view expert sessions" requires is_available = true.
-- An expert with sessions they've temporarily disabled should still
-- see them on their own dashboard.
drop policy if exists "Experts can view their own sessions" on public.expert_sessions;
create policy "Experts can view their own sessions"
  on public.expert_sessions
  for select
  using (
    exists (
      select 1 from public.experts e
      where e.id = expert_sessions.expert_id
        and e.user_id = auth.uid()
    )
  );
