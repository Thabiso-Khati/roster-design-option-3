/**
 * POST /api/vault/items/[id]/upload-url
 * ─────────────────────────────────────
 * Returns a short-lived signed upload URL the browser uses to PUT the
 * already-encrypted ciphertext directly to the vault-files bucket.
 *
 * The path enforced is {user_id}/{itemId}/blob.enc — matches the RLS
 * folder convention. We don't trust the client to pick the path.
 *
 * Quota: enforces per-tier total + per-file caps BEFORE minting the URL,
 * so the upload can't even start if it would push the user over.
 *
 * Body: { sizeBytes: number }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTier } from "@/lib/vault/get-user-tier";
import { getLimitForTier, MAX_BUCKET_FILE_SIZE, formatBytes } from "@/lib/vault/limits";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* allow empty body */ }
  const sizeBytes = Number(body.sizeBytes) || 0;

  // ─── Quota enforcement ─────────────────────────────────────────────
  const tier = await getUserTier(supabase, user.id);
  const limit = getLimitForTier(tier);

  // Per-file cap: the lower of the absolute bucket cap and the tier's max.
  const perFileCap = Math.min(MAX_BUCKET_FILE_SIZE, limit.maxFileBytes);
  if (sizeBytes > perFileCap) {
    return NextResponse.json(
      { error: `File exceeds ${formatBytes(perFileCap)} per-file limit on the ${tier} plan.` },
      { status: 413 }
    );
  }

  // Total quota: sum size_bytes of all non-deleted items, see if new file fits.
  const { data: usageRows, error: usageErr } = await supabase
    .from("vault_items")
    .select("size_bytes")
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (usageErr) {
    logger.error("[vault/upload-url] usage lookup error", {}, usageErr);
    return NextResponse.json({ error: "Failed to check quota" }, { status: 500 });
  }

  const usedBytes = (usageRows ?? []).reduce(
    (acc: number, r: { size_bytes: number | null }) => acc + (r.size_bytes ?? 0),
    0,
  );

  if (usedBytes + sizeBytes > limit.totalBytes) {
    const remaining = Math.max(0, limit.totalBytes - usedBytes);
    return NextResponse.json(
      {
        error:
          `Upload would exceed your vault quota. Plan: ${tier} (${limit.label}). ` +
          `Used: ${formatBytes(usedBytes)}. Remaining: ${formatBytes(remaining)}.`,
        quota: {
          tier,
          totalBytes: limit.totalBytes,
          usedBytes,
          remainingBytes: remaining,
        },
      },
      { status: 413 }
    );
  }

  const path = `${user.id}/${id}/blob.enc`;

  // Use admin client to mint a signed upload URL (Supabase requires service-role
  // for createSignedUploadUrl on private buckets in some SDK versions).
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("vault-files")
    .createSignedUploadUrl(path);

  if (error || !data) {
    logger.error("[vault/upload-url] error", {}, error);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path,
  });
}
