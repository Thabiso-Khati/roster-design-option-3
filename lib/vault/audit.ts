/**
 * Vault audit log helper.
 *
 * RLS policy on vault_audit_log allows SELECT for the row owner but no
 * authenticated INSERT — all audit writes happen server-side via the
 * admin client. This helper centralises that pattern so every route
 * emits audit entries identically.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

export type VaultAuditAction =
  | "init_vault"
  | "unlock_vault"
  | "rotate_password"
  | "rotate_recovery"
  | "upload"
  | "download"
  | "view_metadata"
  | "rename"
  | "recategorise"
  | "soft_delete"
  | "restore"
  | "hard_delete"
  | "share_create"
  | "share_revoke";

export interface AuditEntry {
  userId: string;
  action: VaultAuditAction;
  vaultItemId?: string | null;
  metadata?: Record<string, unknown> | null;
  request?: NextRequest;
}

/**
 * Extract the requester IP from headers Vercel / proxies set.
 * Falls back to null if not detectable.
 */
function ipFromRequest(req?: NextRequest): string | null {
  if (!req) return null;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return null;
}

/** Insert an audit row. Best-effort — logs but doesn't throw. */
export async function logVaultAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("vault_audit_log").insert({
      user_id: entry.userId,
      action: entry.action,
      vault_item_id: entry.vaultItemId ?? null,
      metadata: entry.metadata ?? null,
      ip: ipFromRequest(entry.request),
      user_agent: entry.request?.headers.get("user-agent") ?? null,
    });
    if (error) {
      logger.error("[vault-audit] insert failed", { userId: entry.userId, action: entry.action }, error);
    }
  } catch (e) {
    logger.error("[vault-audit] unexpected error", { userId: entry.userId, action: entry.action }, e);
  }
}
