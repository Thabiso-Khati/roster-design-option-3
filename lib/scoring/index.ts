// ============================================================
// ROSTER — Scoring engine
// ------------------------------------------------------------
// Pure function: in -> array of metric snapshots, out -> three
// composite scores (Reach / Momentum / Engagement) plus a
// breakdown of which signals drove each one.
//
// Why pure:
//   • Trivially unit-testable — feed it synthetic snapshots,
//     assert the scores.
//   • The DB layer (api/artists GET) handles fetching; this
//     module never touches Supabase.
//   • Same algorithm runs server-side (for the widget GET) and
//     potentially client-side (for "what-if" sliders later).
//
// The model:
//   Reach        = weighted log-normalized aggregate of "people
//                  reached" signals across platforms.
//   Momentum     = weighted velocity (% change between latest
//                  two snapshots) across both Reach and
//                  Engagement signals, signed.
//   Engagement   = weighted log-normalized aggregate of depth
//                  signals, weighted by bot-resistance ladder.
//
// Every weight, calibration, and policy decision lives in
// `./config.ts`. This file is just the math.
// ============================================================

import {
  ENGAGEMENT_MAX,
  ENGAGEMENT_SIGNALS,
  ENGAGEMENT_WEIGHTS,
  FRESHNESS_ADJUSTED_REACH_SIGNALS,
  freshnessMultiplier,
  MOMENTUM_SHARE,
  MOMENTUM_VELOCITY_CLAMP_PCT,
  REACH_BOT_DISCOUNT,
  REACH_MAX,
  REACH_SIGNALS,
  reachWeightsFor,
} from "./config";
import type {
  ArtistScores,
  MetricSnapshot,
  Platform,
  SignalContribution,
} from "./types";

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Log-normalize a raw value into the 0–100 range.
 * `max` is the calibration ceiling — values at or above `max`
 * score 100, very low values approach 0. log10 chosen because
 * artist sizes span 6+ orders of magnitude.
 */
