// ============================================================
// ROSTER — Fetcher types
// ------------------------------------------------------------
// Shared shapes for the auto-pull layer (Audiomack web JSON,
// YouTube Data API, future TikTok/Spotify OAuth, etc).
//
// Each fetcher returns a uniform result the orchestrator turns
// into rows on `artist_platform_metrics`. Two metric buckets:
//
//   • metrics    — scoring metrics. Keys MUST match the
//                  PLATFORMS registry (e.g. "plays_28d",
//                  "followers"). Written as normal rows the
//                  scoring engine reads.
//   • internal   — non-scoring rows used as "previous total"
//                  for delta computation on the next run
//                  (e.g. "_total_views_lifetime"). Always
//                  prefixed with an underscore so the registry
//                  validator and the scoring engine ignore them.
//
// `resolvedHandle` lets a fetcher report back the handle it
// auto-resolved (Audiomack slug, YouTube channelId) so the
// orchestrator can persist it on the artist row and skip
// re-resolution on subsequent runs.
// ============================================================

import type { MetricSource } from "@/lib/scoring/types";

export interface FetcherResult {
  ok: boolean;
  source: MetricSource;
  /** Scoring metrics — keys must be in the PLATFORMS registry. */
  metrics: Record<string, number>;
  /** Bookkeeping rows for delta math on the next run. */
  internal: Record<string, number>;
  /** Handle the fetcher resolved on a fresh artist (NULL → backfill). */
  resolvedHandle?: string;
  /** Error message when ok=false. */
  error?: string;
}

/** Handed to each fetcher so they can read prior internal state without
 * each one wiring up its own DB client. */
export interface FetcherContext {
  /** Most recent value for an `_total_*_lifetime` row, or null if none. */
  getPrevInternal(metricKey: string): {
    value: number;
    snapshotAt: string;
  } | null;
}

export const emptyResult = (
  source: MetricSource,
  error?: string
): FetcherResult => ({
  ok: !error,
  source,
  metrics: {},
  internal: {},
  error,
});
