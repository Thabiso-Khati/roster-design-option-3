-- ============================================================
-- ROSTER — Phase 3 Sprint 1: ROSTER AI conversation tables
-- ============================================================
-- Run this in your Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to re-run: every DDL statement uses IF NOT EXISTS.
--
-- Creates:
--   public.conversations  — one row per chat thread per user
--   public.messages       — one row per message (user + assistant)
--
-- Access rules:
--   • Each user can only read/write their own rows (RLS)
--   • Admin (service_role) bypasses RLS for server writes
-- ============================================================

-- ── conversations ────────────────────────────────────────────────────────────

create table if not exists public.conversations (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  title            text,
  created_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now()
);

alter table public.conversations enable row level security;

-- Owner can select their own conversations
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'conversations'
      and policyname = 'owner can read own conversations'
  ) then
    execute $pol$
      create policy "owner can read own conversations"
        on public.conversations for select
        using (auth.uid() = user_id)
    $pol$;
  end if;
end $$;

-- Owner can insert their own conversations
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'conversations'
      and policyname = 'owner can insert own conversations'
  ) then
    execute $pol$
      create policy "owner can insert own conversations"
        on public.conversations for insert
        with check (auth.uid() = user_id)
    $pol$;
  end if;
end $$;

-- Owner can update their own conversations (e.g. title rename)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'conversations'
      and policyname = 'owner can update own conversations'
  ) then
    execute $pol$
      create policy "owner can update own conversations"
        on public.conversations for update
        using (auth.uid() = user_id)
    $pol$;
  end if;
end $$;

-- Owner can delete their own conversations (cascade deletes messages)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'conversations'
      and policyname = 'owner can delete own conversations'
  ) then
    execute $pol$
      create policy "owner can delete own conversations"
        on public.conversations for delete
        using (auth.uid() = user_id)
    $pol$;
  end if;
end $$;

-- Index for "my recent conversations" list query (ORDER BY last_message_at DESC)
create index if not exists conversations_user_recent_idx
  on public.conversations (user_id, last_message_at desc);

-- ── messages ──────────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id               uuid        primary key default gen_random_uuid(),
  conversation_id  uuid        not null references public.conversations(id) on delete cascade,
  user_id          uuid        not null references auth.users(id) on delete cascade,
  role             text        not null check (role in ('user', 'assistant')),
  content          text        not null,
  agent_type       text,       -- 'orchestrator' | 'contracts' | 'royalties' | etc.
  metadata         jsonb,      -- { model, inputTokens, outputTokens, ... }
  created_at       timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Owner can read messages in their own conversations
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'messages'
      and policyname = 'owner can read own messages'
  ) then
    execute $pol$
      create policy "owner can read own messages"
        on public.messages for select
        using (auth.uid() = user_id)
    $pol$;
  end if;
end $$;

-- Owner can insert messages into their own conversations
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'messages'
      and policyname = 'owner can insert own messages'
  ) then
    execute $pol$
      create policy "owner can insert own messages"
        on public.messages for insert
        with check (auth.uid() = user_id)
    $pol$;
  end if;
end $$;

-- Owner can update their own messages (server needs to update content after streaming)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'messages'
      and policyname = 'owner can update own messages'
  ) then
    execute $pol$
      create policy "owner can update own messages"
        on public.messages for update
        using (auth.uid() = user_id)
    $pol$;
  end if;
end $$;

-- Index for "all messages in a conversation ordered by time"
create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at asc);

-- ── 14-day retention function (optional cron) ─────────────────────────────────
-- Call this from a Vercel cron or Supabase pg_cron job daily:
--   SELECT prune_old_ai_conversations();
--
-- Deletes conversations (and cascades to messages) older than 14 days
-- where the user hasn't sent a message in that window. Keeps the DB lean.

create or replace function public.prune_old_ai_conversations()
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from public.conversations
  where last_message_at < now() - interval '14 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
