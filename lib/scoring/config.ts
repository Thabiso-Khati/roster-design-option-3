// ============================================================
// ROSTER — Scoring engine configuration
// ------------------------------------------------------------
// Every weight, calibration constant, and policy decision lives
// here, NOT in the algorithm. That way the founder can tune
// scores without touching the math, and the math file stays a
// pure expression of the model.
//
// ── 28-day rolling convention ───────────────────────────────
// Volume metrics are stored as the LAST 28 DAYS of activity, NOT
// lifetime totals. Ceilings below are calibrated for that 28-day
// window. See platforms.ts for the full rationale.
//
// Decisions locked with the founder during design — see
// /docs/scoring-engine-v1.md (TODO) for the full rationale.
// ============================================================

import type { Platform } from "./types";

// ── 1. Reach calibration ────────────────────────────────────
// Per-metric "what value scores 100 in log space". These are
// rough "world-class artist for this platform, in a hot 28-day
// window" benchmarks. They're tunable — when we have real
// distribution data from the live roster, we'll re-fit these
// against the 95th percentile of active artists.
//
// Format: `${platform}.${metric}` → ceiling
//
// Sanity: a global star like Burna Boy in a hot release month
// might do ~100M YouTube views, ~80M Spotify streams, ~50M
// TikTok video views in 28 days. Ceiling = a step above that
// so monthly_listeners-of-50M still maps cleanly to ~100.
export const REACH_MAX: Record<string, number> = {
  // Spotify — rolling 28d
  "spotify.streams_28d": 100_000_000,
  "spotify.monthly_listeners": 50_000_000, // already a 28d rolling metric by Spotify spec
  "spotify.followers": 30_000_000, // cumulative trust signal

  // YouTube — bigger raw numbers but bot-discounted later
  "youtube.views_28d": 300_000_000,
  "youtube.subscribers": 50_000_000, // cumulative

  // Audiomack — Africa-heavy, smaller global scale
  "audiomack.plays_28d": 8_000_000,
  "audiomack.followers": 5_000_000, // cumulative

  // Boomplay — Africa-first DSP
  "boomplay.streams_28d": 40_000_000,
  "boomplay.followers": 10_000_000, // cumulative

  // TikTok
  "tiktok.video_views_28d": 80_000_000,
  "tiktok.followers": 50_000_000, // cumulative

  // Instagram (already on a 28/30d window)
  "instagram.reach_28d": 15_000_000,
  "instagram.followers": 20_000_000, // cumulative

  // Smaller DSPs
  "mdundo.plays_28d": 4_000_000,
  "deezer.plays_28d": 15_000_000,
};

// ── 2. Engagement calibration ───────────────────────────────
// Same idea as REACH_MAX but for engagement signals. Numbers
// are smaller because engagement is rarer than reach. Calibrated
// for 28d windows except where noted.
export const ENGAGEMENT_MAX: Record<string, number> = {
  // Audiomack supporters — paid, kept CUMULATIVE (paid intent
  // doesn't decay). Scale stays small because supporters are RARE.
  "audiomack.supporters": 50_000,

  // Spotify — 28d windows
  "spotify.ugc_playlist_adds_28d": 50_000,
  "spotify.super_listeners": 1_000_000, // already a 28d rolling metric
  "spotify.saves_28d": 1_000_000,

  // YouTube — 28d windows
  "youtube.comments_28d": 100_000,
  "youtube.watch_time_seconds_28d": 1_000_000_000, // 1B sec ≈ 31.7 yr in 28 days

  // TikTok — 28d windows
  "tiktok.sound_uses_28d": 1_000_000,

  // Instagram — already on 28/30d windows
  "instagram.saves_28d": 500_000,
  "instagram.shares_28d": 500_000,
  "instagram.comments_28d": 500_000,
  "instagram.likes_28d": 5_000_000,

  // Boomplay fans — kept CUMULATIVE (favourites are sticky)
  "boomplay.fans": 1_000_000,
};

