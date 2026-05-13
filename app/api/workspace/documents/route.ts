export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/workspace/documents
// GET  — list the authenticated user's workspace documents
//         (their own + workspace-level + custom-shared)
//         Also merges tool_snapshots so saved tools appear here.
// POST — create a new workspace document (ROSTER-native save)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Human-readable labels for tool slugs shown in Workspace
const TOOL_TITLES: Record<string, string> = {
  // Finance & Tax — /tools/
  "personal-budget":    "Personal Budget Planner",
  "cashflow-forecast":  "Cashflow Forecast",
  "daily-bookkeeping":  "Daily Bookkeeping Log",
  "annual-pl":          "Annual P&L",
  "artist-pl":          "Artist P&L",
  "artist-finances":    "Artist Finances",
  "monthly-revenue":    "Monthly Revenue",
  "net-worth":          "Net Worth Tracker",
  "booking-advance":    "Booking Advance Calculator",
  "album-budget":       "Album Budget",
  "invoice":            "Invoice Builder",
  // Finance — library
  "wht-tracker":                   "Withholding Tax Tracker",
  "royalty-calculator":            "Royalty Calculator",
  "advance-recoupment-tracker":    "Advance Recoupment Tracker",
  "recoupable-cost-tracker":       "Recoupable Cost Tracker",
  "royalty-statement-reconciliation": "Royalty Statement Reconciliation",
  "streaming-income-reconciliation":  "Streaming Income Reconciliation",
  "tour-merch-settlement":         "Tour Merch Settlement",
  "show-settlement-sheet":         "Show Settlement Sheet",
  "tour-settlement-master":        "Tour Settlement Master",
  "music-video-budget":            "Music Video Budget",
  "sync-quote-calculator":         "Sync Quote Calculator",
  // Marketing — /tools/
  "brand-studio":       "Brand Studio",
  "epk-builder":        "EPK Builder",
  "one-sheet":          "One Sheet",
  "routine-checklist":  "Routine Checklist",
  "content-calendar":   "Content Calendar",
  "posting-checklist":  "Posting Checklist",
  "marketing-forecast": "Marketing Forecast",
  "viral-hooks":        "Viral Hooks",
  "youtube-growth":     "YouTube Growth Planner",
  "pitching-scripts":   "Pitching Scripts",
  // Marketing — library
  "meta-ads-brief":                "Meta Ads Brief",
  "tour-sponsorship-deck":         "Tour Sponsorship Deck",
  "bandcamp-day-strategy":         "Bandcamp Day Strategy",
  "drop-capacity-planner":         "Drop Capacity Planner",
  "shopify-setup":                 "Shopify Setup",
  "awards-bio-pack":               "Awards Bio Pack",
  "awards-tracker":                "Awards Tracker",
  "press-release-templates":       "Press Release Templates",
  "quotes-library":                "Quotes Library",
  "sync-pitch-one-sheet":          "Sync Pitch One Sheet",
  "publisher-pitch-pager":         "Publisher Pitch Pager",
  // Touring — /tools/
  "tour-budget":        "Tour Budget",
  "tour-itinerary":     "Tour Itinerary",
  "tour-reference":     "Tour Reference",
  "run-sheet":          "Run Sheet",
  "personnel-record":   "Personnel Record",
  "promoter-agreement": "Promoter Agreement",
  // Touring — library
  "dj-set-submission":             "DJ Set Submission",
  "festival-application-pack":     "Festival Application Pack",
  "hospitality-rider":             "Hospitality Rider",
  "performance-rider":             "Performance Rider",
  "visa-travel-checklist":         "Visa Travel Checklist",
  // Recording — /tools/ (recording-level tools)
  "label-copy":         "Label Copy",
  "lyric-sheet":        "Lyric Sheet",
  "producer-agreement": "Producer Agreement",
  "release-checklist":  "Release Checklist",
  "sample-clearance":   "Sample Clearance",
  "session-song-form":  "Session Song Form",
  // Recording — library
  "atmos-spatial-brief":           "Atmos Spatial Brief",
  "daw-handoff":                   "DAW Handoff",
  "master-delivery-specs":         "Master Delivery Specs",
  "vocal-comp-sheet":              "Vocal Comp Sheet",
  // Merch
  "merch-revenue":      "Merch Revenue Tracker",
  "merch-sales":        "Merch Sales",
  "shipping-matrix":    "Shipping Matrix",
  "asset-inventory":    "Asset Inventory",
  "tour-merch-inventory":          "Tour Merch Inventory",
  // Publishing
  "co-writing-splits":  "Co-Writing Splits",
  "cover-mech-license":            "Cover Mech License",
  "cue-sheet":                     "Cue Sheet",
  "mlc-tracker":                   "MLC Tracker",
  "pro-membership-tracker":        "PRO Membership Tracker",
  "soundexchange-guide":           "SoundExchange Guide",
  // A&R / Startup
  "checklist":          "A&R Checklist",
  "competitor-set":     "Competitor Set",
  "song-metadata":      "Song Metadata",
  "ar-pipeline":                   "A&R Pipeline",
  "artist-scorecard":              "Artist Scorecard",
  "chart-performance":             "Chart Performance",
  "goal-setter":                   "Goal Setter",
  "service-provider-onboarding":   "Service Provider Onboarding",
  "songwriter-camp-hold-letter":   "Songwriter Camp Hold Letter",
  "songwriter-camp":               "Songwriter Camp",
  // Sync
  "sync-pitch-tracker":            "Sync Pitch Tracker",
  "sync-quote-letter":             "Sync Quote Letter",
  // Fan
  "fan-signup":         "Fan Sign-up",
  "release-targets":    "Release Targets",
  "email-marketing-calendar":      "Email Marketing Calendar",
  // Legal
  "copyright-tracker":             "Copyright Tracker",
  "trademark-tracker":             "Trademark Tracker",
  // Distribution
  "pitch-audit":                   "Pitch Audit",
  "pre-release-metadata-qc":       "Pre-Release Metadata QC",
  // Visual Production
  "cover-art-brief":               "Cover Art Brief",
  "cover-art-qc":                  "Cover Art QC",
  "music-video-brief":             "Music Video Brief",
  "music-video-call-sheet":        "Music Video Call Sheet",
  "music-video-treatment":         "Music Video Treatment",
  "vendor-database":               "Vendor Database",
};

