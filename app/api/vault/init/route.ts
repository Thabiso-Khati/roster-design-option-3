/**
 * POST /api/vault/init
 * ────────────────────
 * First-time vault setup. Receives the user's wrapped master key
 * (encrypted client-side with the password-derived key) plus the
 * recovery-phrase wrapped variant. Server stores both — never sees
 * plaintext key or password or recovery phrase.
 *
 * Body shape (all fields base64-encoded bytea):
 *   {
 *     masterKeyEncrypted: string,      // master key wrapped with KP (password-derived)
 *     masterKeyIv: string,
 *     masterKeySalt: string,
 *     masterKeyIterations?: number,    // default 600000
 *     recoveryMasterKeyEncrypted: string,  // master key wrapped with KR (recovery-derived)
 *     recoveryMasterKeyIv: string,
 *     recoveryMasterKeySalt: string,
 *   }
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

  const required = [
    "masterKeyEncrypted", "masterKeyIv", "masterKeySalt",
    "recoveryMasterKeyEncrypted", "recoveryMasterKeyIv", "recoveryMasterKeySalt",
  ] as const;

  for (const f of required) {
    if (typeof body[f] !== "string" || !(body[f] as string).length) {
      return NextResponse.json({ error: `Missing or invalid ${f}` }, { status: 400 });
    }
  }

  const iterations = typeof body.masterKeyIterations === "number" && body.masterKeyIterations >= 100000
    ? body.masterKeyIterations
    : 600000;

  // Use admin client because vault_user_keys may be inserted before the user
  // has been able to write under their own RLS auth.uid() reference.
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("vault_user_keys")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Vault already initialised. Use rotate-password to change keys." },
      { status: 409 }
    );
  }

  const { error: insertError } = await admin.from("vault_user_keys").insert({
    user_id: user.id,
    master_key_encrypted: base64ToPgHex(body.masterKeyEncrypted as string),
    master_key_iv: base64ToPgHex(body.masterKeyIv as string),
    master_key_salt: base64ToPgHex(body.masterKeySalt as string),
    master_key_iterations: iterations,
    recovery_master_key_encrypted: base64ToPgHex(body.recoveryMasterKeyEncrypted as string),
    recovery_master_key_iv: base64ToPgHex(body.recoveryMasterKeyIv as string),
    recovery_master_key_salt: base64ToPgHex(body.recoveryMasterKeySalt as string),
  });

  if (insertError) {
    logger.error("[vault/init] insert error", {}, insertError);
    return NextResponse.json({ error: "Failed to initialise vault" }, { status: 500 });
  }

  await logVaultAudit({
    userId: user.id,
    action: "init_vault",
    request: req,
  });

  return NextResponse.json({ ok: true });
}