// ── 3. Reach platform weights ───────────────────────────────
// How much each platform contributes to the Reach score AFTER
// per-signal log normalization. These sum to 1.0 across all
// platforms an artist might appear on; per-artist we re-normalize
// across only the platforms with data so a missing platform
// doesn't tank the score.
//
// This is the GLOBAL DEFAULT — used when an artist has no country
// set or their country has no per-country override below.
// Africa-friendly compromise (Boomplay / Audiomack get more weight
// than they would on a global SaaS).
export const REACH_WEIGHTS: Record<Platform, number> = {
  spotify: 0.25,
  youtube: 0.2,
  boomplay: 0.15,
  audiomack: 0.1,
  tiktok: 0.1,
  deezer: 0.1,
  instagram: 0.05,
  mdundo: 0.05,
};

// ── 3a. Per-country Reach weight overrides ──────────────────
// When an artist's primary country matches a key here, the engine
// uses these weights instead of the global default. Each profile
// must FULLY redefine every platform (sum to 1.0) so it's
// auditable — no implicit merging with the default.
//
// Add a new country: research market data → propose weights →
// document the source per weight in the comment block above the
// profile → ship. NEVER add a profile without sourcing.
//
// Per-artist re-normalization across platforms-with-data still
// applies inside the engine, same as the default. So an SA artist
// with no Boomplay number isn't punished by SA's 0.10 Boomplay
// weight — it just gets re-normalized away.
//
// ── South Africa ────────────────────────────────────────────
// Sourced 2026-04-26 from public reports — refresh annually after
// IFPI Global Music Report and Spotify Loud&Clear publish:
//   • Spotify dominance: Spotify Loud&Clear 2024 — R400m to SA
//     artists (+54% YoY), 1.1B SA artist discoveries by first-time
//     listeners, 5+ years in market.
//   • TikTok weight: DataReportal Digital 2025 SA — 23.4M users
//     18+, adoption 34%→38%, 2nd most-used social app. Documented
//     amapiano breakthrough engine (Tyler ICU, Uncle Waffles, etc.)
//   • YouTube: Techpoint — 25M SA users; YouTube Music in market
//     since March 2019.
//   • Boomplay/Audiomack downweighted: Boomplay press confirms
//     SA = "tier-one growth market" but secondary to Nigeria/Ghana.
//     Audiomack stronghold is Nigeria (15.3M MAU there); SA is
//     top-5 Android music app but not #1.
//   • Deezer/Mdundo trimmed: smallest SA subscriber bases;
//     Mdundo is East-Africa-focused, Deezer francophone-heavy.
export const REACH_WEIGHT_OVERRIDES: Record<
  string,
  Record<Platform, number>
> = {
  "South Africa": {
    spotify: 0.3,
    youtube: 0.2,
    tiktok: 0.2,
    boomplay: 0.1,
    audiomack: 0.07,
    instagram: 0.07,
    deezer: 0.04,
    mdundo: 0.02,
  },

  // ── Nigeria ──────────────────────────────────────────────
  // Sourced 2026-04-26 — Nigeria is FUNDAMENTALLY DIFFERENT from
  // SA: Audiomack-first, not Spotify-first. Refresh annually.
  //   • Audiomack 0.30: 15.3M MAU in NG, NG is Audiomack's
  //     largest market globally, #1 music app on iOS+Android
  //     (Music Ally Dec '24, Audiomack press, Sensor Tower Q1'24).
  //   • YouTube 0.20: 28M NG users, central for music videos
  //     and Afrobeats discovery (Techpoint).
  //   • Boomplay 0.18: pre-installed on 50%+ NG smartphones via
  //     Transsion partnership; weakened by Sony/AWAL boycott
  //     over royalty disputes but still huge (Boomplay press,
  //     TurntableCharts 2024).
  //   • TikTok 0.15: 37.4M NG users 18+ (DataReportal Jan '25),
  //     largest social platform in NG. Less central to NG
  //     breakthroughs than SA's amapiano-on-TikTok pattern —
  //     NG hits come more from labels + radio + YouTube.
  //   • Spotify 0.10: only ~1M NG MAU (Sensor Tower Q1'24) but
  //     ₦58bn ($37.8M) royalties in 2024 (+232% YoY) — small
  //     user base, outsized economic value, +146% growth
  //     trajectory (Spotify Loud&Clear 2024).
  //   • Instagram 0.05: 9.9M NG users, smaller than TikTok
  //     (DataReportal Jan '25, declined 7% Q4'24 → Jan'25).
  //   • Deezer/Mdundo 0.01 each: negligible NG presence.
  //     Deezer is francophone-focused, Mdundo is East Africa.
  Nigeria: {
    audiomack: 0.3,
    youtube: 0.2,
    boomplay: 0.18,
    tiktok: 0.15,
    spotify: 0.1,
    instagram: 0.05,
    deezer: 0.01,
    mdundo: 0.01,
  },
};