function logScore(value: number, max: number): number {
  if (value <= 0 || max <= 1) return 0;
  const score = (Math.log10(value + 1) / Math.log10(max + 1)) * 100;
  return clamp(score, 0, 100);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Most recent snapshot for a (platform, metric) tuple. */
function latestSnapshot(
  snapshots: MetricSnapshot[],
  platform: Platform,
  metric: string
): MetricSnapshot | null {
  const matches = snapshots
    .filter((s) => s.platform === platform && s.metric === metric)
    .sort((a, b) => b.snapshotAt.localeCompare(a.snapshotAt));
  return matches[0] ?? null;
}

/**
 * Velocity between the latest two snapshots, as a percentage.
 * Returns null if we don't have two snapshots or if the previous
 * value was zero (can't divide).
 *
 * Result is clamped to ±MOMENTUM_VELOCITY_CLAMP_PCT so a single
 * viral spike doesn't permanently peg the momentum score.
 */
function velocityPct(
  snapshots: MetricSnapshot[],
  platform: Platform,
  metric: string
): number | null {
  const matches = snapshots
    .filter((s) => s.platform === platform && s.metric === metric)
    .sort((a, b) => b.snapshotAt.localeCompare(a.snapshotAt));
  if (matches.length < 2) return null;
  const [latest, previous] = matches;
  if (previous.value <= 0) return null;
  const pct = ((latest.value - previous.value) / previous.value) * 100;
  return clamp(pct, -MOMENTUM_VELOCITY_CLAMP_PCT, MOMENTUM_VELOCITY_CLAMP_PCT);
}

// ─── Score builders ───────────────────────────────────────────

/**
 * Reach score: weighted log-normalized aggregate of "people
 * reached" signals across all platforms with data.
 *
 * We re-normalize across only platforms that have data, so an
 * artist not on Deezer isn't penalized vs one who is.
 *
 * `reachWeights` is passed in so the caller can supply a per-country
 * profile (e.g. SA artists weight TikTok higher than the global
 * default). Falls through to the same logic regardless of which
 * profile it is.
 */
function buildReach(
  snapshots: MetricSnapshot[],
  reachWeights: Record<Platform, number>
): {
  score: number;
  contributions: SignalContribution[];
} {
  const contributions: SignalContribution[] = [];

  // Per-platform: pick the highest-scoring reach signal for that
  // platform (don't double-count "streams" + "monthly_listeners"
  // for Spotify; both are reach proxies for the same audience).
  const perPlatformBest = new Map<Platform, number>();

  for (const { platform, metric } of REACH_SIGNALS) {
    const latest = latestSnapshot(snapshots, platform, metric);
    if (!latest) continue;

    const key = `${platform}.${metric}`;
    const max = REACH_MAX[key] ?? 1_000_000_000;
    const raw = logScore(latest.value, max);
    const botDiscount = REACH_BOT_DISCOUNT[key] ?? 1.0;

    // Cumulative trust signals (followers/subscribers) get
    // freshness-adjusted: a dormant 800K follower base shouldn't
    // inflate Reach the way a growing 800K base does. Needs at
    // least two snapshots; defaults to 1.0 (no adjustment) when
    // velocity is unknown.
    let freshness = 1.0;
    if (FRESHNESS_ADJUSTED_REACH_SIGNALS.has(key)) {
      const v = velocityPct(snapshots, platform, metric);
      if (v !== null) freshness = freshnessMultiplier(v);
    }

    const adjusted = raw * botDiscount * freshness;

    contributions.push({ signal: key, contribution: +adjusted.toFixed(2) });

    const prevBest = perPlatformBest.get(platform) ?? 0;
    if (adjusted > prevBest) perPlatformBest.set(platform, adjusted);
  }

  // Weighted average across platforms with data, re-normalized
  // so missing platforms don't drag the score down.
  let weightedSum = 0;
  let weightTotal = 0;
  for (const [platform, score] of perPlatformBest.entries()) {
    const w = reachWeights[platform] ?? 0;
    weightedSum += score * w;
    weightTotal += w;
  }

  const score = weightTotal > 0 ? weightedSum / weightTotal : 0;

  contributions.sort((a, b) => b.contribution - a.contribution);
  return { score: clamp(score, 0, 100), contributions };
}

/**
 * Momentum score: weighted velocity across both Reach and
 * Engagement signals. Signed (-100..+100).
 *
 * Each signal contributes `velocity * momentum_share * weight`
 * where the weight is the same as that signal's weight in its
 * own score (the per-country reach weights for reach signals,
 * ENGAGEMENT_WEIGHTS for engagement signals).
 *
 * Missing previous snapshots are ignored, not penalized — a brand
 * new artist with one snapshot has a momentum of 0, not -100.
 */
function buildMomentum(
  snapshots: MetricSnapshot[],
  reachWeights: Record<Platform, number>
): {
  score: number;
  contributions: SignalContribution[];
} {
  const contributions: SignalContribution[] = [];
  let weightedSum = 0;
  let weightTotal = 0;

  // Reach signals
  for (const { platform, metric } of REACH_SIGNALS) {
    const v = velocityPct(snapshots, platform, metric);
    if (v === null) continue;

    const key = `${platform}.${metric}`;
    const share = MOMENTUM_SHARE[key] ?? 0;
    if (share === 0) continue;

    const platformWeight = reachWeights[platform] ?? 0;
    const w = platformWeight * share;
    if (w === 0) continue;

    // Velocity is already clamped to ±200; map to ±100 by halving.
    const contribution = (v / 2) * share;
    contributions.push({
      signal: key,
      contribution: +contribution.toFixed(2),
    });
    weightedSum += (v / 2) * w;
    weightTotal += w;
  }

  // Engagement signals
  for (const { platform, metric } of ENGAGEMENT_SIGNALS) {
    const v = velocityPct(snapshots, platform, metric);
    if (v === null) continue;

    const key = `${platform}.${metric}`;
    const share = MOMENTUM_SHARE[key] ?? 0;
    if (share === 0) continue;

    const ladderWeight = ENGAGEMENT_WEIGHTS[key] ?? 0;
    const w = ladderWeight * share;
    if (w === 0) continue;

    const contribution = (v / 2) * share;
    contributions.push({
      signal: key,
      contribution: +contribution.toFixed(2),
    });
    weightedSum += (v / 2) * w;
    weightTotal += w;
  }

  const score = weightTotal > 0 ? weightedSum / weightTotal : 0;

  contributions.sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
  );
  return { score: clamp(Math.round(score), -100, 100), contributions };
}

