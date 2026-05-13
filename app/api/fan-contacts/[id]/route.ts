export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/fan-contacts/[id]
// PATCH  — update a contact
// DELETE — delete a contact
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { z } from "zod";

const PatchSchema = z.object({
  name:               z.string().min(1).max(200).optional(),
  email:              z.string().email().optional().nullable().or(z.literal("")),
  whatsapp:           z.string().max(30).optional().nullable().or(z.literal("")),
  city:               z.string().max(100).optional().nullable().or(z.literal("")),
  province:           z.string().max(100).optional().nullable().or(z.literal("")),
  country:            z.string().max(100).optional(),
  source:             z.enum(["show", "import", "manual", "social", "other"]).optional(),
  show_name:          z.string().max(200).optional().nullable().or(z.literal("")),
  tags:               z.array(z.string().max(50)).optional(),
  popia_consent:      z.boolean().optional(),
  notes:              z.string().max(2000).optional().nullable().or(z.literal("")),
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

  // Normalise empty strings to null for nullable fields
  const d = parsed.data as Record<string, unknown>;
  for (const key of ["email", "whatsapp", "city", "province", "show_name", "notes"]) {
    if (d[key] === "") d[key] = null;
  }

  // Auto-set popia_consent_date when consent is granted
  if (parsed.data.popia_consent === true && !d.popia_consent_date) {
    d.popia_consent_date = new Date().toISOString();
  }

  const { data, error } = await admin
    .from("fan_contacts")
    .update(d)
    .eq("id", id)
    .eq("owner_id", ctx.ownerId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ contact: data });
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
    .from("fan_contacts")
    .delete()
    .eq("id", id)
    .eq("owner_id", ctx.ownerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
