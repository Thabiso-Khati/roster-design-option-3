-- ============================================================
-- ROSTER — "Book an Expert" video meetings
-- ------------------------------------------------------------
-- Adds the Daily.co meeting layer to existing `bookings` table.
-- Privacy posture: ROSTER stores ZERO meeting content.
--   • No recording, no transcript, no AI notes.
--   • Only operational telemetry: join/leave times, call quality,
--     disconnect events. Used exclusively to (a) enforce no-show
--     policy and (b) surface quality problems to admin.
--
-- No-show policy (codified in the cron sweeper, not SQL):
--   • Expert doesn't join within 15 min of scheduled_at → full
--     refund to user + R100 penalty deducted from expert's next
--     payout + 1 strike.
--   • 3 strikes within a rolling 90-day window → expert auto-
--     suspended (is_active=false), requires admin reinstatement.
--   • User doesn't join (but expert did wait) → expert keeps full
--     payout, no refund.
-- ============================================================

-- ─── 1. Extend bookings with meeting + no-show fields ────────
alter table public.bookings
  -- Daily room identifiers — created when payment clears
  add column if not exists meeting_room_name   text,
  add column if not exists meeting_url         text,
  -- Join/leave tracking (written by the Daily webhook handler)
  add column if not exists expert_joined_at    timestamptz,
  add column if not exists user_joined_at      timestamptz,
  add column if not exists session_ended_at    timestamptz,
  -- No-show resolution
  add column if not exists no_show_status      text
    check (no_show_status in ('expert', 'user') or no_show_status is null),
  add column if not exists no_show_resolved_at timestamptz,
  add column if not exists refund_reference    text;

comment on column public.bookings.meeting_room_name is
  'Daily.co room name — created at payment confirmation, deleted 2h after session end.';
comment on column public.bookings.meeting_url is
  'Full Daily.co room URL, served to both parties on Join Session click.';
comment on column public.bookings.expert_joined_at is
  'First participant.joined event received from Daily for the expert.';
comment on column public.bookings.user_joined_at is
  'First participant.joined event received from Daily for the booker.';
comment on column public.bookings.no_show_status is
  '"expert" or "user" — which party failed to join within the 15-min grace window.';

-- Expand booking_status to include no-show resolution states
alter table public.bookings
  drop constraint if exists bookings_booking_status_check;
alter table public.bookings
  add constraint bookings_booking_status_check
  check (booking_status in (
    'confirmed',
    'completed',
    'cancelled',
    'no_show_expert',
    'no_show_user'
  ));

-- Expand payment_status for partial refunds on expert penalty
alter table public.bookings
  drop constraint if exists bookings_payment_status_check;
alter table public.bookings
  add constraint bookings_payment_status_check
  check (payment_status in ('pending', 'paid', 'refunded', 'refund_failed'));

-- Fast lookup for the no-show sweeper cron
create index if not exists idx_bookings_sweeper on public.bookings
  (scheduled_at, booking_status, payment_status)
  where booking_status = 'confirmed' and payment_status = 'paid';


-- ─── 2. Per-session operational telemetry ───────────────────
-- Content-free: only timestamps, quality metrics, and event types.
-- Daily webhook pushes rows here on every interesting event.
create table if not exists public.booking_telemetry (
  id              uuid default gen_random_uuid() primary key,
  booking_id      uuid references public.bookings(id) on delete cascade not null,
  event_type      text not null,
    -- 'meeting.started', 'meeting.ended',
    -- 'participant.joined', 'participant.left',
    -- 'recording.started' (should never fire), 'network.quality'
  participant_role text
    check (participant_role in ('expert', 'user', 'unknown') or participant_role is null),
  -- Quality stats (nullable; only populated on network.quality events)
  packet_loss_pct   numeric(5,2),
  jitter_ms         integer,
  round_trip_ms     integer,
  audio_level_rms   numeric(5,3),
  -- Raw Daily payload for forensics (no content, only metadata)
  raw_payload     jsonb,
  occurred_at     timestamptz not null,
  created_at      timestamptz default now()
);

create index if not exists idx_telemetry_booking on public.booking_telemetry (booking_id);
create index if not exists idx_telemetry_event   on public.booking_telemetry (event_type);

alter table public.booking_telemetry enable row level security;

-- Booker + expert can see telemetry for their own bookings (not content,
-- just operational facts — useful on the booking detail page to show
-- "Call lasted 47 min, audio quality: excellent").
create policy "Booking parties can view own telemetry" on public.booking_telemetry
  for select using (
    booking_id in (
      select id from public.bookings where user_id = auth.uid()
    )
    or booking_id in (
      select b.id from public.bookings b
      join public.experts e on e.id = b.expert_id
      where e.user_id = auth.uid()
    )
  );

-- No insert policy — webhook handler uses the admin client


-- ─── 3. Expert strike ledger ─────────────────────────────────
-- One row per no-show event. Strike count = rows within last 90 days.
-- Kept as an append-only log so the full history is preserved even
-- after reinstatement (helps admin spot repeat offenders).
create table if not exists public.expert_strikes (
  id            uuid default gen_random_uuid() primary key,
  expert_id     uuid references public.experts(id) on delete cascade not null,
  booking_id    uuid references public.bookings(id) on delete set null,
  reason        text not null default 'no_show',
    -- 'no_show' is the only automated reason today; leave room for
    -- admin-issued strikes in future ('inappropriate_conduct', etc).
  penalty_amount  integer not null default 10000,
    -- R100 in cents. Deducted from the expert's next Paystack payout.
  penalty_currency text default 'ZAR',
  penalty_applied  boolean default false,
    -- Set true once the payout deduction lands in Paystack.
  admin_notes   text,
  created_at    timestamptz default now()
);

create index if not exists idx_strikes_expert_90d on public.expert_strikes
  (expert_id, created_at);

alter table public.expert_strikes enable row level security;

-- Experts can view their own strikes (so they know they're on thin ice)
create policy "Experts view own strikes" on public.expert_strikes
  for select using (
    expert_id in (
      select id from public.experts where user_id = auth.uid()
    )
  );

-- Admin writes via the admin client; no user insert/update policy


-- ─── 4. Helper view: active strikes in last 90 days ─────────
create or replace view public.expert_active_strikes as
select
  expert_id,
  count(*) as strike_count,
  max(created_at) as last_strike_at
from public.expert_strikes
where created_at > now() - interval '90 days'
group by expert_id;

comment on view public.expert_active_strikes is
  'Rolling 90-day strike count per expert. 3+ triggers auto-suspension.';


-- ─── 5. Privacy declaration (schema-level docs) ─────────────
comment on table public.bookings is
  'Expert session bookings. Privacy: ROSTER stores NO meeting content — no recordings, transcripts, or notes. Only operational telemetry in booking_telemetry.';
comment on table public.booking_telemetry is
  'Content-free operational metrics for each meeting (join times, call quality, disconnects). No audio/video/text content is ever stored.';
