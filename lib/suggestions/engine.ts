/**
 * Proactive Suggestion Engine — AI Tier B
 * ────────────────────────────────────────
 * Evaluates 4 rule categories nightly and writes proactive_suggestions:
 *
 *   1. anomaly_driven         — joins anomaly_events; spike → pitch idea
 *   2. recoupment             — reads advance_recoupment data; near-recouped → renegotiation prep
 *   3. stalled_workspace_event — workspace_events untouched > 4 days
 *   4. calendar_driven        — fixed industry calendar (SAMA window opens, royalty distributions)
 *
 * Each rule is independent + idempotent (dedup_key prevents dupes).
 *
 * Optional AI augmentation: rules can call /lib/ai/budget.ts to draft
 * an action body (e.g. an email to a sync sup). Skipped in MVP — flag
 * AI_TIER_B_DRAFT_ACTIONS=true in .env.local to enable.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreArtist } from "@/lib/scoring";
import type { MetricSnapshot, Platform } from "@/lib/scoring/types";
import { logger } from "@/lib/logger";

interface SuggestionInput {
  userId: string;
  artistId?: string | null;
  ruleCategory: "anomaly_driven" | "recoupment" | "stalled_workspace_event" | "calendar_driven" | "opportunity";
  ruleId: string;
  priority?: "low" | "medium" | "high" | "urgent";
  title: string;
  body?: string;
  actionLabel?: string;
  actionHref?: string;
  expiresAt?: string;
  sourceAnomalyId?: string | null;
  sourceEventId?: string | null;
  sourceMetadata?: Record<string, unknown>;
  dedupKey: string;
}

async function upsertSuggestion(s: SuggestionInput): Promise<"inserted" | "skipped" | "error"> {
  const admin = createAdminClient();
  const { error } = await admin.from("proactive_suggestions").insert({
    user_id: s.userId,
    artist_id: s.artistId ?? null,
    rule_category: s.ruleCategory,
    rule_id: s.ruleId,
    priority: s.priority ?? "medium",
    title: s.title,
    body: s.body ?? null,
    action_label: s.actionLabel ?? null,
    action_href: s.actionHref ?? null,
    expires_at: s.expiresAt ?? null,
    source_anomaly_id: s.sourceAnomalyId ?? null,
    source_event_id: s.sourceEventId ?? null,
    source_metadata: s.sourceMetadata ?? {},
    dedup_key: s.dedupKey,
  });
  if (error) {
    if (error.code === "23505") return "skipped";
    logger.error("[suggestions] insert error", { dedupKey: s.dedupKey }, error);
    return "error";
  }
  return "inserted";
}

// ── Rule 1: anomaly-driven ──────────────────────────────────────
async function ruleAnomalyDriven(): Promise<number> {
  const admin = createAdminClient();
  const { data: anomalies } = await admin
    .from("anomaly_events")
    .select("id, user_id, artist_id, metric_key, platform, direction, severity, pct_change, current_value, detected_at")
    .in("status", ["open", "acknowledged"])
    .gte("detected_at", new Date(Date.now() - 7 * 86400_000).toISOString())
    .limit(200);

  if (!anomalies || anomalies.length === 0) return 0;

  let inserted = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const a of anomalies as Array<{
    id: string;
    user_id: string;
    artist_id: string | null;
    metric_key: string;
    platform: string | null;
    direction: string;
    severity: string;
    pct_change: number | null;
    current_value: number;
    detected_at: string;
  }>) {
    const pct = Math.abs(Number(a.pct_change ?? 0)).toFixed(0);
    const isSpike = a.direction === "spike";
    const platformLabel = a.platform ? a.platform[0].toUpperCase() + a.platform.slice(1) : "Platform";

    const title = isSpike
      ? `${platformLabel} ${a.metric_key.replace(/_/g, " ")} up ${pct}% — capitalise now`
      : `${platformLabel} ${a.metric_key.replace(/_/g, " ")} down ${pct}% — investigate`;

    const body = isSpike
      ? `Trailing 7-day average is ${pct}% above the prior 30-day baseline. Pitch this song / artist for sync, push to playlists, or run a paid amplification while momentum is fresh.`
      : `Trailing 7-day average is ${pct}% below the prior 30-day baseline. Possible causes: algorithmic deprioritisation, seasonal dip, removed playlist placement, or a release cycle ending. Worth a quick audit.`;

    const result = await upsertSuggestion({
      userId: a.user_id,
      artistId: a.artist_id,
      ruleCategory: "anomaly_driven",
      ruleId: `anomaly_${a.direction}_${a.severity}`,
      priority: a.severity === "critical" ? "urgent" : a.severity === "major" ? "high" : "medium",
      title,
      body,
      actionLabel: isSpike ? "Open sync pitch" : "Open artist scorecard",
      actionHref: isSpike
        ? "/dashboard/library/sync"
        : a.artist_id
          ? `/dashboard/artists/${a.artist_id}`
          : "/dashboard/library/startup/artist-scorecard",
      sourceAnomalyId: a.id,
      sourceMetadata: { metricKey: a.metric_key, pctChange: a.pct_change, severity: a.severity },
      dedupKey: `anomaly:${a.id}:${today}`,
      expiresAt: new Date(Date.now() + 14 * 86400_000).toISOString(),
    });
    if (result === "inserted") inserted++;
  }
  return inserted;
}

// ── Rule 2: recoupment ──────────────────────────────────────────
// Reads advance recoupment data IF the user has any. Threshold: 75-95% recouped → renegotiation window.
async function ruleRecoupment(): Promise<number> {
  const admin = createAdminClient();

  // Try to read the advance recoupment table; if it doesn't exist or is empty, skip silently.
  const { data: rows, error } = await admin
    .from("advance_recoupment")
    .select("id, user_id, artist_id, artist_name, advance_amount, recouped_amount")
    .limit(500);

  if (error || !rows) return 0;

  let inserted = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const r of rows as Array<{
    id: string;
    user_id: string;
    artist_id: string | null;
    artist_name: string | null;
    advance_amount: number;
    recouped_amount: number;
  }>) {
    if (!r.advance_amount || r.advance_amount <= 0) continue;
    const pct = (Number(r.recouped_amount ?? 0) / Number(r.advance_amount)) * 100;
    if (pct < 75 || pct > 95) continue; // window where renegotiation makes sense

    const result = await upsertSuggestion({
      userId: r.user_id,
      artistId: r.artist_id,
      ruleCategory: "recoupment",
      ruleId: "advance_near_recouped",
      priority: "high",
      title: `${r.artist_name ?? "An artist"} is ${pct.toFixed(0)}% recouped — start renegotiation prep`,
      body: `Once recoupment crosses 100%, the artist's leverage in renegotiation increases substantially. Now is the window to begin commercial conversations with the label.`,
      actionLabel: "Open recoupment tracker",
      actionHref: "/dashboard/library/royalties/advance-recoupment-tracker",
      sourceMetadata: { recoupmentPct: pct, advance: r.advance_amount, recouped: r.recouped_amount },
      dedupKey: `recoupment:${r.id}:${today}`,
      expiresAt: new Date(Date.now() + 30 * 86400_000).toISOString(),
    });
    if (result === "inserted") inserted++;
  }
  return inserted;
}

// ── Rule 3: stalled workspace events ────────────────────────────
async function ruleStalledEvents(): Promise<number> {
  const admin = createAdminClient();
  const fourDaysAgo = new Date(Date.now() - 4 * 86400_000).toISOString();

  const { data: rows, error } = await admin
    .from("workspace_events")
    .select("id, user_id, artist_id, artifact_type, artifact_label, progress_pct, last_touched_at")
    .gte("progress_pct", 30)
    .lt("progress_pct", 100)
    .lte("last_touched_at", fourDaysAgo)
    .order("last_touched_at", { ascending: false })
    .limit(200);

  if (error || !rows) return 0;

  let inserted = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const r of rows as Array<{
    id: string;
    user_id: string;
    artist_id: string | null;
    artifact_type: string;
    artifact_label: string | null;
    progress_pct: number;
    last_touched_at: string;
  }>) {
    const daysIdle = Math.floor((Date.now() - new Date(r.last_touched_at).getTime()) / 86400_000);
    const result = await upsertSuggestion({
      userId: r.user_id,
      artistId: r.artist_id,
      ruleCategory: "stalled_workspace_event",
      ruleId: "tool_stalled",
      priority: daysIdle > 14 ? "high" : "medium",
      title: `${r.artifact_label ?? r.artifact_type} ${r.progress_pct}% complete — untouched ${daysIdle} days`,
      body: `Pick this back up to keep momentum. Half-finished tools tend to get abandoned; the cost of finishing this one is much smaller now than a fresh restart later.`,
      actionLabel: "Open tool",
      actionHref: `/dashboard/tools/${r.artifact_type}`,
      sourceEventId: r.id,
      sourceMetadata: { artifactType: r.artifact_type, progressPct: r.progress_pct, daysIdle },
      dedupKey: `stalled:${r.id}:${today}`,
      expiresAt: new Date(Date.now() + 14 * 86400_000).toISOString(),
    });
    if (result === "inserted") inserted++;
  }
  return inserted;
}

// ── Rule 4: calendar-driven ─────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
  windowStartIso: string;
  windowEndIso: string;
  // Targeted countries — null = global
  countries?: string[];
}

const INDUSTRY_CALENDAR: CalendarEvent[] = [
  {
    id: "samas_submission_window_2026",
    title: "SAMAs submissions open soon",
    body: "South African Music Awards submissions typically open mid-year. If your artist's eligible release dropped in the qualifying window, prep the submission package — it's a 4-week build (release credits, audio masters, marketing assets, video links).",
    actionLabel: "Open Awards Submissions",
    actionHref: "/dashboard/library/pr-press/awards-submissions",
    windowStartIso: "2026-05-01T00:00:00Z",
    windowEndIso: "2026-08-15T00:00:00Z",
    countries: ["South Africa"],
  },
  {
    id: "headies_submission_window_2026",
    title: "The Headies submission window — Nigeria",
    body: "The Headies awards submission cycle. Submit eligible work for your Nigerian artists; deadline is firm.",
    actionLabel: "Open Awards Submissions",
    actionHref: "/dashboard/library/pr-press/awards-submissions",
    windowStartIso: "2026-09-01T00:00:00Z",
    windowEndIso: "2026-11-15T00:00:00Z",
    countries: ["Nigeria"],
  },
  {
    id: "samro_distribution_q2_2026",
    title: "SAMRO distribution coming up",
    body: "South African royalty collection society SAMRO typically distributes quarterly. Reconcile your statements + flag any missing live performance or broadcast claims now.",
    actionLabel: "Open Royalty Statement Reconciliation",
    actionHref: "/dashboard/library/royalties/royalty-statement-reconciliation",
    windowStartIso: "2026-05-15T00:00:00Z",
    windowEndIso: "2026-06-30T00:00:00Z",
    countries: ["South Africa"],
  },
];

async function ruleCalendarDriven(): Promise<number> {
  const admin = createAdminClient();
  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7); // "YYYY-MM" — dedup per month

  // ── Step 1: filter to only active calendar events (O(events), in JS) ─────
  // With 10-50 calendar events per year this is negligible. No DB round-trip.
  const activeEvents = INDUSTRY_CALENDAR.filter((ev) => {
    const start = new Date(ev.windowStartIso);
    const end   = new Date(ev.windowEndIso);
    return now >= start && now <= end;
  });

  if (activeEvents.length === 0) return 0;

  let totalInserted = 0;

  // ── Step 2: one DB query + one bulk insert PER active event ───────────────
  // Previously: O(users × events) individual upserts.
  // Now:        O(active_events) queries, each inserting a batch of rows.
  // At 1,000 users and 3 active events: 3 queries instead of 3,000.
  for (const ev of activeEvents) {
    // Fetch eligible users in a single query.
    // country filter: if the event targets specific countries, only fetch
    // users whose profile.country is in that list; otherwise fetch all.
    let query = admin.from("profiles").select("id, country");
    if (ev.countries && ev.countries.length > 0) {
      query = query.in("country", ev.countries) as typeof query;
    }
    const { data: profiles, error } = await query.limit(5000);

    if (error || !profiles || profiles.length === 0) continue;

    // Build all rows for this event in one pass.
    const rows = (profiles as Array<{ id: string; country: string | null }>).map((p) => ({
      user_id:         p.id,
      artist_id:       null,
      rule_category:   "calendar_driven" as const,
      rule_id:         ev.id,
      priority:        "medium" as const,
      title:           ev.title,
      body:            ev.body,
      action_label:    ev.actionLabel,
      action_href:     ev.actionHref,
      expires_at:      ev.windowEndIso,
      source_metadata: { windowStart: ev.windowStartIso, windowEnd: ev.windowEndIso },
      dedup_key:       `calendar:${p.id}:${ev.id}:${monthKey}`,
    }));

    // Bulk insert — ON CONFLICT DO NOTHING so duplicates are silently skipped.
    // Supabase PostgREST maps upsert({ ignoreDuplicates: true }) → INSERT … ON CONFLICT DO NOTHING.
    const { error: insertError, data: inserted } = await admin
      .from("proactive_suggestions")
      .upsert(rows, { onConflict: "dedup_key", ignoreDuplicates: true })
      .select("id");

    if (insertError) {
      logger.error("[suggestions] calendar bulk insert error", { eventId: ev.id }, insertError);
    } else {
      totalInserted += inserted?.length ?? 0;
    }
  }

  return totalInserted;
}

// ── Rule 5: ROSTER Momentum alerts ─────────────────────────────
//
// Scans every artist's current ROSTER scores. Two alert types:
//   • Momentum drop  (score < -10) → anomaly_driven HIGH/MEDIUM
//   • Momentum spike (score > +20) → opportunity LOW/MEDIUM
//
// Dedup key is per-artist per-week so the same alert won't flood
// the Compass if the cron runs multiple times in a day.
async function ruleMomentumScores(): Promise<number> {
  const admin = createAdminClient();

  // Pull all artists with their owner user_id
  const { data: artists, error: artistsErr } = await admin
    .from("artists")
    .select("id, name, user_id, country");

  if (artistsErr || !artists || artists.length === 0) return 0;

  const artistIds = (artists as Array<{ id: string }>).map((a) => a.id);

  // Fetch the last 60 days of platform metrics in a single round-trip
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const { data: metrics, error: metricsErr } = await admin
    .from("artist_platform_metrics")
    .select("artist_id, platform, metric, value, snapshot_at, source")
    .in("artist_id", artistIds)
    .gte("snapshot_at", since)
    .order("snapshot_at", { ascending: false });

  if (metricsErr || !metrics) return 0;

  // Group metrics by artist_id
  const byArtist = new Map<string, MetricSnapshot[]>();
  for (const m of metrics as Array<{
    artist_id: string;
    platform: string;
    metric: string;
    value: number | string;
    snapshot_at: string;
    source?: string;
  }>) {
    const list = byArtist.get(m.artist_id) ?? [];
    list.push({
      platform: m.platform as Platform,
      metric: m.metric,
      value: typeof m.value === "string" ? Number(m.value) : (m.value as number),
      snapshotAt: m.snapshot_at,
      source: ((m.source ?? "manual") as MetricSnapshot["source"]),
    });
    byArtist.set(m.artist_id, list);
  }

  const today = new Date();
  const isoWeek = (() => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
  })();

  let inserted = 0;

  for (const artist of artists as Array<{
    id: string;
    name: string;
    user_id: string;
    country: string | null;
  }>) {
    const snapshots = byArtist.get(artist.id) ?? [];
    if (snapshots.length === 0) continue;

    const scores = scoreArtist(snapshots, { primaryCountry: artist.country ?? undefined });

    // Skip artists with no momentum signal yet (need 2+ sync cycles)
    if (scores.coverage.momentumSignals === 0) continue;

    const m = scores.momentum;

    // ── Drop alert ────────────────────────────────────────────────
    if (m <= -10) {
      const priority = m <= -20 ? "high" : "medium";
      const severity = m <= -20 ? "notable" : "mild";
      await upsertSuggestion({
        userId: artist.user_id,
        artistId: artist.id,
        ruleCategory: "anomaly_driven",
        ruleId: "roster_momentum_drop",
        priority,
        title: `${artist.name}'s momentum is dropping — act now`,
        body: `ROSTER Momentum score is ${m} this week — a ${severity} negative velocity. This typically means growth signals are slowing across multiple platforms. Review recent release activity, playlist placement, and social posting frequency. A targeted push now is cheaper than rebuilding from a deeper trough.`,
        actionLabel: "View artist scorecard",
        actionHref: `/dashboard?highlight=${artist.id}`,
        sourceMetadata: { momentum: m, reachSignals: scores.coverage.reachSignals, engagementSignals: scores.coverage.engagementSignals },
        dedupKey: `momentum_drop:${artist.id}:${isoWeek}`,
        expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      }).then((r) => { if (r === "inserted") inserted++; });
    }

    // ── Spike / opportunity alert ─────────────────────────────────
    if (m >= 20) {
      const priority = m >= 40 ? "high" : "low";
      await upsertSuggestion({
        userId: artist.user_id,
        artistId: artist.id,
        ruleCategory: "opportunity",
        ruleId: "roster_momentum_spike",
        priority,
        title: `${artist.name} has strong positive momentum — capitalise`,
        body: `ROSTER Momentum score is +${m} this week. Growth signals are accelerating. Now is the ideal time to pitch for playlist adds, sync briefs, or media coverage — the data supports the pitch and labels / supervisors respond better when numbers are moving.`,
        actionLabel: "Draft a pitch",
        actionHref: `/dashboard/library/pitching`,
        sourceMetadata: { momentum: m, reachSignals: scores.coverage.reachSignals },
        dedupKey: `momentum_spike:${artist.id}:${isoWeek}`,
        expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      }).then((r) => { if (r === "inserted") inserted++; });
    }
  }

  return inserted;
}

// ── Main runner ─────────────────────────────────────────────────
export async function runSuggestionEngine(): Promise<{
  anomaly: number;
  recoupment: number;
  stalled: number;
  calendar: number;
  momentum: number;
  total: number;
}> {
  const [anomaly, recoupment, stalled, calendar, momentum] = await Promise.all([
    ruleAnomalyDriven().catch((e) => { logger.error("[suggestions] anomaly rule failed", {}, e); return 0; }),
    ruleRecoupment().catch((e) => { logger.error("[suggestions] recoupment rule failed", {}, e); return 0; }),
    ruleStalledEvents().catch((e) => { logger.error("[suggestions] stalled rule failed", {}, e); return 0; }),
    ruleCalendarDriven().catch((e) => { logger.error("[suggestions] calendar rule failed", {}, e); return 0; }),
    ruleMomentumScores().catch((e) => { logger.error("[suggestions] momentum rule failed", {}, e); return 0; }),
  ]);

  return {
    anomaly,
    recoupment,
    stalled,
    calendar,
    momentum,
    total: anomaly + recoupment + stalled + calendar + momentum,
  };
}
