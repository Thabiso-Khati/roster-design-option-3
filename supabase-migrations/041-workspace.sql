-- ============================================================
-- ROSTER Migration 041 — Workspace
-- ------------------------------------------------------------
-- Workspace is the unified document and work-product hub.
-- It stores ROSTER-native outputs (campaign plans, release
-- plans, AI drafts) and will store uploaded external docs
-- (Phase 2). Every document has a privacy setting and can
-- be shared with specific team members (Phase 3).
--
-- Team model: ROSTER uses workspace_owner_id on team_members.
-- No separate workspaces table — workspace scope is determined
-- by auth.uid() = user_id (owner) or team membership lookup.
-- ============================================================

-- ── 1. workspace_documents ───────────────────────────────────
create table if not exists public.workspace_documents (
  id                  uuid        primary key default gen_random_uuid(),

  -- Owner — the user who created or uploaded this document
  user_id             uuid        not null references auth.users(id) on delete cascade,

  -- Identity
  title               text        not null,
  doc_type            text        not null check (doc_type in (
                        'campaign_plan',
                        'release_plan',
                        'ai_draft',
                        'marketing_budget',
                        'upload_pdf',
                        'upload_docx',
                        'upload_xlsx',
                        'upload_pptx',
                        'upload_other'
                      )),

  -- Source link — for ROSTER-native docs, links back to origin record
  -- e.g. source_type='artist_campaigns', source_id=<campaign uuid>
  source_type         text,
  source_id           uuid,

  -- Content — for ROSTER-native docs, the structured JSON plan/data.
  -- For uploads (Phase 2), stores AI-extracted summary + metadata.
  content             jsonb,

  -- File storage — Phase 2 only; null for ROSTER-native docs
  file_url            text,
  file_name           text,
  file_size_bytes     integer,
  file_mime_type      text,

  -- AI extraction — Phase 2
  extraction_status   text        default 'not_applicable'
                      check (extraction_status in (
                        'not_applicable', 'pending', 'processing', 'done', 'failed'
                      )),
  extracted_text      text,
  ai_summary          text,
  ai_tags             text[]      default '{}',

  -- Privacy
  -- private   → only the owner sees it
  -- workspace → all team members of the owner's workspace can see it
  -- custom    → only explicitly shared members (workspace_document_shares)
  privacy             text        not null default 'private'
                      check (privacy in ('private', 'workspace', 'custom')),

  -- Lifecycle
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  last_accessed_at    timestamptz
);

-- Indexes
create index if not exists workspace_documents_user_idx
  on public.workspace_documents (user_id, updated_at desc);

create index if not exists workspace_documents_source_idx
  on public.workspace_documents (source_type, source_id)
  where source_type is not null;

create index if not exists workspace_documents_type_idx
  on public.workspace_documents (user_id, doc_type);

-- updated_at trigger
create or replace function public.set_workspace_documents_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workspace_documents_updated_at on public.workspace_documents;
create trigger workspace_documents_updated_at
  before update on public.workspace_documents
  for each row execute function public.set_workspace_documents_updated_at();

-- ── 2. workspace_document_shares ─────────────────────────────
-- Tracks per-user sharing for documents with privacy = 'custom'
create table if not exists public.workspace_document_shares (
  id              uuid        primary key default gen_random_uuid(),
  document_id     uuid        not null references public.workspace_documents(id) on delete cascade,
  shared_with_id  uuid        not null references auth.users(id) on delete cascade,
  -- permission: what the shared user can do
  permission      text        not null default 'view'
                  check (permission in ('view', 'comment', 'edit')),
  created_at      timestamptz not null default now(),
  unique (document_id, shared_with_id)
);

create index if not exists workspace_doc_shares_doc_idx
  on public.workspace_document_shares (document_id);

create index if not exists workspace_doc_shares_user_idx
  on public.workspace_document_shares (shared_with_id);

-- ── 3. RLS ───────────────────────────────────────────────────
alter table public.workspace_documents enable row level security;
alter table public.workspace_document_shares enable row level security;

-- Owner has full access to their own documents
create policy "workspace_docs_owner_all"
  on public.workspace_documents
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Team members can read workspace-level documents from their owner
create policy "workspace_docs_team_read"
  on public.workspace_documents for select
  using (
    privacy = 'workspace'
    and user_id in (
      select workspace_owner_id
      from public.team_members
      where member_user_id = auth.uid()
        and status = 'active'
    )
  );

-- Custom shares — readable if explicitly granted
create policy "workspace_docs_custom_read"
  on public.workspace_documents for select
  using (
    privacy = 'custom'
    and id in (
      select document_id
      from public.workspace_document_shares
      where shared_with_id = auth.uid()
    )
  );

-- Shares: owner of document can manage its shares
create policy "workspace_doc_shares_owner"
  on public.workspace_document_shares
  using (
    document_id in (
      select id from public.workspace_documents
      where user_id = auth.uid()
    )
  )
  with check (
    document_id in (
      select id from public.workspace_documents
      where user_id = auth.uid()
    )
  );

-- Shared users can read their own share rows
create policy "workspace_doc_shares_self_read"
  on public.workspace_document_shares for select
  using (shared_with_id = auth.uid());
