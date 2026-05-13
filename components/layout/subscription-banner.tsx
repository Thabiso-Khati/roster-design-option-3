"use client";

// ============================================================
// ROSTER — SubscriptionBanner
// ------------------------------------------------------------
// Shown when a user's paid subscription has lapsed (cancelled
// or expired). Sits above the workspace banner as a persistent
// amber nudge to renew. Not shown to active subscribers or
// free-tier users who never had a paid plan.
// ============================================================

import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface SubscriptionBannerProps {
  tierName: string;
}

export function SubscriptionBanner({ tierName }: SubscriptionBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 text-sm text-amber-400 min-w-0">
        <AlertTriangle size={14} className="flex-shrink-0" />
        <span className="truncate">
          Your{tierName ? ` ${tierName}` : ""} subscription has expired.{" "}
          <Link
            href="/auth/signup?plan=pro&billing=monthly"
            className="underline font-semibold hover:text-amber-300 transition-colors"
          >
            Renew now
          </Link>{" "}
          to restore full access.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-amber-500/60 hover:text-amber-400 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
