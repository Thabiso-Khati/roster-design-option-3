export const dynamic = 'force-dynamic';

/**
 * GET /api/vault/audit
 * ────────────────────
 * Returns the user's audit log. RLS scopes to the row owner.
 *
 * Query params:
 *   ?itemId=<uuid>  — filter to events for one item
 *   ?limit=N        — max rows (default 100, max 500)
 *   ?cursor=<iso>   — created_at cursor for pagination
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const itemId = url.searchParams.get("itemId");
  const limitRaw = Number(url.searchParams.get("limit") ?? 100);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100;
  const cursor = url.searchParams.get("cursor");

  let q = supabase
    .from("vault_audit_log")
    .select("id, vault_item_id, action, ip, user_agent, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (itemId) q = q.eq("vault_item_id", itemId);
  if (cursor) q = q.lt("created_at", cursor);

  const { data, error } = await q;
  if (error) {
    logger.error("[vault/audit] error", {}, error);
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
  }

  return NextResponse.json({
    entries: (data ?? []).map((r) => ({
      id: r.id,
      itemId: r.vault_item_id,
      action: r.action,
      ip: r.ip,
      userAgent: r.user_agent,
      metadata: r.metadata,
      createdAt: r.created_at,
    })),
    nextCursor: data && data.length === limit ? data[data.length - 1].created_at : null,
  });
}
