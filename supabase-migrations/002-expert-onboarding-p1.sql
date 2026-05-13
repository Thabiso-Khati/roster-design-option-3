-- ============================================================
-- ROSTER — Expert Onboarding Phase 1
-- ------------------------------------------------------------
-- Schema + storage to support self-service expert onboarding:
--
--   1. Claim tokens on `experts` so approved applicants can
--      link their auth account to their expert row via a
--      one-time email link (no more manual SQL per expert).
--   2. Profile-completion tracking so new experts don't appear
--      in the public directory until they've filled in enough
--      to be useful (avatar, long_bio, highlights, pricing).
--   3. `expert-avatars` storage bucket for avatar uploads, with
--      RLS so experts can only write their own folder but anyone
--      can read.
--
-- Idempotent: safe to re-run.
-- ============================================================

-- ── 1. Experts table — onboarding columns ──────────────────
alter table public.experts
  add column if not exists claim_token uuid unique,
  add column if not exists claim_token_expires_at timestamptz,
  add column if not exists application_email text,
  add column if not exists profile_completed_at timestamptz;

-- Index for fast token lookups at claim time
create index if not exists experts_claim_token_idx
  on public.experts (claim_token)
  where claim_token is not null;

-- ── 2. Storage bucket for expert avatars ────────────────────
-- Public read so <img src="..."> works on the directory without
-- signed URLs. Write is gated by the policy below — experts can
-- only upload to a folder matching their own auth.uid().
insert into storage.buckets (id, name, public)
values ('expert-avatars', 'expert-avatars', true)
on conflict (id) do nothing;

-- ── 3. RLS policies for the bucket ──────────────────────────
-- File path convention: `{auth.uid()}/avatar.<ext>`
-- storage.foldername(name) returns an array of path segments;
-- the first segment must equal the caller's auth.uid().

-- Drop-and-recreate pattern so re-running the migration doesn't
-- error if the policy already exists. `if not exists` isn't
-- supported on storage.objects policies in all Supabase versions.
drop policy if exists "Anyone can view expert avatars" on storage.objects;
create policy "Anyone can view expert avatars"
  on storage.objects for select
  using (bucket_id = 'expert-avatars');

drop policy if exists "Experts can upload their own avatar" on storage.objects;
create policy "Experts can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'expert-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Experts can update their own avatar" on storage.objects;
create policy "Experts can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'expert-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Experts can delete their own avatar" on storage.objects;
create policy "Experts can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'expert-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── 4. Experts RLS — self-update policy ─────────────────────
-- The existing policy ("Anyone can view active experts") is SELECT-only.
-- Experts need to be able to UPDATE their own row (bio, pricing,
-- avatar, go-live toggle, etc.) from the /dashboard/expert page.
drop policy if exists "Experts can update their own row" on public.experts;
create policy "Experts can update their own row"
  on public.experts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Same idea for expert_sessions — experts manage their own pricing.
drop policy if exists "Experts can manage their own sessions" on public.expert_sessions;
create policy "Experts can manage their own sessions"
  on public.expert_sessions for all
  using (
    exists (
      select 1 from public.experts e
      where e.id = expert_sessions.expert_id
        and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.experts e
      where e.id = expert_sessions.expert_id
        and e.user_id = auth.uid()
    )
  );
