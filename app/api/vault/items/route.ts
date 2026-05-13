export const dynamic = 'force-dynamic';

/**
 * /api/vault/items
 * ────────────────
 *   GET  — list user's items (paginated, encrypted metadata, scoped via RLS).
 *   POST — create vault_items row after a successful Storage upload.
 *
 * On POST the client has already encrypted the file client-side and
 * uploaded the ciphertext to {user_id}/{vault_item_id}/... in Storage
 * via the signed URL from /api/vault/items/[id]/upload-url. POST here
 * persists the metadata + wrapped DEK that lets us decrypt later.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logVaultAudit } from "@/lib/vault/audit";
import { byteaToBase64, base64ToPgHex } from "@/lib/vault/bytea";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const PAGE_SIZE     = 20;
const MAX_PAGE_SIZE = 100;

const ALLOWED_CATEGORIES = new Set([
  "Contracts", "Masters", "Cover art", "EPK / press", "Visual assets",
  "Tax / financial", "Government / legal", "Touring", "Other",
]);

// ─── GET ────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page  = Math.max(0, parseInt(searchParams.get("page")  ?? "0", 10));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10)));
  const from  = page * limit;
  const to    = from + limit - 1;

  const { data, error, count } = await supabase
    .from("vault_items")
    .select(
      `id, artist_id, category, version, size_bytes, mime_type,
      storage_path, name_encrypted, name_iv, file_iv, wrapped_key,
      wrap_iv, notes_encrypted, notes_iv, created_at, updated_at`,
      { count: "exact" }
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    logger.error("[vault/items GET] error", {}, error);
    return NextResponse.json({ error: "Failed to list items" }, { status: 500 });
  }

  const items = (data ?? []).map((r) => ({
    id: r.id,
    artistId: r.artist_id,
    category: r.category,
    version: r.version,
    sizeBytes: r.size_bytes,
    mimeType: r.mime_type,
    storagePath: r.storage_path,
    nameEncrypted: byteaToBase64(r.name_encrypted),
    nameIv: byteaToBase64(r.name_iv),
    fileIv: byteaToBase64(r.file_iv),
    wrappedKey: byteaToBase64(r.wrapped_key),
    wrapIv: byteaToBase64(r.wrap_iv),
    notesEncrypted: byteaToBase64(r.notes_encrypted),
    notesIv: byteaToBase64(r.notes_iv),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return NextResponse.json({
    items,
    total:   count ?? 0,
    page,
    limit,
    hasMore: from + items.length < (count ?? 0),
  });
}

// ─── POST ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const required = [
    "id", "nameEncrypted", "nameIv", "fileIv", "wrappedKey", "wrapIv",
    "storagePath", "sizeBytes",
  ] as const;
  for (const f of required) {
    if (body[f] === undefined || body[f] === null || body[f] === "") {
      return NextResponse.json({ error: `Missing or invalid ${f}` }, { status: 400 });
    }
  }

  const category = typeof body.category === "string" && ALLOWED_CATEGORIES.has(body.category)
    ? (body.category as string)
    : "Other";

  // Check for existing item with same name to bump version
  let version = 1;
  if (typeof body.bumpVersionFrom === "string") {
    const { data: prior } = await supabase
      .from("vault_items")
      .select("version")
      .eq("user_id", user.id)
      .eq("id", body.bumpVersionFrom)
      .maybeSingle();
    if (prior?.version) version = prior.version + 1;
  }

  // Confirm storage_path begins with user_id (defence-in-depth — RLS already enforces)
  const storagePath = String(body.storagePath);
  if (!storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json(
      { error: "storagePath must be scoped to the authenticated user" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("vault_items")
    .insert({
      id: String(body.id),
      user_id: user.id,
      artist_id: typeof body.artistId === "string" ? body.artistId : null,
      name_encrypted: base64ToPgHex(body.nameEncrypted as string),
      name_iv: base64ToPgHex(body.nameIv as string),
      category,
      version,
      size_bytes: Number(body.sizeBytes) || 0,
      mime_type: typeof body.mimeType === "string" ? body.mimeType : "application/octet-stream",
      storage_path: storagePath,
      file_iv: base64ToPgHex(body.fileIv as string),
      wrapped_key: base64ToPgHex(body.wrappedKey as string),
      wrap_iv: base64ToPgHex(body.wrapIv as string),
      notes_encrypted: typeof body.notesEncrypted === "string" && body.notesEncrypted.length
        ? base64ToPgHex(body.notesEncrypted as string) : null,
      notes_iv: typeof body.notesIv === "string" && body.notesIv.length
        ? base64ToPgHex(body.notesIv as string) : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    logger.error("[vault/items POST] error", {}, error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }

  await logVaultAudit({
    userId: user.id,
    action: "upload",
    vaultItemId: data.id,
    metadata: { category, sizeBytes: Number(body.sizeBytes) || 0 },
    request: req,
  });

  return NextResponse.json({ id: data.id });
}
