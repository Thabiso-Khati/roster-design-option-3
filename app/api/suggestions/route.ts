export const dynamic = 'force-dynamic';

/**
 * GET    /api/suggestions      — list open suggestions for the user (top 5 prioritised)
 * PATCH  /api/suggestions      — body { id, status: "acted"|"snoozed"|"dismissed", snoozedUntil? }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

interface Row {
  id: string;
  artist_id: string | null;
  rule_category: string;
  rule_id: string;
  priority: string;
  title: string;
  body: string | null;
  action_label: string | null;
  action_href: string | null;
  expires_at: string | null;
  created_at: string;
  status: string;
}

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") ?? 10)));

  const { data, error } = await supabase
    .from("proactive_suggestions")
    .select("id, artist_id, rule_category, rule_id, priority, title, body, action_label, action_href, expires_at, created_at, status")
    .eq("user_id", user.id)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    logger.error("[suggestions/list]", {}, error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as Row[];

  // Filter expired + sort by priority (urgent first), then recency
  const now = Date.now();
  const filtered = rows.filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now);
  filtered.sort((a, b) => {
    const ra = PRIORITY_RANK[a.priority] ?? 99;
    const rb = PRIORITY_RANK[b.priority] ?? 99;
    if (ra !== rb) return ra - rb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return NextResponse.json({
    suggestions: filtered.slice(0, limit).map((r) => ({
      id: r.id,
      artistId: r.artist_id,
      ruleCategory: r.rule_category,
      ruleId: r.rule_id,
      priority: r.priority,
      title: r.title,
      body: r.body,
      actionLabel: r.action_label,
      actionHref: r.action_href,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
    })),
    totalOpen: filtered.length,
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
  const allowed = ["acted", "snoozed", "dismissed"];

  if (!id || !status || !allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
  }

  const update: Record<string, unknown> = { status };
  if (status === "acted") update.acted_at = new Date().toISOString();
  if (status === "dismissed") update.dismissed_at = new Date().toISOString();
  if (status === "snoozed" && snoozedUntil) update.snoozed_until = snoozedUntil;

  const { error } = await supabase
    .from("proactive_suggestions")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    logger.error("[suggestions/patch]", {}, error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
