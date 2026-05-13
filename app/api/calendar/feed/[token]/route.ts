// ============================================================
// ROSTER — /api/calendar/feed/[token]
// ------------------------------------------------------------
// Public iCal feed. Returns RFC 5545 .ics content that Google
// Calendar, Apple Calendar, and Outlook can subscribe to.
//
// The token comes from profiles.ical_token — it's secret and
// acts as the bearer credential. No session cookie required.
//
// Regenerating the token (PATCH /api/calendar/feed/token)
// revokes all existing subscriptions instantly.
//
// Public route — no auth middleware needed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }         from "@/lib/supabase/admin";
import { logger }                    from "@/lib/logger";

export const runtime = "nodejs";

// ── iCal helpers ─────────────────────────────────────────────

/** Escape special characters per RFC 5545 §3.3.11 */
function icsEscape(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Fold long lines to 75 octets per RFC 5545 §3.1.
 * Continuation lines start with a single space.
 */
function icsFold(line: string): string {
  const limit = 75;
  if (line.length <= limit) return line;

  const chunks: string[] = [];
  let pos = 0;
  chunks.push(line.slice(pos, pos + limit));
  pos += limit;
  while (pos < line.length) {
    chunks.push(" " + line.slice(pos, pos + limit - 1));
    pos += limit - 1;
  }
  return chunks.join("\r\n");
}

/** Format a UTC date as ics DTSTART/DTEND value */
function icsDateTime(iso: string): string {
  // Convert to UTC: 20250512T090000Z
  const d = new Date(iso);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Format a date-only value for all-day events: 20250512 */
function icsDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "");
}

/** Current timestamp for DTSTAMP */
function icsDTStamp(): string {
  return icsDateTime(new Date().toISOString());
}

interface CalEvent {
  id:          string;
  title:       string;
  description: string | null;
  location:    string | null;
  start_at:    string;
  end_at:      string;
  all_day:     boolean;
  event_type:  string;
  updated_at:  string;
}

function buildVEvent(ev: CalEvent, prodDomain: string): string {
  const lines: string[] = ["BEGIN:VEVENT"];

  lines.push(`UID:${ev.id}@${prodDomain}`);
  lines.push(`DTSTAMP:${icsDTStamp()}`);
  lines.push(`LAST-MODIFIED:${icsDateTime(ev.updated_at)}`);

  if (ev.all_day) {
    lines.push(`DTSTART;VALUE=DATE:${icsDate(ev.start_at)}`);
    // All-day end is exclusive in iCal — add 1 day
    const endDate = new Date(ev.end_at);
    endDate.setDate(endDate.getDate() + 1);
    lines.push(`DTEND;VALUE=DATE:${icsDate(endDate.toISOString())}`);
  } else {
    lines.push(`DTSTART:${icsDateTime(ev.start_at)}`);
    lines.push(`DTEND:${icsDateTime(ev.end_at)}`);
  }

  lines.push(`SUMMARY:${icsEscape(ev.title)}`);

  if (ev.description) {
    lines.push(`DESCRIPTION:${icsEscape(ev.description)}`);
  }
  if (ev.location) {
    lines.push(`LOCATION:${icsEscape(ev.location)}`);
  }

  // Map event_type to iCal CATEGORIES for calendar apps that support it
  const category = ev.event_type.replace(/_/g, " ").toUpperCase();
  lines.push(`CATEGORIES:${category}`);

  lines.push("END:VEVENT");
  return lines.map(icsFold).join("\r\n");
}

// ── Feed handler ──────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token } = await params;

  if (!token || token.length < 10) {
    return new NextResponse("Not found", { status: 404 });
  }

  const admin = createAdminClient();

  // Look up the user by their iCal token
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("ical_token", token)
    .single();

  if (!profile) {
    // Invalid or revoked token — return 404, not 401, to avoid leaking existence
    return new NextResponse("Not found", { status: 404 });
  }

  const userId = profile.id as string;

  // Fetch events: past 60 days + next 365 days
  const from = new Date(Date.now() - 60  * 24 * 60 * 60 * 1000).toISOString();
  const to   = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { data: events, error } = await admin
    .from("calendar_events")
    .select("id, title, description, location, start_at, end_at, all_day, event_type, updated_at")
    .eq("user_id", userId)
    .gte("start_at", from)
    .lte("start_at", to)
    .order("start_at", { ascending: true })
    .limit(500);

  if (error) {
    logger.error("[calendar/feed] events query failed", { userId }, error);
    return new NextResponse("Internal error", { status: 500 });
  }

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "https://rosterapp.ai";
  const prodDomain = appUrl.replace(/^https?:\/\//, "");
  const dtstamp   = icsDTStamp();

  const vevents = (events ?? [])
    .map(ev => buildVEvent(ev as CalEvent, prodDomain))
    .join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//ROSTER//ROSTER Calendar//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:ROSTER`,
    `X-WR-TIMEZONE:Africa/Johannesburg`,
    `X-PUBLISHED-TTL:PT1H`,
    vevents,
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  logger.info("[calendar/feed] served", { userId, eventCount: events?.length ?? 0 });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type":        "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="roster-calendar.ics"',
      // Clients re-poll hourly; don't cache stale feeds
      "Cache-Control":       "no-store",
    },
  });
}

// ── Token regeneration ────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token } = await params;

  // This endpoint requires the user to be authenticated (session cookie)
  // Token regeneration must come from the settings page, not a public URL.
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Verify the token belongs to the requesting user
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("ical_token", token)
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Generate a new token (this revokes all existing subscriptions)
  const newToken = crypto.randomUUID();
  await admin
    .from("profiles")
    .update({ ical_token: newToken })
    .eq("id", user.id);

  logger.info("[calendar/feed] token regenerated", { userId: user.id });
  return NextResponse.json({ ical_token: newToken });
}
