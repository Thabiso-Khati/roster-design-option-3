// ─────────────────────────────────────────────────────────────
// ROSTER — WhatsApp Utilities
//
// Three layers:
// 1. wa.me links  — no API, works everywhere, zero setup
// 2. Africa's Talking SMS — backup for users without WhatsApp data
// 3. WhatsApp Business API (via AT) — for automated messages when approved
// ─────────────────────────────────────────────────────────────

import { logger } from "@/lib/logger";
const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "";
const AT_API_KEY = process.env.AFRICASTALKING_API_KEY || "";
const AT_USERNAME = process.env.AFRICASTALKING_USERNAME || "sandbox";
const AT_BASE_URL = "https://api.africastalking.com/version1/messaging";

// ── 1. wa.me LINK GENERATORS ──────────────────────────────────

/** Opens WhatsApp chat with a pre-filled message */
export function waLink(phone: string, message: string): string {
  const clean = phone.replace(/\s+/g, "").replace(/^0/, "+27");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean.replace("+", "")}?text=${encoded}`;
}

/** Support chat link — goes to ROSTER's support number */
export function supportWaLink(context?: string): string {
  const msg = context
    ? `Hi ROSTER support, I need help with: ${context}`
    : "Hi ROSTER support, I need some help.";
  return SUPPORT_WHATSAPP
    ? waLink(SUPPORT_WHATSAPP, msg)
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

/** Booking confirmation share link */
export function bookingWaLink({
  expertName,
  durationMinutes,
  scheduledAt,
}: {
  expertName: string;
  durationMinutes: number;
  scheduledAt: string;
}): string {
  const date = new Date(scheduledAt).toLocaleDateString("en-ZA", {
    weekday: "short", day: "numeric", month: "short",
  });
  const time = new Date(scheduledAt).toLocaleTimeString("en-ZA", {
    hour: "2-digit", minute: "2-digit",
  });
  const msg =
    `✅ Session booked on ROSTER!\n\n` +
    `👤 Expert: ${expertName}\n` +
    `⏱ Duration: ${durationMinutes} minutes\n` +
    `📅 ${date} at ${time}\n\n` +
    `The expert will send you a meeting link shortly.`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

/** Expert contact link — opens chat with the expert directly */
export function expertWaLink(expertPhone: string, expertName: string): string {
  const msg =
    `Hi ${expertName.split(" ")[0]}, I just booked a session with you on ROSTER. ` +
    `Looking forward to it!`;
  return waLink(expertPhone, msg);
}

/** "Share ROSTER" link — for referrals */
export function shareRosterWaLink(): string {
  const msg =
    `🎤 I've been using ROSTER to level up my music management game.\n\n` +
    `It's got everything — contracts, tour planning, royalties, masterclasses, and ` +
    `1-on-1 sessions with real industry professionals.\n\n` +
    `Check it out: ${process.env.NEXT_PUBLIC_APP_URL || "https://rosterapp.ai"}`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

// ── 2. AFRICA'S TALKING SMS FALLBACK ─────────────────────────
// Used when a user has no data / WhatsApp — plain SMS still reaches them

export interface SendSMSParams {
  to: string;   // E.164 format, e.g. +27821234567
  message: string;
  from?: string; // Alphanumeric sender ID (e.g. "ROSTER")
}

export async function sendSMS({
  to,
  message,
  from = "ROSTER",
}: SendSMSParams): Promise<{ success: boolean; error?: string }> {
  if (!AT_API_KEY || AT_API_KEY === "your_africastalking_api_key") {
    // Not configured — log in dev, skip silently in prod
    logger.info(`[SMS fallback] Would send to ${to}: ${message}`);
    return { success: true };
  }

  try {
    const params = new URLSearchParams({
      username: AT_USERNAME,
      to,
      message,
      from,
    });

    const res = await fetch(AT_BASE_URL, {
      method: "POST",
      headers: {
        apiKey: AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });

    const data = await res.json();
    const recipients = data?.SMSMessageData?.Recipients || [];
    const success = recipients.some(
      (r: { status: string }) => r.status === "Success"
    );

    return { success };
  } catch (err) {
    const error = err instanceof Error ? err.message : "SMS send failed";
    logger.error("[SMS]", {}, error);
    return { success: false, error };
  }
}

// ── 3. BOOKING NOTIFICATION (SMS + WhatsApp link in email) ────

export async function notifyBookingViaSMS({
  userPhone,
  expertName,
  durationMinutes,
  scheduledAt,
}: {
  userPhone: string;
  expertName: string;
  durationMinutes: number;
  scheduledAt: string;
}): Promise<void> {
  const date = new Date(scheduledAt).toLocaleDateString("en-ZA", {
    weekday: "short", day: "numeric", month: "short",
  });
  const time = new Date(scheduledAt).toLocaleTimeString("en-ZA", {
    hour: "2-digit", minute: "2-digit",
  });

  const message =
    `ROSTER: Your ${durationMinutes}min session with ${expertName} is confirmed ` +
    `for ${date} at ${time}. The expert will send a link shortly.`;

  await sendSMS({ to: userPhone, message });
}
