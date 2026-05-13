/**
 * GET    /api/releases/[id]/tasks        — list tasks for a release
 * POST   /api/releases/[id]/tasks        — create task(s); body { tasks: TaskInput[] }
 * PATCH  /api/releases/[id]/tasks        — update a task; body { taskId, done?, text?, sort_order? }
 * DELETE /api/releases/[id]/tasks        — delete a task; body { taskId }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncReleaseTaskToCalendar, removeCalendarEventBySource } from "@/lib/calendar/sync";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

type Phase = "pre_8w"|"pre_6w"|"pre_4w"|"pre_2w"|"pre_1w"|"release"|"post_1w"|"post_1m";

// Days offset from release date for each phase
export const PHASE_OFFSETS: Record<Phase, number> = {
  pre_8w:  -56,
  pre_6w:  -42,
  pre_4w:  -28,
  pre_2w:  -14,
  pre_1w:  -7,
  release:  0,
  post_1w: +7,
  post_1m: +30,
};

function dueDateFor(releaseDate: string | null, phase: Phase): string | null {
  if (!releaseDate) return null;
  const d = new Date(releaseDate);
  d.setUTCDate(d.getUTCDate() + PHASE_OFFSETS[phase]);
  return d.toISOString().slice(0, 10);
}

// ─── Ownership guard ──────────────────────────────────────────────────────────
async function assertOwnsRelease(supabase: Awaited<ReturnType<typeof createClient>>, releaseId: string, userId: string) {
  const { data } = await supabase
    .from("releases")
    .select("id")
    .eq("id", releaseId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: releaseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("release_tasks")
    .select("id, phase, text, due_date, done, done_at, sort_order, source, created_at")
    .eq("release_id", releaseId)
    .eq("user_id", user.id)
    .order("phase")
    .order("sort_order")
    .order("created_at");

  if (error) {
    logger.error("[release-tasks/get]", { releaseId }, error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
  return NextResponse.json({ tasks: data ?? [] });
}

// ─── POST (create tasks — batch) ──────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: releaseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const owns = await assertOwnsRelease(supabase, releaseId, user.id);
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { tasks?: Array<{ phase: Phase; text: string; due_date?: string | null; sort_order?: number; source?: string }> };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const rows = (body.tasks ?? []).map((t, i) => ({
    user_id:    user.id,
    release_id: releaseId,
    phase:      t.phase,
    text:       t.text,
    due_date:   t.due_date ?? null,
    sort_order: t.sort_order ?? i,
    source:     t.source === "roster_ai" ? "roster_ai" : "manual",
    done:       false,
  }));

  if (rows.length === 0) return NextResponse.json({ error: "No tasks provided" }, { status: 400 });

  const { data, error } = await supabase.from("release_tasks").insert(rows).select("id, phase, text, due_date, done, sort_order, source, user_id, release_id");
  if (error) {
    logger.error("[release-tasks/post]", { releaseId }, error);
    return NextResponse.json({ error: "Failed to create tasks" }, { status: 500 });
  }

  // Mirror tasks with due dates to calendar (best-effort)
  for (const task of data ?? []) {
    if (task.due_date) void syncReleaseTaskToCalendar(task, supabase);
  }

  return NextResponse.json({ tasks: data }, { status: 201 });
}

// ─── PATCH (update one task) ──────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: releaseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { taskId?: string; done?: boolean; text?: string; sort_order?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.done === "boolean") {
    update.done = body.done;
    update.done_at = body.done ? new Date().toISOString() : null;
  }
  if (typeof body.text === "string" && body.text.trim()) update.text = body.text.trim();
  if (typeof body.sort_order === "number") update.sort_order = body.sort_order;

  const { error } = await supabase
    .from("release_tasks")
    .update(update)
    .eq("id", body.taskId)
    .eq("release_id", releaseId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("[release-tasks/patch]", { taskId: body.taskId }, error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// ─── DELETE (remove one task) ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: releaseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { taskId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

  const { error } = await supabase
    .from("release_tasks")
    .delete()
    .eq("id", body.taskId)
    .eq("release_id", releaseId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("[release-tasks/delete]", { taskId: body.taskId }, error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }

  // Remove calendar mirror (best-effort)
  void removeCalendarEventBySource("release_task", body.taskId, user.id, supabase);

  return NextResponse.json({ ok: true });
}
