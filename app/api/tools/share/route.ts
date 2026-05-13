export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/tools/share
// ------------------------------------------------------------
// POST — share a tool snapshot with workspace members.
//
//   body: {
//     slug:               string        (tool slug)
//     shareWithWorkspace: boolean       (true = all team members)
//     sharedWithUserIds?: string[]      (specific member_user_ids)
//   }
//
// Creates / updates a workspace_documents mirror record with the
// appropriate privacy setting so it surfaces in teammates'
// "Shared with me" tab via the existing workspace/documents route.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Derive doc_type from slug (mirrors toolDocType in workspace/documents)
function toolDocType(slug: string): string {
  const financial = [
    "personal-budget","cashflow-forecast","daily-bookkeeping","annual-pl",
    "artist-pl","artist-finances","monthly-revenue","net-worth",
    "booking-advance","album-budget","merch-revenue","merch-sales",
    "shipping-matrix","marketing-forecast","invoice",
    "wht-tracker","royalty-calculator","advance-recoupment-tracker",
    "recoupable-cost-tracker","royalty-statement-reconciliation",
    "streaming-income-reconciliation","tour-merch-settlement",
    "show-settlement-sheet","tour-settlement-master","music-video-budget",
    "sync-quote-calculator",
  ];
  const marketing = [
    "brand-studio","epk-builder","one-sheet","routine-checklist","content-calendar",
    "posting-checklist","viral-hooks","youtube-growth","pitching-scripts",
    "meta-ads-brief","tour-sponsorship-deck","bandcamp-day-strategy",
    "drop-capacity-planner","shopify-setup","awards-bio-pack","awards-tracker",
    "press-release-templates","quotes-library","sync-pitch-one-sheet",
    "publisher-pitch-pager","email-marketing-calendar",
  ];
  const touring = [
    "tour-budget","tour-itinerary","tour-reference","run-sheet",
    "personnel-record","promoter-agreement",
    "dj-set-submission","festival-application-pack","hospitality-rider",
    "performance-rider","visa-travel-checklist",
  ];
  if (financial.includes(slug)) return "tool_financial";
  if (marketing.includes(slug)) return "tool_marketing";
  if (touring.includes(slug))   return "tool_touring";
  return "tool_other";
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: { slug?: string; shareWithWorkspace?: boolean; sharedWithUserIds?: string[] };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { slug, shareWithWorkspace, sharedWithUserIds } = body;
  if (!slug?.trim()) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // ── 1. Load the snapshot to get its title ───────────────────
  const { data: snapshot } = await admin
    .from("tool_snapshots")
    .select("id, title, tool_slug")
    .eq("user_id", user.id)
    .eq("tool_slug", slug.trim())
    .maybeSingle();

  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found — save the tool first" }, { status: 404 });
  }

  const privacy = shareWithWorkspace ? "workspace" : (sharedWithUserIds?.length ? "custom" : "private");
  const doc_type = toolDocType(slug.trim());

  // ── 2. Upsert workspace_documents mirror ────────────────────
  // Use source_type + source_id + user_id as the natural key.
  // Check for existing record first.
  const { data: existing } = await supabase
    .from("workspace_documents")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_type", "tool_snapshots")
    .eq("source_id", slug.trim())
    .maybeSingle();

  let docId: string;

  if (existing) {
    // Update privacy on existing record
    const { data: updated, error: upErr } = await supabase
      .from("workspace_documents")
      .update({ privacy, doc_type, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("id")
      .single();
    if (upErr) {
      console.error("[tools/share] update error:", upErr.message);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
    docId = updated.id;
  } else {
    // Insert new workspace_documents mirror
    const { data: inserted, error: insErr } = await supabase
      .from("workspace_documents")
      .insert({
        user_id:          user.id,
        title:            snapshot.title,
        doc_type,
        source_type:      "tool_snapshots",
        source_id:        slug.trim(),
        privacy,
        extraction_status: "not_applicable",
      })
      .select("id")
      .single();
    if (insErr) {
      console.error("[tools/share] insert error:", insErr.message);
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    docId = inserted.id;
  }

  // ── 3. Specific user shares ──────────────────────────────────
  if (privacy === "custom" && sharedWithUserIds?.length) {
    // Remove existing shares first, then re-insert
    await supabase
      .from("workspace_document_shares")
      .delete()
      .eq("document_id", docId);

    const shareRows = sharedWithUserIds.map(uid => ({
      document_id:    docId,
      shared_with_id: uid,
      permission:     "view",
    }));
    const { error: shareErr } = await supabase
      .from("workspace_document_shares")
      .insert(shareRows);
    if (shareErr) {
      console.error("[tools/share] shares insert error:", shareErr.message);
    }
  }

  return NextResponse.json({ ok: true, docId, privacy });
}

// ── DELETE — unshare (revert to private) ─────────────────────
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  // Revert to private
  await supabase
    .from("workspace_documents")
    .update({ privacy: "private" })
    .eq("user_id", user.id)
    .eq("source_type", "tool_snapshots")
    .eq("source_id", slug);

  return NextResponse.json({ ok: true });
}
