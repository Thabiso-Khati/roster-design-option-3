// ============================================================
// ROSTER — /api/bookings/list
// GET — return the authenticated user's bookings (paginated)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE     = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page  = Math.max(0, parseInt(searchParams.get("page")  ?? "0",             10));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10)));
  const from  = page * limit;
  const to    = from + limit - 1;

  const { data: bookings, error, count } = await supabase
    .from("bookings")
    .select(`*, experts(name, specialty, country)`, { count: "exact" })
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    bookings: bookings ?? [],
    total:    count ?? 0,
    page,
    limit,
    hasMore:  from + (bookings?.length ?? 0) < (count ?? 0),
  });
}
