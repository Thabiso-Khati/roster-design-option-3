// ============================================================
// ROSTER — /api/fan-contacts/segments/[id]
// GET    — list contact IDs in a segment
// POST   — add contacts to segment  { contact_ids: string[] }
// DELETE — delete segment entirely
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { z } from "zod";

const MembersSchema = z.object({
  contact_ids: z.array(z.string().uuid()).min(1).max(500),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  // Verify ownership
  const { data: seg } = await admin
    .from("fan_segments")
    .select("id")
    .eq("id", id)
    .eq("owner_id", ctx.ownerId)
    .single();
  if (!seg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await admin
    .from("fan_segment_members")
    .select("contact_id, added_at")
    .eq("segment_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = MembersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const admin = createAdminClient();

  // Verify segment ownership
  const { data: seg } = await admin
    .from("fan_segments")
    .select("id")
    .eq("id", id)
    .eq("owner_id", ctx.ownerId)
    .single();
  if (!seg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = parsed.data.contact_ids.map(cid => ({
    segment_id: id,
    contact_id: cid,
  }));

  // upsert so duplicates are silently ignored
  const { error } = await admin
    .from("fan_segment_members")
    .upsert(rows, { onConflict: "segment_id,contact_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ added: rows.length });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("fan_segments")
    .delete()
    .eq("id", id)
    .eq("owner_id", ctx.ownerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
