export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/fan-contacts/welcome
// POST — send a welcome WhatsApp message to a fan
//        Called from the manual "Add Fan" form when the
//        artist ticks "Send welcome WhatsApp".
//
// Delivery: enqueued via QStash (retries up to 3×) when
// QSTASH_TOKEN is set; falls back to inline send otherwise.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { sendWhatsApp } from "@/lib/campaigns/whatsapp";
import { enqueueTransact } from "@/lib/queue/transact";
import { logger } from "@/lib/logger";
import { z } from "zod";

const WelcomeSchema = z.object({
  name:              z.string().min(1).max(200),
  whatsapp:          z.string().min(7).max(30),
  sender_profile_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = WelcomeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { name, whatsapp, sender_profile_id } = parsed.data;

  // Resolve sender display name if a profile is linked
  let displayName: string | null = null;
  let fromNumber:  string | undefined;

  if (sender_profile_id) {
    const admin = createAdminClient();
    const { data: sender } = await admin
      .from("sender_profiles")
      .select("display_name, whatsapp_number")
      .eq("id", sender_profile_id)
      .eq("owner_id", ctx.ownerId)
      .single();

    if (sender) {
      displayName = sender.display_name ?? null;
      fromNumber  = sender.whatsapp_number ?? undefined;
    }
  }

  // Build welcome message
  const artistLine  = displayName ? `*${displayName}:*\n` : "";
  const messageBody =
    `${artistLine}Hey ${name}! 👋 Thanks for joining — you'll be the first to hear about new music, shows, and exclusive drops.\n\nReply *STOP* at any time to unsubscribe.`;

  // ── Try QStash queue first (retries on failure) ─────────────────────────
  const { queued, error: qErr } = await enqueueTransact({
    type:       "whatsapp",
    to:         whatsapp,
    body:       messageBody,
    fromNumber,
  });

  if (queued) {
    return NextResponse.json({ ok: true, queued: true });
  }

  if (qErr) {
    logger.warn("[welcome] QStash enqueue failed — falling back to inline send", {}, qErr);
  }

  // ── Fallback: send inline ───────────────────────────────────────────────
  const result = await sendWhatsApp({ to: whatsapp, body: messageBody, fromNumber });

  if (!result.success) {
    logger.warn("[welcome] WhatsApp send failed", { whatsapp }, result.error);
    return NextResponse.json({ error: result.error ?? "Failed to send WhatsApp" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sid: result.sid });
}
