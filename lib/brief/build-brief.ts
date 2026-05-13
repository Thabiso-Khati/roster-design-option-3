// ============================================================
// ROSTER — Brief signal engine
// ------------------------------------------------------------
// Builds the daily brief (Pick up / Upcoming / Watch out / Try this)
// from the user's real data layer: artists, releases, reminders,
// artist_stats. Each candidate prompt gets a score; the top 5 win.
//
// This is server-side only — runs as part of the dashboard fetch.
// Returning early with the empty-roster brief is intentional:
// new users get a useful "get started" experience instead of stale
// hardcoded mocks.
// ============================================================

import type { Release } from "@/lib/data/releases";
import type { Reminder } from "@/lib/data/reminders";
import type { DashboardCalendarEvent } from "@/lib/data/calendar";
import { createClient } from "@/lib/supabase/server";

export type BriefLabel = "Pick up" | "Upcoming" | "Try this" | "Watch out";

export interface BriefPrompt {
  label: BriefLabel;
  sentence: string;
  href?: string;
  // Internal score — higher = more important. Not rendered.
  score: number;
}

export interface DailyBrief {
  greeting: string;             // Sub-heading copy under the time-of-day greet
  prompts: BriefPrompt[];        // Top N candidates, sorted by score desc
}

interface BuildBriefInput {
  releases:       Release[];
  reminders:      Reminder[];
  calendarEvents?: DashboardCalendarEvent[];
  /** Override "today" for testing. Defaults to new Date(). */
  now?: Date;
  /** How many prompts to surface. Defaults to 5. */
  limit?: number;
}

/**
 * Empty-roster brief — shown when the user has no artists, no releases,
 * and no reminders. The opposite of the LULU mock — pure onboarding.
 */
const EMPTY_ROSTER_BRIEF: DailyBrief = {
  greeting:
    "Your roster is empty. Connect Spotify or add your first artist to start lighting up the dashboard.",
  prompts: [
    {
      label: "Pick up",
      sentence:
        "Connect Spotify in Settings — we'll pull your artists, monthly listeners, and growth into the dashboard.",
      href: "/dashboard/settings#integrations",
      score: 100,
    },
    {
      label: "Try this",
      sentence:
        "Plan a release — drop in a title, date, and DSPs and the pipeline starts tracking it for you.",
      href: "/dashboard/releases/new",
      score: 80,
    },
    {
      label: "Try this",
      sentence:
        "Add your first reminder — anything on your plate this week. We'll surface it at the right time.",
      href: "/dashboard#reminders",
      score: 60,
    },
  ],
};

