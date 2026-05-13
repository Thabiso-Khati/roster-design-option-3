/**
 * Unit tests — lib/anomaly/detector.ts  (pure detectAnomalies function)
 *
 * Run:  npm test
 *
 * Algorithm under test:
 *   - Baseline = samples in [30d ago, 7d ago)
 *   - Current  = mean of samples in the last 7 days
 *   - Z-score  = (current − baseline_mean) / baseline_stddev
 *   - |z| ≥ 2.0 → anomaly;  ≥ 3.0 → major;  ≥ 4.0 → critical
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({}),
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { detectAnomalies } from "@/lib/anomaly/detector";

// ─── helpers ──────────────────────────────────────────────────────────────────

type Snapshot = {
  artist_id: string; user_id: string; platform: string;
  metric: string; metric_key: string; value: number; snapshot_at: string;
};

function makeSnapshots(
  baselineValues: number[],
  recentValues: number[],
  opts: { artistId?: string; userId?: string; platform?: string; metric?: string } = {}
): Snapshot[] {
  const { artistId = "artist-1", userId = "user-1", platform = "spotify", metric = "monthly_listeners" } = opts;
  const today = new Date();
  const snapshots: Snapshot[] = [];

  baselineValues.forEach((value, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - 30 + i);
    snapshots.push({ artist_id: artistId, user_id: userId, platform, metric,
      metric_key: `${platform}_${metric}`, value, snapshot_at: d.toISOString() });
  });

  recentValues.forEach((value, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - 6 + i);
    snapshots.push({ artist_id: artistId, user_id: userId, platform, metric,
      metric_key: `${platform}_${metric}`, value, snapshot_at: d.toISOString() });
  });

  return snapshots;
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe("detectAnomalies", () => {

  it("returns empty array for empty input", () => {
    expect(detectAnomalies([])).toEqual([]);
  });

  it("returns empty when total samples < MIN_SAMPLES (14)", () => {
    expect(detectAnomalies(makeSnapshots([100, 100, 100], [200, 200]))).toEqual([]);
  });

  it("returns empty when baseline window has fewer than 7 points", () => {
    expect(detectAnomalies(makeSnapshots(
      [100, 100, 100, 100, 100],
      [900, 900, 900, 900, 900, 900, 900, 900, 900],
    ))).toEqual([]);
  });

  it("returns empty when z-score is below 2.0 threshold", () => {
    expect(detectAnomalies(makeSnapshots(Array(20).fill(1000), Array(7).fill(1010)))).toEqual([]);
  });

  it("detects a spike (z ≥ 2.0, positive)", () => {
    const baseline = [995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000];
    const results = detectAnomalies(makeSnapshots(baseline, Array(7).fill(1060)));
    expect(results).toHaveLength(1);
    expect(results[0].direction).toBe("spike");
    expect(results[0].zScore).toBeGreaterThan(2.0);
  });

  it("detects a drop (z ≤ -2.0, negative)", () => {
    const baseline = [995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000];
    const results = detectAnomalies(makeSnapshots(baseline, Array(7).fill(940)));
    expect(results).toHaveLength(1);
    expect(results[0].direction).toBe("drop");
    expect(results[0].zScore).toBeLessThan(-2.0);
  });

  it("assigns a valid severity string", () => {
    const baseline = Array(20).fill(1000);
    baseline[0] = 990; baseline[5] = 1010; baseline[10] = 988; baseline[15] = 1012;
    const results = detectAnomalies(makeSnapshots(baseline, Array(7).fill(1030)));
    if (results.length > 0) {
      expect(["normal", "major", "critical"]).toContain(results[0].severity);
    }
  });

  it("produces the correct dedupKey format", () => {
    const baseline = [995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000];
    const results = detectAnomalies(makeSnapshots(baseline, Array(7).fill(1060),
      { artistId: "artist-abc", userId: "user-xyz", platform: "spotify", metric: "monthly_listeners" }));
    expect(results).toHaveLength(1);
    const today = new Date().toISOString().slice(0, 10);
    expect(results[0].dedupKey).toBe(`user-xyz:artist-abc:spotify_monthly_listeners:${today}`);
  });

  it("extracts the correct platform from metric_key", () => {
    const baseline = [995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000];
    const results = detectAnomalies(makeSnapshots(baseline, Array(7).fill(1060),
      { platform: "youtube", metric: "subscribers" }));
    expect(results).toHaveLength(1);
    expect(results[0].platform).toBe("youtube");
    expect(results[0].metricKey).toBe("youtube_subscribers");
  });

  it("handles multiple artists × metrics independently", () => {
    const stableBaseline = Array(20).fill(500);
    const spikeBaseline  = Array(20).fill(1000);
    spikeBaseline[0] = 990; spikeBaseline[10] = 1010;

    const snapshots = [
      ...makeSnapshots(spikeBaseline, Array(7).fill(1060),
        { artistId: "a1", userId: "u1", platform: "spotify", metric: "monthly_listeners" }),
      ...makeSnapshots(stableBaseline, Array(7).fill(502),
        { artistId: "a2", userId: "u2", platform: "spotify", metric: "monthly_listeners" }),
    ];

    const results = detectAnomalies(snapshots);
    expect(results.some((r) => r.artistId === "a2")).toBe(false);
    expect(results.some((r) => r.artistId === "a1")).toBe(true);
  });

  it("skips groups where stdDev is 0 (all identical values)", () => {
    const snapshots = makeSnapshots(Array(20).fill(1000), Array(7).fill(2000));
    expect(() => detectAnomalies(snapshots)).not.toThrow();
    expect(detectAnomalies(snapshots)).toEqual([]);
  });

  it("populates pctChange and currentValue correctly", () => {
    const baseline = [995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000,995,1000,1005,1000];
    const [result] = detectAnomalies(makeSnapshots(baseline, Array(7).fill(1060)));
    expect(result).toBeDefined();
    expect(result.currentValue).toBeGreaterThan(result.priorAvgValue);
    expect(result.pctChange).toBeGreaterThan(0);
    expect(
      Math.abs(result.pctChange - ((result.currentValue - result.priorAvgValue) / result.priorAvgValue) * 100)
    ).toBeLessThan(0.01);
  });
});
