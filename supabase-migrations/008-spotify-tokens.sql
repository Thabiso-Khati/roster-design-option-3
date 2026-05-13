-- ============================================================
-- ROSTER — Spotify OAuth tokens (one row per user)
-- Run this in Supabase SQL Editor AFTER supabase-migration-artists.sql.
--
-- Spotify's Client Credentials flow returns a truncated artist
-- payload for most new apps (no followers / popularity / genres).
-- User tokens from the Authorization Code flow return the full
-- payload, so we store one token per user and refresh as needed.
-- ============================================================

create table public.spotify_tokens (
  user_id uuid references auth.users(id) on delete cascade primary key,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,                     -- space-separated list of granted scopes
  spotify_user_id text,           -- the Spotify account ID we linked
  spotify_display_name text,      -- what we show in Settings (e.g. "Thabiso K")
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.spotify_tokens enable row level security;

-- User can see / update their own token row. Insert + delete go
-- through the service role in our API routes (admin client).
create policy "Users can view own spotify tokens" on public.spotify_tokens
  for select using (auth.uid() = user_id);

create policy "Users can delete own spotify tokens" on public.spotify_tokens
  for delete using (auth.uid() = user_id);
