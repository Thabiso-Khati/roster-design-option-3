export const dynamic = 'force-dynamic';

/**
 * GET /api/search?q=…
 * ───────────────────
 * Universal cross-artifact search for the authenticated user.
 *
 * Searches:
 *   • Artists                  — artists table
 *   • Bookings                 — recent bookings
 *   • Workspace events         — every tracked tool / form / contract touched
 *   • Signing requests         — contracts sent for signature
 *   • Contract templates       — static registry (lib/contracts/registry.ts)
 *   • Library tools / modules  — static MODULES (lib/constants.ts)
 *
 * Returns up to ~50 results grouped by type, lightweight + cached for the
 * cmd-K palette. Uses ILIKE for the dynamic tables — no FTS index required
 * for MVP.  We can swap to a Postgres FTS materialised view later if the
 * dataset grows past tens of thousands of rows.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CONTRACT_REGISTRY } from "@/lib/contracts/registry";
import { MODULES } from "@/lib/constants";

export const runtime = "nodejs";

export type SearchResultType =
  | "artist"
  | "booking"
  | "workspace-event"
  | "signing-request"
  | "contract-template"
  | "module"
  | "library-tool";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
  score?: number;
  meta?: Record<string, unknown>;
}

const PER_TYPE_LIMIT = 8;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const qRaw = url.searchParams.get("q") ?? "";
  const q = qRaw.trim();

  // Empty query → return curated "recents" instead.
  if (!q) {
    return NextResponse.json({ query: "", results: await loadRecents(supabase, user.id) });
  }

  if (q.length < 2) {
    return NextResponse.json({ query: q, results: [] });
  }

  const qLower = q.toLowerCase();
  const ilike = `%${q.replace(/[%_]/g, "")}%`;

  // ── 1. Static registries (no DB call) ─────────────────────────────
  const moduleHits: SearchResult[] = MODULES
    .filter((m) =>
      m.title.toLowerCase().includes(qLower) ||
      m.subtitle.toLowerCase().includes(qLower) ||
      m.description.toLowerCase().includes(qLower)
    )
    .slice(0, PER_TYPE_LIMIT)
    .map((m) => ({
      id: `module-${m.id}`,
      type: "module" as const,
      title: m.title,
      subtitle: `${m.subtitle} · ${m.description.slice(0, 80)}…`,
      href: `/dashboard/library/${m.slug}`,
    }));

  const contractHits: SearchResult[] = CONTRACT_REGISTRY
    .filter((c) =>
      c.title.toLowerCase().includes(qLower) ||
      c.contractType.toLowerCase().includes(qLower) ||
      c.shortDescription.toLowerCase().includes(qLower) ||
      c.parentModule.toLowerCase().includes(qLower)
    )
    .slice(0, PER_TYPE_LIMIT)
    .map((c) => ({
      id: `contract-${c.id}`,
      type: "contract-template" as const,
      title: c.title,
      subtitle: `${c.parentModule} · ${c.shortDescription}`,
      href: c.route,
    }));

  // ── 2. Database queries (parallel) ────────────────────────────────
  const [artistsRes, bookingsRes, eventsRes, signingRes] = await Promise.all([
    supabase
      .from("artists")
      .select("id, name, genre, country")
      .ilike("name", ilike)
      .limit(PER_TYPE_LIMIT),
    supabase
      .from("bookings")
      .select("id, scheduled_at, expert_id, status")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: false })
      .limit(50),
    supabase
      .from("workspace_events")
      .select("id, artifact_type, artifact_id, artifact_label, event_type, created_at")
      .eq("user_id", user.id)
      .ilike("artifact_label", ilike)
      .order("created_at", { ascending: false })
      .limit(PER_TYPE_LIMIT),
    supabase
      .from("signing_requests")
      .select("id, contract_title, contract_type, recipient_name, recipient_email, status")
      .eq("requester_user_id", user.id)
      .or(`contract_title.ilike.${ilike},recipient_name.ilike.${ilike},recipient_email.ilike.${ilike}`)
      .limit(PER_TYPE_LIMIT),
  ]);

  const artistHits: SearchResult[] = (artistsRes.data ?? []).map((r) => ({
    id: `artist-${r.id}`,
    type: "artist",
    title: (r as { name?: string }).name ?? "Untitled artist",
    subtitle: [(r as { genre?: string }).genre, (r as { country?: string }).country].filter(Boolean).join(" · "),
    href: `/dashboard/artists/${r.id}`,
  }));

  // Bookings query above doesn't search by text (no good searchable column without joins).
  // Filter client-side after the fetch.
  const bookingHits: SearchResult[] = (bookingsRes.data ?? [])
    .filter((b) => {
      const date = (b as { scheduled_at?: string }).scheduled_at ?? "";
      return date.toLowerCase().includes(qLower);
    })
    .slice(0, PER_TYPE_LIMIT)
    .map((b) => {
      const dt = new Date((b as { scheduled_at?: string }).scheduled_at ?? Date.now());
      return {
        id: `booking-${(b as { id: string }).id}`,
        type: "booking" as const,
        title: `Booking on ${dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
        subtitle: `Status: ${(b as { status?: string }).status ?? "—"}`,
        href: `/dashboard/bookings`,
      };
    });

  const eventHits: SearchResult[] = (eventsRes.data ?? []).map((r) => {
    const e = r as { id: string; artifact_type: string; artifact_id: string; artifact_label?: string; event_type: string; created_at: string };
    return {
      id: `event-${e.id}`,
      type: "workspace-event",
      title: e.artifact_label ?? e.artifact_id,
      subtitle: `${e.artifact_type} · last touched ${new Date(e.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
      href: deriveArtifactHref(e.artifact_type, e.artifact_id),
    };
  });

  const signingHits: SearchResult[] = (signingRes.data ?? []).map((r) => {
    const s = r as { id: string; contract_title: string; contract_type: string; recipient_name: string; recipient_email: string; status: string };
    return {
      id: `signing-${s.id}`,
      type: "signing-request",
      title: s.contract_title,
      subtitle: `${s.contract_type} · sent to ${s.recipient_name} · ${s.status}`,
      href: "/dashboard/signing",
    };
  });

  return NextResponse.json({
    query: q,
    results: {
      artists:           artistHits,
      bookings:          bookingHits,
      events:            eventHits,
      signing:           signingHits,
      contracts:         contractHits,
      modules:           moduleHits,
    },
  });
}

// ── helpers ────────────────────────────────────────────────────────
async function loadRecents(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("workspace_events")
    .select("id, artifact_type, artifact_id, artifact_label, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  const events: SearchResult[] = (data ?? []).map((r) => {
    const e = r as { id: string; artifact_type: string; artifact_id: string; artifact_label?: string; created_at: string };
    return {
      id: `event-${e.id}`,
      type: "workspace-event",
      title: e.artifact_label ?? e.artifact_id,
      subtitle: `${e.artifact_type} · ${new Date(e.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
      href: deriveArtifactHref(e.artifact_type, e.artifact_id),
    };
  });

  return {
    artists:   [],
    bookings:  [],
    events,
    signing:   [],
    contracts: [],
    modules:   [],
  };
}

function deriveArtifactHref(artifactType: string, artifactId: string): string {
  // Best-effort mapping for known artifact types. Falls back to home.
  const map: Record<string, string> = {
    "tour-budget":       `/dashboard/tools/tour-budget?id=${artifactId}`,
    "cashflow-forecast": `/dashboard/tools/cashflow-forecast?id=${artifactId}`,
    "annual-pl":         `/dashboard/tools/annual-pl?id=${artifactId}`,
    "personal-budget":   `/dashboard/tools/personal-budget?id=${artifactId}`,
    "invoice":           `/dashboard/tools/invoice?id=${artifactId}`,
    "monthly-revenue":   `/dashboard/tools/monthly-revenue?id=${artifactId}`,
    "artist-finances":   `/dashboard/tools/artist-finances?id=${artifactId}`,
    "net-worth":         `/dashboard/tools/net-worth?id=${artifactId}`,
    "release-targets":   `/dashboard/tools/release-targets?id=${artifactId}`,
    "daily-bookkeeping": `/dashboard/tools/daily-bookkeeping?id=${artifactId}`,
  };
  return map[artifactType] ?? "/dashboard";
}
