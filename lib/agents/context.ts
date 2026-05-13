// ============================================================
// ROSTER AI — User context injection
// ------------------------------------------------------------
// Fetches a lightweight snapshot of the user's platform data
// (artists, releases, upcoming bookings) and formats it as a
// plain-text block that is injected verbatim into every agent
// system prompt.
//
// The snapshot is intentionally summary-level — it tells the
// agent *what* is on the roster, not a full data dump. This
// keeps context tokens low while giving the AI real grounding.
// ============================================================

import { createClient } from "@/lib/supabase/server";
import type { UserContext } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string | null | undefined): string {
  if (!date) return "TBC";
  return new Date(date).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

/**
 * Build a context snapshot for the authenticated user.
 *
 * This is a server-side function — call it from API routes only.
 * Returns a `UserContext` whose `summary` field is injected into
 * the agent system prompt.
 */
export async function buildUserContext(userId: string): Promise<UserContext> {
  const supabase = await createClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Parallel fetches — we only need basic fields for the summary
  const [artistsRes, releasesRes, bookingsRes] = await Promise.all([
    supabase
      .from("artists")
      .select("name, genre, country, popularity")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),

    supabase
      .from("releases")
      .select("title, type, artist_name, release_date, status")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("release_date", { ascending: true })
      .limit(20),

    supabase
      .from("bookings")
      .select(
        `scheduled_at, duration_minutes, booking_status,
         experts ( profiles ( full_name ) )`
      )
      .eq("user_id", userId)
      .gte("scheduled_at", now.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
  ]);

  const artists  = artistsRes.data  ?? [];
  const releases = releasesRes.data ?? [];
  const bookings = bookingsRes.data ?? [];

  // ── Build summary text ──────────────────────────────────────────────────────

  const lines: string[] = [
    `=== ROSTER MANAGER CONTEXT (snapshot: ${now.toISOString().slice(0, 10)}) ===`,
    "",
  ];

  // Artists
  if (artists.length > 0) {
    lines.push(`ROSTER (${artists.length} artist${artists.length !== 1 ? "s" : ""}):`);
    for (const a of artists) {
      const parts = [a.name];
      if (a.genre)   parts.push(a.genre);
      if (a.country) parts.push(a.country);
      if (a.popularity != null) parts.push(`Spotify popularity ${a.popularity}/100`);
      lines.push(`  • ${parts.join(" — ")}`);
    }
  } else {
    lines.push("ROSTER: No artists added yet.");
  }

  lines.push("");

  // Releases (last 30 days + upcoming)
  if (releases.length > 0) {
    lines.push(`RECENT & UPCOMING RELEASES (last 30 days / next 30 days):`);
    for (const r of releases) {
      const artistLabel = r.artist_name ?? "Unknown artist";
      const dateLabel   = fmt(r.release_date);
      const statusLabel = r.status ? ` [${r.status}]` : "";
      lines.push(`  • "${r.title}" (${r.type}) — ${artistLabel} — ${dateLabel}${statusLabel}`);
    }
  } else {
    lines.push("RECENT & UPCOMING RELEASES: None in the last 30 days.");
  }

  lines.push("");

  // Upcoming expert bookings
  if (bookings.length > 0) {
    lines.push("UPCOMING EXPERT SESSIONS:");
    for (const b of bookings) {
      // Supabase typed join — access via the nested shape
      const expertRow = b.experts as unknown as { profiles: { full_name: string } | null } | null;
      const expertName = expertRow?.profiles?.full_name ?? "Expert";
      const dateLabel  = fmt(b.scheduled_at);
      lines.push(`  • ${dateLabel} — ${b.duration_minutes} min with ${expertName} [${b.booking_status}]`);
    }
  } else {
    lines.push("UPCOMING EXPERT SESSIONS: None booked.");
  }

  lines.push("");
  lines.push("=== END CONTEXT ===");

  return {
    builtAt: now.toISOString(),
    summary: lines.join("\n"),
  };
}
