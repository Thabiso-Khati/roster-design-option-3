// GET  /api/campaigns  — list campaigns (most recent first)
// POST /api/campaigns  — create a campaign (status: draft)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("fan_campaigns")
    .select(`
      id, name, channel, status, subject, body,
      total_recipients, sent_count, failed_count,
      sent_at, created_at,
      sender_profile:sender_profiles(id, display_name, type),
      segment:fan_segments(id, name, color)
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json() as {
    name?: string;
    channel?: string;
    subject?: string;
    body?: string;
    sender_profile_id?: string;
    segment_id?: string;
  };

  if (!body.name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!body.channel) return NextResponse.json({ error: "channel is required" }, { status: 400 });
  if (!body.body?.trim()) return NextResponse.json({ error: "body is required" }, { status: 400 });
  if (!["email", "whatsapp"].includes(body.channel)) {
    return NextResponse.json({ error: "channel must be email or whatsapp" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("fan_campaigns")
    .insert({
      owner_id: user.id,
      name: body.name.trim(),
      channel: body.channel,
      subject: body.subject?.trim() || null,
      body: body.body.trim(),
      sender_profile_id: body.sender_profile_id || null,
      segment_id: body.segment_id || null,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}
