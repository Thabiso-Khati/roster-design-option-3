// ============================================================
// ROSTER — Tools layout (free-tier gating)
// ------------------------------------------------------------
// Free accounts may only use the two tools listed in the free
// tier's `freeTools` array: "tour-budget" and "cashflow-forecast".
// Attempting to open any other tool redirects to /pricing.
//
// The current tool slug is extracted from the x-pathname header
// stamped by middleware.ts, so this check is zero-JS.
// ============================================================

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { TIERS } from "@/lib/constants";

const SUPABASE_CONFIGURED =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url";

export default async function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!SUPABASE_CONFIGURED) return <>{children}</>;

  const { createClient } = await import("@/lib/supabase/server");
  const { getUserTier }  = await import("@/lib/vault/get-user-tier");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const tierId = await getUserTier(supabase, user.id);

  // Paid tiers always get through.
  if (tierId !== "free") return <>{children}</>;

  // ── Free tier: check if this specific tool is in the allow-list ─
  const freeTier  = TIERS.find((t) => t.id === "free");
  const allowed   = Array.isArray(freeTier?.freeTools) ? freeTier.freeTools : [];

  // Extract the tool slug from the request path stamped by middleware.
  // Path shape: /dashboard/tools/<slug>  (may have trailing segments)
  const h        = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const parts    = pathname.split("/");
  const toolsIdx = parts.indexOf("tools");
  const slug     = toolsIdx >= 0 ? (parts[toolsIdx + 1] ?? "") : "";

  if (slug && !allowed.includes(slug)) {
    // Blocked tool → send to pricing with a gate hint
    redirect("/pricing?gate=tools");
  }

  return <>{children}</>;
}
