# ROSTER V3 — Supabase Migrations

Run these in order against any fresh Supabase project. Each file is
idempotent (safe to re-run).

## How to apply

1. Open the Supabase Dashboard → SQL Editor
2. Paste the contents of each file in numeric order
3. Run, confirm success, move to the next

## Order

| # | File | Purpose |
|---|------|---------|
| 001 | schema.sql | Base tables: profiles, experts, expert_sessions, bookings |
| 002 | expert-onboarding-p1.sql | Onboarding columns on experts (paystack_subaccount_code, etc.) |
| 003 | expert-onboarding-p2.sql | Continuation — go-live state, audit columns |
| 004 | thabiso-as-expert.sql | Seeds founder (Thabiso Khati) as the first real expert |
| 005 | expert-dashboard-rls.sql | RLS fix so paused/onboarding experts can read their own row |
| 006 | meetings.sql | Daily.co meeting room columns on bookings |
| 007 | artists.sql | Artists table (linked to manager profile) |
| 008 | spotify-tokens.sql | OAuth tokens for Spotify Web API |
| 009 | monthly-listeners.sql | Cached Spotify monthly listener counts |
| 010 | s4a-metrics.sql | Spotify-for-Artists metrics snapshots |
| 011 | profiles-insert-policy.sql | INSERT policy on public.profiles |
| 012 | releases.sql | Artist releases table |
| 013 | reminders.sql | Dashboard reminders widget |
| 014 | seed-jola-releases.sql | Seed JO-LA releases (dev only) |
| 015 | seed-jola-artists.sql | Seed JO-LA artists (dev only) |
| 016 | multi-jurisdiction.sql | Multi-country support on artists |
| 017 | cleanup-stale-jola-artists.sql | Remove stale dev seed data |
| 018 | artist-platform-metrics.sql | Platform metrics table (Audiomack, YouTube, etc.) |
| 019 | artist-platform-handles.sql | Platform handles on artists |
| 020 | workspace-events.sql | Workspace audit events |
| 021 | ai-usage.sql | Per-user AI budget + call audit log |
| 022 | roster-ai-conversations.sql | AI chat conversations + messages (14-day prune fn) |
| 023 | onboarding.sql | Artist onboarding checklist |
| 024 | team-workspace.sql | Multi-seat workspace + team members |
| 025 | multi-tier-subscriptions.sql | Pro / Agency / Enterprise subscription tiers |
| 026 | artist-limit-trigger.sql | DB constraint enforcing per-tier artist limit |
| 027 | increment-ai-spent-rpc.sql | Atomic `increment_ai_spent` Postgres RPC |
| 028 | esign.sql | E-sign signing requests + audit trail |
| 029 | anomaly-suggestions.sql | Z-score anomaly events + proactive suggestions |
| 030 | ui-language.sql | User language / locale preference |
| 031 | fan-crm.sql | Fan CRM — fan_contacts, fan_segments, fan_segment_members, fan_broadcast_templates |
| 032 | masterclasses-seed.sql | Seed 12 masterclass entries (curriculum live; attach vimeo_id when videos are ready) |
| 033 | artist-tiktok-tokens.sql | Per-artist TikTok OAuth tokens + tiktok_open_id / tiktok_display_name columns on artists |

## Notes

- Migration 004 (`thabiso-as-expert.sql`) requires Thabiso to have signed
  in at least once so `auth.users` has a row keyed on `thabiso.khati@gmail.com`.
- **This is the single source of truth for all migrations.** The old
  `supabase/migrations/` directory has been merged in (formerly date-prefixed
  files 028–030 are now numbered sequentially here).
- If you ever add a new migration, give it the next available number
  (e.g. 031-...) so the order stays unambiguous.
