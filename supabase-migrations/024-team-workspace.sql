-- ============================================================
-- ROSTER — Migration 024: Team members + workspace context
-- ============================================================
-- Creates the team_members table, two DB helper functions
-- (my_workspace_owner_id, workspace_can), and updates RLS
-- policies on all data tables so active team members can
-- transparently access the workspace owner's data according
-- to their role and per-area permissions.
--
-- Run in Supabase SQL Editor (safe to re-run — uses IF NOT EXISTS
-- and DROP IF EXISTS guards throughout).
-- ============================================================

-- ── 1. team_members ─────────────────────────────────────────

create table if not exists public.team_members (
  id                  uuid        primary key default gen_random_uuid(),

  -- The account that owns this workspace
  workspace_owner_id  uuid        not null references auth.users(id) on delete cascade,

  -- The invited user (null until they accept the invite)
  member_user_id      uuid        references auth.users(id) on delete set null,

  -- Email used for the invite (used to match on acceptance)
  email               text        not null,

  -- Role governs default capabilities
  --   admin  — full access, can invite / manage team
  --   editor — access determined by permissions JSONB
  --   viewer — read-only, access determined by permissions JSONB
  role                text        not null check (role in ('admin', 'editor', 'viewer')),

  -- Per-area permission map.  Areas:
  --   artists | releases | reminders | bookings | vault | assistant | analytics
  -- Each area has { "view": bool, "edit": bool }.
  -- Admin role ignores this map (always full access).
  permissions         jsonb       not null default '{
    "artists":   {"view": true,  "edit": false},
    "releases":  {"view": true,  "edit": false},
    "reminders": {"view": true,  "edit": false},
    "bookings":  {"view": true,  "edit": false},
    "vault":     {"view": false, "edit": false},
    "assistant": {"view": false, "edit": false},
    "analytics": {"view": true,  "edit": false}
  }'::jsonb,

  -- Magic-link token (sent via email)
  invite_token        text        unique default encode(gen_random_bytes(32), 'hex'),

  -- Short alphanumeric code (shared manually / shown in UI)
  invite_code         text        unique default upper(left(encode(gen_random_bytes(4), 'hex'), 8)),

  status              text        not null default 'pending'
                                  check (status in ('pending', 'active', 'revoked')),

  invited_at          timestamptz not null default now(),
  accepted_at         timestamptz,

  -- One invite per (workspace, email)
  constraint team_members_workspace_email_key unique (workspace_owner_id, email)
);

-- Indexes
create index if not exists team_members_owner_idx
  on public.team_members (workspace_owner_id);

create index if not exists team_members_member_idx
  on public.team_members (member_user_id)
  where member_user_id is not null;

create index if not exists team_members_token_idx
  on public.team_members (invite_token);

create index if not exists team_members_code_idx
  on public.team_members (invite_code);

-- RLS
alter table public.team_members enable row level security;

-- Owner: full CRUD on their team
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'team_members'
    and policyname = 'owner manages team'
  ) then
    execute $pol$
      create policy "owner manages team"
        on public.team_members for all
        using (workspace_owner_id = auth.uid())
    $pol$;
  end if;
end $$;

-- Member: can read their own invitation record
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'team_members'
    and policyname = 'member reads own invite'
  ) then
    execute $pol$
      create policy "member reads own invite"
        on public.team_members for select
        using (member_user_id = auth.uid())
    $pol$;
  end if;
end $$;

-- ── 2. DB helper functions ───────────────────────────────────

-- my_workspace_owner_id()
-- Returns the effective workspace owner's user ID:
--   • If the caller is an active team member → the owner's ID
--   • Otherwise → auth.uid() (they are the owner)
create or replace function public.my_workspace_owner_id()
returns uuid
language sql
security definer
stable
as $$
  select coalesce(
    (
      select workspace_owner_id
      from   public.team_members
      where  member_user_id = auth.uid()
        and  status         = 'active'
      limit  1
    ),
    auth.uid()
  );
$$;

-- workspace_can(area, action)
-- Returns true when the caller is permitted to perform `action`
-- ('view' or 'edit') on `area`.
--   • Not a team member (owner): always true
--   • Admin role: always true
--   • Editor / Viewer: check permissions JSONB
create or replace function public.workspace_can(area text, action text)
returns boolean
language sql
security definer
stable
as $$
  select case
    when not exists (
      select 1 from public.team_members
      where member_user_id = auth.uid() and status = 'active'
    ) then true   -- caller is the workspace owner
    when exists (
      select 1 from public.team_members
      where member_user_id = auth.uid()
        and status = 'active'
        and role   = 'admin'
    ) then true   -- admin role → full access
    else (
      select coalesce((permissions -> area -> action)::boolean, false)
      from   public.team_members
      where  member_user_id = auth.uid() and status = 'active'
      limit  1
    )
  end;
$$;

-- ── 3. Update RLS on data tables ────────────────────────────
-- Pattern for every user-scoped table:
--   SELECT  → user_id = my_workspace_owner_id()  AND workspace_can(area, 'view')
--   INSERT  → user_id = my_workspace_owner_id()  AND workspace_can(area, 'edit')
--   UPDATE  → user_id = my_workspace_owner_id()  AND workspace_can(area, 'edit')
--   DELETE  → user_id = my_workspace_owner_id()  AND workspace_can(area, 'edit')

