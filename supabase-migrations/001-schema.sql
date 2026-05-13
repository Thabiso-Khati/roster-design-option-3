-- ============================================================
-- ROSTER — Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- PROFILES (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  phone text,
  country text default 'South Africa',
  currency_override text,                -- ISO 4217 code; null = use country default
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SUBSCRIPTIONS
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tx_ref text unique not null,
  plan text check (plan in ('monthly', 'annual')) not null,
  status text check (status in ('pending', 'active', 'cancelled', 'expired')) default 'pending',
  paystack_transaction_id text,
  paystack_plan_code text,
  plan_data jsonb,
  activated_at timestamptz,
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now()
);
alter table public.subscriptions enable row level security;
create policy "Users can view own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

-- EXPERTS
create table public.experts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  bio text,
  specialty text,
  country text,
  avatar_url text,
  paystack_subaccount_code text,
  is_verified boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.experts enable row level security;
create policy "Anyone can view active experts" on public.experts
  for select using (is_active = true);

-- EXPERT SESSION TYPES (pricing per duration)
create table public.expert_sessions (
  id uuid default gen_random_uuid() primary key,
  expert_id uuid references public.experts(id) on delete cascade,
  duration_minutes integer check (duration_minutes in (30, 45, 60, 120)) not null,
  price integer not null, -- in smallest currency unit (cents/kobo)
  currency text default 'ZAR',
  is_available boolean default true
);
alter table public.expert_sessions enable row level security;
create policy "Anyone can view expert sessions" on public.expert_sessions
  for select using (is_available = true);

-- BOOKINGS
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  expert_id uuid references public.experts(id) not null,
  session_id uuid references public.expert_sessions(id) not null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null,
  amount integer not null,
  currency text default 'ZAR',
  platform_commission integer not null, -- 20% of amount
  expert_payout integer not null,       -- 80% of amount
  tx_ref text unique,
  payment_status text check (payment_status in ('pending', 'paid', 'refunded')) default 'pending',
  booking_status text check (booking_status in ('confirmed', 'completed', 'cancelled')) default 'confirmed',
  paystack_transaction_id text,
  notes text,
  paid_at timestamptz,
  created_at timestamptz default now()
);
alter table public.bookings enable row level security;
create policy "Users can view own bookings" on public.bookings
  for select using (auth.uid() = user_id);
create policy "Experts can view bookings for them" on public.bookings
  for select using (
    expert_id in (
      select id from public.experts where user_id = auth.uid()
    )
  );

-- MASTERCLASSES
create table public.masterclasses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  instructor_name text,
  instructor_title text,
  vimeo_id text,              -- Vimeo video ID for embedding
  thumbnail_url text,
  duration_seconds integer,
  category text,              -- maps to module slugs
  is_published boolean default false,
  created_at timestamptz default now()
);
alter table public.masterclasses enable row level security;
create policy "Authenticated users can view published masterclasses" on public.masterclasses
  for select using (is_published = true and auth.uid() is not null);

-- Helpful view: check if user has active subscription
create or replace view public.active_subscribers as
  select user_id from public.subscriptions
  where status = 'active'
  and (expires_at is null or expires_at > now());

-- ============================================================
-- STAGE 2 ADDITIONS
-- ============================================================

-- EXPERT APPLICATIONS (pre-onboarding submissions)
create table public.expert_applications (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  specialty text,
  country text,
  bio text,
  years_experience integer,
  linkedin text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamptz default now()
);
alter table public.expert_applications enable row level security;
-- Only admins can see applications (enforced at API layer via ADMIN_EMAILS env var)
create policy "Admins can manage applications" on public.expert_applications
  for all using (auth.uid() is not null);

-- RESOURCES (uploaded guides, templates, spreadsheets per module)
create table public.resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  module_slug text not null,   -- startup | touring | recording | marketing | money
  file_url text not null,      -- Supabase Storage public URL
  file_type text not null,     -- pdf | docx | xlsx | pptx
  download_count integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.resources enable row level security;
-- Active subscribers can view and download all resources
create policy "Active subscribers can view resources" on public.resources
  for select using (
    is_active = true
    and auth.uid() in (select user_id from public.active_subscribers)
  );
-- Admins can manage (enforced at API layer)
create policy "Admins can manage resources" on public.resources
  for all using (auth.uid() is not null);

-- RESOURCE DOWNLOADS (audit trail)
create table public.resource_downloads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  resource_id uuid references public.resources(id) on delete cascade not null,
  downloaded_at timestamptz default now()
);
alter table public.resource_downloads enable row level security;
create policy "Users can track own downloads" on public.resource_downloads
  for select using (auth.uid() = user_id);

-- Allow admins to insert/update masterclasses
create policy "Admins can manage masterclasses" on public.masterclasses
  for all using (auth.uid() is not null);

-- Allow experts to update their own profile
create policy "Experts can update own profile" on public.experts
  for update using (auth.uid() = user_id);

-- Allow experts to manage their own sessions
create policy "Experts can manage own sessions" on public.expert_sessions
  for all using (
    expert_id in (select id from public.experts where user_id = auth.uid())
  );

-- Allow users to create bookings
create policy "Users can create bookings" on public.bookings
  for insert with check (auth.uid() = user_id);

-- Supabase Storage bucket setup instructions:
-- 1. Go to Storage → New bucket → Name: "resources" → Public: true
-- 2. Set file size limit: 50MB
-- 3. Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.*,
--    application/vnd.ms-excel, application/msword
