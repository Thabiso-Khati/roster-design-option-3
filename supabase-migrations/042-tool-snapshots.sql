-- ============================================================
-- ROSTER Migration 042 — Tool Snapshots
-- ------------------------------------------------------------
-- tool_snapshots stores the saved state of any interactive
-- work tool on ROSTER. Every tool that has a Save button
-- writes here. This is the server-side persistence layer that
-- replaces ephemeral localStorage for work the user explicitly
-- wants to keep.
--
-- One row per (user_id, tool_slug) — saving again UPSERTS,
-- so each user has at most one saved session per tool.
-- The full tool state lives in the `data` jsonb column.
--
-- Workspace reads from this table alongside workspace_documents
-- to give users a unified view of all their saved work.
-- ============================================================

-- ── 1. tool_snapshots ────────────────────────────────────────
create table if not exists public.tool_snapshots (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,

  -- Which tool this snapshot belongs to
  -- Matches the URL slug: e.g. "personal-budget", "tour-budget"
  tool_slug   text        not null,

  -- Human-readable title shown in Workspace
  -- e.g. "Personal Budget — May 2026", "Tour Budget — Cape Town Tour"
  title       text        not null,

  -- The full tool state as JSON (all rows, fields, values)
  data        jsonb       not null default '{}',

  -- Lifecycle
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- One saved session per tool per user
  unique (user_id, tool_slug)
);

-- Indexes
create index if not exists tool_snapshots_user_idx
  on public.tool_snapshots (user_id, updated_at desc);

create index if not exists tool_snapshots_slug_idx
  on public.tool_snapshots (user_id, tool_slug);

-- updated_at trigger
create or replace function public.set_tool_snapshots_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tool_snapshots_updated_at on public.tool_snapshots;
create trigger tool_snapshots_updated_at
  before update on public.tool_snapshots
  for each row execute function public.set_tool_snapshots_updated_at();

-- ── 2. RLS ───────────────────────────────────────────────────
alter table public.tool_snapshots enable row level security;

-- Users can only see and manage their own snapshots
create policy "tool_snapshots_owner_all"
  on public.tool_snapshots
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
