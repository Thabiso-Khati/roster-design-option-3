export const dynamic = 'force-dynamic';

/**
 * GET /api/audit-trail
 * ────────────────────
 * Returns the user's recent workspace activity + signing audit log,
 * merged into a single chronological timeline.
 *
 * Query params:
 *   ?limit=N       (default 100, max 500)
 *   ?cursor=<iso>  (created_at cursor for pagination)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface UnifiedEvent {
  id: string;
  source: "workspace" | "signing" | "vault";
  action: string;
  artifactType: string;
  artifactLabel: string | null;
  artifactId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? 100);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100;
  const cursor = url.searchParams.get("cursor");

  // Pull from each source in parallel.
  const [wsRes, signRes, vaultRes] = await Promise.all([
    (() => {
      let q = supabase
        .from("workspace_events")
        .select("id, artifact_type, artifact_id, artifact_label, event_type, created_at, payload")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (cursor) q = q.lt("created_at", cursor);
      return q;
    })(),
    (() => {
      let q = supabase
        .from("signing_audit_log")
        .select("id, signing_request_id, action, ip, user_agent, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (cursor) q = q.lt("created_at", cursor);
      return q;
    })(),
    (() => {
      let q = supabase
        .from("vault_audit_log")
        .select("id, vault_item_id, action, ip, user_agent, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (cursor) q = q.lt("created_at", cursor);
      return q;
    })(),
  ]);

  const wsEvents: UnifiedEvent[] = (wsRes.data ?? []).map((r) => {
    const e = r as { id: string; artifact_type: string; artifact_id: string; artifact_label?: string | null; event_type: string; created_at: string; payload?: Record<string, unknown> | null };
    return {
      id: `ws-${e.id}`,
      source: "workspace",
      action: e.event_type,
      artifactType: e.artifact_type,
      artifactLabel: e.artifact_label ?? null,
      artifactId: e.artifact_id,
      metadata: e.payload ?? {},
      createdAt: e.created_at,
    };
  });

  const signEvents: UnifiedEvent[] = (signRes.data ?? []).map((r) => {
    const s = r as { id: string; signing_request_id: string; action: string; ip?: string | null; user_agent?: string | null; metadata?: Record<string, unknown> | null; created_at: string };
    return {
      id: `sign-${s.id}`,
      source: "signing",
      action: s.action,
      artifactType: "signing_request",
      artifactLabel: null,
      artifactId: s.signing_request_id,
      metadata: { ...(s.metadata ?? {}), ip: s.ip, userAgent: s.user_agent },
      createdAt: s.created_at,
    };
  });

  const vaultEvents: UnifiedEvent[] = (vaultRes.data ?? []).map((r) => {
    const v = r as { id: string; vault_item_id: string | null; action: string; ip?: string | null; user_agent?: string | null; metadata?: Record<string, unknown> | null; created_at: string };
    return {
      id: `vault-${v.id}`,
      source: "vault",
      action: v.action,
      artifactType: "vault_item",
      artifactLabel: null,
      artifactId: v.vault_item_id,
      metadata: { ...(v.metadata ?? {}), ip: v.ip, userAgent: v.user_agent },
      createdAt: v.created_at,
    };
  });

  // Merge + sort + paginate
  const merged = [...wsEvents, ...signEvents, ...vaultEvents]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);

  return NextResponse.json({
    events: merged,
    nextCursor: merged.length === limit ? merged[merged.length - 1].createdAt : null,
  });
}