export async function buildBrief(
  input: BuildBriefInput,
): Promise<DailyBrief> {
  const now = input.now ?? new Date();
  const limit = input.limit ?? 5;
  const todayISO = now.toISOString().slice(0, 10);

  // Fetch artist roster + recent stat snapshots (best-effort).
  const artists = await fetchArtistsForBrief();

  // Empty-roster early return
  if (
    artists.length === 0 &&
    input.releases.length === 0 &&
    input.reminders.length === 0
  ) {
    return EMPTY_ROSTER_BRIEF;
  }

  const candidates: BriefPrompt[] = [];

  // ── Watch out: overdue or due-today reminders ───────────────
  // High priority overdue gets the highest weight.
  for (const r of input.reminders) {
    if (r.done) continue;
    const dueMs = new Date(r.due_date).getTime() - now.getTime();
    const days = Math.ceil(dueMs / (1000 * 60 * 60 * 24));

    if (days < 0) {
      // Overdue
      const sev = r.priority === "high" ? 100 : r.priority === "medium" ? 70 : 40;
      candidates.push({
        label: "Watch out",
        sentence: `${r.title} is ${Math.abs(days)} day${
          Math.abs(days) === 1 ? "" : "s"
        } overdue.`,
        href: r.href ?? "/dashboard#reminders",
        score: sev + Math.min(Math.abs(days) * 2, 50),
      });
    } else if (days <= 2 && r.priority === "high") {
      candidates.push({
        label: "Watch out",
        sentence: `${r.title} is due ${
          days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`
        }.`,
        href: r.href ?? "/dashboard#reminders",
        score: 85,
      });
    } else if (days <= 7) {
      // Upcoming: due in the next week
      candidates.push({
        label: "Upcoming",
        sentence: `${r.title} — ${
          days === 0 ? "today" : days === 1 ? "tomorrow" : `due in ${days} days`
        }.`,
        href: r.href ?? "/dashboard#reminders",
        score:
          (r.priority === "high" ? 60 : r.priority === "medium" ? 45 : 30) +
          Math.max(0, 7 - days) * 2,
      });
    } else if (days <= 30) {
      // Calendared: still on the radar but not pressing
      candidates.push({
        label: "Upcoming",
        sentence: `${r.title} — due in ${
          days < 14 ? `${days} days` : `${Math.round(days / 7)} weeks`
        }. No action today; calendared.`,
        href: r.href ?? "/dashboard#reminders",
        score: r.priority === "high" ? 40 : 25,
      });
    }
  }

  // ── Upcoming: releases in the next 30 days ──────────────────
  for (const rel of input.releases) {
    if (rel.status === "live" || rel.status === "cancelled") continue;
    if (!rel.release_date) {
      // TBC — surface once if planned, lower score
      if (rel.status === "planned") {
        candidates.push({
          label: "Pick up",
          sentence: `${rel.artist_name ?? "An artist"}'s ${rel.type} "${
            rel.title
          }" still has a TBC release date — lock it in.`,
          href: "/dashboard#releases",
          score: 35,
        });
      }
      continue;
    }
    if (rel.release_date < todayISO) continue;
    const days = Math.ceil(
      (new Date(rel.release_date).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (days <= 14) {
      const dspsTagged = (rel.dsps ?? []).length;
      const hasArtwork = !!rel.artwork_url;
      const issues: string[] = [];
      if (dspsTagged === 0) issues.push("no DSPs set");
      if (!hasArtwork) issues.push("artwork pending");
      const tail = issues.length > 0 ? ` — ${issues.join(", ")}.` : ".";
      candidates.push({
        label: "Upcoming",
        sentence: `${rel.artist_name ?? "An artist"}'s ${rel.type} "${
          rel.title
        }" goes live ${days === 0 ? "today" : `in ${days} days`}${tail}`,
        href: "/dashboard#releases",
        score: 70 + Math.max(0, 14 - days) * 2 + issues.length * 5,
      });
    } else if (days <= 60) {
      candidates.push({
        label: "Upcoming",
        sentence: `${rel.artist_name ?? "An artist"}'s ${rel.type} "${
          rel.title
        }" drops in ${
          days < 30 ? `${days} days` : `${Math.round(days / 7)} weeks`
        }. Promo plan?`,
        href: "/dashboard#releases",
        score: 35,
      });
    }
  }

  // ── Pick up: artist momentum (Spotify monthly listener deltas) ─
  for (const a of artists) {
    if (a.deltaPct !== null && Math.abs(a.deltaPct) >= 10) {
      const direction = a.deltaPct > 0 ? "up" : "down";
      const flavour =
        a.deltaPct > 0
          ? "worth flagging to them for the next pitch."
          : "worth checking what shifted.";
      candidates.push({
        label: a.deltaPct > 0 ? "Pick up" : "Watch out",
        sentence: `${a.name}'s monthly listeners are ${direction} ${Math.abs(
          a.deltaPct,
        ).toFixed(1)}% — ${flavour}`,
        href: `/dashboard/artists/${a.id}`,
        score: 50 + Math.min(Math.abs(a.deltaPct), 50),
      });
    }
  }

  // ── Calendar events: today's meetings + upcoming deadlines ──
  const DEADLINE_TYPES = new Set([
    "sync_deadline", "royalty_due", "contract_deadline", "release_date",
  ]);
  const MEETING_TYPES = new Set([
    "expert_booking", "meeting", "studio_session",
    "press_interview", "radio_appearance", "tour_date",
  ]);
  const todayStr = todayISO;

  for (const ev of (input.calendarEvents ?? [])) {
    const evStart    = new Date(ev.start_at);
    const evEnd      = new Date(ev.end_at);
    const evDateStr  = ev.start_at.slice(0, 10);
    const daysUntil  = Math.ceil((evStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const minsAgoEnd = (now.getTime() - evEnd.getTime()) / 60_000;
    const timeStr    = ev.all_day
      ? ""
      : evStart.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });

    if (MEETING_TYPES.has(ev.event_type)) {
      // Post-event: just finished in the last 2 hours → "Pick up" follow-up nudge
      if (minsAgoEnd > 0 && minsAgoEnd <= 120 && evDateStr === todayStr) {
        candidates.push({
          label: "Pick up",
          sentence: `${ev.title} just wrapped — capture your notes and any follow-ups while they're fresh.`,
          href:    "/dashboard/calendar",
          score:   92,
        });
      } else if (evDateStr === todayStr && evStart > now) {
        // Today's upcoming meeting — highest priority, "Pick up"
        candidates.push({
          label: "Pick up",
          sentence: `${ev.title}${timeStr ? ` at ${timeStr}` : ""} — on your calendar today.${ev.location ? ` (${ev.location})` : ""}`,
          href:    "/dashboard/calendar",
          score:   90,
        });
      } else if (daysUntil > 0 && daysUntil <= 3) {
        candidates.push({
          label: "Upcoming",
          sentence: `${ev.title} — ${daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`}${timeStr ? ` at ${timeStr}` : ""}.`,
          href:    "/dashboard/calendar",
          score:   55,
        });
      }
    } else if (DEADLINE_TYPES.has(ev.event_type)) {
      if (daysUntil < 0) {
        // Overdue deadline
        candidates.push({
          label: "Watch out",
          sentence: `${ev.title} deadline passed ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"} ago.`,
          href:    "/dashboard/calendar",
          score:   80 + Math.min(Math.abs(daysUntil) * 3, 40),
        });
      } else if (daysUntil === 0) {
        candidates.push({
          label: "Watch out",
          sentence: `${ev.title} deadline is today.`,
          href:    "/dashboard/calendar",
          score:   88,
        });
      } else if (daysUntil <= 7) {
        candidates.push({
          label: "Upcoming",
          sentence: `${ev.title} — deadline ${daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`}.`,
          href:    "/dashboard/calendar",
          score:   60 + Math.max(0, 7 - daysUntil) * 3,
        });
      }
    }
  }

  // ── Try this: nudge if no recent activity ───────────────────
  if (input.reminders.filter(r => !r.done).length === 0) {
    candidates.push({
      label: "Try this",
      sentence:
        "Your reminders list is empty. Capture what's on your plate this week so it doesn't slip.",
      href: "/dashboard#reminders",
      score: 20,
    });
  }
  if (input.releases.length === 0 && artists.length > 0) {
    candidates.push({
      label: "Try this",
      sentence:
        "No releases on the calendar. Plan one — even a placeholder lets the pipeline track artwork, splits, and DSPs.",
      href: "/dashboard/releases/new",
      score: 25,
    });
  }
  if (artists.length === 0) {
    candidates.push({
      label: "Pick up",
      sentence:
        "Connect Spotify in Settings to pull your roster, monthly listeners, and growth.",
      href: "/dashboard/settings#integrations",
      score: 90,
    });
  }

  // Sort by score desc, take top N
  const top = candidates.sort((a, b) => b.score - a.score).slice(0, limit);

  return {
    greeting: greetingForBrief({
      artistsCount: artists.length,
      reminders: input.reminders,
      releases: input.releases,
      now,
    }),
    prompts: top,
  };
}

// ─── Greeting tone ────────────────────────────────────────────
function greetingForBrief(args: {
  artistsCount: number;
  reminders: Reminder[];
  releases: Release[];
  now: Date;
}): string {
  const { artistsCount, reminders, releases } = args;
  const openHigh = reminders.filter(
    r => !r.done && r.priority === "high",
  ).length;
  const overdue = reminders.filter(r => {
    if (r.done) return false;
    return new Date(r.due_date).getTime() < args.now.getTime();
  }).length;
  const releasesThisMonth = releases.filter(r => {
    if (!r.release_date) return false;
    const d = new Date(r.release_date);
    const end = new Date(args.now);
    end.setDate(end.getDate() + 30);
    return d >= args.now && d <= end;
  }).length;

  if (overdue > 0) return `${overdue} overdue. Clear them first.`;
  if (openHigh >= 3) return "A loaded plate. Triage the high-priority list.";
  if (releasesThisMonth >= 2)
    return `${releasesThisMonth} releases land in the next 30 days.`;
  if (releasesThisMonth === 1) return "One release on the runway. Keep it tight.";
  if (artistsCount === 0) return "Empty stage. Let's set it up.";
  return "Steady as it goes. Your numbers look healthy.";
}

// ─── Artist + stat fetch (best-effort) ────────────────────────
interface ArtistMomentum {
  id: string;
  name: string;
  /** Monthly listener change %, or null if we don't have two snapshots yet. */
  deltaPct: number | null;
}

async function fetchArtistsForBrief(): Promise<ArtistMomentum[]> {
  const SUPABASE_CONFIGURED =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http");
  if (!SUPABASE_CONFIGURED) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: artists } = await supabase
      .from("artists")
      .select("id, name")
      .eq("user_id", user.id);

    if (!artists || artists.length === 0) return [];

    // For each artist, pull last 2 monthly_listeners snapshots.
    const result: ArtistMomentum[] = [];
    for (const a of artists) {
      const { data: snaps } = await supabase
        .from("monthly_listeners")
        .select("count, snapshot_at")
        .eq("artist_id", a.id)
        .order("snapshot_at", { ascending: false })
        .limit(2);
      let deltaPct: number | null = null;
      if (snaps && snaps.length === 2) {
        const [latest, prior] = snaps as { count: number }[];
        if (prior.count > 0) {
          deltaPct = ((latest.count - prior.count) / prior.count) * 100;
        }
      }
      result.push({ id: a.id as string, name: a.name as string, deltaPct });
    }
    return result;
  } catch {
    return [];
  }
}
