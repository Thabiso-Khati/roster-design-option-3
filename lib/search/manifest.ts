/**
 * Static route manifest — every navigable surface in the ROSTER app.
 * Used by the cmd-K Universal Search palette.
 *
 * Pulls in:
 *   • Top-level dashboard surfaces (Dashboard / Toolkit / Masterclasses / Experts / etc.)
 *   • Every contract from CONTRACT_REGISTRY (auto-flows so adding contracts there appears here)
 *   • Every Toolkit module from MODULES
 *   • Every "live tool" page in /dashboard/tools/
 */
import { CONTRACT_REGISTRY } from "@/lib/contracts/registry";
import { MODULES } from "@/lib/constants";

export type SearchEntryKind =
  | "page"
  | "contract"
  | "module"
  | "tool"
  | "settings";

export interface SearchEntry {
  id: string;
  kind: SearchEntryKind;
  title: string;
  description?: string;
  href: string;
  category: string;
  keywords?: string[];        // extra keywords to make matching forgiving
  icon?: string;              // lucide icon name (resolved client-side)
  color?: string;             // hex color for the icon background
}

// ── Top-level dashboard surfaces ────────────────────────────────────────
const TOP_LEVEL: SearchEntry[] = [
  { id: "dashboard",      kind: "page", title: "Dashboard",         description: "Home — at-a-glance overview of artists, reminders, scoring, and recent activity.",     href: "/dashboard",                category: "Navigate", icon: "LayoutDashboard", color: "#C9A84C", keywords: ["home", "overview"] },
  { id: "toolkit",        kind: "page", title: "Toolkit",           description: "All 15 modules — every contract, form, calculator, and tracker.",                       href: "/dashboard/library",        category: "Navigate", icon: "BookOpen",        color: "#C9A84C", keywords: ["library", "tools"] },
  { id: "masterclasses",  kind: "page", title: "Masterclasses",     description: "Video lessons across A&R, recording, marketing, sync, and the music business.",        href: "/dashboard/masterclasses",  category: "Learn",    icon: "Video",           color: "#8B5CF6" },
  { id: "experts",        kind: "page", title: "Book an Expert",    description: "Verified entertainment lawyers, music attorneys, mix engineers, sync supervisors.",     href: "/dashboard/experts",        category: "People",   icon: "Calendar",        color: "#10B981" },
  { id: "industry",       kind: "page", title: "Industry Directory",description: "Searchable directory of labels, distributors, PROs, festivals, brands, sync agencies.", href: "/dashboard/contacts",       category: "People",   icon: "Users2",          color: "#3B82F6" },
  { id: "bookings",       kind: "page", title: "My Bookings",       description: "Sessions you've booked with experts. Upcoming + history + receipts.",                  href: "/dashboard/bookings",       category: "Activity", icon: "ClipboardList",   color: "#8B5CF6" },
  { id: "signing",        kind: "page", title: "Signing Inbox",     description: "Every contract you've sent for signature with live status + audit trail.",             href: "/dashboard/signing",        category: "Activity", icon: "PenLine",         color: "#C9A84C", keywords: ["sign", "esign", "signature"] },
  { id: "expert-dash",    kind: "page", title: "Expert Dashboard",  description: "If you're a verified expert: your booking inbox, payouts, and profile.",                href: "/dashboard/expert",         category: "Navigate", icon: "Star",            color: "#F59E0B" },
  { id: "learn",          kind: "page", title: "Learn",             description: "Curated learning paths: A&R, recording, publishing, sync, legal, data.",                href: "/dashboard/learn",          category: "Learn",    icon: "GraduationCap",   color: "#06B6D4" },
  { id: "settings",       kind: "settings", title: "Settings",      description: "Account, locale, currency, notifications, exports.",                                    href: "/dashboard/settings",       category: "Settings", icon: "Settings",        color: "#94A3B8" },
];

