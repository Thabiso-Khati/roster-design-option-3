export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/optin/[slug]
// GET  — fetch public campaign info (for the opt-in landing page)
// POST — fan submits opt-in form
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp } from "@/lib/campaigns/whatsapp";
import { logger } from "@/lib/logger";
import { z } from "zod";

const SubmitSchema = z.object({
  name:     z.string().min(1).max(200),
  whatsapp: z.string().min(7).max(30),
  consent:  z.literal(true, { errorMap: () => ({ message: "You must give consent to opt in." }) }),
});

// ── GET — public page fetches campaign info ───────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("fan_optin_campaigns")
    .select("slug, headline, description, artist_display_name, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Campaign not found or inactive" }, { status: 404 });
  }

  return NextResponse.json({ campaign: data });
}

// ── POST — fan submits opt-in ─────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { name, whatsapp } = parsed.data;
  const admin = createAdminClient();

  // Fetch campaign (and owner_id — needed for inserting fan_contact)
  const { data: campaign, error: campErr } = await admin
    .from("fan_optin_campaigns")
    .select("id, owner_id, artist_display_name, welcome_message, sender_profile_id, is_active")
    .eq("slug", slug)
    .single();

  if (campErr || !campaign || !campaign.is_active) {
    return NextResponse.json({ error: "Campaign not found or inactive" }, { status: 404 });
  }

  // Normalise WhatsApp to E.164
  const cleaned = whatsapp.replace(/[\s\-().]/g, "");
  const e164 = cleaned.startsWith("+") ? cleaned : `+${cleaned}`;

  // Upsert fan contact — update if same (owner_id + whatsapp) already exists
  const { data: contact, error: contactErr } = await admin
    .from("fan_contacts")
    .upsert(
      {
        owner_id:            campaign.owner_id,
        name,
        whatsapp:            e164,
        popia_consent:       true,
        popia_consent_date:  new Date().toISOString(),
        source:              "social",
      },
      {
        onConflict:          "owner_id,whatsapp",
        ignoreDuplicates:    false,
      }
    )
    .select("id")
    .single();

  if (contactErr) {
    logger.error("[optin] contact upsert failed", { slug, e164 }, contactErr);
    return NextResponse.json({ error: "Could not save your details. Please try again." }, { status: 500 });
  }

  // Increment opt_in_count
  await admin.rpc("increment_optin_count", { campaign_id: campaign.id }).maybeSingle();

  // Send welcome WhatsApp if configured
  if (campaign.welcome_message) {
    const resolvedBody = campaign.welcome_message
      .replace(/\[Fan Name\]/g, name)
      .replace(/\[Artist Name\]/g, campaign.artist_display_name);

    const result = await sendWhatsApp({ to: e164, body: resolvedBody });
    if (!result.success) {
      logger.warn("[optin] welcome WhatsApp failed", { slug, e164 }, result.error);
      // Don't fail the opt-in — contact is saved, just log the WhatsApp error
    }
  }

  return NextResponse.json({ ok: true, contactId: contact?.id });
}
