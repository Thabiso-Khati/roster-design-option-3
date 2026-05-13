export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email || ""))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const formData = await req.formData();
  const expertId = formData.get("expert_id") as string;

  if (!expertId) {
    return NextResponse.redirect(new URL("/admin/experts?error=missing_id", req.url));
  }

  await supabase
    .from("experts")
    .update({ is_verified: true })
    .eq("id", expertId);

  return NextResponse.redirect(new URL("/admin/experts?verified=1", req.url));
}
