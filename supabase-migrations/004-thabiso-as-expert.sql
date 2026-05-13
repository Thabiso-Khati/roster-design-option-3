-- ============================================================
-- ROSTER — Founder as First Expert (Tom from MySpace)
-- ------------------------------------------------------------
-- Converts Thabiso's mock seed profile into a REAL expert row
-- in the DB so he:
--   1. Appears first on the /dashboard/experts directory
--      (real DB experts are merged before seeds in the page)
--   2. Is actually bookable end-to-end (fixes "Expert not found"
--      error that was hitting when trying to book seed-2)
--   3. Can own his own bookings once the expert dashboard ships
--
-- Adds two new columns to experts (long_bio, highlights) so the
-- detail page can render the full founder bio + expertise list
-- that currently only live in the seed data.
--
-- Idempotent: safe to re-run. Uses ON CONFLICT for the expert
-- row (keyed on user_id) and DELETE+INSERT for session types.
-- ============================================================

-- 1. Schema: add rich-profile columns
alter table public.experts
  add column if not exists long_bio text,
  add column if not exists highlights text[];

-- 2. Insert/update Thabiso's expert row
-- We look up his user_id by email (thabiso.khati@gmail.com) so
-- this script works regardless of which Supabase env it runs in.
do $$
declare
  v_user_id uuid;
  v_expert_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = 'thabiso.khati@gmail.com'
  limit 1;

  if v_user_id is null then
    raise exception 'No auth user found for thabiso.khati@gmail.com — sign in at least once before running this migration.';
  end if;

  -- Upsert on (user_id, name) so re-running doesn't duplicate.
  -- Pick the existing row if present, otherwise insert a new one.
  select id into v_expert_id
  from public.experts
  where user_id = v_user_id
    and name = 'Thabiso Khati'
  limit 1;

  if v_expert_id is null then
    insert into public.experts (
      user_id, name, bio, long_bio, highlights,
      specialty, country, avatar_url,
      is_verified, is_active
    ) values (
      v_user_id,
      'Thabiso Khati',
      'Founder & CEO of JO:LA. 25+ years building African music. Former UMG Africa triple-director. Pioneer of SA Hip-Hop and Amapiano''s global rise.',
      'Thabiso Khati is a music and entertainment industry leader with over 25 years of experience shaping African culture globally. In 1996, as a student, he founded Nativz Entertainment — Africa''s first exclusively Hip-Hop record label — and secured a landmark distribution deal with Sony Music. He later co-founded Cashtime Life, signing K.O, Moozlie, and Kid X, and guided K.O to become the first South African Hip-Hop artist to hit 1M YouTube views and win SAMA Record of the Year. At UMG Africa, Thabiso held three concurrent directorships (Brand Partnerships, U-Live, Urban Label), managing a roster of 80+ artists including Black Coffee, Nasty C, Mafikizolo, and Rebecca Malope. He launched Def Jam Africa, brokered Nasty C''s Def Jam USA signing, and oversaw the release of Black Coffee x David Guetta''s global hit ''Drive''. A pioneer of Amapiano''s partnership with UMG and a consultant for Global Citizen''s Mandela 100 Festival, Thabiso now leads JO:LA with a vision to sign 40 artists and 55 writers by 2030.',
      array[
        '25+ years in African music industry',
        'Founded Africa''s first Hip-Hop label (Nativz, 1996)',
        'Former UMG Africa triple-director — 80+ artist roster',
        'Launched Def Jam Africa; brokered Nasty C × Def Jam USA',
        'Mandela 100 Festival consultant (Beyoncé & Jay-Z headlined)'
      ],
      'Label Leadership & Artist Development',
      'South Africa',
      '/experts/thabiso.jpg',
      true,
      true
    )
    returning id into v_expert_id;
  else
    -- Row exists — refresh content so re-running picks up bio edits.
    update public.experts set
      bio = 'Founder & CEO of JO:LA. 25+ years building African music. Former UMG Africa triple-director. Pioneer of SA Hip-Hop and Amapiano''s global rise.',
      long_bio = 'Thabiso Khati is a music and entertainment industry leader with over 25 years of experience shaping African culture globally. In 1996, as a student, he founded Nativz Entertainment — Africa''s first exclusively Hip-Hop record label — and secured a landmark distribution deal with Sony Music. He later co-founded Cashtime Life, signing K.O, Moozlie, and Kid X, and guided K.O to become the first South African Hip-Hop artist to hit 1M YouTube views and win SAMA Record of the Year. At UMG Africa, Thabiso held three concurrent directorships (Brand Partnerships, U-Live, Urban Label), managing a roster of 80+ artists including Black Coffee, Nasty C, Mafikizolo, and Rebecca Malope. He launched Def Jam Africa, brokered Nasty C''s Def Jam USA signing, and oversaw the release of Black Coffee x David Guetta''s global hit ''Drive''. A pioneer of Amapiano''s partnership with UMG and a consultant for Global Citizen''s Mandela 100 Festival, Thabiso now leads JO:LA with a vision to sign 40 artists and 55 writers by 2030.',
      highlights = array[
        '25+ years in African music industry',
        'Founded Africa''s first Hip-Hop label (Nativz, 1996)',
        'Former UMG Africa triple-director — 80+ artist roster',
        'Launched Def Jam Africa; brokered Nasty C × Def Jam USA',
        'Mandela 100 Festival consultant (Beyoncé & Jay-Z headlined)'
      ],
      specialty = 'Label Leadership & Artist Development',
      country = 'South Africa',
      avatar_url = '/experts/thabiso.jpg',
      is_verified = true,
      is_active = true
    where id = v_expert_id;
  end if;

  -- 3. Session types — wipe and re-seed 30/60/120 min tiers
  --    (cleanest way to keep pricing canonical across re-runs)
  delete from public.expert_sessions where expert_id = v_expert_id;

  insert into public.expert_sessions (expert_id, duration_minutes, price, currency, is_available)
  values
    (v_expert_id,  30, 1500, 'ZAR', true),
    (v_expert_id,  60, 2500, 'ZAR', true),
    (v_expert_id, 120, 4500, 'ZAR', true);

  raise notice 'Seeded founder expert row (id=%) with 3 sessions.', v_expert_id;
end $$;
