-- ────────────────────────────────────────────────────────────────────
-- Group B — Anomaly Engine + AI Tier B Proactive Suggestions
-- 2026-04-29
-- ────────────────────────────────────────────────────────────────────
-- Two new tables that drive proactive intelligence in the dashboard:
--
--   anomaly_events       — spikes/drops detected on artist_platform_metrics
--                          (e.g. "Spotify monthly listeners up 42% week-over-week")
--   proactive_suggestions — AI Tier B nudges drawn from rules:
--                            anomaly-driven, recoupment, stalled events,
--                            calendar-driven
--
-- Both are RLS-scoped to the artist's owner. Inserts come from
-- service-role cron jobs; the user reads via authenticated SELECT.
-- ────────────────────────────────────────────────────────────────────

-- ── anomaly_events ──────────────────────────────────────────────────
create table if not exists public.anomaly_events (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  artist_id uuid references public.artists(id) on delete cascade,

  metric_key text not null,                 -- e.g. "spotify_monthly_listeners"
  platform text,                             -- e.g. "spotify" / "youtube" / "boomplay"
  direction text not null check (direction in ('spike','drop')),
  severity text not null default 'normal' check (severity in ('minor','normal','major','critical')),

  -- The maths
  current_value numeric not null,
  prior_avg_value numeric not null,
  std_dev_value numeric,
  pct_change numeric,                        -- (current - prior_avg) / prior_avg * 100
  z_score numeric,                           -- (current - prior_avg) / std_dev

  -- Window
  detected_at timestamptz default now(),
  window_short text default '7d',            -- short MA window ("7d" / "1d")
  window_long text default '30d',            -- baseline window ("30d" / "90d")

  -- Lifecycle
  status text not null default 'open'
    check (status in ('open','acknowledged','dismissed','snoozed','resolved')),
  acknowledged_at timestamptz,
  dismissed_at timestamptz,
  snoozed_until timestamptz,

  -- For dedup so the same anomaly doesn't re-fire daily
  dedup_key text unique,                     -- e.g. "user_id:artist_id:metric:date"
  metadata jsonb default '{}'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_anomaly_events_user on public.anomaly_events(user_id);
create index if not exists idx_anomaly_events_artist on public.anomaly_events(artist_id);
create index if not exists idx_anomaly_events_open on public.anomaly_events(user_id, status, detected_at desc) where status in ('open','snoozed');

-- ── proactive_suggestions ───────────────────────────────────────────
create table if not exists public.proactive_suggestions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  artist_id uuid references public.artists(id) on delete cascade,

  -- Rule taxonomy
  rule_category text not null check (rule_category in (
    'anomaly_driven',
    'recoupment',
    'stalled_workspace_event',
    'calendar_driven',
    'opportunity'
  )),
  rule_id text not null,                     -- e.g. "spotify_streams_spike", "samas_window_open"
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),

  -- Display
  title text not null,                       -- "Streams up 42% — pitch this song for sync"
  body text,                                 -- 1–3 sentence detail
  action_label text,                         -- "Open sync pitch", "Start renegotiation prep"
  action_href text,                          -- internal route to act on

  -- AI augmentation (optional drafted action)
  ai_drafted_text text,                      -- AI-drafted email / note / message
  ai_model text,
  ai_input_tokens int,
  ai_output_tokens int,
  ai_cost_usd numeric,

  -- Lifecycle
  status text not null default 'open'
    check (status in ('open','acted','snoozed','dismissed','expired')),
  expires_at timestamptz,
  snoozed_until timestamptz,
  acted_at timestamptz,
  dismissed_at timestamptz,

  -- Source linkage
  source_anomaly_id uuid references public.anomaly_events(id) on delete set null,
  source_event_id uuid,                      -- workspace event id, contract id, etc.
  source_metadata jsonb default '{}'::jsonb,

  -- Dedup
  dedup_key text unique,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_proactive_suggestions_user on public.proactive_suggestions(user_id);
create index if not exists idx_proactive_suggestions_open on public.proactive_suggestions(user_id, status, priority, created_at desc) where status = 'open';

-- ── updated_at triggers ────────────────────────────────────────────
create or replace function public.set_anomaly_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists trg_anomaly_events_updated_at on public.anomaly_events;
create trigger trg_anomaly_events_updated_at
  before update on public.anomaly_events
  for each row execute function public.set_anomaly_updated_at();

drop trigger if exists trg_proactive_suggestions_updated_at on public.proactive_suggestions;
create trigger trg_proactive_suggestions_updated_at
  before update on public.proactive_suggestions
  for each row execute function public.set_anomaly_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────
alter table public.anomaly_events enable row level security;
alter table public.proactive_suggestions enable row level security;

drop policy if exists "anomaly_events_select_own" on public.anomaly_events;
create policy "anomaly_events_select_own"
  on public.anomaly_events for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "anomaly_events_update_own" on public.anomaly_events;
create policy "anomaly_events_update_own"
  on public.anomaly_events for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "proactive_suggestions_select_own" on public.proactive_suggestions;
create policy "proactive_suggestions_select_own"
  on public.proactive_suggestions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "proactive_suggestions_update_own" on public.proactive_suggestions;
create policy "proactive_suggestions_update_own"
  on public.proactive_suggestions for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- (No INSERT/DELETE policies for authenticated — service-role inserts only via cron)
