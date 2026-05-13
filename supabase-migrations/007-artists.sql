-- ============================================================
-- ROSTER — Artists + Spotify integration migration
-- Run this in Supabase SQL Editor (one-time) to add the
-- `artists` and `artist_stats` tables.
-- ============================================================

-- ARTISTS — one row per artist a user has added to their roster
create table public.artists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  genre text,
  country text,
  country_flag text,
  spotify_artist_id text,       -- Spotify's 22-char base62 ID
  spotify_url text,             -- open.spotify.com/artist/...
  image_url text,               -- Spotify avatar (refreshed on sync)
  popularity integer,           -- Spotify's 0–100 score (last known)
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, spotify_artist_id)
);

alter table public.artists enable row level security;

create policy "Users can view own artists" on public.artists
  for select using (auth.uid() = user_id);

create policy "Users can insert own artists" on public.artists
  for insert with check (auth.uid() = user_id);

create policy "Users can update own artists" on public.artists
  for update using (auth.uid() = user_id);

create policy "Users can delete own artists" on public.artists
  for delete using (auth.uid() = user_id);

-- ARTIST_STATS — time-series snapshots of follower count + popularity
-- One row is written each time we sync with Spotify. Lets us compute
-- growth trends and build a historical graph the user owns.
create table public.artist_stats (
  id uuid default gen_random_uuid() primary key,
  artist_id uuid references public.artists(id) on delete cascade not null,
  followers integer not null,
  popularity integer,
  snapshot_at timestamptz default now()
);

create index artist_stats_artist_time_idx
  on public.artist_stats (artist_id, snapshot_at desc);

alter table public.artist_stats enable row level security;

create policy "Users can view stats for own artists" on public.artist_stats
  for select using (
    artist_id in (select id from public.artists where user_id = auth.uid())
  );

-- All writes to artist_stats happen via the service role in our
-- API routes, so we don't need user-facing insert/update policies.
