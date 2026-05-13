-- ============================================================
-- ROSTER Migration 036 — WhatsApp Opt-In Campaigns
-- ------------------------------------------------------------
-- Enables artists/labels to create shareable opt-in links at
-- roster.app/join/[slug]. Fans submit their name + WhatsApp
-- number + POPIA consent, get auto-enrolled in fan_contacts,
-- and receive a welcome WhatsApp message.
-- ============================================================

-- ── Opt-in campaigns table ────────────────────────────────────
CREATE TABLE fan_optin_campaigns (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Internal management
  name                 text        NOT NULL CHECK (char_length(name) <= 100),
  is_active            boolean     NOT NULL DEFAULT true,

  -- Public page content
  slug                 text        NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9\-]{1,58}[a-z0-9]$'),
  headline             text        NOT NULL DEFAULT 'Stay connected' CHECK (char_length(headline) <= 120),
  description          text        CHECK (char_length(description) <= 400),
  artist_display_name  text        NOT NULL CHECK (char_length(artist_display_name) <= 100),

  -- WhatsApp welcome message sent immediately after opt-in
  welcome_message      text        CHECK (char_length(welcome_message) <= 1000),

  -- Linked sender profile (for WhatsApp identity prefix)
  sender_profile_id    uuid        REFERENCES sender_profiles(id) ON DELETE SET NULL,

  -- Stats
  opt_in_count         integer     NOT NULL DEFAULT 0,

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE fan_optin_campaigns ENABLE ROW LEVEL SECURITY;

-- Owners can do everything
CREATE POLICY "optin_campaigns_owner_all"
  ON fan_optin_campaigns
  FOR ALL
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Public read-only access (needed for the /join/[slug] page)
-- Row is only readable if is_active = true
CREATE POLICY "optin_campaigns_public_read"
  ON fan_optin_campaigns
  FOR SELECT
  USING (is_active = true);

-- ── Updated-at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_optin_campaigns_updated_at
  BEFORE UPDATE ON fan_optin_campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RPC: safely increment opt_in_count ───────────────────────
CREATE OR REPLACE FUNCTION increment_optin_count(campaign_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE fan_optin_campaigns
  SET opt_in_count = opt_in_count + 1
  WHERE id = campaign_id;
$$;
