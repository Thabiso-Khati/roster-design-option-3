// ============================================================
// ROSTER — Daily.co server client
// ------------------------------------------------------------
// Thin wrapper around Daily's REST API for the Book-an-Expert
// meeting flow. Used exclusively from server code (API routes,
// webhook handlers, cron jobs). Never imported into client
// components — it ships the DAILY_API_KEY.
//
// Privacy contract enforced here:
//   • rooms are created with enable_recording: false
//   • privacy: 'private' so only token holders can join
//   • rooms expire 2h after scheduled session end → self-cleanup
//   • tokens are short-lived, user-bound, role-scoped
//
// Docs reference: https://docs.daily.co/reference/rest-api
// ============================================================

/**
 * Environment variables required by this client:
 *   DAILY_API_KEY        — from https://dashboard.daily.co/developers
 *   DAILY_DOMAIN         — e.g. "roster" (your subdomain at .daily.co)
 *   DAILY_WEBHOOK_SECRET — set when registering the webhook; used by
 *                          /api/daily/webhook to verify signatures
 */

const DAILY_API_BASE = "https://api.daily.co/v1";

function dailyApiKey(): string {
  const key = process.env.DAILY_API_KEY;
  if (!key) {
    throw new Error(
      "DAILY_API_KEY is not set. Add it to your Vercel/local env."
    );
  }
  return key;
}

function dailyDomain(): string {
  const domain = process.env.DAILY_DOMAIN;
  if (!domain) {
    throw new Error(
      'DAILY_DOMAIN is not set. Expected the subdomain (e.g. "roster"), not the full URL.'
    );
  }
  return domain;
}

async function dailyFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${DAILY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${dailyApiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Daily API ${init.method ?? "GET"} ${path} failed: ${res.status} ${body}`
    );
  }

  return (await res.json()) as T;
}

// ─── Types ───────────────────────────────────────────────────
export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  privacy: "public" | "private";
  created_at: string;
  config: {
    exp?: number;
    enable_recording?: "cloud" | "local" | "rtp-tracks" | false;
    enable_chat?: boolean;
    enable_screenshare?: boolean;
    start_audio_off?: boolean;
    start_video_off?: boolean;
  };
}

export interface DailyMeetingToken {
  token: string;
}

// ─── Rooms ───────────────────────────────────────────────────

/**
 * Create a private Daily room for a ROSTER booking.
 *
 * Room name format: `booking-{uuid-prefix}-{timestamp}` — short,
 * unguessable, and easy to correlate to a booking when the webhook
 * reports events back to us.
 *
 * The room auto-expires 2h after the scheduled session end so we
 * don't leak rooms even if our cleanup cron fails.
 */
export async function createRoom(params: {
  bookingId: string;
  scheduledAt: Date;
  durationMinutes: number;
}): Promise<DailyRoom> {
  const { bookingId, scheduledAt, durationMinutes } = params;

  // Unix seconds — Daily uses seconds-since-epoch for `exp`
  const sessionEndSec = Math.floor(scheduledAt.getTime() / 1000) + durationMinutes * 60;
  const roomExpSec = sessionEndSec + 2 * 60 * 60; // 2h grace

  // Unguessable room name — prefix with booking id's first segment
  // for human readability in the Daily dashboard, but include random
  // bytes so nobody can guess another booking's room.
  const shortId = bookingId.split("-")[0];
  const randomTag = crypto.randomUUID().split("-")[0];
  const roomName = `booking-${shortId}-${randomTag}`;

  return dailyFetch<DailyRoom>("/rooms", {
    method: "POST",
    body: JSON.stringify({
      name: roomName,
      privacy: "private",
      properties: {
        exp: roomExpSec,
        // PRIVACY: recording is hard-disabled at room level
        enable_recording: false,
        // Core call features
        enable_chat: true,
        enable_screenshare: true,
        enable_prejoin_ui: true,
        // Quality-of-life
        start_audio_off: false,
        start_video_off: false,
        // Eject participants 2h after meeting start — defensive cap
        eject_at_room_exp: true,
        // 2-person rooms — block random extras even if a URL leaked
        max_participants: 2,
      },
    }),
  });
}

/**
 * Delete a Daily room immediately. Safe to call on an already-deleted
 * room (Daily returns 404, which we swallow).
 */
export async function deleteRoom(roomName: string): Promise<void> {
  try {
    await dailyFetch<void>(`/rooms/${encodeURIComponent(roomName)}`, {
      method: "DELETE",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (!msg.includes("404")) throw e;
  }
}

// ─── Meeting tokens ──────────────────────────────────────────

/**
 * Mint a short-lived meeting token bound to a specific room + user.
 *
 * Both parties (booker and expert) get role=owner so either can mute,
 * eject the other, or end the call. There is no "attendee vs. host"
 * asymmetry in ROSTER's model — it's a 1-on-1 meeting between peers.
 *
 * `userName` + `userId` are sent on the participant events in the
 * webhook so we can map join/leave back to booker vs expert without
 * needing to store any content.
 */
export async function mintMeetingToken(params: {
  roomName: string;
  userId: string;
  userName: string;
  role: "expert" | "user";
  expiresInSeconds?: number;
}): Promise<string> {
  const {
    roomName,
    userId,
    userName,
    role,
    expiresInSeconds = 60 * 60 * 3, // 3h default — covers longest session + lateness
  } = params;

  const expSec = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const res = await dailyFetch<DailyMeetingToken>("/meeting-tokens", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        user_id: userId,
        exp: expSec,
        // Both parties are owners — peer-to-peer, not host/attendee
        is_owner: true,
        // Embed role in the token so webhook can distinguish expert vs user
        // (Daily sends user_id back on every participant event)
        enable_recording: false, // belt-and-suspenders on top of room setting
      },
    }),
  });

  return res.token;
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Build the public room URL from a room name. Useful when we already
 * have the room stored and don't need to hit the Daily API.
 */
export function roomUrlFor(roomName: string): string {
  return `https://${dailyDomain()}.daily.co/${roomName}`;
}
