-- ============================================================
-- ROSTER V3 — Profiles INSERT policy + backfill
-- ------------------------------------------------------------
-- The original profiles policy set only allows SELECT and UPDATE.
-- That breaks the Settings page, which does an .upsert(): when the
-- user has no profile row yet, upsert falls back to INSERT and is
-- rejected with "new row violates row-level security policy for
-- table 'profiles'".
--
-- Two fixes here:
--
--   1. Add a permanent INSERT policy so any signed-in user can
--      create their own profile row.
--
--   2. Backfill profile rows for any auth.users entry that doesn't
--      have one (e.g. accounts created before the auto-create
--      trigger existed, or via admin/service-role).
--
-- Idempotent: safe to re-run.
-- ============================================================

-- 1. Allow users to insert their own profile row
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- 2. Backfill missing profile rows from auth.users
insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', '') as full_name
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
