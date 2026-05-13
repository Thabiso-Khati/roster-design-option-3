// ============================================================
// ROSTER — Release Plan (full PM board)
// Server component: loads the release + its tasks, then hands
// everything to the client ReleasePlanBoard component.
// ============================================================
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReleasePlanBoard } from "@/components/dashboard/releases/release-plan-board";
import type { Release } from "@/lib/data/releases";

interface ReleaseTask {
  id: string;
  phase: string;
  text: string;
  due_date: string | null;
  done: boolean;
  sort_order: number;
}

async function fetchRelease(id: string): Promise<Release | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("releases")
      .select("id, user_id, artist_id, artist_name, title, type, release_date, status, dsps, distributor, isrc, upc, artwork_url, notes, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) return null;
    return data as Release;
  } catch { return null; }
}

async function fetchTasks(releaseId: string): Promise<ReleaseTask[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("release_tasks")
      .select("id, phase, text, due_date, done, sort_order")
      .eq("release_id", releaseId)
      .eq("user_id", user.id)
      .order("phase")
      .order("sort_order")
      .order("created_at");

    if (error) return [];
    return (data ?? []) as ReleaseTask[];
  } catch { return []; }
}

export default async function ReleasePlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [release, tasks] = await Promise.all([fetchRelease(id), fetchTasks(id)]);
  if (!release) notFound();

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <ReleasePlanBoard
        release={release}
        initialTasks={tasks as Parameters<typeof ReleasePlanBoard>[0]["initialTasks"]}
      />
    </div>
  );
}
