export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — GET /api/settings/export
// ------------------------------------------------------------
// POPIA / GDPR "right to access" — returns a JSON file
// containing all personal data held for the authenticated user.
//
// Aggregates:
//   profile, artists, releases, reminders, bookings,
//   subscriptions, vault_items, workspace_events,
//   ai_conversations, ai_messages
//
// The response is streamed as an attachment so the browser
// triggers a download rather than rendering inline.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const uid = user.id;

    // Run all queries in parallel — each is user-scoped via RLS
    const [
      { data: profile },
      { data: artists },
      { data: releases },
      { data: reminders },
      { data: bookings },
      { data: subscriptions },
      { data: vaultItems },
      { data: workspaceEvents },
      { data: aiConversations },
      { data: aiMessages },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle(),
      supabase
        .from("artists")
        .select("id, name, genre, country, spotify_artist_id, created_at")
        .eq("user_id", uid),
      supabase
        .from("releases")
        .select("id, title, type, release_date, status, created_at")
        .eq("user_id", uid),
      supabase
        .from("reminders")
        .select("id, title, due_date, completed, created_at")
        .eq("user_id", uid),
      supabase
        .from("bookings")
        .select("id, expert_id, status, meeting_time, notes, created_at")
        .eq("user_id", uid),
      supabase
        .from("subscriptions")
        .select("id, plan, status, activated_at, expires_at, created_at")
        .eq("user_id", uid),
      supabase
        .from("vault_items")
        .select("id, file_name, file_type, size_bytes, created_at")
        .eq("user_id", uid),
      supabase
        .from("workspace_events")
        .select("id, event_type, entity_type, entity_id, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("ai_conversations")
        .select("id, title, created_at, updated_at")
        .eq("user_id", uid),
      supabase
        .from("ai_messages")
        .select("id, conversation_id, role, content, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    const exportPayload = {
      exported_at: new Date().toISOString(),
      notice:
        "This file contains all personal data ROSTER holds about your account. " +
        "Keep it secure. Exported under your rights under POPIA (South Africa) and GDPR (EU).",
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile:           profile ?? null,
      artists:           artists ?? [],
      releases:          releases ?? [],
      reminders:         reminders ?? [],
      bookings:          bookings ?? [],
      subscriptions:     subscriptions ?? [],
      vault_items:       vaultItems ?? [],
      workspace_events:  workspaceEvents ?? [],
      ai_conversations:  aiConversations ?? [],
      ai_messages:       aiMessages ?? [],
    };

    const json   = JSON.stringify(exportPayload, null, 2);
    const bytes  = Buffer.from(json, "utf-8");
    const date   = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `roster-data-export-${date}.json`;

    logger.info("[settings/export] data export generated", { userId: uid });

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type":        "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      String(bytes.byteLength),
        // Prevent caching — data must always be fresh
        "Cache-Control":       "no-store",
      },
    });
  } catch (err) {
    logger.error("[settings/export] unexpected error", {}, err);
    return NextResponse.json(
      { error: "Failed to generate export" },
      { status: 500 }
    );
  }
}
