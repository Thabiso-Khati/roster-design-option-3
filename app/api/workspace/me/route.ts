// ============================================================
// ROSTER — GET /api/workspace/me
// ------------------------------------------------------------
// Returns the workspace context for the authenticated user.
// Used by the client-side WorkspaceContext to know:
//   • whether the user is an owner or team member
//   • whose workspace they are accessing (ownerId)
//   • their role and per-area permissions
// ============================================================

import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/workspace/context";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getWorkspaceContext();

  if (!ctx) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  return NextResponse.json(ctx, {
    headers: {
      // Short cache — context changes when invite is accepted / revoked
      "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
    },
  });
}
