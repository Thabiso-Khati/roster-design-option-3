import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email || "")) return false;
  return true;
}

// POST — create a new resource record (file already uploaded to Supabase Storage)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!(await checkAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, module_slug, file_url, file_type } = await req.json();

  if (!title || !module_slug || !file_url || !file_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("resources")
    .insert({ title, description: description || null, module_slug, file_url, file_type })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// GET — list resources, optionally filtered by module
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const module_slug = searchParams.get("module");

  let query = supabase.from("resources").select("*").order("created_at", { ascending: false });
  if (module_slug) query = query.eq("module_slug", module_slug);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE — remove a resource
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  if (!(await checkAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
