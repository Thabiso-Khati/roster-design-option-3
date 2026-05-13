export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/campaign-builder/context
// GET — pull artist context to pre-seed the Campaign Builder.
//       Supports ?artistId=<uuid> to load a specific artist.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreArtist } from "@/lib/scoring";
import type { MetricSnapshot, Platform } from "@/lib/scoring/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const url = new URL(req.url);
  const artistId = url.searchParams.get("artistId");

  // ── 1. All artists for selector ──────────────────────────────
  // NOTE: We use admin client here because RLS on embedded joins
  // can silently return empty arrays — same pattern as /api/artists.
  // We scope by user_id manually so this is safe.
  const { data: allArtists, error: artistsErr } = await admin
    .from("artists")
    .select("id, name, country")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (artistsErr) {
    console.error("[campaign-builder/context] artists fetch error:", artistsErr.message);
  }

  // Pick the requested artist or default to first
  const targetArtist = artistId
    ? allArtists?.find(a => a.id === artistId) ?? allArtists?.[0] ?? null
    : allArtists?.[0] ?? null;

  // ── 2. Platform metrics → scoring engine ─────────────────────
  // Replaces the old artist_stats query (that table doesn't exist).
  // artist_platform_metrics is the source of truth for all signals.
  let monthlyListeners = 0;
  let followers = 0;
  let compassScore = 0;
  let momentum: "up" | "flat" | "down" = "flat";

  if (targetArtist) {
    const { data: metrics, error: metricsErr } = await admin
      .from("artist_platform_metrics")
      .select("platform, metric, value, snapshot_at, source")
      .eq("artist_id", targetArtist.id)
      .order("snapshot_at", { ascending: false });

    if (metricsErr) {
      console.error("[campaign-builder/context] metrics fetch error:", metricsErr.message);
    }

    if (metrics && metrics.length > 0) {
      const snapshots: MetricSnapshot[] = metrics.map(m => ({
        platform: m.platform as Platform,
        metric:   m.metric,
        value:    typeof m.value === "string" ? Number(m.value) : (m.value as number),
        snapshotAt: m.snapshot_at,
        source:   m.source,
      }));

      // Score via the same engine used everywhere else in ROSTER
      const scores = scoreArtist(snapshots, { primaryCountry: targetArtist.country ?? null });
      // compass_score = average of Reach + Engagement (same as roster dashboard)
      compassScore = Math.round((scores.reach + scores.engagement) / 2);

      // Helper: latest value for a (platform, metric) pair
      const latest = (plat: string, met: string): number => {
        return snapshots
          .filter(s => s.platform === plat && s.metric === met)
          .sort((a, b) => b.snapshotAt.localeCompare(a.snapshotAt))[0]?.value ?? 0;
      };

      monthlyListeners = latest("spotify", "monthly_listeners");
      followers        = latest("spotify", "followers");

      // Map numeric momentum score → direction label
      const mom = scores.momentum; // -100..+100
      momentum = mom > 5 ? "up" : mom < -5 ? "down" : "flat";
    }
  }

  const reachTier: "micro" | "emerging" | "established" =
    monthlyListeners >= 100_000 ? "established"
    : monthlyListeners >= 10_000 ? "emerging"
    : "micro";

  // ── 3. Fan CRM ───────────────────────────────────────────────
  const { count: totalContacts } = await admin
    .from("fan_contacts")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const { count: waContacts } = await admin
    .from("fan_contacts")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .not("whatsapp", "is", null);

  // ── 4. Upcoming release from releases table ──────────────────
  // Use the releases table directly (more reliable than workspace_events)
  const { data: releases } = await admin
    .from("releases")
    .select("id, title, release_date")
    .eq("user_id", user.id)
    .gt("release_date", new Date().toISOString().split("T")[0])
    .order("release_date", { ascending: true })
    .limit(1);

  let releaseDate: string | null = null;
  let releaseTitle: string | null = null;
  let daysToRelease: number | null = null;

  if (releases && releases.length > 0) {
    const r = releases[0];
    releaseDate  = r.release_date;
    releaseTitle = r.title;
    daysToRelease = Math.ceil(
      (new Date(r.release_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  }

  // ── Response ─────────────────────────────────────────────────
  return NextResponse.json({
    artists: (allArtists ?? []).map(a => ({ id: a.id, name: a.name })),
    context: {
      artist_id:         targetArtist?.id ?? null,
      artist_name:       targetArtist?.name ?? null,
      monthly_listeners: monthlyListeners,
      followers,
      compass_score:     compassScore,
      momentum,
      reach_tier:        reachTier,
      fan_crm_count:     totalContacts ?? 0,
      wa_count:          waContacts ?? 0,
      release_date:      releaseDate,
      release_title:     releaseTitle,
      days_to_release:   daysToRelease,
    },
  });
}
