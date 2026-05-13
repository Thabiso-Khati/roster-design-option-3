-- ============================================================
-- ROSTER — Onboarding state on profiles
-- ------------------------------------------------------------
-- Adds two columns:
--
--   onboarding_complete  boolean  — whether the user has
--     finished the first-run wizard. false by default so new
--     users are redirected to /onboarding on first dashboard
--     visit. Existing users are backfilled to true so they are
--     never interrupted.
--
--   role  text  — self-reported role chosen in step 1 of the
--     wizard. One of: manager | artist | label | agency.
--
-- Idempotent: safe to re-run.
-- ============================================================

alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists role text
    check (role in ('manager', 'artist', 'label', 'agency'));

-- Existing users have already used the product — mark them done
-- so they skip the wizard on next login.
update public.profiles
set onboarding_complete = true
where onboarding_complete = false;
