// ============================================================
// ROSTER — Calendar data access (server-side)
// ------------------------------------------------------------
// Fetches calendar events for the dashboard. Used by:
//   - buildBrief (today's brief prompts)
//   - CalendarWidget (upcoming events card)
// ============================================================

import { createClient } from "@/lib/supabase/server";

export type DashboardEventType =
  | "expert_booking" | "release_date" | "tour_date" | "studio_session"
  | "press_interview" | "radio_appearance" | "sync_deadline" | "royalty_due"
  | "contract_deadline" | "meeting" | "focus_time" | "custom";

export interface DashboardCalendarEvent {
  id:         string;
  title:      string;
  start_at:   string;
  end_at:     string;
  all_day:    boolean;
  event_type: DashboardEventType;
  location:   string | null;
  privacy:    "private" | "team";
}

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http");

/**
 * Returns calendar events in the next `daysAhead` days (default 14).
 * Deadline-type events from the past 2 days are included so overdue
 * items surface in Today's Brief.
 *
 * Always returns an empty array when Supabase is not configured.
 */
export async function fetchCalendarEventsForDashboard(
  daysAhead = 14,
): Promise<DashboardCalendarEvent[]> {
  if (!SUPABASE_CONFIGURED) return [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const now   = new Date();
    // Include 2 days in the past so overdue deadlines show in the brief
    const from  = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const to    = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("calendar_events")
      .select("id, title, start_at, end_at, all_day, event_type, location, privacy")
      .eq("user_id", user.id)
      .gte("start_at", from)
      .lte("start_at", to)
      .order("start_at", { ascending: true })
      .limit(50);

    if (error) return [];
    return (data ?? []) as DashboardCalendarEvent[];
  } catch {
    return [];
  }
}
