// ============================================================
// ROSTER — Twilio WhatsApp sender
// ------------------------------------------------------------
// Sends a WhatsApp message via the Twilio Messaging API using
// a plain fetch call (no SDK dependency).
//
// Required env vars:
//   TWILIO_ACCOUNT_SID   — found in Twilio Console dashboard
//   TWILIO_AUTH_TOKEN    — found in Twilio Console dashboard
//   TWILIO_WHATSAPP_FROM — your Twilio WhatsApp number,
//                          e.g. "+14155238886" (sandbox)
//                          or   "+27XXXXXXXXX" (production)
//
// The "From" value must be prefixed with "whatsapp:" — this
// helper adds it automatically so callers just pass the number.
// ============================================================

import { logger } from "@/lib/logger";

export interface WhatsAppSendParams {
  to: string;           // recipient number, e.g. "+27831234567"
  body: string;         // message text
  fromNumber?: string;  // override default — uses TWILIO_WHATSAPP_FROM if omitted
}

export interface WhatsAppSendResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/** Normalise a phone number to E.164 + "whatsapp:" prefix.
 *
 * Handles common formats:
 *   +27831234567  → whatsapp:+27831234567  (already E.164)
 *   0831234567    → whatsapp:+27831234567  (SA local — strip leading 0, prepend +27)
 *   27831234567   → whatsapp:+27831234567  (SA without +)
 *   +447911123456 → whatsapp:+447911123456 (other country, already E.164)
 */
function toWhatsAppAddress(number: string): string {
  const digits = number.replace(/[^\d+]/g, "");

  let e164: string;
  if (digits.startsWith("+")) {
    // Already has + prefix — assume E.164
    e164 = digits;
  } else if (digits.startsWith("0") && digits.length === 10) {
    // South African local format: 08x/06x/07x — replace leading 0 with +27
    e164 = `+27${digits.slice(1)}`;
  } else if (digits.startsWith("27") && digits.length === 11) {
    // SA number without + prefix
    e164 = `+${digits}`;
  } else {
    // Best-effort: prepend + and hope for the best
    e164 = `+${digits}`;
  }

  return `whatsapp:${e164}`;
}

export async function sendWhatsApp({
  to,
  body,
  fromNumber,
}: WhatsAppSendParams): Promise<WhatsAppSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const defaultFrom = fromNumber ?? process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken) {
    return { success: false, error: "TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set" };
  }
  if (!defaultFrom) {
    return { success: false, error: "TWILIO_WHATSAPP_FROM not configured — set it in .env.local" };
  }
  if (!to?.trim()) {
    return { success: false, error: "Recipient number is empty" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const formBody = new URLSearchParams({
    From: toWhatsAppAddress(defaultFrom),
    To:   toWhatsAppAddress(to),
    Body: body,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody.toString(),
      signal: AbortSignal.timeout(15_000),
    });

    const json = await res.json() as { sid?: string; message?: string; code?: number };

    if (!res.ok) {
      const errMsg = json.message ?? `Twilio ${res.status}`;
      logger.warn("[whatsapp] send failed", { to, code: json.code }, errMsg);
      return { success: false, error: errMsg };
    }

    return { success: true, sid: json.sid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Twilio error";
    logger.error("[whatsapp] unexpected error", { to }, err);
    return { success: false, error: msg };
  }
}
