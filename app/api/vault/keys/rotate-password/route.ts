/**
 * POST /api/vault/keys/rotate-password
 * ────────────────────────────────────
 * User has changed their vault password. Client has already re-wrapped
 * the master key with the new password-derived key and sends the new
 * ciphertext + IV + salt. Server replaces the wrapped values.
 *
 * Server never sees the old or new password, never sees the master key.
 * Recovery wrapped key remains unchanged (separate route for that).
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

  const required = ["masterKeyEncrypted", "masterKeyIv", "masterKeySalt"] as const;
  for (const f of required) {
    if (typeof body[f] !== "string" || !(body[f] as string).length) {
      return NextResponse.json({ error: `Missing or invalid ${f}` }, { status: 400 });
    }
  }

  const iterations = typeof body.masterKeyIterations === "number" && body.masterKeyIterations >= 100000
    ? body.masterKeyIterations
    : 600000;

  const admin = createAdminClient();
  const { error } = await admin
    .from("vault_user_keys")
    .update({
      master_key_encrypted: base64ToPgHex(body.masterKeyEncrypted as string),
      master_key_iv: base64ToPgHex(body.masterKeyIv as string),
      master_key_salt: base64ToPgHex(body.masterKeySalt as string),
      master_key_iterations: iterations,
    })
    .eq("user_id", user.id);

  if (error) {
    logger.error("[vault/rotate-password] update error", {}, error);
    return NextResponse.json({ error: "Failed to rotate password" }, { status: 500 });
  }

  await logVaultAudit({ userId: user.id, action: "rotate_password", request: req });
  return NextResponse.json({ ok: true });
}
