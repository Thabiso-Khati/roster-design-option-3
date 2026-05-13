export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE     = 20;
const MAX_PAGE_SIZE = 100;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email || "")) return false;
  return true;
}

// POST /api/admin/masterclasses — toggle publish or update
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!(await checkAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action, id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (action === "toggle") {
    const { data: mc } = await supabase.from("masterclasses").select("is_published").eq("id", id).single();
    if (!mc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { error } = await supabase.from("masterclasses").update({ is_published: !mc.is_published }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, is_published: !mc.is_published });
  }

  if (action === "update") {
    const { error } = await supabase.from("masterclasses").update(fields).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    const { error } = await supabase.from("masterclasses").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// GET /api/admin/masterclasses — list all (including drafts, paginated)
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  if (!(await checkAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const page  = Math.max(0, parseInt(searchParams.get("page")  ?? "0", 10));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10)));
  const from  = page * limit;
  const to    = from + limit - 1;

  let query = supabase
    .from("masterclasses")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data, error, count } = await query.range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data:    data ?? [],
    total:   count ?? 0,
    page,
    limit,
    hasMore: from + (data?.length ?? 0) < (count ?? 0),
  });
}
