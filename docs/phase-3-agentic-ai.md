# ROSTER — Phase 3: Agentic AI Assistant

**Status:** Design only. Build is a multi-week project, deferred until Phase 2 state surfacing is at least at Wave 2.
**Owner:** Thabiso (sole maintainer).
**Why this exists:** Thabiso wants ROSTER to feel like an AI co-pilot that drafts work, suggests next steps, and reduces the "blank page" cost of every operational task — release plans, outreach, media, agreements. This doc is the architecture + scope brief for that work.

This doc is the build briefing — paste it back into a future session to resume cleanly.

---

## 1. The vision (verbatim from Thabiso)

> "I want us to get to a point where the AI works with you, completes your work, suggests next tasks, draft media releases, or outreach emails or WhatsApp messages on the users' behalf."

Generalised: AI doesn't replace the user, it shortens the distance between blank page → useful first draft. User stays the editor and the sender. AI is the writer + the suggester.

---

## 2. What ROSTER already has

`.env.example` already declares `ANTHROPIC_API_KEY=` — so the infrastructure for AI calls exists.

The platform already lists a handful of AI-powered tools per the codebase comments:
- **Brand Studio** — generates brand assets/copy
- **Pitching Scripts** — drafts DSP pitch copy
- **Viral Hooks** — short-form content hook generator

These are **single-shot generators**, not an assistant. Phase 3 is the leap from "press button → get one output" to "AI sees what you're doing and proposes/drafts the right thing at the right moment."

---

## 3. Capability tiers (smallest → largest)

Build in tiers; ship each before starting the next.

### Tier A — Inline drafting (smallest scope, highest ROI)

Wherever a user has to write something, give them a "Draft with AI" button. Not autonomous — just collapses blank-page friction.

**Surfaces:**
- New release one-sheet generator (release name + style → press one-sheet draft)
- Outreach email composer (recipient context → cold email draft, follow-up draft)
- WhatsApp message composer (booking confirmation, gig advance, payment reminder)
- Media release / press release drafts
- Social caption drafts (Reels, TikTok, Instagram post copy)
- Bio drafts (short / medium / long)
- Pitching scripts (already exists — extend with more contexts)

User flow: open the tool → "Draft with AI" button → AI uses the artifact's filled-in fields + relevant context (artist data, recent metrics) → produces draft → user edits, copies/sends manually.

Tier A is **not autonomous**. The AI never sends, never acts. It only fills text boxes the user reviews.

### Tier B — Contextual suggestions on the dashboard

Builds on **Phase 2 state surfacing**. The Compass card already says "you finished Album Budget — start Release Targets next." Tier B upgrades that with:

- "Start Release Targets next — and here's a 60-second draft based on your Album Budget numbers" (one-click pre-fill)
- "Your release date is 14 days away. Here's the press one-sheet I'd send — review and forward it."
- "@[contact name] hasn't heard from you in 21 days. Want me to draft a check-in?"

Tier B is **proactive but not autonomous** — the AI surfaces drafts on the dashboard; user still presses Send.

Hard prerequisite: Phase 2 must be live (need state events to know when to surface).

### Tier C — Multi-step task completion (the big ask)

AI doesn't just draft one message — it sees a task and runs through it.

**Example flows:**
- "Draft my whole release plan for [release name]" → AI fills Plan a Release, drafts Album Budget rough numbers, drafts Release Targets, drafts press one-sheet, drafts Spotify pitch — all simultaneously, all in draft state for user review.
- "Run a tour booking outreach round" → AI takes a list of venue contacts, drafts personalised intro emails per venue (using venue's history with the artist's genre, geographic fit), queues them up for user one-click send.
- "Prepare for my Tuesday 10am with [manager name]" → AI surfaces all relevant context (artist they manage, last conversation, outstanding items) and drafts an agenda.

Tier C requires **structured tool calls** — the AI agent invokes ROSTER's existing routes (PATCH platform metrics, POST releases, etc.) on the user's behalf. Still no auto-sending of external messages — only Roster-internal data writes are auto-applied; everything outbound (email / WhatsApp) is queued for user approval.

### Tier D — Autonomous outbound (highest risk, last to ship)

