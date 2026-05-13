/**
 * Anomaly Detector
 * ─────────────────
 * Computes spike/drop anomalies on artist_platform_metrics.
 *
 * Algorithm (per artist × metric):
 *   1. Pull all snapshots for the last 30 days.
 *   2. Compute mean μ + std-dev σ over the 30d window EXCLUDING
 *      the most recent 7 days (so the baseline isn't pulled
 *      towards the spike itself).
 *   3. Compute the 7-day moving average (current).
 *   4. Z-score = (current − μ) / σ.
 *   5. |z| ≥ 2.0  → "normal" anomaly
 *      |z| ≥ 3.0  → "major"
 *      |z| ≥ 4.0  → "critical"
 *      Sign of z determines spike vs drop.
 *
 * Insertion is idempotent via dedup_key = `${userId}:${artistId}:${metric}:${YYYY-MM-DD}` —
 * running the cron twice on the same day will not duplicate.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const SHORT_DAYS = 7;
const LONG_DAYS = 30;
const MIN_SAMPLES = 14;          // need at least this many points for a stable baseline
const Z_THRESHOLD = 2.0;
const Z_MAJOR = 3.0;
const Z_CRITICAL = 4.0;

interface MetricSnapshot {
  artist_id: string;
  user_id: string;
  platform: string;
  metric: string;                 // metric name within the platform (e.g. "monthly_listeners")
  metric_key: string;             // computed: `${platform}_${metric}` for unique grouping
  value: number;
  snapshot_at: string;            // ISO
}

export interface DetectedAnomaly {
  userId: string;
  artistId: string;
  metricKey: string;
  platform: string | null;
  direction: "spike" | "drop";
  severity: "minor" | "normal" | "major" | "critical";
  currentValue: number;
  priorAvgValue: number;
  stdDevValue: number;
  pctChange: number;
  zScore: number;
  dedupKey: string;
}

function platformOf(metricKey: string): string | null {
  // metric keys conventionally start with the platform: spotify_*, youtube_*, audiomack_*, etc.
  const idx = metricKey.indexOf("_");
  return idx > 0 ? metricKey.slice(0, idx) : null;
}

function severityFor(z: number): DetectedAnomaly["severity"] {
  const a = Math.abs(z);
  if (a >= Z_CRITICAL) return "critical";
  if (a >= Z_MAJOR) return "major";
  if (a >= Z_THRESHOLD) return "normal";
  return "minor";
}

function dailyAverage(samples: MetricSnapshot[], lastNDays: number, endDate: Date): number | null {
  const cutoff = new Date(endDate);
  cutoff.setUTCDate(cutoff.getUTCDate() - lastNDays);
  const recent = samples.filter((s) => new Date(s.snapshot_at) >= cutoff);
  if (recent.length === 0) return null;
  const sum = recent.reduce((acc, s) => acc + s.value, 0);
  return sum / recent.length;
}

function stats(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (values.length < 2) return { mean, stdDev: 0 };
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / (values.length - 1);
  return { mean, stdDev: Math.sqrt(variance) };
}

/**
 * @param samples  Metric snapshots to analyse.
 * @param anchor   The reference date for "now". Defaults to the latest
 *                 snapshot_at found in `samples` so that a delayed fetcher
 *                 does not produce false anomalies compared to wall-clock time.
 *                 Tests and the end-to-end runner always pass an explicit value.
 */
export function detectAnomalies(
  samples: MetricSnapshot[],
  anchor?: Date,
): DetectedAnomaly[] {
  // Group samples by artist × metric
  const groups = new Map<string, MetricSnapshot[]>();
  for (const s of samples) {
    const k = `${s.user_id}|${s.artist_id}|${s.metric_key}`;
    const arr = groups.get(k) ?? [];
    arr.push(s);
    groups.set(k, arr);
  }

  // Anchor to MAX(snapshot_at) in the dataset so a late-running fetcher
  // does not shift the short/long windows relative to the actual data.
  let today: Date;
  if (anchor) {
    today = anchor;
  } else if (samples.length > 0) {
    today = new Date(
      Math.max(...samples.map((s) => new Date(s.snapshot_at).getTime()))
    );
  } else {
    today = new Date();
  }

  const isoDate = today.toISOString().slice(0, 10);
  const out: DetectedAnomaly[] = [];

  for (const [, group] of groups) {
    if (group.length < MIN_SAMPLES) continue;

    // Baseline = LONG_DAYS window EXCLUDING the most recent SHORT_DAYS
    const shortStart = new Date(today);
    shortStart.setUTCDate(shortStart.getUTCDate() - SHORT_DAYS);
    const longStart = new Date(today);
    longStart.setUTCDate(longStart.getUTCDate() - LONG_DAYS);

    const baseline = group
      .filter((s) => {
        const t = new Date(s.snapshot_at);
        return t >= longStart && t < shortStart;
      })
      .map((s) => s.value);

    if (baseline.length < 7) continue; // need a meaningful baseline

    const current = dailyAverage(group, SHORT_DAYS, today);
    if (current == null) continue;

    const { mean, stdDev } = stats(baseline);
    if (stdDev === 0 || mean === 0) continue;

    const z = (current - mean) / stdDev;
    if (Math.abs(z) < Z_THRESHOLD) continue;

    const first = group[0];
    out.push({
      userId: first.user_id,
      artistId: first.artist_id,
      metricKey: first.metric_key,
      platform: platformOf(first.metric_key),
      direction: z > 0 ? "spike" : "drop",
      severity: severityFor(z),
      currentValue: current,
      priorAvgValue: mean,
      stdDevValue: stdDev,
      pctChange: ((current - mean) / mean) * 100,
      zScore: z,
      dedupKey: `${first.user_id}:${first.artist_id}:${first.metric_key}:${isoDate}`,
    });
  }

  return out;
}

