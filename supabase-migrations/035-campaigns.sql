-- ============================================================
-- 035 — Campaign sending infrastructure
-- ------------------------------------------------------------
-- Tables:
--   sender_profiles         — reusable "from" identities (artist,
--                             label, co-brand)
--   fan_campaigns           — one row per campaign send
--   fan_campaign_recipients — per-contact delivery status
-- ============================================================

-- ── 1. sender_profiles ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sender_profiles (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      text        NOT NULL,          -- "Kabza De Small" / "Hype Records"
  type              text        NOT NULL DEFAULT 'artist'
                                CHECK (type IN ('artist', 'label', 'cobrand')),
  email_from_name   text,                          -- override for email from-name
  email_reply_to    text,                          -- reply-to address
  whatsapp_number   text,                          -- Twilio number e.g. "+14155238886"
  avatar_url        text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sender_profiles_owner_idx
  ON public.sender_profiles (owner_id);

ALTER TABLE public.sender_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sender_profiles_select" ON public.sender_profiles
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "sender_profiles_insert" ON public.sender_profiles
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "sender_profiles_update" ON public.sender_profiles
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "sender_profiles_delete" ON public.sender_profiles
  FOR DELETE USING (auth.uid() = owner_id);

-- ── 2. fan_campaigns ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fan_campaigns (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                text        NOT NULL,         -- internal label, e.g. "Album drop — Joburg fans"
  sender_profile_id   uuid        REFERENCES public.sender_profiles(id) ON DELETE SET NULL,
  segment_id          uuid        REFERENCES public.fan_segments(id) ON DELETE SET NULL,
  channel             text        NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  subject             text,                         -- email only
  body                text        NOT NULL,         -- final message body (placeholders resolved at send time)
  status              text        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  total_recipients    integer     NOT NULL DEFAULT 0,
  sent_count          integer     NOT NULL DEFAULT 0,
  failed_count        integer     NOT NULL DEFAULT 0,
  sent_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fan_campaigns_owner_idx
  ON public.fan_campaigns (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS fan_campaigns_status_idx
  ON public.fan_campaigns (owner_id, status);

CREATE OR REPLACE FUNCTION public.set_fan_campaigns_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS fan_campaigns_updated_at ON public.fan_campaigns;
CREATE TRIGGER fan_campaigns_updated_at
  BEFORE UPDATE ON public.fan_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_fan_campaigns_updated_at();

ALTER TABLE public.fan_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fan_campaigns_select" ON public.fan_campaigns
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "fan_campaigns_insert" ON public.fan_campaigns
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "fan_campaigns_update" ON public.fan_campaigns
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "fan_campaigns_delete" ON public.fan_campaigns
  FOR DELETE USING (auth.uid() = owner_id);

-- ── 3. fan_campaign_recipients ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.fan_campaign_recipients (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid        NOT NULL REFERENCES public.fan_campaigns(id) ON DELETE CASCADE,
  contact_id    uuid        NOT NULL REFERENCES public.fan_contacts(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  sent_at       timestamptz,
  UNIQUE (campaign_id, contact_id)
);

CREATE INDEX IF NOT EXISTS fan_campaign_recipients_campaign_idx
  ON public.fan_campaign_recipients (campaign_id, status);

ALTER TABLE public.fan_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Recipients inherit campaign ownership — join to fan_campaigns for RLS
CREATE POLICY "fan_campaign_recipients_select" ON public.fan_campaign_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.fan_campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
  );