User explicitly opts a workflow into autonomous mode. Examples:
- "Auto-send weekly metrics digest to [team email]"
- "Auto-confirm booking advance receipts when funds clear in linked bank"
- "Auto-respond to incoming gig enquiry emails with availability + standard rates"

This is the riskiest tier and probably stays gated. Document the path but don't budget for it in initial build.

---

## 4. Architecture

### Core: `lib/ai/agent.ts`

A thin agent runtime built on Anthropic's API. Responsibilities:
1. Build a per-call context from the user's data (artist roster, recent events, the specific artifact they're working on).
2. Call Claude with structured tool definitions (drafting tools, data-write tools, lookup tools).
3. Stream the response back to the UI.
4. Log every call for cost tracking.

Conceptual shape:

```ts
// lib/ai/agent.ts
export interface AgentContext {
  user: { id: string; email: string };
  // Artifact in focus, if any (e.g. user pressed "Draft with AI" on Album Budget)
  focusArtifact?: { type: string; id: string; data: unknown };
  // Recent activity from workspace_events (Phase 2)
  recentEvents?: WorkspaceEvent[];
  // The specific artist this is about
  artist?: { id: string; name: string; metrics: ArtistMetrics };
}

export interface AgentTask {
  // What the user asked for
  intent: 'draft_release_one_sheet' | 'draft_outreach_email' | 'draft_whatsapp'
        | 'suggest_next_step' | 'pre_fill_form' | 'run_workflow';
  // Free-text prompt (when applicable)
  prompt?: string;
}

export async function runAgent(
  ctx: AgentContext,
  task: AgentTask,
  opts?: { stream?: boolean; maxTokens?: number }
): Promise<AgentResult>;
```

### Tool definitions for the agent

Claude's tool-use API gets a curated set of tools the agent can call:

- `lookup_artist(artist_id)` — read artist + latest metrics
- `lookup_events(filter)` — recent workspace events
- `draft_text(format, fields)` — produce a text draft (no side effects)
- `pre_fill_form(form_id, values)` — pre-populate a form for user review (does NOT submit)
- `send_external(channel, recipient, body)` — **gated**. Only callable in Tier D, requires explicit user mode flag.

### Per-user budget

```sql
create table public.ai_usage (
  user_id uuid primary key references auth.users(id),
  monthly_budget_usd numeric not null default 5.00,
  spent_usd numeric not null default 0,
  reset_at timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  updated_at timestamptz not null default now()
);

create table public.ai_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  intent text not null,
  input_tokens int not null,
  output_tokens int not null,
  cost_usd numeric not null,
  occurred_at timestamptz not null default now()
);
```

Every agent call hits a budget check before execution. Over-budget → soft-fail with "AI quota exhausted, resets [date]" message. Logged in `ai_calls` regardless of success for audit.

### Cost control levers
- Default monthly budget per user: low (e.g. $5) — generous enough for daily use of Tier A drafting on Sonnet, restrictive enough to cap a runaway loop.
- Plan-tiered budgets (subscribers get higher caps).
- Use Claude **Haiku** for short drafts (TikTok captions, WhatsApp messages — most calls); **Sonnet** for longer-form content (press releases, multi-paragraph outreach); **Opus** rarely (only if user explicitly invokes "deep mode").
- Always set `max_tokens` aggressively. A WhatsApp draft never needs >300 tokens output.

---

## 5. Specific use cases and design

### 5.1 Outreach email drafter (Tier A — first to ship)

**Context inputs:**
- The contact (name, role, company, last interaction notes)
- The artist (name, genre, recent metrics)
- The intent (intro / follow-up / specific ask)

**System prompt skeleton:**
```
You are drafting a professional outreach email on behalf of [user.name],
who manages [artist.name] (genre: [artist.genre], 28d Reach score [N]).

Recipient: [contact.name] ([contact.role] at [contact.company]).
Previous interaction: [last_event.summary or "no prior contact"].
Goal: [intent].

Voice rules:
- Direct but warm
- Concrete (cite a specific data point about the artist)
- One ask per email
- South African English (no over-Americanised tone)
- Sign off as the user, not as ROSTER
```

**Output:** subject line + body. User edits in a textarea, copies to their email client, sends manually.

