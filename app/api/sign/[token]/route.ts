/**
 * /api/sign/[token]
 * ─────────────────
 * Public token-based access for the signer.
 *
 * GET   — Returns the contract for the recipient to read & sign.
 *         Auto-logs "viewed" on first call. No auth required.
 *
 * POST  — Capture signature. Body: { signatureImageData, signatureTypedName }.
 *         Logs "signed" + sends confirmation email to both parties.
 *
 * DELETE — (Used as decline.) Body: { reason? }. Logs "declined".
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySigningToken, ipFromRequest } from "@/lib/sign/tokens";
import { logSignAudit } from "@/lib/sign/audit";
import { sendEmail } from "@/lib/email/send";
import { signingCompleteEmail, signingDeclinedEmail } from "@/lib/email/templates";
import type { PublicSigningRequestView } from "@/lib/sign/types";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

interface RawRow {
  id: string;
  requester_name: string;
  requester_email: string;
  recipient_email: string;
  recipient_name: string;
  contract_type: string;
  contract_title: string;
  contract_html: string;
  status: string;
  expires_at: string;
  sent_at: string | null;
  signed_at: string | null;
  first_viewed_at: string | null;
  signature_image_data: string | null;
  signature_typed_name: string | null;
  signer_ip: string | null;
}

async function loadByToken(token: string): Promise<RawRow | null> {
  const admin = createAdminClient();
  const payload = verifySigningToken(token);

  // Strict path: token still within TTL — verify rid matches.
  if (payload) {
    const { data, error } = await admin
      .from("signing_requests")
      .select("id, requester_name, requester_email, recipient_email, recipient_name, contract_type, contract_title, contract_html, status, expires_at, sent_at, signed_at, first_viewed_at, signature_image_data, signature_typed_name, signer_ip")
      .eq("id", payload.rid)
      .eq("token", token)
      .maybeSingle();
    if (!error && data) return data as RawRow;
  }

  // Permanent-access path: signed contracts remain accessible to anyone with
  // the token, even after the original 30-day TTL — recipients without a
  // ROSTER account need to be able to retrieve their signed copy years later.
  const { data: signedRow, error: signedErr } = await admin
    .from("signing_requests")
    .select("id, requester_name, requester_email, recipient_email, recipient_name, contract_type, contract_title, contract_html, status, expires_at, sent_at, signed_at, first_viewed_at, signature_image_data, signature_typed_name, signer_ip")
    .eq("token", token)
    .eq("status", "signed")
    .maybeSingle();
  if (!signedErr && signedRow) return signedRow as RawRow;

  return null;
}

// ── GET ──────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const row = await loadByToken(token);
  if (!row) {
    return NextResponse.json({ error: "Invalid or expired signing link." }, { status: 404 });
  }

  // Mark first-view if not already, log audit
  if (!row.first_viewed_at) {
    const admin = createAdminClient();
    await admin
      .from("signing_requests")
      .update({ first_viewed_at: new Date().toISOString(), status: row.status === "sent" ? "viewed" : row.status })
      .eq("id", row.id);
  }
  await logSignAudit({ signingRequestId: row.id, action: "viewed", request: req });

  const view: PublicSigningRequestView = {
    id: row.id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    recipientName: row.recipient_name,
    contractType: row.contract_type,
    contractTitle: row.contract_title,
    contractHtml: row.contract_html,
    status: row.status as PublicSigningRequestView["status"],
    expiresAt: row.expires_at,
    sentAt: row.sent_at,
    signedAt: row.signed_at,
    signatureImageData: row.signature_image_data,
    signatureTypedName: row.signature_typed_name,
  };
  return NextResponse.json(view);
}

// ── POST (sign) ──────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const row = await loadByToken(token);
  if (!row) {
    return NextResponse.json({ error: "Invalid or expired signing link." }, { status: 404 });
  }
  if (row.status === "signed") {
    return NextResponse.json({ error: "This contract has already been signed." }, { status: 409 });
  }
  if (row.status === "declined" || row.status === "cancelled" || row.status === "expired") {
    return NextResponse.json({ error: `This signing request is ${row.status}.` }, { status: 409 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signatureImageData = typeof body.signatureImageData === "string" ? body.signatureImageData : "";
  const signatureTypedName = typeof body.signatureTypedName === "string" ? body.signatureTypedName.trim() : "";

  if (!signatureImageData.startsWith("data:image/")) {
    return NextResponse.json({ error: "Signature image required" }, { status: 400 });
  }
  if (!signatureTypedName || signatureTypedName.length < 2) {
    return NextResponse.json({ error: "Typed full name required for signature verification" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: updateErr } = await admin
    .from("signing_requests")
    .update({
      status: "signed",
      signed_at: new Date().toISOString(),
      signature_image_data: signatureImageData,
      signature_typed_name: signatureTypedName,
      signer_ip: ipFromRequest(req),
      signer_user_agent: req.headers.get("user-agent"),
    })
    .eq("id", row.id);

  if (updateErr) {
    logger.error("[sign/sign] update error", {}, updateErr);
    return NextResponse.json({ error: "Failed to record signature" }, { status: 500 });
  }

  await logSignAudit({
    signingRequestId: row.id,
    action: "signed",
    metadata: { typedName: signatureTypedName },
    request: req,
  });

  // Send confirmation emails to both parties
  try {
    const html = signingCompleteEmail({
      recipientName: row.recipient_name,
      requesterName: row.requester_name,
      contractTitle: row.contract_title,
      signedAt: new Date().toISOString(),
    });
    await sendEmail({
      to: [row.requester_email, row.recipient_email],
      subject: `"${row.contract_title}" has been signed`,
      html,
    });
  } catch (e) {
    logger.error("[sign/sign] confirmation email error (non-fatal)", {}, e);
  }

  return NextResponse.json({ ok: true });
}

// ── DELETE (decline) ─────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const row = await loadByToken(token);
  if (!row) {
    return NextResponse.json({ error: "Invalid or expired signing link." }, { status: 404 });
  }
  if (row.status === "signed" || row.status === "declined" || row.status === "cancelled" || row.status === "expired") {
    return NextResponse.json({ error: `Cannot decline a ${row.status} request.` }, { status: 409 });
  }

  let reason = "";
  try {
    const body = await req.json();
    reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : "";
  } catch { /* allow empty */ }

  const admin = createAdminClient();
  await admin
    .from("signing_requests")
    .update({
      status: "declined",
      declined_at: new Date().toISOString(),
      decline_reason: reason || null,
    })
    .eq("id", row.id);

  await logSignAudit({ signingRequestId: row.id, action: "declined", metadata: { reason }, request: req });

  // Notify requester
  try {
    await sendEmail({
      to: row.requester_email,
      subject: `${row.recipient_name} declined to sign "${row.contract_title}"`,
      html: signingDeclinedEmail({
        requesterName: row.requester_name,
        recipientName: row.recipient_name,
        contractTitle: row.contract_title,
        reason,
      }),
    });
  } catch (e) {
    logger.error("[sign/decline] notify error (non-fatal)", {}, e);
  }

  return NextResponse.json({ ok: true });
}
