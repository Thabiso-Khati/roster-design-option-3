export const dynamic = 'force-dynamic';

/**
 * GET /api/vault/keys
 * ───────────────────
 * Fetch the user's wrapped master key (and optionally the recovery wrapped
 * variant). Client uses these to derive plaintext master key locally and
 * unlock the vault for the session. Server never sees plaintext.
 *
 * Returns null fields if the vault hasn't been initialised yet — UI uses
 * that signal to show the "set vault password" flow.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { byteaToBase64, type ByteaValue } from "@/lib/vault/bytea";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  interface KeyRow {
    master_key_encrypted: ByteaValue;
    master_key_iv: ByteaValue;
    master_key_salt: ByteaValue;
    master_key_iterations: number | null;
    recovery_master_key_encrypted: ByteaValue;
    recovery_master_key_iv: ByteaValue;
    recovery_master_key_salt: ByteaValue;
  }

  const { data, error } = await supabase
    .from("vault_user_keys")
    .select(
      "master_key_encrypted, master_key_iv, master_key_salt, master_key_iterations, " +
      "recovery_master_key_encrypted, recovery_master_key_iv, recovery_master_key_salt"
    )
    .eq("user_id", user.id)
    .maybeSingle()
    .overrideTypes<KeyRow, { merge: false }>();

  if (error) {
    logger.error("[vault/keys] select error", {}, error);
    return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ initialised: false });
  }

  return NextResponse.json({
    initialised: true,
    masterKeyEncrypted: byteaToBase64(data.master_key_encrypted),
    masterKeyIv: byteaToBase64(data.master_key_iv),
    masterKeySalt: byteaToBase64(data.master_key_salt),
    masterKeyIterations: data.master_key_iterations,
    recoveryMasterKeyEncrypted: byteaToBase64(data.recovery_master_key_encrypted),
    recoveryMasterKeyIv: byteaToBase64(data.recovery_master_key_iv),
    recoveryMasterKeySalt: byteaToBase64(data.recovery_master_key_salt),
  });
}
