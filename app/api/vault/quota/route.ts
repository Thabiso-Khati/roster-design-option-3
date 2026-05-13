export const dynamic = 'force-dynamic';

/**
 * GET /api/vault/quota
 * ────────────────────
 * Returns the user's current vault storage usage and tier limits.
 * UI uses this to render "X used of Y" + percentage bar.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/vault/get-user-tier";
import { getLimitForTier, MAX_BUCKET_FILE_SIZE, formatBytes } from "@/lib/vault/limits";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const tier = await getUserTier(supabase, user.id);
  const limit = getLimitForTier(tier);

  const { data: usageRows, error: usageErr } = await supabase
    .from("vault_items")
    .select("size_bytes")
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (usageErr) {
    logger.error("[vault/quota] usage error", {}, usageErr);
    return NextResponse.json({ error: "Failed to fetch quota" }, { status: 500 });
  }

  const usedBytes = (usageRows ?? []).reduce(
    (acc: number, r: { size_bytes: number | null }) => acc + (r.size_bytes ?? 0),
    0,
  );
  const totalBytes = limit.totalBytes;
  const remainingBytes = Math.max(0, totalBytes - usedBytes);
  const perFileCap = Math.min(MAX_BUCKET_FILE_SIZE, limit.maxFileBytes);
  const percentUsed = totalBytes === 0 ? 0 : Math.min(100, Math.round((usedBytes / totalBytes) * 1000) / 10);

  return NextResponse.json({
    tier,
    label: limit.label,
    totalBytes,
    usedBytes,
    remainingBytes,
    perFileCap,
    percentUsed,
    formatted: {
      used: formatBytes(usedBytes),
      total: formatBytes(totalBytes),
      remaining: formatBytes(remainingBytes),
      perFileCap: formatBytes(perFileCap),
    },
    itemCount: usageRows?.length ?? 0,
  });
}
