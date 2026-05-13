-- ============================================================
-- ROSTER — Releases migration
-- Run this in Supabase SQL Editor (one-time) to add the
-- `releases` table that powers the "Next releases" pipeline
-- widget on the dashboard.
-- ============================================================

-- RELEASES — one row per scheduled or delivered release
-- Always scoped to the user (manager/founder). Optionally linked
-- to an artist row, so we can pivot per artist on the dashboard.
create table public.releases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  artist_id uuid references public.artists(id) on delete set null,
  -- Free-text artist name as a fallback when artist_id is null
  -- (e.g. release planned for an artist not yet in the roster).
  artist_name text,

  title text not null,
  type text not null default 'single'
    check (type in ('single','EP','album','mixtape','compilation','live')),

  -- ISO release date. We use date (not timestamptz) because
  -- releases are calendared on a day, not a timestamp.
  -- Nullable to support 'TBC' (date not yet locked).
  release_date date,

  status text not null default 'planned'
    check (status in ('planned','in_progress','delivered','live','cancelled')),

  -- Distribution metadata
  dsps text[] default '{}',           -- e.g. {Spotify, Apple Music, Boomplay}
  distributor text,                    -- e.g. DistroKid, Africori, Believe
  isrc text,
  upc text,

  -- Asset / context
  artwork_url text,
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index releases_user_date_idx
  on public.releases (user_id, release_date asc);

create index releases_user_status_idx
  on public.releases (user_id, status);

create index releases_artist_idx
  on public.releases (artist_id);

alter table public.releases enable row level security;

create policy "Users can view own releases" on public.releases
  for select using (auth.uid() = user_id);

create policy "Users can insert own releases" on public.releases
  for insert with check (auth.uid() = user_id);

create policy "Users can update own releases" on public.releases
  for update using (auth.uid() = user_id);

create policy "Users can delete own releases" on public.releases
  for delete using (auth.uid() = user_id);

-- Auto-bump updated_at on row modification
create or replace function public.set_releases_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger releases_set_updated_at
  before update on public.releases
  for each row execute function public.set_releases_updated_at();
