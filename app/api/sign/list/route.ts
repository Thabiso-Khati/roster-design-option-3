/**
 * GET /api/sign/list
 * ──────────────────
 * Returns the authenticated user's sent signing requests.
 * RLS scopes to requester_user_id.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  interface ListRow {
    id: string;
    recipient_email: string;
    recipient_name: string;
    contract_type: string;
    contract_title: string;
    status: string;
    sent_at: string | null;
    first_viewed_at: string | null;
    signed_at: string | null;
    declined_at: string | null;
    decline_reason: string | null;
    expires_at: string;
    created_at: string;
  }

  const { data, error } = await supabase
    .from("signing_requests")
    .select(
      "id, recipient_email, recipient_name, contract_type, contract_title, status, " +
      "sent_at, first_viewed_at, signed_at, declined_at, decline_reason, expires_at, created_at",
    )
    .eq("requester_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200)
    .overrideTypes<ListRow[], { merge: false }>();

  if (error) {
    logger.error("[sign/list] error", {}, error);
    return NextResponse.json({ error: "Failed to fetch signing requests" }, { status: 500 });
  }

  return NextResponse.json({
    requests: (data ?? []).map((r) => ({
      id: r.id,
      recipientEmail: r.recipient_email,
      recipientName: r.recipient_name,
      contractType: r.contract_type,
      contractTitle: r.contract_title,
      status: r.status,
      sentAt: r.sent_at,
      firstViewedAt: r.first_viewed_at,
      signedAt: r.signed_at,
      declinedAt: r.declined_at,
      declineReason: r.decline_reason,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
    })),
  });
}
