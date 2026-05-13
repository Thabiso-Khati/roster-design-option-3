export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/brand-book
// GET  — list the user's saved brand books (most recent first)
// POST — save a new brand book (marks previous ones inactive)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// ── GET — list saved brand books ──────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "10"), 20);

  const { data, error } = await supabase
    .from("artist_brand_books")
    .select("id, artist_name, market, sub_genre, archetype, archetype_label, is_active, created_at, data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ books: data ?? [] });
}

// ── POST — save / update brand book ───────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    artistName, market, subGenre, archetype, archetypeRef,
    vibe, audienceWho, audienceLoves, audienceRejects,
    toneOfVoice, colorPalette, visualAesthetic, moodWords,
    captionStyle, completed,
  } = body;

  if (!artistName?.trim()) {
    return NextResponse.json({ error: "artistName is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Deactivate all previous brand books for this user
  await admin
    .from("artist_brand_books")
    .update({ is_active: false })
    .eq("user_id", user.id);

  // Find archetype label
  const ARCHETYPE_LABELS: Record<string, string> = {
    "the-auteur": "The Auteur",
    "the-pop-architect": "The Pop Architect",
    "the-street-poet": "The Street Poet",
    "the-sonic-innovator": "The Sonic Innovator",
    "the-performer": "The Performer",
    "the-confessionalist": "The Confessionalist",
    "the-cultural-diplomat": "The Cultural Diplomat",
    "the-scene-maker": "The Scene-Maker",
  };

  const { data: book, error } = await admin
    .from("artist_brand_books")
    .insert({
      user_id:         user.id,
      artist_name:     artistName.trim(),
      market:          market ?? "",
      sub_genre:       subGenre ?? "",
      archetype:       archetype ?? "",
      archetype_label: ARCHETYPE_LABELS[archetype] ?? archetype ?? "",
      is_active:       true,
      data: {
        artistName, market, subGenre, archetype, archetypeRef,
        vibe, audienceWho, audienceLoves, audienceRejects,
        toneOfVoice, colorPalette, visualAesthetic, moodWords,
        captionStyle, completed,
      },
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ book }, { status: 201 });
}