// ── Module landing pages (auto from MODULES) ────────────────────────────
const MODULE_ENTRIES: SearchEntry[] = MODULES.map((m) => ({
  id: `module:${m.id}`,
  kind: "module" as const,
  title: m.title,
  description: m.description,
  href: `/dashboard/library/${m.slug}`,
  category: "Toolkit modules",
  color: m.color,
  keywords: [m.subtitle, ...(m.title.split(/\s+|,|&/).filter(Boolean))],
}));

// ── Contracts (auto from CONTRACT_REGISTRY) ─────────────────────────────
const CONTRACT_ENTRIES: SearchEntry[] = CONTRACT_REGISTRY.map((c) => ({
  id: `contract:${c.id}`,
  kind: "contract" as const,
  title: c.title,
  description: `${c.category} · ${c.shortDescription}`,
  href: c.route,
  category: "Contracts",
  color: c.parentColor,
  keywords: [c.contractType, c.parentModule, c.category, ...c.title.split(/\s+/)],
}));

// ── Live tools (curated — kept manually because they live under /dashboard/tools/) ─
const LIVE_TOOLS: SearchEntry[] = [
  { id: "tool:personal-budget",     kind: "tool", title: "Personal Budget Planner",       description: "Map personal income against every expense category.",                              href: "/dashboard/tools/personal-budget",     category: "Live tools", color: "#EF4444", icon: "Calculator" },
  { id: "tool:cashflow-forecast",   kind: "tool", title: "Cashflow Forecast",             description: "Plan expected cash position month by month, forecast vs actuals.",                href: "/dashboard/tools/cashflow-forecast",   category: "Live tools", color: "#F59E0B", icon: "DollarSign" },
  { id: "tool:invoice",             kind: "tool", title: "Invoice Generator",             description: "Tax-compliant invoice with automatic VAT calculation.",                            href: "/dashboard/tools/invoice",             category: "Live tools", color: "#6366F1", icon: "FileSpreadsheet" },
  { id: "tool:daily-bookkeeping",   kind: "tool", title: "Daily Bookkeeping Log",         description: "Record every transaction with VAT tracking and local tax categories.",            href: "/dashboard/tools/daily-bookkeeping",   category: "Live tools", color: "#10B981", icon: "Receipt" },
  { id: "tool:monthly-revenue",     kind: "tool", title: "Monthly Revenue Tracker",       description: "Track all income sources week by week across every month.",                       href: "/dashboard/tools/monthly-revenue",     category: "Live tools", color: "#EC4899", icon: "TrendingUp" },
  { id: "tool:artist-finances",     kind: "tool", title: "Artist Finances",               description: "Complete financial management — spend plan, sales tracker, 3-year overview.",     href: "/dashboard/tools/artist-finances",     category: "Live tools", color: "#06B6D4", icon: "Wallet" },
  { id: "tool:annual-pl",           kind: "tool", title: "Annual Profit & Loss",          description: "6-year income and expense tracker across every revenue category.",                 href: "/dashboard/tools/annual-pl",           category: "Live tools", color: "#8B5CF6", icon: "BarChart3" },
  { id: "tool:net-worth",           kind: "tool", title: "Net Worth Tracker",             description: "Track assets and liabilities at 30, 60, and 90-day intervals.",                    href: "/dashboard/tools/net-worth",           category: "Live tools", color: "#C9A84C", icon: "PiggyBank" },
  { id: "tool:tour-budget",         kind: "tool", title: "Tour Budget",                   description: "Per-show / per-leg cost modelling for live touring with breakeven math.",          href: "/dashboard/tools/tour-budget",         category: "Live tools", color: "#F59E0B", icon: "Plane" },
  { id: "tool:album-budget",        kind: "tool", title: "Album Budget",                  description: "Recording, mixing, mastering, vocal, production, marketing budget.",               href: "/dashboard/tools/album-budget",        category: "Live tools", color: "#10B981", icon: "Music" },
  { id: "tool:booking-advance",     kind: "tool", title: "Booking Advance Worksheet",     description: "Calculate the artist guarantee + door split + advance position pre-show.",         href: "/dashboard/tools/booking-advance",     category: "Live tools", color: "#F59E0B", icon: "Mic" },
  { id: "tool:asset-inventory",     kind: "tool", title: "Asset Inventory",               description: "Track every master, stem, photo, video, contract, master pack across artists.",   href: "/dashboard/tools/asset-inventory",     category: "Live tools", color: "#475569", icon: "Archive" },
  { id: "tool:dsp-pitching",        kind: "tool", title: "DSP Pitching Tracker",          description: "Pitch progress per release across Spotify, Apple, Boomplay, Audiomack, Tidal.",    href: "/dashboard/tools/dsp-pitching",        category: "Live tools", color: "#22D3EE", icon: "Target" },
  { id: "tool:fan-signup",          kind: "tool", title: "Fan Sign-up Form",              description: "Self-hosted fan signup that captures email + WhatsApp + first-party data.",        href: "/dashboard/tools/fan-signup",          category: "Live tools", color: "#EF4444", icon: "Users" },
  { id: "tool:industry-directory",  kind: "tool", title: "Industry Directory (live)",      description: "Filterable directory tool with bookmarks and recent contacts.",                    href: "/dashboard/tools/industry-directory",  category: "Live tools", color: "#3B82F6", icon: "Users2" },
  { id: "tool:marketing-forecast",  kind: "tool", title: "Marketing Forecast",            description: "Plan marketing spend by channel against expected reach + conversion.",             href: "/dashboard/tools/marketing-forecast",  category: "Live tools", color: "#8B5CF6", icon: "Megaphone" },
  { id: "tool:merch-revenue",       kind: "tool", title: "Merch Revenue Tracker",         description: "Sales by SKU, channel, and tour stop. Margin and inventory turn.",                href: "/dashboard/tools/merch-revenue",       category: "Live tools", color: "#FB923C", icon: "ShoppingBag" },
  { id: "tool:merch-sales",         kind: "tool", title: "Merch Sales Log",               description: "Per-show merch settlement: opening / closing inventory, cash, card, mobile.",      href: "/dashboard/tools/merch-sales",         category: "Live tools", color: "#FB923C", icon: "ShoppingCart" },
  { id: "tool:content-calendar",    kind: "tool", title: "Content Calendar",              description: "Plan social posts, drops, premieres across every channel and artist.",              href: "/dashboard/tools/content-calendar",    category: "Live tools", color: "#8B5CF6", icon: "Calendar" },
  { id: "tool:social-media-calendar", kind: "tool", title: "Social Media Calendar",       description: "Multi-artist, multi-platform editorial planner with assets and approvals.",        href: "/dashboard/tools/social-media-calendar", category: "Live tools", color: "#8B5CF6", icon: "Calendar" },
];

