-- ============================================================
-- ROSTER — Reminders migration
-- Run this in Supabase SQL Editor (one-time) to add the
-- `reminders` table that powers the "What needs you" widget
-- on the dashboard, and feeds the Brief signal engine.
-- ============================================================

create table public.reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Optional artist link. Lets the brief engine + per-artist views
  -- surface "everything for LULU". Falls back to free-text below
  -- when the reminder isn't tied to a specific artist.
  artist_id uuid references public.artists(id) on delete set null,
  artist_name text,                     -- denormalised cache for quick render

  title text not null,
  notes text,

  due_date date not null,

  category text not null default 'admin'
    check (category in ('legal','royalty','release','finance','admin','marketing','tour')),

  priority text not null default 'medium'
    check (priority in ('low','medium','high')),

  done boolean not null default false,
  completed_at timestamptz,

  -- Optional deep-link target so a reminder can take you somewhere
  -- (a contract page, a settlement form, an artist profile).
  href text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Open reminders sorted by due date is the dominant query pattern
create index reminders_user_open_due_idx
  on public.reminders (user_id, due_date asc)
  where done = false;

create index reminders_user_done_idx
  on public.reminders (user_id, done);

create index reminders_artist_idx
  on public.reminders (artist_id);

alter table public.reminders enable row level security;

create policy "Users can view own reminders" on public.reminders
  for select using (auth.uid() = user_id);

create policy "Users can insert own reminders" on public.reminders
  for insert with check (auth.uid() = user_id);

create policy "Users can update own reminders" on public.reminders
  for update using (auth.uid() = user_id);

create policy "Users can delete own reminders" on public.reminders
  for delete using (auth.uid() = user_id);

-- Auto-bump updated_at, and stamp completed_at when done flips true
create or replace function public.set_reminders_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if new.done = true and (old.done is distinct from new.done) then
    new.completed_at = now();
  end if;
  if new.done = false then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger reminders_set_updated_at
  before update on public.reminders
  for each row execute function public.set_reminders_updated_at();
