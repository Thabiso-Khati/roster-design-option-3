export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const formData = await req.formData();
  const applicationId = formData.get("application_id") as string;
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const specialty = formData.get("specialty") as string;
  const country = formData.get("country") as string;
  const bio = formData.get("bio") as string;

  if (!applicationId || !email || !name) {
    return NextResponse.redirect(new URL("/admin/experts?error=missing_fields", req.url));
  }

  // 1. Mark application as approved
  await supabase
    .from("expert_applications")
    .update({ status: "approved" })
    .eq("id", applicationId);

  // 2. Create expert record
  const { data: newExpert } = await supabase
    .from("experts")
    .insert({
      name,
      bio: bio || null,
      specialty: specialty || null,
      country: country || null,
      is_verified: false,
      is_active: true,
    })
    .select()
    .single();

  // 3. Send approval email to applicant
  await sendEmail({
    to: email,
    subject: "You've been approved as a ROSTER expert 🎉",
    html: `
      <div style="font-family:sans-serif;background:#080B14;color:#F1F5F9;padding:40px;max-width:500px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:32px;">
          <span style="font-size:20px;font-weight:900;letter-spacing:6px;background:linear-gradient(135deg,#C9A84C,#F59E0B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">ROSTER</span>
        </div>
        <div style="background:#111827;border:1px solid #1F2937;border-radius:16px;padding:32px;">
          <h2 style="color:#F1F5F9;margin:0 0 8px 0;">Welcome to the expert network, ${name.split(" ")[0]}.</h2>
          <p style="color:#64748B;font-size:14px;margin:0 0 20px 0;">Your application has been approved.</p>
          <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
            You're now part of the ROSTER expert network. Create your ROSTER account using this email
            address, then go to your Expert Dashboard to set your session prices and availability.
          </p>
          <div style="background:#1F2937;border-radius:10px;padding:16px;margin-bottom:24px;">
            <p style="font-size:12px;font-weight:700;color:#C9A84C;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Your Expert ID</p>
            <p style="font-size:13px;color:#F1F5F9;font-family:monospace;margin:0;">${newExpert?.id || "pending"}</p>
          </div>
          <a href="${APP_URL}/auth/signup" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#F59E0B);color:#080B14;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:14px;">
            Create Your Account →
          </a>
        </div>
        <p style="text-align:center;font-size:12px;color:#64748B;margin-top:24px;">
          Questions? Email us at <a href="mailto:experts@rosterapp.ai" style="color:#C9A84C;">experts@rosterapp.ai</a>
        </p>
      </div>
    `,
  });

  return NextResponse.redirect(new URL("/admin/experts?approved=1", req.url));
}
