/**
 * /api/vault/items/[id]
 * ─────────────────────
 *   PATCH  — rename / recategorise / update notes (encrypted fields).
 *   DELETE — soft-delete (sets deleted_at; storage object retained for now).
 *            Hard-delete is a separate admin route (TODO).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logVaultAudit } from "@/lib/vault/audit";
import { base64ToPgHex } from "@/lib/vault/bytea";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const ALLOWED_CATEGORIES = new Set([
  "Contracts", "Masters", "Cover art", "EPK / press", "Visual assets",
  "Tax / financial", "Government / legal", "Touring", "Other",
]);

interface PatchBody {
  nameEncrypted?: string;
  nameIv?: string;
  category?: string;
  notesEncrypted?: string | null;
  notesIv?: string | null;
}

// ─── PATCH ──────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  let auditAction: "rename" | "recategorise" | "view_metadata" = "view_metadata";

  if (typeof body.nameEncrypted === "string" && typeof body.nameIv === "string") {
    update.name_encrypted = base64ToPgHex(body.nameEncrypted);
    update.name_iv = base64ToPgHex(body.nameIv);
    auditAction = "rename";
  }

  if (typeof body.category === "string") {
    if (!ALLOWED_CATEGORIES.has(body.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    update.category = body.category;
    if (auditAction === "view_metadata") auditAction = "recategorise";
  }

  if (body.notesEncrypted !== undefined) {
    update.notes_encrypted = body.notesEncrypted ? base64ToPgHex(body.notesEncrypted) : null;
    update.notes_iv = body.notesIv ? base64ToPgHex(body.notesIv) : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("vault_items")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    logger.error("[vault/items PATCH] error", {}, error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }

  await logVaultAudit({
    userId: user.id,
    action: auditAction,
    vaultItemId: id,
    request: req,
  });

  return NextResponse.json({ ok: true });
}

// ─── DELETE (soft) ──────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await supabase
    .from("vault_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    logger.error("[vault/items DELETE] error", {}, error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }

  await logVaultAudit({
    userId: user.id,
    action: "soft_delete",
    vaultItemId: id,
    request: req,
  });

  return NextResponse.json({ ok: true });
}
