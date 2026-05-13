-- ============================================================
-- ROSTER Migration 037 — fan_contacts unique whatsapp constraint
-- ------------------------------------------------------------
-- The /api/optin/[slug] upsert uses onConflict: "owner_id,whatsapp"
-- which requires a proper UNIQUE CONSTRAINT (not just an index).
-- PostgreSQL partial indexes cannot be used as ON CONFLICT inference
-- targets when referenced by column names — only full constraints can.
--
-- PostgreSQL allows multiple NULL values in a UNIQUE constraint
-- (NULL != NULL), so this is safe even though whatsapp is nullable.
-- ============================================================

-- Drop the partial index from the first attempt (if it was run)
DROP INDEX IF EXISTS fan_contacts_owner_whatsapp_unique;

-- Remove duplicate (owner_id, whatsapp) rows before adding constraint,
-- keeping the most recently created record for each pair.
DELETE FROM public.fan_contacts a
  USING public.fan_contacts b
  WHERE a.id <> b.id
    AND a.owner_id  = b.owner_id
    AND a.whatsapp  = b.whatsapp
    AND a.created_at < b.created_at;

-- Add the proper unique constraint
ALTER TABLE public.fan_contacts
  ADD CONSTRAINT fan_contacts_owner_whatsapp_key
  UNIQUE (owner_id, whatsapp);
