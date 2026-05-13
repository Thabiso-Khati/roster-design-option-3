export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — DELETE /api/settings/account
// ------------------------------------------------------------
// POPIA / GDPR "right to erasure" — permanently deletes the
// authenticated user's account and ALL associated data.
//
// Because every table uses  user_id references auth.users(id)
// ON DELETE CASCADE, deleting the auth user row is sufficient
// to cascade-remove all application data. Storage objects
// (vault files, avatars) are cleaned up separately.
//
// This is irreversible. The route requires a confirmation
// token (the user's email, re-entered) to prevent accidental
// deletion via CSRF or stale UI state.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    // Parse confirmation payload
    const body = await req.json().catch(() => ({}));
    const { confirmEmail } = body as { confirmEmail?: string };

    // Require the user to re-type their email as a CSRF / fat-finger guard
    if (
      !confirmEmail ||
      confirmEmail.trim().toLowerCase() !== (user.email ?? "").toLowerCase()
    ) {
      return NextResponse.json(
        {
          error:
            "Email confirmation does not match. Please type your exact email address to confirm deletion.",
        },
        { status: 422 }
      );
    }

    const uid = user.id;

    // ── 1. Remove storage objects ─────────────────────────────
    // Vault bucket — best-effort, non-blocking
    try {
      const admin = createAdminClient();
      const { data: vaultFiles } = await admin.storage
        .from("vault")
        .list(uid, { limit: 1000 });

      if (vaultFiles && vaultFiles.length > 0) {
        const paths = vaultFiles.map((f) => `${uid}/${f.name}`);
        await admin.storage.from("vault").remove(paths);
      }

      // Avatar bucket
      const { data: avatarFiles } = await admin.storage
        .from("avatars")
        .list(uid, { limit: 10 });

      if (avatarFiles && avatarFiles.length > 0) {
        const paths = avatarFiles.map((f) => `${uid}/${f.name}`);
        await admin.storage.from("avatars").remove(paths);
      }
    } catch {
      // Storage cleanup failure is non-fatal — proceed with account deletion
      logger.warn("[settings/account DELETE] storage cleanup failed — continuing", { userId: uid });
    }

    // ── 2. Delete auth user (cascades all DB rows) ────────────
    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(uid);

    if (deleteError) {
      logger.error("[settings/account DELETE] auth.admin.deleteUser failed", { userId: uid }, deleteError);
      return NextResponse.json(
        { error: "Failed to delete account. Please contact support@rosterapp.ai." },
        { status: 500 }
      );
    }

    logger.info("[settings/account DELETE] account deleted", { userId: uid });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[settings/account DELETE] unexpected error", {}, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
