export const dynamic = 'force-dynamic';

// GET  /api/sender-profiles  — list all profiles for the authed user
// POST /api/sender-profiles  — create a new sender profile

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("sender_profiles")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profiles: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json() as {
    display_name?: string;
    type?: string;
    email_from_name?: string;
    email_reply_to?: string;
    whatsapp_number?: string;
  };

  if (!body.display_name?.trim()) {
    return NextResponse.json({ error: "display_name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sender_profiles")
    .insert({
      owner_id: user.id,
      display_name: body.display_name.trim(),
      type: body.type ?? "artist",
      email_from_name: body.email_from_name?.trim() || null,
      email_reply_to: body.email_reply_to?.trim() || null,
      whatsapp_number: body.whatsapp_number?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data }, { status: 201 });
}
