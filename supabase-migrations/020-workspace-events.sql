-- ============================================================
-- ROSTER — Migration 020: Workspace events (Phase 2 foundation)
-- Run this in Supabase SQL Editor (one-time) to add the
-- `workspace_events` table that powers cross-platform state
-- surfacing on the dashboard.
--
-- See /docs/phase-2-state-surfacing.md for the full design rationale.
-- ============================================================

-- ── Add user timezone column if it doesn't already exist ────
-- Used so "stale after 3 days" is calendar-correct in the user's
-- locale, not a flat 72h that goes off at weird hours for SA users.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'timezone'
  ) then
    alter table public.profiles
      add column timezone text not null default 'Africa/Johannesburg';
  end if;
end$$;

-- ── Workspace events table ──────────────────────────────────
-- Every interaction with a tracked artifact emits one row here.
-- Dashboard cards aggregate by latest-event-per-artifact to know
-- what state the user is in.
create table public.workspace_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- What kind of artifact this event is about. Keep this enum
  -- in sync with /lib/workspace/types.ts.
  artifact_type text not null check (artifact_type in (
    'tool',          -- calculators, planners (Album Budget, Tour Budget, ...)
    'form',          -- fillable templates (Label Copy, Lyric Sheet, ...)
    'checklist',     -- multi-step interactive checklist
    'contract',      -- contract template being filled in
    'release',       -- planned release (also has its own row in `releases`)
    'contact',       -- a person in the contacts module
    'booking',       -- a tour/show booking
    'agreement'      -- signed agreement/document
  )),

  -- Stable identifier for the artifact within its type.
  --   • Server-backed entities: the row's UUID (release_id, contact_id, ...)
  --   • localStorage-backed tools: synthetic key like "album-budget" or
  --     "album-budget:cape-town-tour" if multi-instance.
  artifact_id text not null,

  -- Human-readable label cached at event time so dashboard cards
  -- don't need a join to display the artifact name.
  artifact_label text,

  -- Lifecycle event that just happened.
  event_type text not null check (event_type in (
    'opened',        -- user navigated to the artifact
    'edited',        -- user changed a field (debounced ~5s on client)
    'completed',     -- artifact reached its "done" state
    'dismissed',     -- user explicitly dismissed/archived
    'reopened'       -- previously-completed artifact reopened (revision signal)
  )),

  -- Completion ratio at event time (0.000 to 1.000). NULL when
  -- not meaningful (e.g. a contact doesn't have a completion %).
  completion_pct numeric(4, 3) check (
    completion_pct is null or (completion_pct >= 0 and completion_pct <= 1)
  ),

  -- Optional small structured payload. Keep it lean — this is NOT
  -- a place to mirror the full artifact data. Examples:
  --   • For a release: { "release_date": "2026-06-12", "status": "planned" }
  --   • For a checklist: { "items_done": 7, "items_total": 12 }
  --   • For a dismissal: { "snooze_until": "2026-05-03" }
  metadata jsonb,

  occurred_at timestamptz not null default now()
);

-- ── Indexes ─────────────────────────────────────────────────
-- Dominant read pattern: "give me the latest event per (user,
-- artifact_type, artifact_id)" for dashboard aggregation.
create index workspace_events_user_artifact_recent_idx
  on public.workspace_events (user_id, artifact_type, artifact_id, occurred_at desc);

-- Secondary read pattern: "all my events in the last N days".
create index workspace_events_user_recent_idx
  on public.workspace_events (user_id, occurred_at desc);

-- ── Row-Level Security ──────────────────────────────────────
alter table public.workspace_events enable row level security;

create policy "owner can read own events"
  on public.workspace_events for select
  using (user_id = auth.uid());

create policy "owner can insert own events"
  on public.workspace_events for insert
  with check (user_id = auth.uid());

-- Updates and deletes intentionally not exposed to client. Events
-- are append-only; "dismissal" is its own event_type, not a delete.
-- Admins can clean up via service role if needed.
