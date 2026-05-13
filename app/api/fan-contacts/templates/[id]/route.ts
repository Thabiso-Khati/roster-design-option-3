// ============================================================
// ROSTER — /api/fan-contacts/templates/[id]
// PATCH  — update template
// DELETE — delete template
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { z } from "zod";

const PatchSchema = z.object({
  name:    z.string().min(1).max(200).optional(),
  channel: z.enum(["email", "whatsapp", "sms"]).optional(),
  subject: z.string().max(300).optional().nullable().or(z.literal("")),
  body:    z.string().min(1).max(10_000).optional(),
  tags:    z.array(z.string().max(50)).optional(),
}).strict();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const admin = createAdminClient();
  const payload: Record<string, unknown> = { ...parsed.data };
  if (payload.subject === "") payload.subject = null;

  const { data, error } = await admin
    .from("fan_broadcast_templates")
    .update(payload)
    .eq("id", id)
    .eq("owner_id", ctx.ownerId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ template: data });
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
    .from("fan_broadcast_templates")
    .delete()
    .eq("id", id)
    .eq("owner_id", ctx.ownerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
