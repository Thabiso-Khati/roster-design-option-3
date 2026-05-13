export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/fan-contacts
// GET  — list contacts (paginated, filterable)
// POST — create a single contact
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { z } from "zod";

const CreateSchema = z.object({
  name:               z.string().min(1).max(200),
  email:              z.string().email().optional().or(z.literal("")),
  whatsapp:           z.string().max(30).optional().or(z.literal("")),
  city:               z.string().max(100).optional().or(z.literal("")),
  province:           z.string().max(100).optional().or(z.literal("")),
  country:            z.string().max(100).optional().default("South Africa"),
  source:             z.enum(["show", "import", "manual", "social", "other"]).optional().default("manual"),
  show_name:          z.string().max(200).optional().or(z.literal("")),
  tags:               z.array(z.string().max(50)).optional().default([]),
  popia_consent:      z.boolean().optional().default(false),
  popia_consent_date: z.string().datetime().optional().nullable(),
  notes:              z.string().max(2000).optional().or(z.literal("")),
});

// ── GET ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const q          = searchParams.get("q")?.trim() || "";
    const source     = searchParams.get("source") || "";
    const consent    = searchParams.get("popia_consent");
    const hasChannel = searchParams.get("has_channel") || ""; // "email" | "whatsapp"
    const page       = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit      = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const offset     = (page - 1) * limit;

    const admin = createAdminClient();

    let query = admin
      .from("fan_contacts")
      .select("*", { count: "exact" })
      .eq("owner_id", ctx.ownerId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,whatsapp.ilike.%${q}%,city.ilike.%${q}%`);
    }
    if (source) {
      query = query.eq("source", source);
    }
    if (consent === "true")  query = query.eq("popia_consent", true);
    if (consent === "false") query = query.eq("popia_consent", false);
    if (hasChannel === "email")    query = query.not("email",    "is", null);
    if (hasChannel === "whatsapp") query = query.not("whatsapp", "is", null);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ contacts: data, total: count ?? 0, page, limit });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    let body: unknown;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const d = parsed.data;
    const admin = createAdminClient();

    const payload = {
      owner_id:           ctx.ownerId,
      name:               d.name,
      email:              d.email || null,
      whatsapp:           d.whatsapp || null,
      city:               d.city || null,
      province:           d.province || null,
      country:            d.country || "South Africa",
      source:             d.source || "manual",
      show_name:          d.show_name || null,
      tags:               d.tags ?? [],
      popia_consent:      d.popia_consent,
      popia_consent_date: d.popia_consent ? (d.popia_consent_date ?? new Date().toISOString()) : null,
      notes:              d.notes || null,
    };

    const { data, error } = await admin
      .from("fan_contacts")
      .insert(payload)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contact: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
