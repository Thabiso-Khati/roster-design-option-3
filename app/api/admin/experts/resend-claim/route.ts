export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — Admin: Resend claim link
// ------------------------------------------------------------
// Reissues a fresh claim_token on an already-approved-but-not-yet-
// claimed expert row, and re-sends the claim email. Admin-gated
// by ADMIN_EMAILS env var, same as other admin routes.
//
// Delivery: enqueued via QStash (retries up to 3×) when
// QSTASH_TOKEN is set; falls back to inline send otherwise.
//
// Use when:
//   - Expert lost the original email
//   - Original token expired (14-day TTL)
//   - You changed the application_email and want a new invite
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail }       from "@/lib/email/send";
import { enqueueTransact } from "@/lib/queue/transact";
import { randomUUID } from "crypto";
import { logger } from "@/lib/logger";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const APP_URL       = process.env.NEXT_PUBLIC_APP_URL || "";
const CLAIM_TTL_DAYS = 14;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email || ""))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const formData  = await req.formData();
  const expertId  = formData.get("expert_id") as string;
  if (!expertId) {
    return NextResponse.redirect(new URL("/admin/experts?error=missing_id", req.url));
  }

  // Fetch expert; refuse if already claimed.
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: expert, error: lookupError } = await admin
    .from("experts")
    .select("id, name, application_email, user_id")
    .eq("id", expertId)
    .maybeSingle();

  if (lookupError || !expert) {
    return NextResponse.redirect(new URL("/admin/experts?error=not_found", req.url));
  }
  if (expert.user_id) {
    return NextResponse.redirect(new URL("/admin/experts?error=already_claimed", req.url));
  }
  if (!expert.application_email) {
    return NextResponse.redirect(new URL("/admin/experts?error=no_email", req.url));
  }

  // Issue fresh token
  const claimToken   = randomUUID();
  const claimExpires = new Date(Date.now() + CLAIM_TTL_DAYS * 24 * 60 * 60 * 1000);

  const { error: updateError } = await admin
    .from("experts")
    .update({
      claim_token:            claimToken,
      claim_token_expires_at: claimExpires.toISOString(),
    })
    .eq("id", expertId);

  if (updateError) {
    logger.error("[resend-claim] Update error", {}, updateError);
    return NextResponse.redirect(new URL("/admin/experts?error=update_failed", req.url));
  }

  const claimUrl  = `${APP_URL}/experts/claim?token=${claimToken}`;
  const firstName = expert.name?.split(" ")[0] || "there";

  const emailHtml = `
    <div style="font-family:sans-serif;background:#080B14;color:#F1F5F9;padding:40px;max-width:500px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:32px;">
        <span style="font-size:20px;font-weight:900;letter-spacing:6px;background:linear-gradient(135deg,#C9A84C,#F59E0B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">ROSTER</span>
      </div>
      <div style="background:#111827;border:1px solid #1F2937;border-radius:16px;padding:32px;">
        <h2 style="color:#F1F5F9;margin:0 0 8px 0;">Fresh claim link, ${firstName}.</h2>
        <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
          Your previous claim link expired or went missing. Use the button below to claim your expert
          account — signed in as <strong style="color:#F1F5F9;">${expert.application_email}</strong>.
        </p>
        <a href="${claimUrl}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#F59E0B);color:#080B14;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:14px;">
          Claim Your Expert Account →
        </a>
        <p style="color:#64748B;font-size:11px;margin:20px 0 0 0;">
          This link expires in ${CLAIM_TTL_DAYS} days.
        </p>
      </div>
      <p style="text-align:center;font-size:12px;color:#64748B;margin-top:24px;">
        Questions? <a href="mailto:experts@rosterapp.ai" style="color:#C9A84C;">experts@rosterapp.ai</a>
      </p>
    </div>
  `;

  // ── Try QStash queue first (retries on failure) ───────────────────────
  const { queued, error: qErr } = await enqueueTransact({
    type:    "email",
    to:      expert.application_email,
    subject: "Your ROSTER expert claim link (reissued)",
    html:    emailHtml,
  });

  if (!queued) {
    if (qErr) logger.warn("[resend-claim] QStash enqueue failed — falling back to inline send", {}, qErr);
    // Fallback: send inline
    await sendEmail({
      to:      expert.application_email,
      subject: "Your ROSTER expert claim link (reissued)",
      html:    emailHtml,
    });
  }

  return NextResponse.redirect(new URL("/admin/experts?resent=1", req.url));
}
