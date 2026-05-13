# ROSTER — Phase 2: Cross-Platform State Surfacing

**Status:** Design only. Build deferred until Thabiso signs off on the data model + UX rules.
**Owner:** Thabiso (sole maintainer).
**Why this exists:** Right now every tool, checklist, contract template, and contact list is a silo. The Dashboard's three cards (Reminders / Pipeline / Compass) don't know what state any of those items are in. This design wires every workspace artifact to the dashboard so "what needs you" becomes a real question with a real answer.

This doc is the build briefing — paste it back into a future session to resume cleanly.

---

## 1. The vision (verbatim from Thabiso)

> "If I am working on a Tour Budget and have not completed it this should pop up on the dashboard. Or if I have completed it but have not taken next steps that should also pop up on the dashboard."

Generalised: every work artifact has a lifecycle, and the dashboard surfaces wherever the user is stuck or has left something incomplete.

**Lifecycle states for any artifact:**
1. **Untouched** — never opened
2. **Started** — opened, some data entered, not finished
3. **In-progress** — actively being edited (within the last ~48h)
4. **Stale** — started >7 days ago, no activity since, not yet completed
5. **Completed** — all required fields filled / all checklist items checked
6. **Completed-no-next-action** — completed but the natural next step hasn't been taken
7. **Archived** — user explicitly marked done/dismissed

The dashboard's three cards consume state like this:

| Card | Surfaces | Examples |
|---|---|---|
| **Reminders — "What needs you"** | Stale + In-progress (>3 days) artifacts | "Your Tour Budget for Cape Town show is 80% done — finish it" |
| **Pipeline — "Next Releases"** | Releases + tour bookings + outstanding contracts | "Drop in 5 days. Release Targets sheet still empty" |
| **Compass — "Where to focus next"** | Completed-no-next-action artifacts (suggested follow-ups) | "Album Budget locked — start Release Targets next" |

---

## 2. Current state of the codebase (what we have to work with)

### Tools structure
- Live under `/dashboard/tools/*` (calculators, planners, P&L sheets) and `/dashboard/library/*/...` (forms, templates, contracts).
- Most tools auto-save to **browser localStorage** for 90 days. Banner on each tool: "All tools auto-save to this device for 90 days."
- **No server-side persistence** for most tools today. This is the central design constraint.

### What IS server-side already
- `artists` (with stats / metrics)
- `releases` (the Pipeline → Next Releases data)
- `contacts`
- `bookings` (expert bookings, not artist bookings)
- `subscriptions`
- `expert_*` tables

### What is NOT server-side
- Album budget figures, tour budget figures, P&L sheets
- Filled-in template values (label copy, lyric sheet, producer agreement, etc.)
- Checklist completion state (release checklist, posting checklist, run sheet, etc.)

### Implication
Phase 2 cannot work for any tool that lives only in localStorage — the dashboard renders server-side and can't read a user's localStorage. We need either:

- **Option A — Migrate tools to server-side persistence** (clean but big lift, many tools to update, also raises privacy/data-export questions)
- **Option B — Hybrid: tools keep localStorage as primary store, but emit small "state events" to the server** (just metadata: "user X opened tool Y at time Z, completion=42%"). Server stores events, dashboard reads aggregated events. **Recommended.**

Option B is cheaper (small writes, no full-payload mirroring), respects the existing UX where data is local-first, and gives us the dashboard signal we need.

---

## 3. Proposed data model

### Core table: `workspace_events`