/** Returns the Reach weights to use for an artist's primary country.
 *  Falls back to the global default when no country is set or the
 *  country has no profile defined yet. */
export function reachWeightsFor(
  primaryCountry: string | null | undefined
): Record<Platform, number> {
  if (!primaryCountry) return REACH_WEIGHTS;
  return REACH_WEIGHT_OVERRIDES[primaryCountry] ?? REACH_WEIGHTS;
}

// ── 4. Bot-resistance ladder ────────────────────────────────
// Engagement signals weighted by how hard they are to fake.
// Tiers locked with the founder:
//   1.00 — paid support (Audiomack supporters)
//   0.85 — listening time (Spotify super-listeners, YT watch)
//   0.70 — shares (TikTok sound uses, IG shares)
//   0.55 — saves / curation intent (Spotify UGC adds, IG saves)
//   0.40 — comments
//   0.20 — likes
//   0.10 — follows
//
// Maps `${platform}.${metric}` → ladder weight.
export const ENGAGEMENT_WEIGHTS: Record<string, number> = {
  // Tier 1 — paid (cumulative — paid intent doesn't decay)
  "audiomack.supporters": 1.0,

  // Tier 2 — listening time
  "spotify.super_listeners": 0.85,
  "youtube.watch_time_seconds_28d": 0.85,

  // Tier 3 — shares
  "tiktok.sound_uses_28d": 0.7,
  "instagram.shares_28d": 0.7,

  // Tier 4 — saves / curation intent
  "spotify.ugc_playlist_adds_28d": 0.55,
  "spotify.saves_28d": 0.55,
  "instagram.saves_28d": 0.55,
  "boomplay.fans": 0.55, // cumulative favourites — sticky like a follow

  // Tier 5 — comments
  "youtube.comments_28d": 0.4,
  "instagram.comments_28d": 0.4,

  // Tier 6 — likes
  "instagram.likes_28d": 0.2,
};

// ── 5. Reach bot discounts ──────────────────────────────────
// Some Reach signals are easier to inflate than others. Apply a
// per-signal discount factor BEFORE the platform weight so a
// botted YouTube view doesn't out-vote a real Spotify stream.
// Defaults to 1.0 (no discount).
export const REACH_BOT_DISCOUNT: Record<string, number> = {
  "youtube.views_28d": 0.4, // notoriously bottable
  "tiktok.video_views_28d": 0.5, // also easy to inflate
};

// ── 6. Momentum share per signal ────────────────────────────
// Of each signal's contribution, what % flows to the Momentum
// score (as velocity) vs Engagement (as absolute value).
//
// Reach signals → 1.0 (their growth is pure momentum; they're
// not engagement signals so they only count toward Momentum/Reach).
//
// Engagement signals — split locked with founder:
//   tiktok.sound_uses_28d    → 0.70 momentum / 0.30 engagement
//   spotify.ugc_adds_28d     → 0.00 / 1.00
//   youtube.comments_28d     → 0.40 / 0.60
//   instagram.shares_28d     → 0.20 / 0.80
//   instagram.saves_28d      → 0.20 / 0.80
//
// Anything not listed defaults to 0.0 momentum (pure engagement).
//
// Note: with 28d-rolling Reach signals, momentum is now the
// 28d-window-over-28d-window delta — way more meaningful than
// velocity of cumulative numbers (which always trends to 0).
export const MOMENTUM_SHARE: Record<string, number> = {
  // Reach signals — all velocity counts as momentum
  "spotify.streams_28d": 1.0,
  "spotify.monthly_listeners": 1.0,
  "spotify.followers": 0.5, // cumulative trust; followers grow slowly; half-credit
  "youtube.views_28d": 1.0,
  "youtube.subscribers": 0.5,
  "audiomack.plays_28d": 1.0,
  "audiomack.followers": 0.5,
  "boomplay.streams_28d": 1.0,
  "boomplay.followers": 0.5,
  "tiktok.video_views_28d": 1.0,
  "tiktok.followers": 0.5,
  "instagram.reach_28d": 1.0,
  "instagram.followers": 0.5,
  "mdundo.plays_28d": 1.0,
  "deezer.plays_28d": 1.0,

  // Engagement signals — locked splits
  "tiktok.sound_uses_28d": 0.7,
  "spotify.ugc_playlist_adds_28d": 0.0,
  "youtube.comments_28d": 0.4,
  "instagram.shares_28d": 0.2,
  "instagram.saves_28d": 0.2,
  // Defaults to 0 if absent (audiomack supporters, super listeners,
  // watch time — these are pure engagement, not momentum signals).
};

