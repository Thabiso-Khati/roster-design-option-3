-- ============================================================
-- ROSTER — Migration 031: Fan CRM
-- ------------------------------------------------------------
-- Tables:
--   fan_contacts            — individual fan records
--   fan_segments            — named lists / audience segments
--   fan_segment_members     — many-to-many contacts ↔ segments
--   fan_broadcast_templates — reusable broadcast templates
--
-- RLS uses my_workspace_owner_id() (defined in migration 024)
-- so team members transparently see their workspace owner's data.
-- ============================================================

-- ── 1. fan_contacts ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fan_contacts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                text        NOT NULL,
  email               text,
  whatsapp            text,
  city                text,
  province            text,
  country             text        NOT NULL DEFAULT 'South Africa',
  source              text        NOT NULL DEFAULT 'manual'
                                  CHECK (source IN ('show', 'import', 'manual', 'social', 'other')),
  show_name           text,
  tags                text[]      NOT NULL DEFAULT '{}',
  popia_consent       boolean     NOT NULL DEFAULT false,
  popia_consent_date  timestamptz,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fan_contacts_owner_id_idx      ON public.fan_contacts (owner_id);
CREATE INDEX IF NOT EXISTS fan_contacts_email_idx         ON public.fan_contacts (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS fan_contacts_popia_idx         ON public.fan_contacts (owner_id, popia_consent);
CREATE INDEX IF NOT EXISTS fan_contacts_source_idx        ON public.fan_contacts (owner_id, source);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_fan_contacts_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS fan_contacts_updated_at ON public.fan_contacts;
CREATE TRIGGER fan_contacts_updated_at
  BEFORE UPDATE ON public.fan_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_fan_contacts_updated_at();

-- RLS
ALTER TABLE public.fan_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fan_contacts_select ON public.fan_contacts;
CREATE POLICY fan_contacts_select ON public.fan_contacts
  FOR SELECT USING (owner_id = my_workspace_owner_id());

DROP POLICY IF EXISTS fan_contacts_insert ON public.fan_contacts;
CREATE POLICY fan_contacts_insert ON public.fan_contacts
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS fan_contacts_update ON public.fan_contacts;
CREATE POLICY fan_contacts_update ON public.fan_contacts
  FOR UPDATE USING (owner_id = my_workspace_owner_id());

DROP POLICY IF EXISTS fan_contacts_delete ON public.fan_contacts;
CREATE POLICY fan_contacts_delete ON public.fan_contacts
  FOR DELETE USING (owner_id = my_workspace_owner_id());

-- ── 2. fan_segments ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fan_segments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  color       text        NOT NULL DEFAULT '#C9A84C',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fan_segments_owner_id_idx ON public.fan_segments (owner_id);

ALTER TABLE public.fan_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fan_segments_select ON public.fan_segments;
CREATE POLICY fan_segments_select ON public.fan_segments
  FOR SELECT USING (owner_id = my_workspace_owner_id());

DROP POLICY IF EXISTS fan_segments_insert ON public.fan_segments;
CREATE POLICY fan_segments_insert ON public.fan_segments
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS fan_segments_update ON public.fan_segments;
CREATE POLICY fan_segments_update ON public.fan_segments
  FOR UPDATE USING (owner_id = my_workspace_owner_id());

DROP POLICY IF EXISTS fan_segments_delete ON public.fan_segments;
CREATE POLICY fan_segments_delete ON public.fan_segments
  FOR DELETE USING (owner_id = my_workspace_owner_id());

-- ── 3. fan_segment_members ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fan_segment_members (
  segment_id  uuid        NOT NULL REFERENCES public.fan_segments(id)  ON DELETE CASCADE,
  contact_id  uuid        NOT NULL REFERENCES public.fan_contacts(id)  ON DELETE CASCADE,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (segment_id, contact_id)
);

CREATE INDEX IF NOT EXISTS fan_segment_members_contact_idx ON public.fan_segment_members (contact_id);

ALTER TABLE public.fan_segment_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fan_segment_members_select ON public.fan_segment_members;
CREATE POLICY fan_segment_members_select ON public.fan_segment_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.fan_segments s
      WHERE s.id = segment_id AND s.owner_id = my_workspace_owner_id()
    )
  );

DROP POLICY IF EXISTS fan_segment_members_insert ON public.fan_segment_members;
CREATE POLICY fan_segment_members_insert ON public.fan_segment_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fan_segments s
      WHERE s.id = segment_id AND s.owner_id = my_workspace_owner_id()
    )
  );

DROP POLICY IF EXISTS fan_segment_members_delete ON public.fan_segment_members;
CREATE POLICY fan_segment_members_delete ON public.fan_segment_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.fan_segments s
      WHERE s.id = segment_id AND s.owner_id = my_workspace_owner_id()
    )
  );

-- ── 4. fan_broadcast_templates ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.fan_broadcast_templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  channel     text        NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms')),
  subject     text,                -- email only
  body        text        NOT NULL,
  tags        text[]      NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fan_broadcast_templates_owner_idx     ON public.fan_broadcast_templates (owner_id);
CREATE INDEX IF NOT EXISTS fan_broadcast_templates_channel_idx   ON public.fan_broadcast_templates (owner_id, channel);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_fan_templates_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS fan_broadcast_templates_updated_at ON public.fan_broadcast_templates;
CREATE TRIGGER fan_broadcast_templates_updated_at
  BEFORE UPDATE ON public.fan_broadcast_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_fan_templates_updated_at();

ALTER TABLE public.fan_broadcast_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fan_broadcast_templates_select ON public.fan_broadcast_templates;
CREATE POLICY fan_broadcast_templates_select ON public.fan_broadcast_templates
  FOR SELECT USING (owner_id = my_workspace_owner_id());

DROP POLICY IF EXISTS fan_broadcast_templates_insert ON public.fan_broadcast_templates;
CREATE POLICY fan_broadcast_templates_insert ON public.fan_broadcast_templates
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS fan_broadcast_templates_update ON public.fan_broadcast_templates;
CREATE POLICY fan_broadcast_templates_update ON public.fan_broadcast_templates
  FOR UPDATE USING (owner_id = my_workspace_owner_id());

DROP POLICY IF EXISTS fan_broadcast_templates_delete ON public.fan_broadcast_templates;
CREATE POLICY fan_broadcast_templates_delete ON public.fan_broadcast_templates
  FOR DELETE USING (owner_id = my_workspace_owner_id());

-- ── 5. Seed default broadcast templates for new workspaces ───
-- These are inserted once per workspace on first use (see API route).
-- The SQL below does nothing on re-run (guarded by the DO block).

DO $$
BEGIN
  -- Intentionally empty — templates are seeded via the API route on
  -- first load so they can carry proper owner_id context.
  NULL;
END $$;