```sql
create table public.workspace_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- What kind of artifact is this event about
  artifact_type text not null check (artifact_type in (
    'tool',          -- calculator/planner (Album Budget, Tour Budget, etc.)
    'form',          -- fillable template (Label Copy, Lyric Sheet, etc.)
    'checklist',     -- multi-step interactive checklist
    'contract',      -- contract template being filled in
    'release',       -- planned release (already in `releases` table — events here track activity around it)
    'contact',       -- a person in the contacts module
    'booking',       -- a tour/show booking
    'agreement'      -- signed agreement/document
  )),

  -- Stable identifier for the artifact within its type:
  --   • For known server-backed entities: the row's UUID (release_id, contact_id, etc.)
  --   • For localStorage-backed tools: a synthetic key like "album-budget" or
  --     "album-budget:cape-town-tour" if multi-instance.
  artifact_id text not null,

  -- Human label cached at event time so dashboard cards don't need a join
  -- to display the artifact name (e.g. "Album Budget — Q3 2026 release").
  artifact_label text,

  -- The lifecycle event that just happened
  event_type text not null check (event_type in (
    'opened',        -- user navigated to the artifact
    'edited',        -- user changed a field (debounced, see §4)
    'completed',     -- artifact reached its "done" state
    'dismissed',     -- user explicitly dismissed/archived
    'reopened'       -- previously-completed artifact reopened (signals a revision)
  )),

  -- Completion ratio at the time of the event (0.0 to 1.0). NULL if not
  -- meaningful (e.g. a contact doesn't have a completion %).
  completion_pct numeric(4, 3),

  -- Optional structured payload — used sparingly. Keep this small;
  -- it's NOT a place to mirror the full artifact data. Examples:
  --   • For a release: { "release_date": "2026-06-12", "status": "planned" }
  --   • For a checklist: { "items_done": 7, "items_total": 12 }
  metadata jsonb,

  occurred_at timestamptz not null default now()
);

-- Lookup pattern: "give me the latest event per (user, artifact)" for
-- dashboard aggregation. This index makes that cheap.
create index workspace_events_user_artifact_recent_idx
  on public.workspace_events (user_id, artifact_type, artifact_id, occurred_at desc);

-- "All my events in last N days" pattern.
create index workspace_events_user_recent_idx
  on public.workspace_events (user_id, occurred_at desc);

alter table public.workspace_events enable row level security;

create policy "owner can read own events"
  on public.workspace_events for select
  using (user_id = auth.uid());

create policy "owner can insert own events"
  on public.workspace_events for insert
  with check (user_id = auth.uid());
```

### Materialised view: `workspace_artifact_state` (optional optimisation)

The dashboard cards query "latest event per artifact" frequently. We can either:

1. **Compute on read** (PostgREST query with `distinct on (artifact_type, artifact_id)` ordered by `occurred_at desc`) — simpler, fine until the events table is large.
2. **Materialised view** refreshed by a trigger on insert — faster reads, slightly more complex to maintain.

Start with option 1. Migrate to option 2 when the events table crosses ~100k rows per user (probably never for a one-person team, but document the migration path).

---

## 4. Tool integration pattern

Each tool wires up identically — minimal boilerplate.

### Client-side hook: `useWorkspaceTracking`

```ts
// lib/hooks/use-workspace-tracking.ts
export function useWorkspaceTracking(opts: {
  artifactType: 'tool' | 'form' | 'checklist' | 'contract';
  artifactId: string;        // stable key per tool instance
  artifactLabel: string;     // for dashboard display
  computeCompletion: () => number;  // 0..1, called on each emit
}): { markCompleted: () => void; markDismissed: () => void };
```

Behaviour:

1. **On mount:** emit `opened` event (debounced — don't emit if a previous `opened` event exists within last 60 seconds, so accidental re-renders don't spam events).
2. **On data change:** debounce 5 seconds, emit `edited` event with current `completion_pct`. (Local typing → 5s of inactivity → one event. Avoids per-keystroke events.)
3. **On `markCompleted()`:** emit `completed` event. Tool calls this when its "done" condition is met.
4. **On `markDismissed()`:** emit `dismissed` event.

### What "completion" means per artifact type

Tool authors define `computeCompletion()` themselves. Conventions:

- **Calculators (Album Budget, Tour Budget):** `(filled_required_fields / total_required_fields)`. 1.0 = saved + every required field non-zero.
- **Forms (Label Copy, Lyric Sheet):** same — required fields filled.
- **Checklists (Release Checklist, Posting Checklist):** `(items_checked / items_total)`.
- **Contracts:** all blanks filled + at least one party identified.

Tools that don't naturally have a completion concept (e.g. "Industry Directory" — a static reference doc) skip Phase 2 entirely. They're not artifacts in this model.

### Server endpoint: `POST /api/workspace/events`

Accepts the event payload, RLS validates user_id matches session, inserts into `workspace_events`. Idempotent on `(user_id, artifact_type, artifact_id, event_type, occurred_at)` — prevents double-fires from racing client-side debouncing.

---

## 5. Dashboard aggregation rules

### Reminders card — "What needs you"

Surfaces artifacts where the user is **stuck**. Query:

```
SELECT artifact, latest_event
FROM workspace_artifact_state
WHERE user_id = $session_user
  AND latest_event_type IN ('opened', 'edited')
  AND latest_event.completion_pct < 1.0
  AND latest_event.occurred_at < (now() - interval '3 days')
ORDER BY latest_event.occurred_at ASC
LIMIT 5;
```

Plain English: "Show me artifacts I've started, haven't finished, and haven't touched in 3+ days." Sorted oldest-first because those are the most stuck.

Empty-state: "Nothing's slipping. You're caught up." (with a quiet illustration).

### Pipeline card — "Next Releases" (already exists, expand its sources)

Currently driven only by `releases` table. Expand to also surface:

- Releases with empty Release Targets (completed-no-next-action signal)
- Releases whose distributor is unset within 14 days of release date
- Tour bookings without a Tour Budget

Same query pattern as Reminders, just filtered by `artifact_type IN ('release', 'booking')` and joined to next-step detection (§6).

### Compass card — "Where to focus next"

The new one. Surfaces **completed-no-next-action** artifacts with suggested follow-ups. Query:

```
Find artifacts with latest_event_type = 'completed' AND
  no follow-up artifact exists per the next-step rule table (§6)
```

Examples:
- Album Budget completed → no Release Targets sheet started → "Album Budget locked. Set Release Targets next →"
- Producer Agreement completed → no Sample Clearance for the same release → "You've signed the producer agreement. Did you clear all samples?"
- Contact added (artist manager) → no outreach event in 14 days → "You added [Manager Name] but haven't reached out. Draft an intro email →"

The action link on each Compass row jumps directly to the suggested next tool, pre-populated where possible.

---

## 6. Next-step detection — the rule table

Stored as a hand-curated config, not derived. Each rule is:

```ts
type NextStepRule = {
  trigger: { artifactType: string; artifactId: string }; // exact match, e.g. "tool:album-budget"
  follow_up: {
    artifactType: string;
    artifactId: string;
    label: string;           // CTA text in Compass
    reasoning: string;       // tooltip / "Why this?"
  };
  // Optional condition: only fire follow-up if this predicate is true
  condition?: 'related_release_within_30d' | 'no_existing_artifact';
};
```

### Initial rule set (curated by Thabiso, refined over time)

| When you complete... | We suggest you start... |
|---|---|
| Album Budget | Release Targets |
| Release Targets | Posting Checklist + Pitching Scripts |
| Tour Budget | Booking Advance + Stage Plot |
| Producer Agreement | Sample Clearance Form (per track) |
| Sample Clearance | Session/Song Form |
| Booking Advance | Run Sheet + Set List |
| New Contact added | Draft outreach (Phase 3 — agentic) |
| Plan a Release saved | Album Budget if not started |

Rules live in `lib/workspace/next-step-rules.ts` — one source of truth, easy to amend.

---

## 7. UX rules for dashboard cards