// ── 7. Reach signals (drives both Reach and Momentum) ───────
// The (platform, metric) pairs that count as Reach signals.
// Used by the engine to know what to look for; missing data is
// ignored, not penalized.
export const REACH_SIGNALS: Array<{
  platform: Platform;
  metric: string;
}> = [
  { platform: "spotify", metric: "streams_28d" },
  { platform: "spotify", metric: "monthly_listeners" },
  { platform: "spotify", metric: "followers" },
  { platform: "youtube", metric: "views_28d" },
  { platform: "youtube", metric: "subscribers" },
  { platform: "audiomack", metric: "plays_28d" },
  { platform: "audiomack", metric: "followers" },
  { platform: "boomplay", metric: "streams_28d" },
  { platform: "boomplay", metric: "followers" },
  { platform: "tiktok", metric: "video_views_28d" },
  { platform: "tiktok", metric: "followers" },
  { platform: "instagram", metric: "reach_28d" },
  { platform: "instagram", metric: "followers" },
  { platform: "mdundo", metric: "plays_28d" },
  { platform: "deezer", metric: "plays_28d" },
];

// ── 8. Engagement signals ───────────────────────────────────
// Subset of all metrics that count as Engagement signals — i.e.
// things in ENGAGEMENT_WEIGHTS. The engine iterates this list
// when building the Engagement score.
export const ENGAGEMENT_SIGNALS: Array<{
  platform: Platform;
  metric: string;
}> = (Object.keys(ENGAGEMENT_WEIGHTS) as string[]).map((key) => {
  const [platform, metric] = key.split(".") as [Platform, string];
  return { platform, metric };
});

// ── 9. Momentum velocity clamping ───────────────────────────
// A 1000% spike (e.g. first viral moment) shouldn't peg the
// momentum score forever — clamp per-signal velocity into a
// reasonable range before weighting.
export const MOMENTUM_VELOCITY_CLAMP_PCT = 200; // ±200%

// ── 10. Freshness multiplier on cumulative trust signals ────
// Cumulative followers/subscribers can stay big long after the
// audience has gone dormant — that inflates Reach today. Fix:
// when scoring a follower-style metric for Reach, look at its
// own velocity and dampen / boost the contribution accordingly.
//
// Only applies to follower/subscriber-style signals (where
// dormancy is the actual risk). Paid signals (Audiomack
// supporters, Boomplay fans) skip this — paid intent doesn't
// decay the same way virality does.
//
// Capped at ±30% impact so velocity can't completely override
// the level signal: followers ARE a real asset, they just count
// for less when they're going stale.
export const FRESHNESS_ADJUSTED_REACH_SIGNALS: ReadonlySet<string> = new Set([
  "spotify.followers",
  "youtube.subscribers",
  "audiomack.followers",
  "boomplay.followers",
  "tiktok.followers",
  "instagram.followers",
]);

/**
 * Map a follower-velocity (% change between latest two snapshots)
 * to a Reach multiplier. Used inside buildReach for the metrics
 * listed in FRESHNESS_ADJUSTED_REACH_SIGNALS.
 *
 * Bands chosen to reward genuine growth and penalize visible
 * decline without making a single noisy month overwhelm the
 * level signal.
 */
export function freshnessMultiplier(velocityPct: number): number {
  if (velocityPct >= 20) return 1.15; // growing fast → audience alive
  if (velocityPct >= 5) return 1.05; // healthy growth
  if (velocityPct >= -5) return 1.0; // stable, no adjustment
  if (velocityPct >= -20) return 0.85; // stagnant → followers tuning out
  return 0.7; // declining → dormant base
}
