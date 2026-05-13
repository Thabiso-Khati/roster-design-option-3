/**
 * Resolve a user's subscription tier for vault quota enforcement.
 *
 * Tier mapping (mirrors the plans defined in lib/constants.ts):
 *
 *   legacy:            "monthly" | "annual"                              → "pro"
 *   explicit Pro:      "pro_monthly" | "pro_annual"                    → "pro"
 *   Agency:            "agency_monthly" | "agency_annual"              → "agency"
 *   Enterprise:        "enterprise_monthly" | "enterprise_annual"      → "enterprise"
 *   Enterprise Max:    "enterprise_max_monthly" | "enterprise_max_annual" → "enterprise_max"
 *   No active sub:                                                      → "free"
 *
 * Active subscription = status = 'active' AND (expires_at IS NULL OR expires_at > now())
 */

import type { TierId } from "@/lib/constants";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

interface SubscriptionRow {
  plan: string;
  status: string;
  expires_at: string | null;
}

export async function getUserTier(
  supabase: SupabaseClient,
  userId: string,
): Promise<TierId> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, status, expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("activated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Log and fail-safe to "free" — never grant access on uncertainty.
    logger.warn("[getUserTier] subscription lookup failed; defaulting to free", {
      userId,
      error: error.message,
    });
    return "free";
  }

  if (!data) return "free";

  const row = data as SubscriptionRow;

  // Check expiry if present
  if (row.expires_at && new Date(row.expires_at) <= new Date()) {
    return "free";
  }

  // Map plan → TierId.
  switch (row.plan) {
    // Legacy single-tier era
    case "monthly":
    case "annual":
    // Explicit Pro
    case "pro_monthly":
    case "pro_annual":
      return "pro";
    case "agency_monthly":
    case "agency_annual":
      return "agency";
    case "enterprise_monthly":
    case "enterprise_annual":
      return "enterprise";
    case "enterprise_max_monthly":
    case "enterprise_max_annual":
      return "enterprise_max";
    default:
      return "free";
  }
}