/**
 * Engagement score: log-normalized depth signals weighted by
 * bot-resistance ladder. Each signal contributes
 *   logScore(value) * ladder_weight * (1 - momentum_share)
 * where (1 - momentum_share) ensures TikTok sound uses (which
 * are 70% momentum) only contribute 30% of their value to
 * engagement, etc.
 */
function buildEngagement(snapshots: MetricSnapshot[]): {
  score: number;
  contributions: SignalContribution[];
} {
  const contributions: SignalContribution[] = [];
  let weightedSum = 0;
  let weightTotal = 0;

  for (const { platform, metric } of ENGAGEMENT_SIGNALS) {
    const latest = latestSnapshot(snapshots, platform, metric);
    if (!latest) continue;

    const key = `${platform}.${metric}`;
    const max = ENGAGEMENT_MAX[key] ?? 1_000_000;
    const raw = logScore(latest.value, max);

    const ladderWeight = ENGAGEMENT_WEIGHTS[key] ?? 0;
    const engagementShare = 1 - (MOMENTUM_SHARE[key] ?? 0);
    const w = ladderWeight * engagementShare;
    if (w === 0) continue;

    const contribution = raw * w;
    contributions.push({
      signal: key,
      contribution: +contribution.toFixed(2),
    });
    weightedSum += raw * w;
    weightTotal += w;
  }

  const score = weightTotal > 0 ? weightedSum / weightTotal : 0;

  contributions.sort((a, b) => b.contribution - a.contribution);
  return { score: clamp(score, 0, 100), contributions };
}

// ─── Public API ───────────────────────────────────────────────

export interface ScoreArtistOptions {
  /** Artist's primary country (e.g. "South Africa", "Nigeria"). Used
   *  to pick a per-country Reach weight profile. Falls back to the
   *  global default when omitted or when the country has no profile
   *  in REACH_WEIGHT_OVERRIDES yet. */
  primaryCountry?: string | null;
}

/**
 * Score an artist from their full history of platform metrics.
 *
 * Pass EVERY snapshot you have for this artist — the engine
 * picks the latest per (platform, metric) for level scoring and
 * the latest two for momentum. Older snapshots are ignored but
 * harmless to include.
 *
 * Returns 0/0/0 with empty breakdowns if the artist has no
 * relevant snapshots — never throws.
 *
 * Engagement scoring is country-agnostic — it weights by the
 * bot-resistance ladder, not by platform — so no regional override
 * applies there. Only Reach and Momentum (the reach-signal portion)
 * change with country.
 */
export function scoreArtist(
  snapshots: MetricSnapshot[],
  opts: ScoreArtistOptions = {}
): ArtistScores {
  const reachWeights = reachWeightsFor(opts.primaryCountry);
  const reach = buildReach(snapshots, reachWeights);
  const momentum = buildMomentum(snapshots, reachWeights);
  const engagement = buildEngagement(snapshots);

  return {
    reach: Math.round(reach.score),
    momentum: momentum.score,
    engagement: Math.round(engagement.score),
    breakdown: {
      reach: reach.contributions,
      momentum: momentum.contributions,
      engagement: engagement.contributions,
    },
    coverage: {
      reachSignals: reach.contributions.length,
      momentumSignals: momentum.contributions.length,
      engagementSignals: engagement.contributions.length,
    },
  };
}

// Re-export types for downstream consumers
export type {
  ArtistScores,
  MetricSnapshot,
  Platform,
  SignalContribution,
} from "./types";
