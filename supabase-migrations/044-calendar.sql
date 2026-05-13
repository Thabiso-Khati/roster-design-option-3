-- ============================================================
-- ROSTER Migration 044 — Calendar
-- ------------------------------------------------------------
-- Unified calendar for the ROSTER platform.
--
-- calendar_events stores ALL event types:
--   manual       — user-created events
--   booking      — mirrored from expert bookings (auto)
--   tool_snapshot — mirrored from tour dates, release dates (auto)
--   workspace_doc — deadlines from workspace documents (auto)
--   release_task  — mirrored from release task due dates (auto)
--
-- Auto-populated events are read-only mirrors. source_type +
-- source_id identify the origin record. Deleting the source
-- record should cascade-delete the mirror (handled app-side).
-- ============================================================

-- ── 1. calendar_events ───────────────────────────────────────

create table if not exists public.calendar_events (
  id                      uuid        primary key default gen_random_uuid(),

  -- Owner
  user_id                 uuid        not null references auth.users(id) on delete cascade,

  -- Content
  title                   text        not null check (char_length(title) between 1 and 200),
  description             text        check (char_length(description) <= 2000),
  location                text        check (char_length(location) <= 300),

  -- Timing
  start_at                timestamptz not null,
  end_at                  timestamptz not null,
  all_day                 boolean     not null default false,
  timezone                text        not null default 'Africa/Johannesburg',

  -- Event classification
  event_type              text        not null default 'custom' check (event_type in (
                            'expert_booking',
                            'release_date',
                            'tour_date',
                            'studio_session',
                            'press_interview',
                            'radio_appearance',
                            'sync_deadline',
                            'royalty_due',
                            'contract_deadline',
                            'meeting',
                            'focus_time',
                            'custom'
                          )),

  -- Source link — for auto-populated events
  source_type             text        check (source_type in (
                            'manual',
                            'booking',
                            'tool_snapshot',
                            'workspace_doc',
                            'release_task'
                          )) default 'manual',
  source_id               text,       -- uuid or slug of the origin record

  -- Artist association (optional)
  artist_id               uuid        references public.artists(id) on delete set null,

  -- Reminders
  reminder_email          boolean     not null default false,
  reminder_whatsapp       boolean     not null default false,
  -- Minutes before event to send reminders, e.g. [60, 1440] = 1hr + 1day
  reminder_minutes        int[]       not null default '{}',
  reminder_sent_at        timestamptz,

  -- Visibility
  privacy                 text        not null default 'private' check (privacy in ('private', 'team')),

  -- Custom colour override (hex, e.g. '#C9A84C')
  color                   text        check (color ~ '^#[0-9A-Fa-f]{6}$'),

  -- Recurring (Phase 2 — stored but not yet processed)
  recurrence_rule         text,

  -- Metadata
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ── 2. Indexes ───────────────────────────────────────────────

create index if not exists calendar_events_user_range_idx
  on public.calendar_events (user_id, start_at, end_at);

create index if not exists calendar_events_source_idx
  on public.calendar_events (source_type, source_id)
  where source_type is not null;

create index if not exists calendar_events_reminders_idx
  on public.calendar_events (user_id, start_at)
  where reminder_email = true or reminder_whatsapp = true;

-- ── 3. updated_at trigger ────────────────────────────────────

create or replace function public.touch_calendar_event()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists calendar_events_updated_at on public.calendar_events;
create trigger calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.touch_calendar_event();

-- ── 4. RLS ───────────────────────────────────────────────────

alter table public.calendar_events enable row level security;

-- Owner: full access to their own events
create policy "calendar_events: owner full access"
  on public.calendar_events
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Team members: read events marked as team-visible
create policy "calendar_events: team members can read shared events"
  on public.calendar_events
  for select
  using (
    privacy = 'team'
    and exists (
      select 1 from public.team_members tm
      where tm.workspace_owner_id = calendar_events.user_id
        and tm.member_user_id     = auth.uid()
        and tm.status             = 'active'
    )
  );

-- ── 5. calendar_booking_link — public scheduling config ──────

create table if not exists public.calendar_booking_link (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null unique references auth.users(id) on delete cascade,

  -- Public slug — used in /book/[slug]
  slug                text        not null unique check (
                        slug ~ '^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$'
                      ),

  -- Display
  display_name        text        not null check (char_length(display_name) between 1 and 120),
  bio                 text        check (char_length(bio) <= 500),

  -- Availability windows (JSONB array of { day: 0-6, from: "HH:MM", to: "HH:MM" })
  availability        jsonb       not null default '[]',

  -- Buffer between meetings (minutes)
  buffer_minutes      int         not null default 15 check (buffer_minutes >= 0 and buffer_minutes <= 120),

  -- Minimum notice before booking (hours)
  notice_hours        int         not null default 24 check (notice_hours >= 0),

  -- Allowed durations (minutes) e.g. [30, 60]
  durations           int[]       not null default '{30,60}',

  -- Optional rate (ZAR cents) — 0 = free
  rate_cents          int         not null default 0 check (rate_cents >= 0),
  currency            text        not null default 'ZAR',

  -- iCal feed token
  ical_token          text        not null default gen_random_uuid()::text,

  -- Active
  active              boolean     not null default true,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.calendar_booking_link enable row level security;

-- Owner manages their own link config
create policy "calendar_booking_link: owner full access"
  on public.calendar_booking_link
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public read for active booking pages (no auth required)
create policy "calendar_booking_link: public read active"
  on public.calendar_booking_link
  for select
  using (active = true);

-- ── 6. Grant ─────────────────────────────────────────────────

grant select, insert, update, delete
  on public.calendar_events
  to authenticated;

grant select, insert, update, delete
  on public.calendar_booking_link
  to authenticated;

grant select
  on public.calendar_booking_link
  to anon;