- **Maximum 5 items per card** to keep the dashboard scannable.
- Each card shows a "View all" link → `/dashboard/reminders` / `/dashboard/pipeline` / `/dashboard/compass` listing pages (build later if needed).
- **Snooze** affordance — user can hide an item for 24h / 7d / forever. Snooze events are also rows in `workspace_events` with `event_type = 'dismissed'` + `metadata: { snooze_until: ISO_DATE }`.
- **No nag-modals** — these cards inform, they don't interrupt.
- **Empty state matters.** "You're caught up" is its own design moment — should feel earned, not blank.

---

## 8. Rollout / migration path

The full vision touches every tool. Don't ship at once — phased rollout:

### Wave 1 (proof of concept, ~1 week)
- Build the events table + the hook + the server endpoint
- Wire to **3 tools** as the test set:
  - Album Budget (most-used)
  - Plan a Release (already touches the Pipeline card, so we can validate the full loop)
  - Release Checklist (a checklist, validates the items_done/items_total pattern)
- Build the Reminders card with these 3 sources
- Ship behind an env flag (`NEXT_PUBLIC_ENABLE_WORKSPACE_EVENTS=1`) so it can be turned off if it misbehaves

### Wave 2 (~1 week)
- Wire remaining Work Tools (Tour Budget, Cashflow, P&L sheets, etc.)
- Build Compass card with first batch of next-step rules
- Expand Reminders to all server-backed artifact types

### Wave 3 (~1 week)
- Wire Forms & Templates (Label Copy, Lyric Sheet, Producer Agreement, etc.)
- Wire Checklists (Posting, Run Sheet, etc.)
- Wire Contacts module (artifact_type='contact', "no outreach in N days" rule)
- Pipeline card upgrades

### Wave 4 (later)
- Snooze + dismissal UX polish
- "View all" listing pages
- Per-card customisation (user can hide categories they don't care about)

---

## 9. Open design questions (need Thabiso's call before building)

1. **Multi-instance tools.** A user may have multiple tour budgets (one per tour). How do we let them name/identify each one? Proposal: every tool that supports multiple instances gets a "Project" or "Release" picker at the top — `artifact_id` becomes `tool:tour-budget:cape-town-tour`. Single-instance tools keep `artifact_id = tool:<slug>`.

2. **localStorage vs server completion %.** If a user clears localStorage (or switches devices), their artifact's actual data is gone but the events history says "70% complete". Show what? Proposal: the `edited` events are advisory, not authoritative. If the user lands on the tool fresh and it's empty, that's the truth — events get a "data not found" annotation in the dashboard card.

3. **Should the events DB also store the FULL artifact data**, not just metadata? This is the "migrate to server-side persistence" path. Pros: cross-device sync, real backups, audit trail. Cons: privacy implications, larger DB, contracts contain sensitive info. Proposal: NO for now — keep events lean, full data stays in localStorage. Revisit when we have enough users to justify the storage cost AND the cross-device need is real.

4. **Time zones for "stale".** "3 days" should be calendar days in the user's timezone, not a flat 72h, so a user in CAT doesn't see things go stale at weird hours. Proposal: store user timezone on `profiles` row, compute staleness in user-local terms.

5. **Rule conflicts.** What if Album Budget completion triggers BOTH "start Release Targets" AND "start Posting Checklist"? Show both? Proposal: rules can stack, but Compass card only shows the first non-snoozed one per trigger artifact.

---

## 10. Estimated build cost

Wave 1: ~1 week of focused work
Wave 2: ~1 week
Wave 3: ~1 week
Wave 4: ~3-5 days

**Total ~3-4 weeks of build time** if Thabiso is the only engineer and treats this as the primary focus. Realistically with other priorities mixed in, plan for 6-8 weeks elapsed.

---

## 11. What to paste back when resuming

> "Phase 2 state surfacing — let's go. Wave 1: Album Budget + Plan a Release + Release Checklist as test set. Decisions on open questions: [your answers to §9 questions 1–5]."

That gets us straight into building.

If any of the §9 questions are still TBD when you resume, we can answer them inline before Wave 1 starts.
