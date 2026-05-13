-- ============================================================
-- ROSTER — Release Tasks (040)
-- Full PM feature: backwards-planned task board per release.
-- Each task has a phase + optional due_date computed from the
-- release date at seed time, stored for offline use.
-- ============================================================

create table if not exists public.release_tasks (
  id uuid primary key default gen_random_uuid(),

  user_id    uuid not null references auth.users(id) on delete cascade,
  release_id uuid not null references public.releases(id) on delete cascade,

  -- Phase taxonomy (matches single-release-plan phases)
  phase text not null check (phase in (
    'pre_8w','pre_6w','pre_4w','pre_2w','pre_1w',
    'release','post_1w','post_1m'
  )),

  text       text not null,
  due_date   date,          -- computed from release_date at seed; null if TBC release
  done       boolean not null default false,
  done_at    timestamptz,
  sort_order int not null default 0,
  source     text not null default 'manual' check (source in ('manual', 'roster_ai')),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_release_tasks_release
  on public.release_tasks (release_id, phase, sort_order);

create index if not exists idx_release_tasks_user
  on public.release_tasks (user_id);

alter table public.release_tasks enable row level security;

create policy "release_tasks_select_own" on public.release_tasks
  for select to authenticated using (auth.uid() = user_id);

create policy "release_tasks_insert_own" on public.release_tasks
  for insert to authenticated with check (auth.uid() = user_id);

create policy "release_tasks_update_own" on public.release_tasks
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "release_tasks_delete_own" on public.release_tasks
  for delete to authenticated using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_release_tasks_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_release_tasks_updated_at
  before update on public.release_tasks
  for each row execute function public.set_release_tasks_updated_at();