/**
 * End-to-end run: pull snapshots → detect → upsert anomaly_events.
 * Returns a summary of inserted/skipped anomalies.
 */
export async function runAnomalyDetection(): Promise<{
  inserted: number;
  skipped: number;
  errors: number;
}> {
  const admin = createAdminClient();

  // Pull last 30 days of metrics — note: artist_platform_metrics doesn't have
  // a user_id column directly; ownership lives on the artists table.
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - LONG_DAYS - 1);

  const { data, error } = await admin
    .from("artist_platform_metrics")
    .select("artist_id, platform, metric, value, snapshot_at")
    .gte("snapshot_at", cutoff.toISOString())
    // Skip internal bookkeeping rows (prefixed with underscore)
    .not("metric", "like", "\\_%")
    .order("snapshot_at", { ascending: true });

  if (error) {
    logger.error("[anomaly] metrics fetch failed", {}, error);
    return { inserted: 0, skipped: 0, errors: 1 };
  }

  const rawSamples = (data ?? []) as Array<{
    artist_id: string;
    platform: string;
    metric: string;
    value: number;
    snapshot_at: string;
  }>;

  if (rawSamples.length === 0) {
    return { inserted: 0, skipped: 0, errors: 0 };
  }

  // Build artist_id → user_id map via the artists table
  const artistIds = Array.from(new Set(rawSamples.map((s) => s.artist_id)));
  const { data: artistsData, error: artistsErr } = await admin
    .from("artists")
    .select("id, user_id")
    .in("id", artistIds);

  if (artistsErr) {
    logger.error("[anomaly] artists lookup failed", { artistIds }, artistsErr);
    return { inserted: 0, skipped: 0, errors: 1 };
  }

  const artistOwnerMap = new Map<string, string>();
  for (const a of (artistsData ?? []) as Array<{ id: string; user_id: string }>) {
    artistOwnerMap.set(a.id, a.user_id);
  }

  // Stitch user_id + composite metric_key onto each sample, drop orphans
  const samples: MetricSnapshot[] = rawSamples
    .map((s) => {
      const userId = artistOwnerMap.get(s.artist_id);
      if (!userId) return null;
      return {
        ...s,
        user_id: userId,
        metric_key: `${s.platform}_${s.metric}`,
      } as MetricSnapshot;
    })
    .filter((s): s is MetricSnapshot => s !== null);

  // Anchor to MAX(snapshot_at) so a delayed fetcher doesn't produce false
  // anomalies by comparing recent data against a now()-anchored baseline.
  const anchor = samples.length > 0
    ? new Date(Math.max(...samples.map((s) => new Date(s.snapshot_at).getTime())))
    : new Date();

  const detected = detectAnomalies(samples, anchor);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const a of detected) {
    const { error: insertErr } = await admin.from("anomaly_events").insert({
      user_id: a.userId,
      artist_id: a.artistId,
      metric_key: a.metricKey,
      platform: a.platform,
      direction: a.direction,
      severity: a.severity,
      current_value: a.currentValue,
      prior_avg_value: a.priorAvgValue,
      std_dev_value: a.stdDevValue,
      pct_change: a.pctChange,
      z_score: a.zScore,
      window_short: `${SHORT_DAYS}d`,
      window_long: `${LONG_DAYS}d`,
      dedup_key: a.dedupKey,
    });

    if (insertErr) {
      // Duplicate key = already detected today, that's fine
      if (insertErr.code === "23505") {
        skipped++;
      } else {
        logger.error("[anomaly] insert error", { dedupKey: a.dedupKey }, insertErr);
        errors++;
      }
    } else {
      inserted++;
    }
  }

  return { inserted, skipped, errors };
}
