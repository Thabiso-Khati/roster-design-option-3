export const dynamic = 'force-dynamic';

// POST /api/campaigns/[id]/send
// ------------------------------------------------------------
// Triggers the actual dispatch for a draft campaign.
// Sets status → sending, runs dispatchCampaign(), then updates
// sent_count / failed_count / status → sent (or failed).
//
// Idempotency guard: returns 409 if campaign is already sending
// or has been sent.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchCampaign } from "@/lib/campaigns/dispatch";
import { logger } from "@/lib/logger";

export const runtime  = "nodejs";
export const maxDuration = 120; // 2 min — large lists need time

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();

  // Fetch campaign + sender profile
  const { data: campaign, error: fetchErr } = await supabase
    .from("fan_campaigns")
    .select(`
      id, owner_id, name, channel, subject, body, status,
      segment_id, sender_profile_id,
      sender_profile:sender_profiles(
        id, display_name, email_from_name, email_reply_to, whatsapp_number
      )
    `)
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (fetchErr || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status !== "draft") {
    return NextResponse.json(
      { error: `Campaign is already ${campaign.status}` },
      { status: 409 }
    );
  }

  // Lock campaign immediately
  await admin
    .from("fan_campaigns")
    .update({ status: "sending" })
    .eq("id", id);

  try {
    const senderProfile = Array.isArray(campaign.sender_profile)
      ? campaign.sender_profile[0] ?? null
      : campaign.sender_profile ?? null;

    const result = await dispatchCampaign({
      campaignId: id,
      ownerId: user.id,
      channel: campaign.channel as "email" | "whatsapp",
      subject: campaign.subject,
      body: campaign.body,
      senderProfile,
      segmentId: campaign.segment_id ?? null,
    });

    const finalStatus = result.failedCount > 0 && result.sentCount === 0
      ? "failed"
      : "sent";

    await admin
      .from("fan_campaigns")
      .update({
        status: finalStatus,
        total_recipients: result.totalRecipients,
        sent_count: result.sentCount,
        failed_count: result.failedCount,
        sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      status: finalStatus,
      totalRecipients: result.totalRecipients,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
    });
  } catch (err) {
    logger.error("[campaigns/send] unexpected error", { campaignId: id }, err);
    await admin.from("fan_campaigns").update({ status: "failed" }).eq("id", id);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 500 }
    );
  }
}
