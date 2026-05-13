-- ─────────────────────────────────────────────────────────────
-- ROSTER — Add ui_language to profiles
-- Stores the user's explicit UI language preference.
-- Values: 'en' | 'fr' | 'sw' | 'pt' | 'ar'
-- NULL means "infer from country" (handled client-side).
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ui_language TEXT
    CHECK (ui_language IN ('en', 'fr', 'sw', 'pt', 'ar'));

COMMENT ON COLUMN public.profiles.ui_language IS
  'Explicit UI language override. NULL = infer from country locale.
   Supported: en (English), fr (Français), sw (Kiswahili), pt (Português), ar (العربية).';
