-- ============================================================
-- ROSTER Migration 039 — Artist Brand Books
-- ------------------------------------------------------------
-- Stores the output of the Brand Studio session — the artist's
-- completed Brand Book — persistently on the platform.
--
-- Previously the Brand Book only lived in localStorage, which
-- meant: (a) it was lost if the user cleared their browser,
-- (b) it couldn't be shared with team members,
-- (c) tools couldn't load it server-side.
--
-- With this table:
--   • Users get a "Save to ROSTER" button that persists the book
--   • The Brand Studio tab shows all saved brand books
--   • AI tools can read the latest brand_book via a server query
--   • Multiple drafts / versions are preserved
-- ============================================================

CREATE TABLE IF NOT EXISTS public.artist_brand_books (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core identity fields (indexed for filtering)
  artist_name       text        NOT NULL DEFAULT '',
  market            text        NOT NULL DEFAULT '',
  sub_genre         text        NOT NULL DEFAULT '',
  archetype         text        NOT NULL DEFAULT '', -- e.g. "the-street-poet"
  archetype_label   text        NOT NULL DEFAULT '', -- e.g. "The Street Poet"

  -- Full brand book data as JSONB (all wizard answers)
  data              jsonb       NOT NULL DEFAULT '{}',

  -- Is this the currently active brand book for this user?
  -- Only one should be active at a time (enforced at app level)
  is_active         boolean     NOT NULL DEFAULT true,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS artist_brand_books_user_id_idx
  ON public.artist_brand_books (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS artist_brand_books_active_idx
  ON public.artist_brand_books (user_id, is_active)
  WHERE is_active = true;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_artist_brand_books_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS artist_brand_books_updated_at ON public.artist_brand_books;
CREATE TRIGGER artist_brand_books_updated_at
  BEFORE UPDATE ON public.artist_brand_books
  FOR EACH ROW EXECUTE FUNCTION public.set_artist_brand_books_updated_at();

-- RLS
ALTER TABLE public.artist_brand_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_books_select" ON public.artist_brand_books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "brand_books_insert" ON public.artist_brand_books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "brand_books_update" ON public.artist_brand_books
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "brand_books_delete" ON public.artist_brand_books
  FOR DELETE USING (auth.uid() = user_id);
