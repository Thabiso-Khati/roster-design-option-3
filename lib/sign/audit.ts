/**
 * E-Sign audit log helper. Inserts via admin client because the recipient
 * (signer) is not authenticated when they view / sign / decline.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { ipFromRequest } from "./tokens";
import type { SigningAuditAction } from "./types";
import { logger } from "@/lib/logger";

export interface SignAuditEntry {
  signingRequestId: string;
  action: SigningAuditAction;
  userId?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;
}

export async function logSignAudit(entry: SignAuditEntry): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("signing_audit_log").insert({
    signing_request_id: entry.signingRequestId,
    user_id: entry.userId ?? null,
    action: entry.action,
    ip: entry.request ? ipFromRequest(entry.request) : null,
    user_agent: entry.request?.headers.get("user-agent") ?? null,
    metadata: entry.metadata ?? {},
  });
  if (error) logger.error("[sign-audit] insert failed", { signingRequestId: entry.signingRequestId, action: entry.action }, error);
}
