export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { logger } from "@/lib/logger";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, specialty, country, bio, years_experience, linkedin } = body;

    if (!name || !email || !specialty || !country || !bio) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();

    // Store the application
    const { error: dbError } = await supabase.from("expert_applications").insert({
      name,
      email,
      specialty,
      country,
      bio,
      years_experience: years_experience ? Number(years_experience) : null,
      linkedin: linkedin || null,
      status: "pending",
    });

    if (dbError) {
      // Table may not exist yet — log and continue
      logger.warn("[Expert register] DB insert warning", {}, dbError.message);
    }

    // Notify admins
    if (ADMIN_EMAILS.length > 0) {
      await sendEmail({
        to: ADMIN_EMAILS,
        subject: `New ROSTER expert application — ${name}`,
        html: `
          <div style="font-family:sans-serif;background:#080B14;color:#F1F5F9;padding:32px;border-radius:12px;max-width:500px;">
            <h2 style="color:#C9A84C;margin:0 0 16px 0;">New Expert Application</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#64748B;">Name</td><td style="padding:6px 0;font-weight:600;">${name}</td></tr>
              <tr><td style="padding:6px 0;color:#64748B;">Email</td><td style="padding:6px 0;">${email}</td></tr>
              <tr><td style="padding:6px 0;color:#64748B;">Specialty</td><td style="padding:6px 0;">${specialty}</td></tr>
              <tr><td style="padding:6px 0;color:#64748B;">Country</td><td style="padding:6px 0;">${country}</td></tr>
              <tr><td style="padding:6px 0;color:#64748B;">Experience</td><td style="padding:6px 0;">${years_experience || "—"} years</td></tr>
              <tr><td style="padding:6px 0;color:#64748B;">LinkedIn</td><td style="padding:6px 0;">${linkedin || "—"}</td></tr>
            </table>
            <div style="margin-top:16px;padding:12px;background:#1F2937;border-radius:8px;font-size:13px;color:#94A3B8;">
              ${bio}
            </div>
            <a href="${APP_URL}/admin/experts" style="display:inline-block;margin-top:20px;background:linear-gradient(135deg,#C9A84C,#F59E0B);color:#080B14;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:13px;">
              Review in Admin Panel →
            </a>
          </div>
        `,
      });
    }

    // Confirmation email to applicant
    await sendEmail({
      to: email,
      subject: "Your ROSTER expert application has been received",
      html: `
        <div style="font-family:sans-serif;background:#080B14;color:#F1F5F9;padding:40px;max-width:500px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:20px;font-weight:900;letter-spacing:6px;background:linear-gradient(135deg,#C9A84C,#F59E0B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">ROSTER</span>
          </div>
          <div style="background:#111827;border:1px solid #1F2937;border-radius:16px;padding:32px;">
            <h2 style="color:#F1F5F9;margin:0 0 8px 0;">Application received, ${name.split(" ")[0]}.</h2>
            <p style="color:#64748B;font-size:14px;margin:0 0 20px 0;">We review every application personally.</p>
            <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0;">
              Thank you for applying to the ROSTER expert network. Our team will review your application
              and get back to you within 3–5 business days with next steps, including your payout setup
              and profile onboarding.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("[Expert register]", {}, err);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
