/**
 * Vault storage quotas per subscription tier.
 *
 * ⚠️ PLACEHOLDER VALUES — finalise at end of build when pricing is locked.
 * Update VAULT_TIER_LIMITS and re-run; no other code changes needed.
 *
 * Quota is enforced server-side in /api/vault/items/[id]/upload-url BEFORE
 * minting a signed URL. The client also reads the limit via /api/vault/quota
 * to surface "X used of Y" in the UI.
 */
import type { TierId } from "@/lib/constants";

const GB = 1024 * 1024 * 1024;
const MB = 1024 * 1024;

export interface VaultTierLimit {
  /** Total ciphertext bytes allowed across all non-deleted items. */
  totalBytes: number;
  /** Hard cap on a single uploaded file (must be ≤ MAX_BUCKET_FILE_SIZE). */
  maxFileBytes: number;
  /** Friendly label for UI. */
  label: string;
}

/**
 * PLACEHOLDER quotas — replace with final values when pricing locks.
 * Free is intentionally tiny: vault is a paid feature, free users get a
 * preview only.
 */
export const VAULT_TIER_LIMITS: Record<TierId, VaultTierLimit> = {
  free:           { totalBytes: 50 * MB,       maxFileBytes: 10 * MB, label: "50 MB"  },
  pro:            { totalBytes: 10 * GB,        maxFileBytes: 50 * MB, label: "10 GB"  },
  agency:         { totalBytes: 100 * GB,       maxFileBytes: 50 * MB, label: "100 GB" },
  enterprise:     { totalBytes: 1024 * GB,      maxFileBytes: 50 * MB, label: "1 TB"   },
  enterprise_max: { totalBytes: 5 * 1024 * GB,  maxFileBytes: 50 * MB, label: "5 TB"   },
};

/** Absolute ceiling; nothing above this can be uploaded regardless of tier. */
export const MAX_BUCKET_FILE_SIZE = 50 * MB;

export function getLimitForTier(tier: TierId): VaultTierLimit {
  return VAULT_TIER_LIMITS[tier] ?? VAULT_TIER_LIMITS.free;
}

/** Format bytes for UI: 12.4 MB / 1.2 GB / 850 KB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < GB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${(bytes / GB).toFixed(2)} GB`;
}
