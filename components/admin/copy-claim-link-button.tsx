// ============================================================
// ROSTER — Admin: Copy claim-link button
// ------------------------------------------------------------
// Client widget for the Experts admin page. Copies a fresh
// /experts/claim?token=… URL to the clipboard so the admin can
// DM it to the applicant directly if the email bounced.
// ============================================================

"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyClaimLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback — most modern browsers won't hit this, but just in case
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 bg-surface-2 hover:bg-surface border border-border text-text-primary text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
    >
      {copied ? (
        <>
          <Check size={12} className="text-success" />
          Copied
        </>
      ) : (
        <>
          <Copy size={12} />
          Copy link
        </>
      )}
    </button>
  );
}
