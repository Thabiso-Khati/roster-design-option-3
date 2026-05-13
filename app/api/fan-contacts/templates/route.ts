export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/fan-contacts/templates
// GET  — list broadcast templates (paginated)
// POST — create a template
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { z } from "zod";

const PAGE_SIZE     = 50;
const MAX_PAGE_SIZE = 200;

const CreateSchema = z.object({
  name:    z.string().min(1).max(200),
  channel: z.enum(["email", "whatsapp", "sms"]),
  subject: z.string().max(300).optional().nullable().or(z.literal("")),
  body:    z.string().min(1).max(10_000),
  tags:    z.array(z.string().max(50)).optional().default([]),
});

// Default templates seeded per workspace on first GET
const SEED_TEMPLATES = [
  {
    name:    "New Release Announcement — WhatsApp",
    channel: "whatsapp",
    subject: null,
    body:    "Hey [Fan Name] 👋\n\nBig news — my new track *[Track Title]* is OUT NOW! 🎶\n\nStream it here 👉 [Link]\n\nLet me know what you think. Your support means everything. 🙏\n\n— [Artist Name]",
    tags:    ["release", "announcement"],
  },
  {
    name:    "Tour Announcement — WhatsApp",
    channel: "whatsapp",
    subject: null,
    body:    "📣 [City], I'm coming! 🎤\n\nCatch me LIVE at [Venue] on [Date].\n\nPresale tickets (fan-only price) 👉 [Link]\n\nPresale ends [Date] — first come, first served!\n\n— [Artist Name]",
    tags:    ["tour", "announcement"],
  },
  {
    name:    "New Release — Email",
    channel: "email",
    subject: "[Artist Name] — [Track Title] is Out Now 🎶",
    body:    "Hi [Fan Name],\n\nI've been working on something special and it's finally here.\n\n[Track Title] is out now on all platforms.\n\nStream it: [Link]\n\nThank you for being part of this journey. You were one of the first to hear about it — that means a lot.\n\n[Artist Name]",
    tags:    ["release", "email"],
  },
  {
    name:    "VIP / Merch Drop — SMS",
    channel: "sms",
    subject: null,
    body:    "[Artist Name]: Limited merch drop LIVE now 👕 Only [X] units. Order: [Link] Reply STOP to opt out.",
    tags:    ["merch", "sms"],
  },
];

export async function GET(req: NextRequest) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();

  // Seed defaults if this workspace has none
  const { count: existingCount } = await admin
    .from("fan_broadcast_templates")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ctx.ownerId);

  if ((existingCount ?? 0) === 0) {
    await admin.from("fan_broadcast_templates").insert(
      SEED_TEMPLATES.map(t => ({ ...t, owner_id: ctx.ownerId }))
    );
  }

  const { searchParams } = req.nextUrl;
  const page  = Math.max(0, parseInt(searchParams.get("page")  ?? "0", 10));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10)));
  const from  = page * limit;
  const to    = from + limit - 1;

  const { data, error, count } = await admin
    .from("fan_broadcast_templates")
    .select("*", { count: "exact" })
    .eq("owner_id", ctx.ownerId)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    templates: data ?? [],
    total:     count ?? 0,
    page,
    limit,
    hasMore:   from + (data?.length ?? 0) < (count ?? 0),
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
    .from("fan_broadcast_templates")
    .insert({
      owner_id: ctx.ownerId,
      ...parsed.data,
      subject: parsed.data.subject || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data }, { status: 201 });
}
