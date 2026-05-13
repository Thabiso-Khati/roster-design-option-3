-- ============================================================
-- ROSTER — Multi-jurisdiction artists
-- ------------------------------------------------------------
-- ROSTER's users (managers, label execs, founders) routinely
-- run rosters that span multiple countries — JO:LA is the
-- canonical example: a South Africa-based operator with artists
-- in Nigeria, South Africa, and elsewhere. The platform must
-- never assume an artist's country from the user's country.
-- Each artist's jurisdiction is set explicitly per artist.
--
-- Most artists belong to exactly ONE country. A minority operate
-- across two (dual citizenship, diaspora artists with home + base
-- territories, dual-PRO registrations). This migration supports
-- both cases by storing country as a list, with the first element
-- treated as the primary for legacy single-flag rendering paths.
--
-- Schema:
--   countries      text[]  — list of country names per artist
--   country_flags  text[]  — list of flag emojis (parallel index)
--
-- The original `country` / `country_flag` columns stay as the
-- "primary" jurisdiction for backwards compat. Application code
-- writes to BOTH (primary text + array of all) so old reads keep
-- working while new UI can render every flag.
-- ============================================================

alter table public.artists
  add column if not exists countries text[] default '{}',
  add column if not exists country_flags text[] default '{}';

-- Backfill arrays from the existing single-value columns so
-- previously-added artists don't show up flagless.
update public.artists
set
  countries = case
    when country is not null and (countries is null or array_length(countries, 1) is null)
      then array[country]
    else countries
  end,
  country_flags = case
    when country_flag is not null and (country_flags is null or array_length(country_flags, 1) is null)
      then array[country_flag]
    else country_flags
  end
where country is not null or country_flag is not null;

comment on column public.artists.countries is
  'Country (or countries, for dual-jurisdiction artists) this artist belongs to. Set per artist — never inferred from the manager''s country. First element mirrors `country` for backwards compat.';
comment on column public.artists.country_flags is
  'Flag emojis matched to `countries` by index. First element mirrors `country_flag`.';

-- Index the array so future "show me all my Nigerian artists"
-- queries are cheap.
create index if not exists artists_countries_gin_idx
  on public.artists using gin (countries);
