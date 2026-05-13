// ============================================================
// ROSTER — /api/workspace/events
// ------------------------------------------------------------
// POST: insert one workspace event for the current user.
// GET:  read the latest event per artifact for the current user
//       (used by dashboard aggregation cards).
//
// See /docs/phase-2-state-surfacing.md for the full design and
// /supabase-migrations/020-workspace-events.sql for the schema.
//
// Insert is intentionally lean — the events table is append-only
// and high-frequency (one row per ~5s of typing on a tracked tool),
// so we avoid joins/triggers in the write path.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isArtifactType,
  isEventType,
  type WorkspaceEvent,
  type WorkspaceEventPayload,
} from "@/lib/workspace/types";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

// ─── POST: insert event ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validated = validatePayload(body);
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const p = validated.payload;

    // Use admin client to bypass RLS — we've already auth'd the user
    // and we're inserting WITH user_id = user.id, which RLS would
    // accept anyway. Admin client is just faster here.
    const admin = createAdminClient();
    const { error } = await admin.from("workspace_events").insert({
      user_id: user.id,
      artifact_type: p.artifactType,
      artifact_id: p.artifactId,
      artifact_label: p.artifactLabel ?? null,
      event_type: p.eventType,
      completion_pct: p.completionPct ?? null,
      metadata: p.metadata ?? null,
    });

    if (error) {
      logger.error("[workspace/events POST] Insert error", {}, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── GET: latest event per artifact ─────────────────────────
// Returns one row per artifact (most recent event), used by
// dashboard cards to drive the "what state is each artifact in"
// aggregation. Optional `?since=<ISO date>` to scope to recent
// activity.
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const since = url.searchParams.get("since");

    const admin = createAdminClient();

    // distinct on (artifact_type, artifact_id) ordered by
    // occurred_at desc gives us the latest event per artifact in
    // a single round-trip. Postgres-specific syntax — accessed via
    // an RPC would be cleaner long-term; for v1 we use the
    // PostgREST equivalent: order desc + manual de-dup client-side.
    let query = admin
      .from("workspace_events")
      .select("*")
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false })
      .limit(500); // safety cap; per-user expected to stay well under

    if (since) {
      query = query.gte("occurred_at", since);
    }

    const { data, error } = await query;
    if (error) {
      logger.error("[workspace/events GET] Read error", {}, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // De-dup: keep only the latest event per (artifact_type, artifact_id).
    // Already ordered DESC so first occurrence wins.
    const seen = new Set<string>();
    const latest: WorkspaceEvent[] = [];
    for (const row of data ?? []) {
      const key = `${row.artifact_type}:${row.artifact_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      latest.push({
        id: row.id,
        userId: row.user_id,
        artifactType: row.artifact_type,
        artifactId: row.artifact_id,
        artifactLabel: row.artifact_label,
        eventType: row.event_type,
        completionPct: row.completion_pct,
        metadata: row.metadata,
        occurredAt: row.occurred_at,
      });
    }

    return NextResponse.json({ events: latest });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Helpers ────────────────────────────────────────────────

function validatePayload(
  body: unknown
):
  | { payload: WorkspaceEventPayload }
  | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Body must be an object" };
  }
  const b = body as Record<string, unknown>;

  if (!isArtifactType(b.artifactType)) {
    return { error: "Invalid or missing artifactType" };
  }
  if (typeof b.artifactId !== "string" || b.artifactId.length === 0) {
    return { error: "artifactId must be a non-empty string" };
  }
  if (!isEventType(b.eventType)) {
    return { error: "Invalid or missing eventType" };
  }

  // Optional fields
  let completionPct: number | null | undefined = undefined;
  if (b.completionPct !== undefined && b.completionPct !== null) {
    if (
      typeof b.completionPct !== "number" ||
      !Number.isFinite(b.completionPct) ||
      b.completionPct < 0 ||
      b.completionPct > 1
    ) {
      return { error: "completionPct must be between 0 and 1" };
    }
    completionPct = b.completionPct;
  } else if (b.completionPct === null) {
    completionPct = null;
  }

  const artifactLabel =
    typeof b.artifactLabel === "string" ? b.artifactLabel.slice(0, 200) : null;

  const metadata =
    b.metadata && typeof b.metadata === "object" && !Array.isArray(b.metadata)
      ? (b.metadata as Record<string, unknown>)
      : null;

  return {
    payload: {
      artifactType: b.artifactType,
      artifactId: b.artifactId,
      artifactLabel,
      eventType: b.eventType,
      completionPct,
      metadata,
    },
  };
}
