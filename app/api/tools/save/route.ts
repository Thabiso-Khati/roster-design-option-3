export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/tools/save
// ------------------------------------------------------------
// Saves (upserts) a tool snapshot for the authenticated user.
// One snapshot per (user, tool_slug) — re-saving updates the
// existing row so Workspace shows one entry per tool, not one
// per save action.
//
// POST /api/tools/save
//   body: { tool_slug, title, data }
//   returns: { snapshot: { id, tool_slug, title, updated_at } }
//
// GET /api/tools/save?slug=<tool_slug>
//   returns: { snapshot: <row> | null }
//   Used by tools on mount to restore saved state from server.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── POST — upsert snapshot ───────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: { tool_slug?: string; title?: string; data?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { tool_slug, title, data } = body;
  if (!tool_slug?.trim()) {
    return NextResponse.json({ error: "tool_slug is required" }, { status: 400 });
  }
  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: snapshot, error } = await admin
    .from("tool_snapshots")
    .upsert(
      {
        user_id:   user.id,
        tool_slug: tool_slug.trim(),
        title:     title.trim(),
        data:      data ?? {},
      },
      { onConflict: "user_id,tool_slug", ignoreDuplicates: false }
    )
    .select("id, tool_slug, title, updated_at")
    .single();

  if (error) {
    console.error("[tools/save] upsert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ snapshot }, { status: 200 });
}

// ── DELETE — permanently remove snapshot ────────────────────
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug param required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("tool_snapshots")
    .delete()
    .eq("user_id", user.id)
    .eq("tool_slug", slug);

  if (error) {
    console.error("[tools/save DELETE] error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// ── PATCH — archive or restore a snapshot ───────────────────
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: { slug?: string; archived?: boolean };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { slug, archived } = body;
  if (!slug?.trim()) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: snapshot, error } = await admin
    .from("tool_snapshots")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("user_id", user.id)
    .eq("tool_slug", slug.trim())
    .select("id, tool_slug, title, archived_at, updated_at")
    .single();

  if (error) {
    console.error("[tools/save PATCH] error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ snapshot });
}

// ── GET — load saved snapshot for a tool ────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug param required" }, { status: 400 });
  }

  const { data: snapshot } = await supabase
    .from("tool_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .eq("tool_slug", slug)
    .maybeSingle();

  return NextResponse.json({ snapshot: snapshot ?? null });
}
