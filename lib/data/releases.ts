// ============================================================
// ROSTER — Releases data access
// ------------------------------------------------------------
// Shared types + server-side fetcher for the releases table.
// Returns [] when Supabase isn't configured so the UI still
// renders an empty state.
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";

export type ReleaseType =
  | "single"
  | "EP"
  | "album"
  | "mixtape"
  | "compilation"
  | "live";

export type ReleaseStatus =
  | "planned"
  | "in_progress"
  | "delivered"
  | "live"
  | "cancelled";

export interface Release {
  id: string;
  user_id: string;
  artist_id: string | null;
  artist_name: string | null;
  title: string;
  type: ReleaseType;
  release_date: string | null;   // ISO date (YYYY-MM-DD); null = TBC
  status: ReleaseStatus;
  dsps: string[];
  distributor: string | null;
  isrc: string | null;
  upc: string | null;
  artwork_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http");

/**
 * Fetch all releases for the authed user, sorted by release date ascending.
 * Returns [] when Supabase isn't configured or the user isn't authed.
 */
export async function fetchReleases(): Promise<Release[]> {
  if (!SUPABASE_CONFIGURED) return [];

  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("releases")
      .select(`
        id, user_id, artist_id, artist_name, title, type, release_date,
        status, dsps, distributor, isrc, upc, artwork_url, notes,
        created_at, updated_at
      `)
      .eq("user_id", ctx.ownerId)
      .order("release_date", { ascending: true, nullsFirst: false });

    if (error) return [];
    return (data ?? []) as Release[];
  } catch {
    return [];
  }
}

/**
 * Helper for the brief engine — returns just the next N planned/in-progress
 * releases that haven't gone live yet.
 */
export async function fetchUpcomingReleases(limit = 5): Promise<Release[]> {
  const all = await fetchReleases();
  const today = new Date().toISOString().slice(0, 10);
  return all
    .filter(
      r =>
        // Include rows with no date set (TBC) and rows on/after today.
        (r.release_date === null || r.release_date >= today) &&
        r.status !== "live" &&
        r.status !== "cancelled",
    )
    .slice(0, limit);
}
