// ============================================================
// ROSTER — Campaign dispatch engine
// ------------------------------------------------------------
// Resolves recipients, substitutes placeholders, and sends
// each message via the correct channel (email / WhatsApp).
//
// Placeholder tokens supported in subject + body:
//   [Fan Name]    → contact.name
//   [Artist Name] → sender_profile.display_name
//   [Track Title] → passed in as extraVars
//
// POPIA guard: only sends to contacts where popia_consent = true.
// ============================================================

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { sendWhatsApp } from "./whatsapp";
import { logger } from "@/lib/logger";

interface SenderProfile {
  id: string;
  display_name: string;
  email_from_name: string | null;
  email_reply_to: string | null;
  whatsapp_number: string | null;
}

interface DispatchOptions {
  campaignId: string;
  ownerId: string;
  channel: "email" | "whatsapp";
  subject: string | null;          // email only
  body: string;
  senderProfile: SenderProfile | null;
  segmentId: string | null;        // null = all fans with POPIA consent
  extraVars?: Record<string, string>;
}

interface DispatchResult {
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
}

/** Replace [Token] placeholders with real values. */
function resolvePlaceholders(
  text: string,
  vars: Record<string, string>
): string {
  return text.replace(/\[([^\]]+)\]/g, (_, key) => vars[key] ?? `[${key}]`);
}

/** Build a plain-text HTML email from a WhatsApp-style body string. */
function buildEmailHtml(body: string, fromName: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;max-width:600px">
        <tr><td style="background:#C9A84C;padding:6px 24px">
          <p style="margin:0;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;color:#0a0a0a">${fromName}</p>
        </td></tr>
        <tr><td style="padding:32px 28px">
          <p style="margin:0;font-size:15px;line-height:1.7;color:#e2e8f0">${escaped}</p>
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #222">
          <p style="margin:0;font-size:11px;color:#555">
            You're receiving this because you opted in to fan updates.
            To unsubscribe, reply STOP.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function dispatchCampaign(opts: DispatchOptions): Promise<DispatchResult> {
  const admin = createAdminClient();
  const {
    campaignId, ownerId, channel, subject, body,
    senderProfile, segmentId, extraVars = {},
  } = opts;

  // ── Fetch recipients ──────────────────────────────────────
  let contactQuery = admin
    .from("fan_contacts")
    .select("id, name, email, whatsapp")
    .eq("owner_id", ownerId)
    .eq("popia_consent", true);

  if (channel === "email") {
    contactQuery = contactQuery.not("email", "is", null);
  } else {
    contactQuery = contactQuery.not("whatsapp", "is", null);
  }

  if (segmentId) {
    // Join via fan_segment_members
    const { data: members } = await admin
      .from("fan_segment_members")
      .select("contact_id")
      .eq("segment_id", segmentId);
    const ids = (members ?? []).map((m) => m.contact_id as string);
    if (ids.length === 0) {
      return { totalRecipients: 0, sentCount: 0, failedCount: 0 };
    }
    contactQuery = contactQuery.in("id", ids);
  }

  const { data: contacts, error: contactsErr } = await contactQuery;
  if (contactsErr || !contacts) {
    logger.error("[dispatch] contacts fetch failed", { campaignId }, contactsErr);
    return { totalRecipients: 0, sentCount: 0, failedCount: 0 };
  }

  const totalRecipients = contacts.length;
  let sentCount = 0;
  let failedCount = 0;

  // Pre-insert recipient rows as 'pending'
  if (contacts.length > 0) {
    await admin.from("fan_campaign_recipients").insert(
      contacts.map((c) => ({
        campaign_id: campaignId,
        contact_id: c.id,
        status: "pending",
      }))
    );
  }

  const fromName = senderProfile?.display_name ?? "ROSTER";

  // ── Email from-label ─────────────────────────────────────
  // Priority: custom email_from_name → "{display_name} via ROSTER" → "ROSTER"
  // The "via ROSTER" suffix is omitted when the artist has already set a custom
  // email_from_name on their sender profile (avoids "Kabza via ROSTER via ROSTER").
  const emailFromLabel: string = senderProfile?.email_from_name
    ? senderProfile.email_from_name
    : senderProfile?.display_name
      ? `${senderProfile.display_name} via ROSTER`
      : "ROSTER";

  // ── WhatsApp identity prefix ──────────────────────────────
  // Since all WhatsApp messages share ROSTER's single business number until
  // each artist connects their own via 360dialog, we prepend a bold identity
  // line so fans immediately know who is writing.
  // Format:  *{sender display_name}:*\n\n{body}
  // Skipped when:
  //   • channel is not whatsapp
  //   • no sender profile (generic ROSTER blast — leave as-is)
  //   • the body already opens with the artist name (user put [Artist Name] first)
  function addWhatsAppIdentityPrefix(resolvedBody: string): string {
    if (!senderProfile) return resolvedBody;
    const prefix = `*${fromName}:*`;
    // Only skip if the resolved body genuinely starts with the name already
    if (resolvedBody.trimStart().startsWith(fromName)) return resolvedBody;
    return `${prefix}\n\n${resolvedBody}`;
  }

  // ── Send to each recipient ────────────────────────────────
  for (const contact of contacts) {
    const vars: Record<string, string> = {
      "Fan Name":    contact.name,
      "Artist Name": fromName,
      ...extraVars,
    };

    const resolvedBody = resolvePlaceholders(body, vars);
    let result: { success: boolean; error?: string };

    if (channel === "email") {
      const resolvedSubject = resolvePlaceholders(subject ?? `Message from ${fromName}`, vars);
      const replyTo = senderProfile?.email_reply_to ?? undefined;
      result = await sendEmail({
        to: contact.email!,
        subject: resolvedSubject,
        html: buildEmailHtml(resolvedBody, emailFromLabel),
        replyTo,
      });
    } else {
      const fromNumber = senderProfile?.whatsapp_number ?? undefined;
      result = await sendWhatsApp({
        to: contact.whatsapp!,
        body: addWhatsAppIdentityPrefix(resolvedBody),
        fromNumber,
      });
    }

    const status = result.success ? "sent" : "failed";
    if (result.success) sentCount++; else failedCount++;

    await admin
      .from("fan_campaign_recipients")
      .update({
        status,
        error_message: result.error ?? null,
        sent_at: result.success ? new Date().toISOString() : null,
      })
      .eq("campaign_id", campaignId)
      .eq("contact_id", contact.id);
  }

  return { totalRecipients, sentCount, failedCount };
}
