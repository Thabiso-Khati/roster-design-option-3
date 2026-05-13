// ============================================================
// ROSTER — /api/fan-contacts/segments
// GET  — list segments with member counts (paginated)
// POST — create a segment
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { z } from "zod";

const PAGE_SIZE     = 50;
const MAX_PAGE_SIZE = 200;

const CreateSchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(500).optional().or(z.literal("")),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default("#C9A84C"),
});

export async function GET(req: NextRequest) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page  = Math.max(0, parseInt(searchParams.get("page")  ?? "0", 10));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10)));
  const from  = page * limit;
  const to    = from + limit - 1;

  const admin = createAdminClient();
  // Fetch segments + member counts in one round-trip using a join
  const { data, error, count } = await admin
    .from("fan_segments")
    .select("*, fan_segment_members(count)", { count: "exact" })
    .eq("owner_id", ctx.ownerId)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const segments = (data ?? []).map(s => ({
    ...s,
    member_count: Array.isArray(s.fan_segment_members)
      ? (s.fan_segment_members[0] as { count: number })?.count ?? 0
      : 0,
    fan_segment_members: undefined,
  }));

  return NextResponse.json({
    segments,
    total:   count ?? 0,
    page,
    limit,
    hasMore: from + segments.length < (count ?? 0),
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fan_segments")
    .insert({
      owner_id:    ctx.ownerId,
      name:        parsed.data.name,
      description: parsed.data.description || null,
      color:       parsed.data.color,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ segment: { ...data, member_count: 0 } }, { status: 201 });
}
