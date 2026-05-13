// ============================================================
// ROSTER — /api/fan-contacts/import
// POST — bulk insert fan contacts from CSV rows
//
// Body: { rows: Array<record>, source?: string }
// Each row is a key→value object. Column names are normalised
// before insert (case-insensitive, strips spaces/underscores).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { z } from "zod";

const MAX_ROWS = 2000;

const RowSchema = z.object({
  name:          z.string().min(1).max(200),
  email:         z.string().email().optional().nullable().or(z.literal("")),
  whatsapp:      z.string().max(30).optional().nullable().or(z.literal("")),
  city:          z.string().max(100).optional().nullable().or(z.literal("")),
  province:      z.string().max(100).optional().nullable().or(z.literal("")),
  country:       z.string().max(100).optional().default("South Africa"),
  show_name:     z.string().max(200).optional().nullable().or(z.literal("")),
  popia_consent: z.union([z.boolean(), z.string()]).optional().default(false),
  notes:         z.string().max(2000).optional().nullable().or(z.literal("")),
}).passthrough();

const BodySchema = z.object({
  rows:   z.array(z.record(z.string(), z.unknown())).max(MAX_ROWS),
  source: z.enum(["show", "import", "manual", "social", "other"]).optional().default("import"),
});

/** Normalise a column header → known field name */
function normalise(key: string): string {
  const k = key.toLowerCase().replace(/[\s_\-]+/g, "");
  const map: Record<string, string> = {
    fullname:        "name",
    firstname:       "name",
    name:            "name",
    email:           "email",
    emailaddress:    "email",
    whatsapp:        "whatsapp",
    whatsappnumber:  "whatsapp",
    phone:           "whatsapp",
    phonenumber:     "whatsapp",
    mobile:          "whatsapp",
    city:            "city",
    town:            "city",
    province:        "province",
    region:          "province",
    state:           "province",
    country:         "country",
    show:            "show_name",
    showname:        "show_name",
    event:           "show_name",
    eventname:       "show_name",
    consent:         "popia_consent",
    popiaconsent:    "popia_consent",
    notes:           "notes",
    note:            "notes",
    comments:        "notes",
  };
  return map[k] || key;
}

function parseBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["true","yes","1","y","✓","x"].includes(v.toLowerCase().trim());
  return false;
}

export async function POST(req: NextRequest) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { rows: rawRows, source } = parsed.data;

  if (rawRows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  // Normalise column headers in each row
  const normalisedRows = rawRows.map(row => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      out[normalise(k)] = v;
    }
    return out;
  });

  // Validate each row
  const valid: object[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < normalisedRows.length; i++) {
    const r = RowSchema.safeParse(normalisedRows[i]);
    if (!r.success) {
      errors.push({ row: i + 1, message: JSON.stringify(r.error.flatten().fieldErrors) });
      continue;
    }
    const d = r.data;
    valid.push({
      owner_id:           ctx.ownerId,
      name:               d.name,
      email:              (d.email as string) || null,
      whatsapp:           (d.whatsapp as string) || null,
      city:               (d.city as string) || null,
      province:           (d.province as string) || null,
      country:            (d.country as string) || "South Africa",
      source,
      show_name:          (d.show_name as string) || null,
      tags:               [],
      popia_consent:      parseBool(d.popia_consent),
      popia_consent_date: parseBool(d.popia_consent) ? new Date().toISOString() : null,
      notes:              (d.notes as string) || null,
    });
  }

  if (valid.length === 0) {
    return NextResponse.json(
      { error: "No valid rows to import", row_errors: errors },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { error: insertError } = await admin
    .from("fan_contacts")
    .insert(valid);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    imported:   valid.length,
    skipped:    errors.length,
    row_errors: errors.length > 0 ? errors : undefined,
  }, { status: 201 });
}