-- ── artists ──────────────────────────────────────────────────
drop policy if exists "Users can view own artists"   on public.artists;
drop policy if exists "Users can insert own artists" on public.artists;
drop policy if exists "Users can update own artists" on public.artists;
drop policy if exists "Users can delete own artists" on public.artists;

create policy "workspace select artists"
  on public.artists for select
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('artists', 'view'));

create policy "workspace insert artists"
  on public.artists for insert
  with check (user_id = public.my_workspace_owner_id()
    and public.workspace_can('artists', 'edit'));

create policy "workspace update artists"
  on public.artists for update
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('artists', 'edit'));

create policy "workspace delete artists"
  on public.artists for delete
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('artists', 'edit'));

-- ── artist_stats ──────────────────────────────────────────────
drop policy if exists "Users can view stats for own artists" on public.artist_stats;

create policy "workspace select artist_stats"
  on public.artist_stats for select
  using (
    artist_id in (
      select id from public.artists
      where  user_id = public.my_workspace_owner_id()
        and  public.workspace_can('artists', 'view')
    )
  );

-- ── releases ─────────────────────────────────────────────────
drop policy if exists "Users can view own releases"   on public.releases;
drop policy if exists "Users can insert own releases" on public.releases;
drop policy if exists "Users can update own releases" on public.releases;
drop policy if exists "Users can delete own releases" on public.releases;

create policy "workspace select releases"
  on public.releases for select
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('releases', 'view'));

create policy "workspace insert releases"
  on public.releases for insert
  with check (user_id = public.my_workspace_owner_id()
    and public.workspace_can('releases', 'edit'));

create policy "workspace update releases"
  on public.releases for update
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('releases', 'edit'));

create policy "workspace delete releases"
  on public.releases for delete
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('releases', 'edit'));

-- ── reminders ────────────────────────────────────────────────
drop policy if exists "Users can view own reminders"   on public.reminders;
drop policy if exists "Users can insert own reminders" on public.reminders;
drop policy if exists "Users can update own reminders" on public.reminders;
drop policy if exists "Users can delete own reminders" on public.reminders;

create policy "workspace select reminders"
  on public.reminders for select
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('reminders', 'view'));

create policy "workspace insert reminders"
  on public.reminders for insert
  with check (user_id = public.my_workspace_owner_id()
    and public.workspace_can('reminders', 'edit'));

create policy "workspace update reminders"
  on public.reminders for update
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('reminders', 'edit'));

create policy "workspace delete reminders"
  on public.reminders for delete
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('reminders', 'edit'));

-- ── bookings ─────────────────────────────────────────────────
drop policy if exists "Users can view own bookings" on public.bookings;
drop policy if exists "Users can create bookings"   on public.bookings;

create policy "workspace select bookings"
  on public.bookings for select
  using (
    (user_id = public.my_workspace_owner_id()
      and public.workspace_can('bookings', 'view'))
    or expert_id in (
      select id from public.experts where user_id = auth.uid()
    )
  );

create policy "workspace insert bookings"
  on public.bookings for insert
  with check (user_id = public.my_workspace_owner_id()
    and public.workspace_can('bookings', 'edit'));

-- ── workspace_events ─────────────────────────────────────────
drop policy if exists "owner can read own events"   on public.workspace_events;
drop policy if exists "owner can insert own events" on public.workspace_events;

create policy "workspace select events"
  on public.workspace_events for select
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('analytics', 'view'));

create policy "workspace insert events"
  on public.workspace_events for insert
  with check (user_id = public.my_workspace_owner_id());

-- ── conversations ────────────────────────────────────────────
drop policy if exists "owner can read own conversations"   on public.conversations;
drop policy if exists "owner can insert own conversations" on public.conversations;
drop policy if exists "owner can update own conversations" on public.conversations;
drop policy if exists "owner can delete own conversations" on public.conversations;

create policy "workspace select conversations"
  on public.conversations for select
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('assistant', 'view'));

create policy "workspace insert conversations"
  on public.conversations for insert
  with check (user_id = public.my_workspace_owner_id()
    and public.workspace_can('assistant', 'edit'));

create policy "workspace update conversations"
  on public.conversations for update
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('assistant', 'edit'));

create policy "workspace delete conversations"
  on public.conversations for delete
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('assistant', 'edit'));

-- ── messages ─────────────────────────────────────────────────
drop policy if exists "owner can read own messages"   on public.messages;
drop policy if exists "owner can insert own messages" on public.messages;
drop policy if exists "owner can update own messages" on public.messages;

create policy "workspace select messages"
  on public.messages for select
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('assistant', 'view'));

create policy "workspace insert messages"
  on public.messages for insert
  with check (user_id = public.my_workspace_owner_id()
    and public.workspace_can('assistant', 'edit'));

create policy "workspace update messages"
  on public.messages for update
  using (user_id = public.my_workspace_owner_id()
    and public.workspace_can('assistant', 'edit'));

-- ── profiles — team members can read the owner's profile ─────
drop policy if exists "Users can view own profile" on public.profiles;

create policy "workspace select profile"
  on public.profiles for select
  using (
    auth.uid() = id
    or id = public.my_workspace_owner_id()
  );

-- profiles update policy remains: only the actual owner can update their own row
-- (existing "Users can update own profile" policy unchanged)
