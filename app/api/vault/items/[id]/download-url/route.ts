export const dynamic = 'force-dynamic';

/**
 * GET /api/vault/items/[id]/download-url
 * ──────────────────────────────────────
 * Mints a short-lived signed URL the browser uses to GET the encrypted
 * blob from Storage. After download, the client decrypts using the
 * wrapped DEK already in the item's metadata response.
 *
 * Logs a 'download' audit entry.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logVaultAudit } from "@/lib/vault/audit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const SIGNED_URL_TTL_SECONDS = 60; // short-lived

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Confirm user owns the item + grab its storage_path
  const { data: item, error: itemError } = await supabase
    .from("vault_items")
    .select("id, storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (itemError) {
    logger.error("[vault/download-url] item lookup error", {}, itemError);
    return NextResponse.json({ error: "Failed to lookup item" }, { status: 500 });
  }

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("vault-files")
    .createSignedUrl(item.storage_path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    logger.error("[vault/download-url] sign error", {}, error);
    return NextResponse.json({ error: "Failed to create download URL" }, { status: 500 });
  }

  await logVaultAudit({
    userId: user.id,
    action: "download",
    vaultItemId: id,
    request: req,
  });

  return NextResponse.json({
    signedUrl: data.signedUrl,
    expiresInSeconds: SIGNED_URL_TTL_SECONDS,
  });
}