// Map tool_slug to a Workspace doc_type category
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

// ── GET — list documents ──────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url      = new URL(req.url);
    const docType  = url.searchParams.get("type");
    const view     = url.searchParams.get("view");

    // ── 1. Own workspace_documents ───────────────────────────────
    let ownQuery = supabase
      .from("workspace_documents")
      .select(`
        id, title, doc_type, source_type, source_id,
        privacy, ai_summary, ai_tags, extraction_status,
        file_name, file_size_bytes,
        created_at, updated_at, last_accessed_at
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (docType && !docType.startsWith("tool_")) {
      ownQuery = ownQuery.eq("doc_type", docType);
    }

    const { data: ownDocs, error: ownErr } = await ownQuery;
    if (ownErr) {
      console.error("[workspace/documents GET] own docs error:", ownErr.message);
      // Don't hard-fail here — workspace_documents table might not exist yet.
      // Return the error details so callers can diagnose.
      return NextResponse.json({
        error: `workspace_documents unavailable: ${ownErr.message}`,
        hint:  "Run migration 041-workspace.sql in your Supabase SQL Editor.",
        documents: [],
      }, { status: 500 });
    }

    // ── 2. Tool snapshots ─────────────────────────────────────────
    // Use admin client (same as the save route) to guarantee the read
    // succeeds regardless of session/RLS propagation in the API context.
    const admin = createAdminClient();
    const isArchivedView = view === "archived";
    let snapshotQuery = admin
      .from("tool_snapshots")
      .select("id, tool_slug, title, updated_at, created_at, archived_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);

    // Archived view: only archived rows. All other views: only non-archived rows.
    if (isArchivedView) {
      snapshotQuery = snapshotQuery.not("archived_at", "is", null);
    } else {
      snapshotQuery = snapshotQuery.is("archived_at", null);
    }

    const { data: snapshots, error: snapshotErr } = await snapshotQuery;

    if (snapshotErr) {
      console.error("[workspace/documents GET] snapshot query error:", snapshotErr.message);
      // Surface this so callers can see the real problem instead of silent empty state.
      return NextResponse.json({
        error: `tool_snapshots unavailable: ${snapshotErr.message}`,
        hint:  "Run migration 042-tool-snapshots.sql in your Supabase SQL Editor.",
        documents: ownDocs ?? [],
      }, { status: 500 });
    }

    // Slugs that already have a workspace_documents mirror (shared tools).
    // For these we use the mirror (which carries the real privacy setting)
    // and drop the raw snapshot entry to avoid duplicates.
    const mirroredSlugs = new Set(
      (ownDocs ?? [])
        .filter(d => d.source_type === "tool_snapshots" && d.source_id)
        .map(d => d.source_id as string)
    );

    // Shape snapshots to match workspace_documents interface
    const snapshotDocs = (snapshots ?? [])
      .filter(s => !mirroredSlugs.has(s.tool_slug)) // skip if mirror already in ownDocs
      .map(s => ({
        id:               s.id,
        title:            s.title || TOOL_TITLES[s.tool_slug] || s.tool_slug,
        doc_type:         toolDocType(s.tool_slug),
        source_type:      "tool_snapshots" as string,
        source_id:        s.tool_slug,       // slug used as routing key
        privacy:          "private" as const,
        ai_summary:       null,
        ai_tags:          [] as string[],
        extraction_status:"not_applicable",
        file_name:        null,
        file_size_bytes:  null,
        created_at:       s.created_at,
        updated_at:       s.updated_at,
        last_accessed_at: null,
      }))
      .filter(s => !docType || s.doc_type === docType);

    // Archived view: return only archived snapshots
    if (isArchivedView) {
      return NextResponse.json({ documents: snapshotDocs });
    }

    if (view === "mine") {
      const all = mergeDedup([...(ownDocs ?? []), ...snapshotDocs]);
      return NextResponse.json({ documents: all });
    }

    // ── 3. Shared docs ────────────────────────────────────────────
    const { data: teamDocs } = await supabase
      .from("workspace_documents")
      .select(`
        id, title, doc_type, source_type, source_id,
        privacy, ai_summary, ai_tags, extraction_status,
        file_name, file_size_bytes,
        created_at, updated_at, last_accessed_at, user_id
      `)
      .eq("privacy", "workspace")
      .order("updated_at", { ascending: false })
      .limit(50);

    const { data: sharedRows } = await supabase
      .from("workspace_document_shares")
      .select("document_id, permission")
      .eq("shared_with_id", user.id);

    let customDocs: typeof ownDocs = [];
    if (sharedRows && sharedRows.length > 0) {
      const docIds = sharedRows.map(r => r.document_id);
      const { data: cd } = await supabase
        .from("workspace_documents")
        .select(`
          id, title, doc_type, source_type, source_id,
          privacy, ai_summary, ai_tags, extraction_status,
          file_name, file_size_bytes,
          created_at, updated_at, last_accessed_at
        `)
        .in("id", docIds)
        .order("updated_at", { ascending: false });
      customDocs = cd ?? [];
    }

    const sharedDocs = [
      ...(teamDocs ?? []).filter((d: { user_id: string }) => d.user_id !== user.id),
      ...customDocs,
    ];

    if (view === "shared") {
      return NextResponse.json({ documents: sharedDocs });
    }

    // All view: merge own docs + snapshots + shared
    const all = mergeDedup([
      ...(ownDocs ?? []),
      ...snapshotDocs,
      ...sharedDocs,
    ]);

    return NextResponse.json({ documents: all });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[workspace/documents GET] unhandled error:", message);
    return NextResponse.json({ error: message, documents: [] }, { status: 500 });
  }
}

function mergeDedup<T extends { id: string; updated_at: string }>(docs: T[]): T[] {
  const seen = new Set<string>();
  return docs
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; });
}

// ── POST — create document (ROSTER-native auto-save) ──────────
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    title:        string;
    doc_type:     string;
    source_type?: string;
    source_id?:   string;
    content?:     Record<string, unknown>;
    privacy?:     string;
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const validTypes = [
    "campaign_plan", "release_plan", "ai_draft",
    "marketing_budget", "upload_pdf", "upload_docx",
    "upload_xlsx", "upload_pptx", "upload_other",
    // Tool snapshot categories (used when promoting a snapshot to a workspace_documents share record)
    "tool_financial", "tool_marketing", "tool_touring", "tool_other",
  ];
  if (!validTypes.includes(body.doc_type)) {
    return NextResponse.json({ error: `invalid doc_type: ${body.doc_type}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("workspace_documents")
    .insert({
      user_id:     user.id,
      title:       body.title.trim(),
      doc_type:    body.doc_type,
      source_type: body.source_type ?? null,
      source_id:   body.source_id ?? null,
      content:     body.content ?? null,
      privacy:     body.privacy ?? "private",
      extraction_status: "not_applicable",
    })
    .select("id, title, doc_type, privacy, created_at")
    .single();

  if (error) {
    console.error("[workspace/documents POST] insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ document: data }, { status: 201 });
}
