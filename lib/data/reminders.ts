// ============================================================
// ROSTER — Reminders data access
// ------------------------------------------------------------
// Shared types + server-side fetcher for the reminders table.
// Client-side mutations live on the widget itself (uses the
// browser Supabase client). When Supabase isn't configured,
// the fetcher returns an empty array so the UI still renders.
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";

export type ReminderCategory =
  | "legal"
  | "royalty"
  | "release"
  | "finance"
  | "admin"
  | "marketing"
  | "tour";

export type ReminderPriority = "low" | "medium" | "high";

export interface Reminder {
  id: string;
  user_id: string;
  artist_id: string | null;
  artist_name: string | null;
  title: string;
  notes: string | null;
  due_date: string;          // ISO date (YYYY-MM-DD)
  category: ReminderCategory;
  priority: ReminderPriority;
  done: boolean;
  completed_at: string | null;
  href: string | null;
  created_at: string;
  updated_at: string;
}

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http");

/**
 * Fetch open reminders for the authed user, sorted by due date ascending.
 * Returns [] when Supabase isn't configured or the user isn't authed.
 */
export async function fetchReminders(): Promise<Reminder[]> {
  if (!SUPABASE_CONFIGURED) return [];

  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", ctx.ownerId)
      .order("due_date", { ascending: true });

    if (error) return [];
    return (data ?? []) as Reminder[];
  } catch {
    return [];
  }
}
