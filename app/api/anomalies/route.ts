/**
 * GET    /api/anomalies         — list open anomalies for the user
 * PATCH  /api/anomalies         — body { id, status: "acknowledged"|"dismissed"|"snoozed", snoozedUntil? }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

interface AnomalyRow {
  id: string;
  artist_id: string | null;
  metric_key: string;
  platform: string | null;
  direction: string;
  severity: string;
  current_value: number;
  prior_avg_value: number;
  pct_change: number | null;
  z_score: number | null;
  detected_at: string;
  status: string;
  snoozed_until: string | null;
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("anomaly_events")
    .select("id, artist_id, metric_key, platform, direction, severity, current_value, prior_avg_value, pct_change, z_score, detected_at, status, snoozed_until")
    .eq("user_id", user.id)
    .in("status", ["open", "snoozed", "acknowledged"])
    .order("detected_at", { ascending: false })
    .limit(100);

  if (error) {
    logger.error("[anomalies/list]", {}, error);
    return NextResponse.json({ error: "Failed to fetch anomalies" }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as AnomalyRow[];
  return NextResponse.json({
    anomalies: rows.map((r) => ({
      id: r.id,
      artistId: r.artist_id,
      metricKey: r.metric_key,
      platform: r.platform,
      direction: r.direction,
      severity: r.severity,
      currentValue: Number(r.current_value),
      priorAvgValue: Number(r.prior_avg_value),
      pctChange: r.pct_change != null ? Number(r.pct_change) : null,
      zScore: r.z_score != null ? Number(r.z_score) : null,
      detectedAt: r.detected_at,
      status: r.status,
      snoozedUntil: r.snoozed_until,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const id = typeof body.id === "string" ? body.id : null;
  const status = typeof body.status === "string" ? body.status : null;
  const snoozedUntil = typeof body.snoozedUntil === "string" ? body.snoozedUntil : null;
  const allowed = ["acknowledged", "dismissed", "snoozed", "resolved"];

  if (!id || !status || !allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
  }

  const update: Record<string, unknown> = { status };
  if (status === "acknowledged") update.acknowledged_at = new Date().toISOString();
  if (status === "dismissed") update.dismissed_at = new Date().toISOString();
  if (status === "snoozed" && snoozedUntil) update.snoozed_until = snoozedUntil;

  const { error } = await supabase
    .from("anomaly_events")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    logger.error("[anomalies/patch]", {}, error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
