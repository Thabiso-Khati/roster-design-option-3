export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/optin/campaigns
// GET  — list owner's opt-in campaigns
// POST — create a new opt-in campaign
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { z } from "zod";

const CreateSchema = z.object({
  name:                z.string().min(1).max(100),
  slug:                z.string().regex(/^[a-z0-9][a-z0-9\-]{1,58}[a-z0-9]$/, "Slug must be lowercase letters, numbers and hyphens"),
  headline:            z.string().min(1).max(120),
  description:         z.string().max(400).optional().nullable(),
  artist_display_name: z.string().min(1).max(100),
  welcome_message:     z.string().max(1000).optional().nullable(),
  sender_profile_id:   z.string().uuid().optional().nullable(),
  is_active:           z.boolean().optional().default(true),
});

export async function GET() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fan_optin_campaigns")
    .select("*, sender_profile:sender_profiles(id, display_name)")
    .eq("owner_id", ctx.ownerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
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

  // Check slug uniqueness
  const { data: existing } = await admin
    .from("fan_optin_campaigns")
    .select("id")
    .eq("slug", parsed.data.slug)
    .single();

  if (existing) {
    return NextResponse.json({ error: "That URL slug is already taken — try another." }, { status: 409 });
  }

  const { data, error } = await admin
    .from("fan_optin_campaigns")
    .insert({ ...parsed.data, owner_id: ctx.ownerId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}
