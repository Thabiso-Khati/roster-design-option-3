// ============================================================
// ROSTER — /api/calendar/events
// ------------------------------------------------------------
// GET    — list events for the authenticated user in a range
// POST   — create a new calendar event
// PATCH  — update an event (body must include id)
// DELETE — delete an event (?id=<uuid>)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { scheduleEventReminders, cancelEventReminders } from "@/lib/calendar/reminders";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const runtime = "nodejs";

// ── Constants ────────────────────────────────────────────────

const EVENT_TYPES = [
  "expert_booking", "release_date", "tour_date", "studio_session",
  "press_interview", "radio_appearance", "sync_deadline", "royalty_due",
  "contract_deadline", "meeting", "focus_time", "custom",
] as const;

// ── Schemas ──────────────────────────────────────────────────

const EventBaseSchema = z.object({
  title:              z.string().trim().min(1).max(200),
  description:        z.string().max(2000).optional(),
  location:           z.string().max(300).optional(),
  start_at:           z.string().datetime({ message: "start_at must be ISO 8601" }),
  end_at:             z.string().datetime({ message: "end_at must be ISO 8601" }),
  all_day:            z.boolean().default(false),
  timezone:           z.string().default("Africa/Johannesburg"),
  event_type:         z.enum(EVENT_TYPES).default("custom"),
  artist_id:          z.string().uuid().optional(),
  reminder_email:     z.boolean().default(false),
  reminder_whatsapp:  z.boolean().default(false),
  reminder_minutes:   z.array(z.number().int().positive()).default([]),
  privacy:            z.enum(["private", "team"]).default("private"),
  color:              z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const CreateEventSchema = EventBaseSchema.refine(
  d => new Date(d.end_at) > new Date(d.start_at),
  { message: "end_at must be after start_at", path: ["end_at"] }
);

const UpdateEventSchema = EventBaseSchema.partial().extend({
  id: z.string().uuid("id must be a valid UUID"),
});

// ── GET — list events in a date range ────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    // Workspace context — team members see the owner's team-visible events
    const ctx = await getWorkspaceContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    // Permission gate for team members
    if (!ctx.isOwner && ctx.role !== "admin") {
      const calPerm = ctx.permissions?.calendar;
      if (!calPerm?.view) {
        return NextResponse.json({ events: [] });
      }
    }

    const { searchParams } = req.nextUrl;
    const from  = searchParams.get("from");   // ISO date string
    const to    = searchParams.get("to");     // ISO date string
    const types = searchParams.get("types");  // comma-separated event_types

    let query = supabase
      .from("calendar_events")
      .select(`
        id, title, description, location,
        start_at, end_at, all_day, timezone,
        event_type, source_type, source_id,
        artist_id, artists(id, name),
        reminder_email, reminder_whatsapp, reminder_minutes,
        privacy, color, created_at, updated_at
      `)
      .eq("user_id", ctx.ownerId)            // always query the owner's events
      .order("start_at", { ascending: true });

    // Team members only see events shared with the team (RLS also enforces this)
    if (!ctx.isOwner) {
      query = query.eq("privacy", "team");
    }

    if (from) query = query.gte("end_at",   from);
    if (to)   query = query.lte("start_at", to);
    if (types) {
      const typeList = types.split(",").filter(t => EVENT_TYPES.includes(t as typeof EVENT_TYPES[number]));
      if (typeList.length > 0) query = query.in("event_type", typeList);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("[calendar/events GET] query failed", {}, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: data ?? [], isTeamView: !ctx.isOwner });
  } catch (err) {
    logger.error("[calendar/events GET] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST — create event ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const ctx = await getWorkspaceContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    // Permission gate for team members
    if (!ctx.isOwner && ctx.role !== "admin") {
      const calPerm = ctx.permissions?.calendar;
      if (!calPerm?.edit) {
        return NextResponse.json({ error: "No calendar edit permission" }, { status: 403 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const parsed = CreateEventSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: `${first.path.join(".")} — ${first.message}` },
        { status: 422 }
      );
    }

    // Team members always create team-visible events in the owner's calendar
    const eventData = {
      ...parsed.data,
      user_id:     ctx.ownerId,
      source_type: "manual" as const,
      ...(ctx.isOwner ? {} : { privacy: "team" as const }),
    };

    const { data: event, error } = await supabase
      .from("calendar_events")
      .insert(eventData)
      .select()
      .single();

    if (error) {
      logger.error("[calendar/events POST] insert failed", {}, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Schedule QStash reminder jobs.
    // IMPORTANT: must be awaited before returning — Vercel freezes the function
    // on response send, so a fire-and-forget void block would be killed before
    // QStash publishing completes and reminder_job_ids would never be stored.
    if (event.reminder_email || event.reminder_whatsapp) {
      try {
        const jobIds = await scheduleEventReminders({
          id:                event.id,
          user_id:           ctx.ownerId,          // owner's ID — whose phone/email to notify
          title:             event.title,
          start_at:          event.start_at,
          event_type:        event.event_type,
          reminder_email:    event.reminder_email    ?? false,
          reminder_whatsapp: event.reminder_whatsapp ?? false,
          reminder_minutes:  (event.reminder_minutes as number[]) ?? [],
          reminder_job_ids:  [],
        });
        if (jobIds.length) {
          // Use admin client so this succeeds regardless of who created the event
          // (team members create events owned by ctx.ownerId; user client RLS would block)
          await createAdminClient()
            .from("calendar_events")
            .update({ reminder_job_ids: jobIds })
            .eq("id", event.id);
        }
      } catch (remErr) {
        // Non-fatal — event is created; reminders just won't fire
        logger.warn("[calendar/events POST] reminder scheduling failed", { eventId: event.id }, remErr);
      }
    }

    logger.info("[calendar/events POST] event created", { userId: user.id, eventId: event.id });
    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    logger.error("[calendar/events POST] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH — update event ──────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const ctx = await getWorkspaceContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    if (!ctx.isOwner && ctx.role !== "admin") {
      const calPerm = ctx.permissions?.calendar;
      if (!calPerm?.edit) {
        return NextResponse.json({ error: "No calendar edit permission" }, { status: 403 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const parsed = UpdateEventSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: `${first.path.join(".")} — ${first.message}` },
        { status: 422 }
      );
    }

    const { id, ...updates } = parsed.data;

    // Block editing auto-populated events
    const { data: existing } = await supabase
      .from("calendar_events")
      .select("source_type")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (existing.source_type && existing.source_type !== "manual") {
      return NextResponse.json(
        { error: "Auto-populated events cannot be edited directly." },
        { status: 403 }
      );
    }

    // Fetch reminder_job_ids before update so we can cancel them
    const { data: prevEvent } = await supabase
      .from("calendar_events")
      .select("reminder_job_ids")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    const { data: event, error } = await supabase
      .from("calendar_events")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      logger.error("[calendar/events PATCH] update failed", {}, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reschedule reminders.
    // IMPORTANT: awaited before returning — see POST comment above for rationale.
    try {
      const prevJobIds = (prevEvent as { reminder_job_ids?: string[] } | null)?.reminder_job_ids ?? [];
      const jobIds = await scheduleEventReminders({
        id:                event.id,
        user_id:           ctx.ownerId,            // owner's ID — whose phone/email to notify
        title:             event.title,
        start_at:          event.start_at,
        event_type:        event.event_type,
        reminder_email:    event.reminder_email    ?? false,
        reminder_whatsapp: event.reminder_whatsapp ?? false,
        reminder_minutes:  (event.reminder_minutes as number[]) ?? [],
        reminder_job_ids:  prevJobIds,
      });
      // Always write back — even an empty array clears stale job IDs.
      // Admin client bypasses RLS so this works when a team member edits an event.
      await createAdminClient()
        .from("calendar_events")
        .update({ reminder_job_ids: jobIds })
        .eq("id", event.id);
    } catch (remErr) {
      logger.warn("[calendar/events PATCH] reminder reschedule failed", { eventId: event.id }, remErr);
    }

    return NextResponse.json({ event });
  } catch (err) {
    logger.error("[calendar/events PATCH] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE — delete event ─────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const ctx = await getWorkspaceContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    // Only owner, admins, or team members with calendar edit can delete
    if (!ctx.isOwner && ctx.role !== "admin") {
      const calPerm = ctx.permissions?.calendar;
      if (!calPerm?.edit) {
        return NextResponse.json({ error: "No calendar edit permission" }, { status: 403 });
      }
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 422 });

    // Fetch job IDs before deletion so we can cancel them
    const { data: toDelete } = await supabase
      .from("calendar_events")
      .select("reminder_job_ids")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("[calendar/events DELETE] failed", {}, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Cancel pending reminder jobs (best-effort)
    const jobIds = (toDelete as { reminder_job_ids?: string[] } | null)?.reminder_job_ids ?? [];
    if (jobIds.length) {
      void cancelEventReminders(jobIds);
    }

    logger.info("[calendar/events DELETE] event deleted", { userId: user.id, id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[calendar/events DELETE] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
