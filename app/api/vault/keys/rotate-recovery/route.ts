export const dynamic = 'force-dynamic';

/**
 * POST /api/vault/keys/rotate-recovery
 * ────────────────────────────────────
 * User has generated a new recovery phrase. Client re-wraps master key
 * with the new recovery-derived key and sends the new ciphertext.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logVaultAudit } from "@/lib/vault/audit";
import { base64ToPgHex } from "@/lib/vault/bytea";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

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

  const required = ["recoveryMasterKeyEncrypted", "recoveryMasterKeyIv", "recoveryMasterKeySalt"] as const;
  for (const f of required) {
    if (typeof body[f] !== "string" || !(body[f] as string).length) {
      return NextResponse.json({ error: `Missing or invalid ${f}` }, { status: 400 });
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("vault_user_keys")
    .update({
      recovery_master_key_encrypted: base64ToPgHex(body.recoveryMasterKeyEncrypted as string),
      recovery_master_key_iv: base64ToPgHex(body.recoveryMasterKeyIv as string),
      recovery_master_key_salt: base64ToPgHex(body.recoveryMasterKeySalt as string),
    })
    .eq("user_id", user.id);

  if (error) {
    logger.error("[vault/rotate-recovery] update error", {}, error);
    return NextResponse.json({ error: "Failed to rotate recovery" }, { status: 500 });
  }

  await logVaultAudit({ userId: user.id, action: "rotate_recovery", request: req });
  return NextResponse.json({ ok: true });
}