### 5.2 Release one-sheet drafter (Tier A)

Inputs: filled-in Plan a Release form + Album Budget summary + Artist bio.
Output: one-page press one-sheet (markdown rendered to PDF on request).
Re-runnable — user can regenerate with feedback ("more focus on the production team").

### 5.3 WhatsApp message drafter (Tier A)

Same pattern but tuned for WhatsApp brevity (under 300 chars, casual tone, no greeting ceremony when it's a follow-up).

Common templates:
- Booking confirmation
- Advance reminder
- Day-of-show check-in
- Payment received acknowledgement
- Polite chase ("any update?")

### 5.4 "Suggest next step" enhancement (Tier B)

When Phase 2 Compass detects a completed artifact with no next-action taken, AI generates a personalised "why this matters" sentence:

> "You've locked Album Budget at R142k. Set Release Targets next — your last single hit 28k streams in week 1, so I'd target 35k for this one given the Reach score uptick."

The rule-driven pairing comes from Phase 2; the AI just personalises the messaging using the user's actual numbers.

### 5.5 Multi-step release prep (Tier C)

User says: "Help me prep [release_name] for launch."

Agent flow:
1. Looks up the release (must already be planned)
2. Lists artifacts that should be filled (Album Budget, Release Targets, Posting Checklist, Pitching Scripts, press one-sheet)
3. Drafts each one in parallel using artist context
4. Returns a single summary view: "I've drafted these 5 items. Open each to review."

Each drafted artifact stays in **draft state** until user opens, reviews, and explicitly saves.

---

## 6. Safety rails

The non-negotiable list:

| Rule | Why |
|---|---|
| **Never auto-send** outbound communications without explicit user confirmation per-message (Tier A–C). | Misdirected emails are reputation-destroying. The user trusts the AI as a writer, not as a sender. |
| **All drafts must be edited or accepted before they take effect.** | Even pre-fill into a form requires user to review before save. |
| **Hard budget caps** at the user level. | A buggy loop can't bankrupt anyone. |
| **Per-call tokens cap** at 4000 output max default, 8000 hard ceiling. | One pathological call doesn't blow the budget. |
| **No ingestion of contracts, financials, or sensitive contact data into model context** without an explicit "deep mode" toggle. | Privacy by default. The agent reads metrics + names + roles, NOT contract bodies or financial transactions. |
| **All external action calls (email send, payment trigger, etc.) require a 2-second confirmation modal** with full preview. | Friction is the feature. |
| **Logging every call to `ai_calls`** including tool calls + token counts + intent. | Auditable. |
| **Refusal on prompts that look like jailbreaks / off-topic requests** (medical, legal, financial advice not specific to the user's roster). | Protects against scope drift. |

### Data scoping: what AI can read

- Artist names, genres, country, public metrics (Reach/Momentum/Engagement scores, follower counts, monthly listeners) — **always**
- Contact names, roles, companies — **with consent** (user opts in per-contact via a "AI can use this contact" toggle)
- Workspace events (which tools were touched when) — **always**
- Filled-in form/checklist data — **only when the user has the artifact open and presses "Draft with AI"** (i.e. transient, not bulk-read)
- Contracts / agreement bodies — **never** in default mode
- Financial figures (budgets, P&L) — **only with explicit "use my financial data" toggle per session**

---

## 7. UX rules

- **Always show "Draft with AI" buttons** in a consistent visual treatment so users know which features are AI-powered.
- **Always show what will be sent to the AI** before the call. A small "Reviewing 3 sources: artist [name], release [title], contact [name]" label.
- **Stream responses** for any output >100 tokens — perceived latency matters.
- **Edit-before-accept** is the default state. AI never directly mutates user-visible data.
- **"Why this draft?"** affordance — clicking it shows the reasoning summary (which signals the AI used).
- **Quick-feedback loop:** thumbs up/down on each draft. Drives Phase 4+ iteration but no auto-tuning yet.

---

## 8. Rollout / phased build

### Tier A (3–5 weeks of focused build)

Wave 1 — Foundation:
- AI agent runtime (`lib/ai/agent.ts`)
- Per-user budget table + middleware
- Cost logging
- "Draft with AI" UI primitive (button + textarea pattern)

Wave 2 — Surfaces:
- Outreach email drafter
- WhatsApp message drafter
- Release one-sheet drafter

### Tier B (~2 weeks, after Phase 2 Wave 2)

- Compass card AI personalisation (drafts + reasoning)
- "Pre-fill this form using my recent data" buttons on each tool

### Tier C (4–6 weeks)

- Multi-step workflow runner
- "Help me prep this release" / "Help me run this booking round" flows

### Tier D (deferred — explicit opt-in only)

- Autonomous outbound, gated behind subscription tier + per-feature opt-in

---

## 9. Cost projection (rough)

Assuming Claude Haiku at $0.25 / $1.25 per M input/output tokens:
- Average outreach email draft: ~1500 input tokens (context) + 400 output tokens = ~$0.001
- WhatsApp draft: ~500 input + 100 output = ~$0.0002
- Release one-sheet: ~3000 input + 1500 output = ~$0.003

A user drafting 50 emails + 30 WhatsApps + 5 one-sheets per month ≈ $0.07/month. **Negligible** at the unit level. Sonnet bumps this 5–10×, still cheap.

The risk isn't unit cost, it's:
1. **Loops** — agentic Tier C flows that retry/re-draft 20× each turn. Hard token caps + budget caps fix this.
2. **Tier C parallelism** — "draft 5 items at once" multiplies single-call costs. Same fixes apply.
3. **Abuse** — a user batch-generating 1000 captions. Budget caps fix this.

Default user budget of **$5/month** gives a comfortable ~5000 short drafts. More than enough for actual use; small enough to cap any pathology.

---

## 10. Open design questions

1. **Voice/tone calibration.** AI writes generically by default. Do we let users upload 3–5 examples of their preferred email/WhatsApp voice and have the agent mirror that style? (Yes-recommended, but adds complexity; optional toggle.)
2. **Multi-language.** Many SA artists communicate in English + isiZulu / isiXhosa / Sotho / Afrikaans. Agent should handle these. Anthropic models are decent multilingual but not native. Plan to support EN-first, add other SA languages as a Wave 3.
3. **Memory across sessions.** Should the agent remember previous drafts the user accepted/rejected? (Yes-recommended for tone learning, no for raw data — keep memory thin and explicit.)
4. **Subscription tier integration.** Does the AI have free-tier, paid-tier behaviour? Recommended: free users get Haiku-only + low budget; paid get Sonnet + higher budget; agency/team get even higher.
5. **Where does the assistant live in the UI?** A persistent right-side panel? A modal triggered by `/` key? Inline buttons on each tool? **Recommended: inline first** (Tier A), persistent panel later (Tier B+).
6. **Audit log visibility.** Should users see "AI drafted this" badges on artifacts they let AI pre-fill? (Yes-recommended for transparency.)

---

## 11. What ROSTER's competitive position is here

Most music industry tools haven't built proper agentic workflows yet. The companies trying:
- **Soundcharts / Chartmetric** — analytics-first, no drafting layer
- **Symphony / Linkfire** — link-in-bio + smart links, no agent
- **Hypeauditor** — analytics, manual outreach
- **Soundplate** — outreach automation but manual templates

ROSTER's edge if Phase 3 ships well: it's the only African-music-context-aware assistant. The model knows what amapiano is, what the SA radio circuit looks like, what Boomplay vs Audiomack means in NG vs SA. Localisation is the moat.

---

## 12. What to paste back when resuming

> "Phase 3 — let's start Tier A. Wave 1 first: agent runtime + budget + cost logging + Draft-with-AI primitive. Decisions on open questions: [your answers to §10 questions 1–6]."

If Phase 2 isn't at Wave 2 yet, Tier B + C builds wait — flag that as a dependency.

---

## 13. Total estimated cost for full Phase 3

- Tier A: 3–5 weeks
- Tier B: ~2 weeks (post Phase 2 Wave 2)
- Tier C: 4–6 weeks
- Tier D: deferred indefinitely

**Realistic full-build calendar: 4–6 months elapsed** as a side-of-desk project. Faster if it's the primary focus.

LLM cost during build: trivial (developer testing, a few dollars). LLM cost in production scales with users — model unit economics into pricing before scaling to 100+ paying users.
