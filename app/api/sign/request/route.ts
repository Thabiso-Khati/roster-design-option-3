/**
 * POST /api/sign/request
 * ──────────────────────
 * Create a new signing request. Caller is the authenticated user (requester).
 * Body:
 *   {
 *     recipientEmail: string,
 *     recipientName: string,
 *     contractType: string,
 *     contractTitle: string,
 *     contractHtml: string,             // immutable snapshot
 *     contractMetadata?: object,
 *     ttlDays?: number                  // defaults to 30
 *   }
 *
 * Returns: { id, token, signerUrl, expiresAt }
 *
 * Side effects:
 *   • Inserts signing_requests row
 *   • Inserts signing_audit_log "created" + "sent"
 *   • Sends email to recipient (via Resend)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueSigningToken } from "@/lib/sign/tokens";
import { logSignAudit } from "@/lib/sign/audit";
import { sendEmail } from "@/lib/email/send";
import { signingRequestEmail } from "@/lib/email/templates";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const MAX_HTML_BYTES = 500_000; // 500 KB cap per contract

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate
  const required = ["recipientEmail", "recipientName", "contractType", "contractTitle", "contractHtml"] as const;
  for (const f of required) {
    if (typeof body[f] !== "string" || !(body[f] as string).length) {
      return NextResponse.json({ error: `Missing or invalid ${f}` }, { status: 400 });
    }
  }

  const recipientEmail = String(body.recipientEmail).trim().toLowerCase();
  const recipientName = String(body.recipientName).trim();
  const contractType = String(body.contractType).trim();
  const contractTitle = String(body.contractTitle).trim();
  const contractHtml = String(body.contractHtml);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return NextResponse.json({ error: "Invalid recipient email" }, { status: 400 });
  }
  if (Buffer.byteLength(contractHtml, "utf8") > MAX_HTML_BYTES) {
    return NextResponse.json({ error: `Contract HTML exceeds ${MAX_HTML_BYTES / 1000} KB limit` }, { status: 413 });
  }

  const ttlDays = typeof body.ttlDays === "number" && body.ttlDays > 0 && body.ttlDays <= 365 ? body.ttlDays : 30;
  const ttlSeconds = ttlDays * 24 * 60 * 60;

  // Get requester's profile for "from" details
  const requesterEmail = user.email ?? "unknown@roster.local";
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, country")
    .eq("id", user.id)
    .maybeSingle();
  const requesterName = (profile as { full_name?: string } | null)?.full_name || requesterEmail.split("@")[0];

  // Generate UUID + token
  const id = crypto.randomUUID();
  const token = issueSigningToken(id, ttlSeconds);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  // Insert via admin (RLS would also allow but admin avoids context churn for cron-style flows)
  const admin = createAdminClient();
  const { error: insertErr } = await admin.from("signing_requests").insert({
    id,
    requester_user_id: user.id,
    requester_name: requesterName,
    requester_email: requesterEmail,
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    contract_type: contractType,
    contract_title: contractTitle,
    contract_html: contractHtml,
    contract_metadata: typeof body.contractMetadata === "object" && body.contractMetadata !== null ? body.contractMetadata : {},
    token,
    expires_at: expiresAt,
    status: "sent",
    sent_at: new Date().toISOString(),
  });

  if (insertErr) {
    logger.error("[sign/request] insert error", {}, insertErr);
    return NextResponse.json({ error: "Failed to create signing request" }, { status: 500 });
  }

  // Audit
  await logSignAudit({ signingRequestId: id, action: "created", userId: user.id, request: req });
  await logSignAudit({ signingRequestId: id, action: "sent", userId: user.id, request: req });

  // Build signer URL
  const origin = req.headers.get("origin") || req.headers.get("referer")?.split("/").slice(0, 3).join("/") || "";
  const signerUrl = `${origin}/sign/${token}`;

  // Send email
  try {
    await sendEmail({
      to: recipientEmail,
      subject: `${requesterName} sent you "${contractTitle}" to sign`,
      html: signingRequestEmail({
        recipientName,
        requesterName,
        contractTitle,
        contractType,
        signerUrl,
        expiresAt,
      }),
      replyTo: requesterEmail,
    });
  } catch (e) {
    logger.error("[sign/request] email send error (non-fatal)", {}, e);
  }

  return NextResponse.json({
    id,
    token,
    signerUrl,
    expiresAt,
  }, { status: 201 });
}