// ── Combined export ─────────────────────────────────────────────────────
export const SEARCH_MANIFEST: SearchEntry[] = [
  ...TOP_LEVEL,
  ...MODULE_ENTRIES,
  ...CONTRACT_ENTRIES,
  ...LIVE_TOOLS,
];

/** Lightweight client-side fuzzy match. */
export function matchesQuery(entry: SearchEntry, q: string): { score: number; matched: boolean } {
  const query = q.trim().toLowerCase();
  if (!query) return { score: 0, matched: true };

  const haystack = [
    entry.title,
    entry.description ?? "",
    entry.category,
    entry.kind,
    ...(entry.keywords ?? []),
  ].join(" ").toLowerCase();

  if (!haystack.includes(query)) {
    // Token-based fallback — match if all query words appear anywhere.
    const tokens = query.split(/\s+/).filter(Boolean);
    if (tokens.every((t) => haystack.includes(t))) {
      return { matched: true, score: 50 };
    }
    return { matched: false, score: 0 };
  }

  // Higher score for title hits, then exact category hits, then keyword hits.
  let score = 100;
  if (entry.title.toLowerCase().startsWith(query)) score += 100;
  else if (entry.title.toLowerCase().includes(query)) score += 50;
  if (entry.category.toLowerCase() === query) score += 25;
  return { matched: true, score };
}

export function searchManifest(query: string, limit = 15): SearchEntry[] {
  const scored = SEARCH_MANIFEST
    .map((e) => ({ entry: e, ...matchesQuery(e, query) }))
    .filter((s) => s.matched)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.entry);
}
