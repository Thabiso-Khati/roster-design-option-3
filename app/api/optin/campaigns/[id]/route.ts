// ============================================================
// ROSTER — /api/optin/campaigns/[id]
// PATCH — update (toggle active, edit fields)
// DELETE — remove campaign
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { z } from "zod";

const PatchSchema = z.object({
  name:                z.string().min(1).max(100).optional(),
  headline:            z.string().min(1).max(120).optional(),
  description:         z.string().max(400).optional().nullable(),
  artist_display_name: z.string().min(1).max(100).optional(),
  welcome_message:     z.string().max(1000).optional().nullable(),
  sender_profile_id:   z.string().uuid().optional().nullable(),
  is_active:           z.boolean().optional(),
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
  const { data, error } = await admin
    .from("fan_optin_campaigns")
    .update(parsed.data)
    .eq("id", id)
    .eq("owner_id", ctx.ownerId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ campaign: data });
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
    .from("fan_optin_campaigns")
    .delete()
    .eq("id", id)
    .eq("owner_id", ctx.ownerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
