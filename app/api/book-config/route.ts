export const dynamic = 'force-dynamic';

// Public endpoint — returns just the display fields needed to
// render the booking page UI without exposing the full config.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 422 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("calendar_booking_link")
    .select("display_name, bio, durations, rate_cents, currency, active")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ config: data });
}
