"use client";
/**
 * ROSTER — Fan CRM
 * Full database-backed fan contact management:
 *  • Contacts tab  — searchable, filterable table, add/edit/delete
 *  • Import tab    — CSV paste or file upload with column detection
 *  • Segments tab  — create & manage audience lists
 *  • Templates tab — reusable broadcast message templates
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, Upload, Layers, MessageSquare, Plus, Trash2, Search,
  X, ChevronLeft, ChevronRight, Check, Download, Mail, Phone,
  Edit2, Save, RotateCcw, AlertCircle, Send, UserCircle2,
  CheckCircle2, XCircle, Clock, ChevronDown, Link2, Copy, ExternalLink, ToggleLeft, ToggleRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

interface FanContact {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
  province: string | null;
  country: string;
  source: string;
  show_name: string | null;
  tags: string[];
  popia_consent: boolean;
  popia_consent_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  color: string;
  member_count: number;
}

interface BroadcastTemplate {
  id: string;
  name: string;
  channel: "email" | "whatsapp" | "sms";
  subject: string | null;
  body: string;
  tags: string[];
  created_at: string;
}

type Tab = "contacts" | "import" | "segments" | "templates" | "campaigns" | "senders" | "optin";

interface OptInCampaign {
  id: string;
  name: string;
  slug: string;
  headline: string;
  description: string | null;
  artist_display_name: string;
  welcome_message: string | null;
  sender_profile_id: string | null;
  is_active: boolean;
  opt_in_count: number;
  created_at: string;
  sender_profile: { id: string; display_name: string } | null;
}

// ── Campaign types ───────────────────────────────────────────

interface SenderProfile {
  id: string;
  display_name: string;
  type: "artist" | "label" | "cobrand";
  email_from_name: string | null;
  email_reply_to: string | null;
  whatsapp_number: string | null;
}

interface Campaign {
  id: string;
  name: string;
  channel: "email" | "whatsapp";
  status: "draft" | "sending" | "sent" | "failed";
  subject: string | null;
  body: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  sent_at: string | null;
  created_at: string;
  sender_profile: { id: string; display_name: string } | null;
  segment: { id: string; name: string; color: string } | null;
}

const COLOR = "#C9A84C";
const SOURCES = ["all", "show", "import", "manual", "social", "other"] as const;

// ── Country → dial code map (Africa-first, then common) ──────
const COUNTRY_DIAL_CODES: Record<string, string> = {
  "South Africa":        "27",
  "Nigeria":             "234",
  "Kenya":               "254",
  "Ghana":               "233",
  "Tanzania":            "255",
  "Uganda":              "256",
  "Rwanda":              "250",
  "Ethiopia":            "251",
  "Zimbabwe":            "263",
  "Zambia":              "260",
  "Mozambique":          "258",
  "Namibia":             "264",
  "Botswana":            "267",
  "Malawi":              "265",
  "Senegal":             "221",
  "Ivory Coast":         "225",
  "Cameroon":            "237",
  "Angola":              "244",
  "DR Congo":            "243",
  "Egypt":               "20",
  "Morocco":             "212",
  "Algeria":             "213",
  "Tunisia":             "216",
  "United States":       "1",
  "United Kingdom":      "44",
  "Germany":             "49",
  "France":              "33",
  "Australia":           "61",
  "Brazil":              "55",
  "India":               "91",
  "Other":               "",
};

const COUNTRY_LIST = Object.keys(COUNTRY_DIAL_CODES);

/**
 * Normalise a WhatsApp number to E.164 format (+[country][number]).
 * Rules:
 *   - Already starts with "+"  → strip spaces/dashes, return as-is
 *   - Starts with "00"         → replace with "+"
 *   - Starts with "0"          → replace leading "0" with "+{dialCode}"
 *   - Bare digits              → prepend "+{dialCode}"
 * If dialCode is empty (unknown country) we just strip spaces and ensure "+".
 */
function toE164(raw: string, dialCode: string): string {
  const cleaned = raw.replace(/[\s\-().]/g, "");
  if (!cleaned) return cleaned;
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (dialCode) {
    if (cleaned.startsWith("0")) return `+${dialCode}${cleaned.slice(1)}`;
    return `+${dialCode}${cleaned}`;
  }
  return `+${cleaned}`;
}

// ── Helpers ──────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).filter(Boolean).map(line => {
    // Basic CSV parse (handles quoted fields with commas)
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes; continue; }
      if (line[i] === "," && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += line[i];
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

function exportToCSV(contacts: FanContact[]) {
  const headers = ["Name","Email","WhatsApp","City","Province","Country","Source","Show","POPIA Consent","Notes","Created"];
  const rows = contacts.map(c => [
    c.name, c.email ?? "", c.whatsapp ?? "", c.city ?? "", c.province ?? "",
    c.country, c.source, c.show_name ?? "",
    c.popia_consent ? "Yes" : "No", c.notes ?? "",
    new Date(c.created_at).toLocaleDateString(),
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "fan-contacts.csv"; a.click();
  URL.revokeObjectURL(url);
}

const CHANNEL_META = {
  email:    { label: "Email",    color: "#6366F1", bg: "rgba(99,102,241,0.10)" },
  whatsapp: { label: "WhatsApp", color: "#25D366", bg: "rgba(37,211,102,0.10)" },
  sms:      { label: "SMS",      color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
};

// ── Sub-components ───────────────────────────────────────────

function StatCard({ label, value, sub, onClick, active }: {
  label: string; value: number; sub?: string;
  onClick?: () => void; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`glass-card rounded-xl p-4 text-center w-full transition-all ${
        onClick ? "cursor-pointer hover:scale-[1.02] hover:border-brand/40" : "cursor-default"
      } ${active ? "ring-2 ring-brand/50 border-brand/30" : ""}`}
    >
      <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${active ? "text-brand" : "text-text-muted"}`}>{label}</p>
      <p className="text-2xl font-black text-text-primary">{value}</p>
      {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
      {onClick && <p className="text-[9px] text-text-muted/50 mt-1">{active ? "click to clear" : "click to filter"}</p>}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────

export default function FanCRMPage() {
  const [tab, setTab] = useState<Tab>("contacts");

  // Contacts state
  const [contacts, setContacts]   = useState<FanContact[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [consentFilter, setConsentFilter] = useState<"all"|"yes"|"no">("all");
  const [channelFilter, setChannelFilter] = useState<"all"|"email"|"whatsapp">("all");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // Add contact state
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState({
    name: "", email: "", whatsapp: "", city: "", province: "",
    country: "South Africa", source: "manual" as string, show_name: "", popia_consent: false, notes: "",
  });
  const [addSaving, setAddSaving]     = useState(false);
  const [sendWelcome, setSendWelcome] = useState(false);
  const [welcomeSenderId, setWelcomeSenderId] = useState("");

  // Edit contact state
  const [editContact, setEditContact] = useState<FanContact | null>(null);
  const [editForm, setEditForm]   = useState({
    name: "", email: "", whatsapp: "", city: "", province: "",
    country: "South Africa", source: "manual" as string, show_name: "", popia_consent: false, notes: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  // Import state
  const [csvText, setCsvText]     = useState("");
  const [importRows, setImportRows] = useState<Record<string, string>[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult]   = useState<{ imported: number; skipped: number } | null>(null);
  const [importError, setImportError]     = useState("");
  const fileRef                   = useRef<HTMLInputElement>(null);

  // Segments state
  const [segments, setSegments]   = useState<Segment[]>([]);
  const [segLoading, setSegLoading] = useState(false);
  const [newSegName, setNewSegName]   = useState("");
  const [newSegDesc, setNewSegDesc]   = useState("");
  const [newSegColor, setNewSegColor] = useState(COLOR);
  const [segSaving, setSegSaving] = useState(false);

  // Templates state
  const [templates, setTemplates]       = useState<BroadcastTemplate[]>([]);
  const [tplLoading, setTplLoading]     = useState(false);
  const [showNewTpl, setShowNewTpl]     = useState(false);
  const [newTpl, setNewTpl]             = useState({ name: "", channel: "whatsapp" as BroadcastTemplate["channel"], subject: "", body: "" });
  const [tplSaving, setTplSaving]       = useState(false);
  const [expandedTpl, setExpandedTpl]   = useState<string | null>(null);

  // Campaigns state
  const [campaigns, setCampaigns]       = useState<Campaign[]>([]);
  const [campLoading, setCampLoading]   = useState(false);
  const [sendingId, setSendingId]       = useState<string | null>(null);
  const [showNewCamp, setShowNewCamp]   = useState(false);
  const [newCamp, setNewCamp]           = useState({
    name: "", channel: "whatsapp" as "email" | "whatsapp",
    subject: "", body: "", sender_profile_id: "", segment_id: "",
  });
  const [campSaving, setCampSaving]     = useState(false);
  const [expandedCamp, setExpandedCamp] = useState<string | null>(null);

  // Sender profiles state
  const [senders, setSenders]           = useState<SenderProfile[]>([]);
  const [sendersLoading, setSendersLoading] = useState(false);
  const [showNewSender, setShowNewSender] = useState(false);
  const [newSender, setNewSender]       = useState({
    display_name: "", type: "artist" as SenderProfile["type"],
    email_from_name: "", email_reply_to: "", whatsapp_number: "",
  });
  const [senderSaving, setSenderSaving] = useState(false);

  // Opt-in campaigns state
  const [optinCampaigns, setOptinCampaigns] = useState<OptInCampaign[]>([]);
  const [optinLoading, setOptinLoading] = useState(false);
  const [showNewOptin, setShowNewOptin] = useState(false);
  const [newOptin, setNewOptin] = useState({
    name: "", slug: "", headline: "", description: "",
    artist_display_name: "", welcome_message: "", sender_profile_id: "", is_active: true,
  });
  const [optinSaving, setOptinSaving] = useState(false);
  const [copiedSlug, setCopiedSlug]   = useState<string | null>(null);

  const LIMIT = 50;

  // Initialise tab/form from URL params (?tab=import, ?showAdd=true).
  // window.location.search is used directly (not useSearchParams) because
  // useSearchParams() may return empty during the initial hydration cycle
  // in Next.js App Router dev mode.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") as Tab;
    const validTabs: Tab[] = ["contacts", "import", "segments", "templates"];
    if (tabParam && validTabs.includes(tabParam)) setTab(tabParam);
    if (params.get("showAdd") === "true") setShowAdd(true);
  }, []);

  // ── Data fetching ─────────────────────────────────────────

  const fetchContacts = useCallback(async (p = 1) => {
    setLoading(true); setError("");
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (search) params.set("q", search);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (consentFilter === "yes") params.set("popia_consent", "true");
    if (consentFilter === "no")  params.set("popia_consent", "false");
    if (channelFilter !== "all") params.set("has_channel", channelFilter);
    try {
      const r = await fetch(`/api/fan-contacts?${params}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to load contacts");
      setContacts(j.contacts);
      setTotal(j.total);
      setPage(p);
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [search, sourceFilter, consentFilter, channelFilter]);

  const fetchSegments = async () => {
    setSegLoading(true);
    const r = await fetch("/api/fan-contacts/segments");
    const j = await r.json();
    if (r.ok) setSegments(j.segments);
    setSegLoading(false);
  };

  const fetchTemplates = async () => {
    setTplLoading(true);
    const r = await fetch("/api/fan-contacts/templates");
    const j = await r.json();
    if (r.ok) setTemplates(j.templates);
    setTplLoading(false);
  };

  const fetchCampaigns = async () => {
    setCampLoading(true);
    const r = await fetch("/api/campaigns");
    const j = await r.json();
    if (r.ok) setCampaigns(j.campaigns ?? []);
    setCampLoading(false);
  };

  const fetchSenders = async () => {
    setSendersLoading(true);
    const r = await fetch("/api/sender-profiles");
    const j = await r.json();
    if (r.ok) setSenders(j.profiles ?? []);
    setSendersLoading(false);
  };

  const fetchOptinCampaigns = async () => {
    setOptinLoading(true);
    const r = await fetch("/api/optin/campaigns");
    const j = await r.json();
    if (r.ok) setOptinCampaigns(j.campaigns ?? []);
    setOptinLoading(false);
  };

  const handleCreateOptinCampaign = async () => {
    if (!newOptin.name.trim() || !newOptin.slug.trim() || !newOptin.artist_display_name.trim()) return;
    setOptinSaving(true);
    const r = await fetch("/api/optin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newOptin,
        sender_profile_id: newOptin.sender_profile_id || undefined,
        description: newOptin.description || undefined,
        welcome_message: newOptin.welcome_message || undefined,
      }),
    });
    const j = await r.json();
    if (r.ok) {
      setShowNewOptin(false);
      setNewOptin({ name: "", slug: "", headline: "", description: "", artist_display_name: "", welcome_message: "", sender_profile_id: "", is_active: true });
      fetchOptinCampaigns();
    } else {
      setError(j.error || "Failed to create opt-in link");
    }
    setOptinSaving(false);
  };

  const handleToggleOptin = async (id: string, is_active: boolean) => {
    await fetch(`/api/optin/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !is_active }),
    });
    fetchOptinCampaigns();
  };

  const copyOptinLink = (slug: string) => {
    const url = `${window.location.origin}/join/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  useEffect(() => { if (tab === "contacts") { fetchContacts(1); fetchSenders(); } }, [tab, fetchContacts]);
  useEffect(() => { if (tab === "segments") fetchSegments(); }, [tab]);
  useEffect(() => { if (tab === "templates") fetchTemplates(); }, [tab]);
  useEffect(() => { if (tab === "campaigns") { fetchCampaigns(); fetchSenders(); fetchSegments(); } }, [tab]);
  useEffect(() => { if (tab === "senders") fetchSenders(); }, [tab]);
  useEffect(() => { if (tab === "optin") { fetchOptinCampaigns(); fetchSenders(); } }, [tab]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { if (tab === "contacts") fetchContacts(1); }, 350);
    return () => clearTimeout(t);
  }, [search, sourceFilter, consentFilter, channelFilter, tab, fetchContacts]);

  // ── Contact actions ───────────────────────────────────────

  const handleAddContact = async () => {
    if (!addForm.name.trim()) return;
    setAddSaving(true);
    const dialCode = COUNTRY_DIAL_CODES[addForm.country] ?? "";
    const normalised = { ...addForm, whatsapp: addForm.whatsapp ? toE164(addForm.whatsapp, dialCode) : "" };
    const r = await fetch("/api/fan-contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalised),
    });
    const j = await r.json();
    if (r.ok) {
      // Optionally fire a welcome WhatsApp
      if (sendWelcome && normalised.whatsapp && normalised.popia_consent) {
        await fetch("/api/fan-contacts/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: normalised.name,
            whatsapp: normalised.whatsapp,
            sender_profile_id: welcomeSenderId || undefined,
          }),
        });
      }
      setShowAdd(false);
      setSendWelcome(false);
      setWelcomeSenderId("");
      setAddForm({ name: "", email: "", whatsapp: "", city: "", province: "", country: "South Africa", source: "manual", show_name: "", popia_consent: false, notes: "" });
      fetchContacts(1);
    } else {
      setError(j.error || "Failed to add contact");
    }
    setAddSaving(false);
  };

  const openEdit = (c: FanContact) => {
    setEditContact(c);
    setEditForm({
      name: c.name,
      email: c.email ?? "",
      whatsapp: c.whatsapp ?? "",
      city: c.city ?? "",
      province: c.province ?? "",
      country: c.country || "South Africa",
      source: c.source,
      show_name: c.show_name ?? "",
      popia_consent: c.popia_consent,
      notes: c.notes ?? "",
    });
  };

  const handleUpdateContact = async () => {
    if (!editContact || !editForm.name.trim()) return;
    setEditSaving(true);
    const dialCode = COUNTRY_DIAL_CODES[editForm.country] ?? "";
    const normalised = { ...editForm, whatsapp: editForm.whatsapp ? toE164(editForm.whatsapp, dialCode) : "" };
    const r = await fetch(`/api/fan-contacts/${editContact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalised),
    });
    const j = await r.json();
    if (r.ok) {
      setEditContact(null);
      fetchContacts(page);
    } else {
      setError(j.error || "Failed to update contact");
    }
    setEditSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this fan contact?")) return;
    await fetch(`/api/fan-contacts/${id}`, { method: "DELETE" });
    fetchContacts(page);
  };

  // ── Import actions ────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setImportRows(parseCSV(text));
    };
    reader.readAsText(file);
  };

  const handleParseCsv = () => {
    setImportRows(parseCSV(csvText));
  };

  const handleImport = async () => {
    if (importRows.length === 0) return;
    setImportLoading(true); setImportError(""); setImportResult(null);
    const r = await fetch("/api/fan-contacts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: importRows, source: "import" }),
    });
    const j = await r.json();
    if (r.ok) {
      setImportResult({ imported: j.imported, skipped: j.skipped });
      setCsvText(""); setImportRows([]);
      if (tab === "contacts") fetchContacts(1);
    } else {
      setImportError(j.error || "Import failed");
    }
    setImportLoading(false);
  };

  // ── Segment actions ───────────────────────────────────────

  const handleAddSegment = async () => {
    if (!newSegName.trim()) return;
    setSegSaving(true);
    const r = await fetch("/api/fan-contacts/segments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSegName, description: newSegDesc, color: newSegColor }),
    });
    if (r.ok) {
      setNewSegName(""); setNewSegDesc(""); setNewSegColor(COLOR);
      fetchSegments();
    }
    setSegSaving(false);
  };

  const handleDeleteSegment = async (id: string) => {
    if (!confirm("Delete this segment?")) return;
    await fetch(`/api/fan-contacts/segments/${id}`, { method: "DELETE" });
    fetchSegments();
  };

  // ── Template actions ──────────────────────────────────────

  const handleAddTemplate = async () => {
    if (!newTpl.name.trim() || !newTpl.body.trim()) return;
    setTplSaving(true);
    const r = await fetch("/api/fan-contacts/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTpl),
    });
    if (r.ok) {
      setShowNewTpl(false);
      setNewTpl({ name: "", channel: "whatsapp", subject: "", body: "" });
      fetchTemplates();
    }
    setTplSaving(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/fan-contacts/templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  };

  // ── Campaign actions ──────────────────────────────────────

  const handleCreateCampaign = async () => {
    if (!newCamp.name.trim() || !newCamp.body.trim()) return;
    setCampSaving(true);
    const r = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newCamp,
        sender_profile_id: newCamp.sender_profile_id || undefined,
        segment_id: newCamp.segment_id || undefined,
        subject: newCamp.channel === "email" ? newCamp.subject : undefined,
      }),
    });
    if (r.ok) {
      setShowNewCamp(false);
      setNewCamp({ name: "", channel: "whatsapp", subject: "", body: "", sender_profile_id: "", segment_id: "" });
      fetchCampaigns();
    }
    setCampSaving(false);
  };

  const handleCreateAndSendCampaign = async () => {
    if (!newCamp.name.trim() || !newCamp.body.trim()) return;
    if (!confirm("Create and send this campaign now? It will be delivered to all eligible fans immediately.")) return;
    setCampSaving(true);
    const r = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newCamp,
        sender_profile_id: newCamp.sender_profile_id || undefined,
        segment_id: newCamp.segment_id || undefined,
        subject: newCamp.channel === "email" ? newCamp.subject : undefined,
      }),
    });
    if (r.ok) {
      const created = await r.json();
      setShowNewCamp(false);
      setNewCamp({ name: "", channel: "whatsapp", subject: "", body: "", sender_profile_id: "", segment_id: "" });
      setCampSaving(false);
      fetchCampaigns();
      // Immediately dispatch
      if (created?.id) {
        setSendingId(created.id);
        const sr = await fetch(`/api/campaigns/${created.id}/send`, { method: "POST" });
        const sj = await sr.json();
        setSendingId(null);
        if (sr.ok) {
          alert(`✓ Sent to ${sj.sentCount} fans.${sj.failedCount > 0 ? ` ${sj.failedCount} failed.` : ""}`);
        } else {
          alert(`Campaign saved but send failed: ${sj.error}`);
        }
        fetchCampaigns();
      }
    } else {
      setCampSaving(false);
    }
  };

  const handleSendCampaign = async (id: string) => {
    if (!confirm("Send this campaign now? This will deliver to all eligible fans immediately.")) return;
    setSendingId(id);
    const r = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
    const j = await r.json();
    setSendingId(null);
    if (r.ok) {
      alert(`✓ Sent to ${j.sentCount} fans. ${j.failedCount > 0 ? `${j.failedCount} failed.` : ""}`);
      fetchCampaigns();
    } else {
      alert(`Send failed: ${j.error}`);
    }
  };

  // ── Sender profile actions ────────────────────────────────

  const handleCreateSender = async () => {
    if (!newSender.display_name.trim()) return;
    setSenderSaving(true);
    const r = await fetch("/api/sender-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newSender,
        email_from_name: newSender.email_from_name || undefined,
        email_reply_to: newSender.email_reply_to || undefined,
        whatsapp_number: newSender.whatsapp_number || undefined,
      }),
    });
    if (r.ok) {
      setShowNewSender(false);
      setNewSender({ display_name: "", type: "artist", email_from_name: "", email_reply_to: "", whatsapp_number: "" });
      fetchSenders();
    }
    setSenderSaving(false);
  };

  // ── Stats ─────────────────────────────────────────────────

  const consentCount = contacts.filter(c => c.popia_consent).length;
  const emailCount   = contacts.filter(c => c.email).length;
  const wpCount      = contacts.filter(c => c.whatsapp).length;

  const totalPages = Math.ceil(total / LIMIT);

  // ── Input helpers ─────────────────────────────────────────

  const inputCls = "w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors";

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="animate-fade-in max-w-6xl">

      {/* ── Header ── */}
      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${COLOR}15` }}>
            <Users size={26} style={{ color: COLOR }} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>
              Fan CRM · POPIA Ready · Cloud-Saved
            </p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Fan Contact Management</h1>
            <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
              Your first-party fan data — stored securely in your workspace, not the browser.
              Add fans manually, import from CSV, segment into lists, and draft broadcast messages.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => exportToCSV(contacts)}
              disabled={contacts.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border text-text-muted hover:text-text-primary hover:border-brand/40 transition-all disabled:opacity-40"
            >
              <Download size={13} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Fans" value={total}
          active={tab === "contacts" && consentFilter === "all" && channelFilter === "all" && sourceFilter === "all"}
          onClick={() => {
            setTab("contacts");
            setConsentFilter("all");
            setChannelFilter("all");
            setSourceFilter("all");
            setSearch("");
          }} />
        <StatCard label="POPIA Confirmed" value={consentCount}
          sub={`${total > 0 ? Math.round(consentCount / total * 100) : 0}% of total`}
          active={tab === "contacts" && consentFilter === "yes"}
          onClick={() => {
            setTab("contacts");
            setConsentFilter(consentFilter === "yes" ? "all" : "yes");
            setChannelFilter("all");
          }} />
        <StatCard label="With Email" value={emailCount}
          active={tab === "contacts" && channelFilter === "email"}
          onClick={() => {
            setTab("contacts");
            setChannelFilter(channelFilter === "email" ? "all" : "email");
            setConsentFilter("all");
          }} />
        <StatCard label="With WhatsApp" value={wpCount}
          active={tab === "contacts" && channelFilter === "whatsapp"}
          onClick={() => {
            setTab("contacts");
            setChannelFilter(channelFilter === "whatsapp" ? "all" : "whatsapp");
            setConsentFilter("all");
          }} />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 mb-5 border-b border-border overflow-x-auto">
        {(
          [
            { id: "contacts",  label: "Contacts",   icon: Users },
            { id: "import",    label: "Import CSV",  icon: Upload },
            { id: "segments",  label: "Segments",    icon: Layers },
            { id: "templates", label: "Templates",   icon: MessageSquare },
            { id: "campaigns", label: "Campaigns",   icon: Send },
            { id: "senders",   label: "Senders",     icon: UserCircle2 },
            { id: "optin",     label: "Opt-In Links", icon: Link2 },
          ] as { id: Tab; label: string; icon: React.ElementType }[]
        ).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap ${
              tab === id ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"
            }`}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* CONTACTS TAB                                        */}
      {/* ════════════════════════════════════════════════════ */}
      {tab === "contacts" && (
        <div>
          {/* Filter bar */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input className={`${inputCls} pl-9`} placeholder="Search name, email, WhatsApp, city…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  <X size={13} />
                </button>
              )}
            </div>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
              className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand min-w-[130px]">
              {SOURCES.map(s => <option key={s} value={s}>{s === "all" ? "All Sources" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select value={consentFilter} onChange={e => setConsentFilter(e.target.value as typeof consentFilter)}
              className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand min-w-[130px]">
              <option value="all">All Consent</option>
              <option value="yes">POPIA ✓ Only</option>
              <option value="no">No Consent</option>
            </select>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-background transition-all hover:opacity-80"
              style={{ backgroundColor: COLOR }}>
              <Plus size={14} />
              Add Fan
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-4 py-3 mb-4">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Add contact form */}
          {showAdd && (
            <div className="glass-card rounded-xl p-5 mb-4 border-brand/20" style={{ borderColor: `${COLOR}30` }}>
              <p className="text-sm font-black text-text-primary mb-4" style={{ color: COLOR }}>Add Fan Contact</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                <input className={inputCls} placeholder="Full name *" value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
                <input className={inputCls} placeholder="Email address" type="email" value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
                {/* WhatsApp + hint */}
                <div>
                  <input className={inputCls} value={addForm.whatsapp}
                    placeholder={COUNTRY_DIAL_CODES[addForm.country]
                      ? `e.g. +${COUNTRY_DIAL_CODES[addForm.country]} 71 000 0000`
                      : "e.g. +27 71 000 0000"}
                    onChange={e => setAddForm(f => ({ ...f, whatsapp: e.target.value }))} />
                  <p className="text-[10px] text-text-muted mt-1">
                    {addForm.whatsapp && !addForm.whatsapp.startsWith("+")
                      ? <span className="text-amber-400">⚠ Will auto-add +{COUNTRY_DIAL_CODES[addForm.country] || "?"} on save</span>
                      : "Include country code (e.g. +27 for SA)"}
                  </p>
                </div>
                {/* Country selector */}
                <select value={addForm.country}
                  onChange={e => setAddForm(f => ({ ...f, country: e.target.value }))}
                  className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand col-span-1">
                  {COUNTRY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className={inputCls} placeholder="City / Town" value={addForm.city}
                  onChange={e => setAddForm(f => ({ ...f, city: e.target.value }))} />
                <input className={inputCls} placeholder="Province / Region" value={addForm.province}
                  onChange={e => setAddForm(f => ({ ...f, province: e.target.value }))} />
                <input className={inputCls} placeholder="Show / Event name" value={addForm.show_name}
                  onChange={e => setAddForm(f => ({ ...f, show_name: e.target.value }))} />
              </div>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <select value={addForm.source} onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}
                  className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand">
                  {["show", "import", "manual", "social", "other"].map(s =>
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  )}
                </select>
                <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                  <input type="checkbox" checked={addForm.popia_consent}
                    onChange={e => setAddForm(f => ({ ...f, popia_consent: e.target.checked }))}
                    className="accent-brand w-4 h-4" />
                  <span className={addForm.popia_consent ? "text-success font-semibold" : ""}>POPIA Consent</span>
                </label>
              </div>

              {/* Welcome WhatsApp option — only show if WhatsApp number + POPIA consent given */}
              {addForm.popia_consent && addForm.whatsapp && (
                <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: `${COLOR}08`, borderColor: `${COLOR}25`, border: "1px solid" }}>
                  <label className="flex items-center gap-2 text-sm cursor-pointer mb-3">
                    <input type="checkbox" checked={sendWelcome} onChange={e => setSendWelcome(e.target.checked)}
                      className="accent-brand w-4 h-4" />
                    <span className={`font-semibold ${sendWelcome ? "" : "text-text-muted"}`} style={sendWelcome ? { color: COLOR } : {}}>
                      Send welcome WhatsApp now
                    </span>
                  </label>
                  {sendWelcome && (
                    <div>
                      <p className="text-[10px] text-text-muted mb-2">
                        Sends: <span className="text-text-primary italic">&ldquo;Hey [Fan Name]! Thanks for signing up. Reply STOP to unsubscribe.&rdquo;</span>
                      </p>
                      <select value={welcomeSenderId} onChange={e => setWelcomeSenderId(e.target.value)}
                        className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand w-full">
                        <option value="">Send from default ROSTER number</option>
                        {senders.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={handleAddContact} disabled={addSaving || !addForm.name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-background disabled:opacity-50 transition-all hover:opacity-80"
                  style={{ backgroundColor: COLOR }}>
                  {addSaving ? <RotateCcw size={13} className="animate-spin" /> : <Save size={13} />}
                  {sendWelcome && addForm.popia_consent && addForm.whatsapp ? "Save & Send Welcome" : "Save Contact"}
                </button>
                <button onClick={() => { setShowAdd(false); setSendWelcome(false); setWelcomeSenderId(""); }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-text-muted border border-border hover:border-text-muted transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Edit contact form */}
          {editContact && (
            <div className="glass-card rounded-xl p-5 mb-4" style={{ borderColor: `${COLOR}30` }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black" style={{ color: COLOR }}>Edit — {editContact.name}</p>
                <button onClick={() => setEditContact(null)} className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"><X size={14} /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                <input className={inputCls} placeholder="Full name *" value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                <input className={inputCls} placeholder="Email address" type="email" value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                <div>
                  <input className={inputCls} value={editForm.whatsapp}
                    placeholder={COUNTRY_DIAL_CODES[editForm.country]
                      ? `e.g. +${COUNTRY_DIAL_CODES[editForm.country]} 71 000 0000`
                      : "e.g. +27 71 000 0000"}
                    onChange={e => setEditForm(f => ({ ...f, whatsapp: e.target.value }))} />
                  <p className="text-[10px] text-text-muted mt-1">
                    {editForm.whatsapp && !editForm.whatsapp.startsWith("+")
                      ? <span className="text-amber-400">⚠ Will auto-add +{COUNTRY_DIAL_CODES[editForm.country] || "?"} on save</span>
                      : "Include country code (e.g. +27 for SA)"}
                  </p>
                </div>
                <select value={editForm.country}
                  onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))}
                  className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand col-span-1">
                  {COUNTRY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className={inputCls} placeholder="City / Town" value={editForm.city}
                  onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
                <input className={inputCls} placeholder="Province / Region" value={editForm.province}
                  onChange={e => setEditForm(f => ({ ...f, province: e.target.value }))} />
                <input className={inputCls} placeholder="Show / Event name" value={editForm.show_name}
                  onChange={e => setEditForm(f => ({ ...f, show_name: e.target.value }))} />
                <input className={`${inputCls} col-span-2`} placeholder="Notes" value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <select value={editForm.source} onChange={e => setEditForm(f => ({ ...f, source: e.target.value }))}
                  className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand">
                  {["show", "import", "manual", "social", "other"].map(s =>
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  )}
                </select>
                <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                  <input type="checkbox" checked={editForm.popia_consent}
                    onChange={e => setEditForm(f => ({ ...f, popia_consent: e.target.checked }))}
                    className="accent-brand w-4 h-4" />
                  <span className={editForm.popia_consent ? "text-success font-semibold" : ""}>POPIA Consent</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={handleUpdateContact} disabled={editSaving || !editForm.name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-background disabled:opacity-50 transition-all hover:opacity-80"
                  style={{ backgroundColor: COLOR }}>
                  {editSaving ? <RotateCcw size={13} className="animate-spin" /> : <Save size={13} />}
                  Save Changes
                </button>
                <button onClick={() => setEditContact(null)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-text-muted border border-border hover:border-text-muted transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="glass-card rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: 800 }}>
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    {["Name","Email / WhatsApp","Location","Source","Show","POPIA","Added",""].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-black uppercase tracking-wider text-text-muted text-[10px] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-text-muted">Loading…</td></tr>
                  ) : contacts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center">
                        <p className="text-2xl mb-2">👥</p>
                        <p className="text-sm font-semibold text-text-primary mb-1">No fans yet</p>
                        <p className="text-xs text-text-muted">Add fans manually or import from CSV.</p>
                      </td>
                    </tr>
                  ) : contacts.map((c, i) => (
                    <tr key={c.id} className={`border-b border-border last:border-0 group hover:bg-brand/5 transition-colors ${i % 2 === 1 ? "bg-surface-2/30" : ""}`}>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-text-primary">{c.name}</p>
                        {c.notes && <p className="text-[10px] text-text-muted truncate max-w-[130px]">{c.notes}</p>}
                      </td>
                      <td className="px-4 py-2.5">
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-text-muted hover:text-brand transition-colors mb-0.5">
                            <Mail size={10} />{c.email}
                          </a>
                        )}
                        {c.whatsapp && (
                          <span className="flex items-center gap-1 text-text-muted">
                            <Phone size={10} />{c.whatsapp}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-text-muted">
                        {[c.city, c.province, c.country].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ backgroundColor: `${COLOR}12`, color: COLOR }}>
                          {c.source}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-text-muted">{c.show_name || "—"}</td>
                      <td className="px-4 py-2.5 text-center">
                        {c.popia_consent
                          ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success/15 text-success"><Check size={10} /></span>
                          : <span className="text-text-muted text-[10px]">—</span>
                        }
                      </td>
                      <td className="px-4 py-2.5 text-text-muted whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                          <button onClick={() => openEdit(c)}
                            className="p-1 rounded text-text-muted hover:text-brand transition-colors"
                            title="Edit contact">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(c.id)}
                            className="p-1 rounded text-text-muted hover:text-error transition-colors"
                            title="Delete contact">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-text-muted mb-6">
              <span>{total} total · Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => fetchContacts(page - 1)}
                  className="p-2 rounded-lg border border-border hover:border-brand/40 disabled:opacity-30 transition-all">
                  <ChevronLeft size={14} />
                </button>
                <button disabled={page >= totalPages} onClick={() => fetchContacts(page + 1)}
                  className="p-2 rounded-lg border border-border hover:border-brand/40 disabled:opacity-30 transition-all">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* POPIA notice */}
          <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3"
            style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
            <span className="text-base flex-shrink-0">🔒</span>
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="font-semibold text-error">POPIA Notice:</span> The Protection of Personal Information Act (Act 4 of 2013) requires
              explicit consent before using fan data for marketing. Only fans with POPIA Consent checked may receive broadcast communications.
              Ensure fans can opt out at any time.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* IMPORT TAB                                          */}
      {/* ════════════════════════════════════════════════════ */}
      {tab === "import" && (
        <div>
          <div className="glass-card rounded-xl p-6 mb-5">
            <p className="text-sm font-black text-text-primary mb-1">Import from CSV</p>
            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Upload a CSV file or paste CSV text below. Recognised columns:
              <span className="font-mono text-brand mx-1">name</span>
              <span className="font-mono text-brand mx-1">email</span>
              <span className="font-mono text-brand mx-1">whatsapp</span>
              <span className="font-mono text-brand mx-1">city</span>
              <span className="font-mono text-brand mx-1">province</span>
              <span className="font-mono text-brand mx-1">country</span>
              <span className="font-mono text-brand mx-1">show</span>
              <span className="font-mono text-brand mx-1">consent</span>
              <span className="font-mono text-brand mx-1">notes</span>
              (case-insensitive). <em>name</em> is required; all others are optional.
            </p>

            {/* File upload */}
            <div className="flex items-center gap-3 mb-4">
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-border text-text-muted hover:text-text-primary hover:border-brand/40 transition-all">
                <Upload size={14} />
                Upload CSV file
              </button>
              <span className="text-xs text-text-muted">— or paste below —</span>
            </div>

            <textarea
              className={`${inputCls} font-mono text-[11px] h-36 resize-y mb-3`}
              placeholder={"name,email,whatsapp,city,consent\nThabo Nkosi,thabo@example.com,+27 81 234 5678,Johannesburg,yes\n…"}
              value={csvText}
              onChange={e => { setCsvText(e.target.value); setImportRows([]); }}
            />

            <div className="flex gap-2">
              <button onClick={handleParseCsv} disabled={!csvText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-border text-text-muted hover:text-text-primary hover:border-brand/40 disabled:opacity-40 transition-all">
                <Edit2 size={13} />
                Preview ({importRows.length} rows)
              </button>
              {importRows.length > 0 && (
                <button onClick={handleImport} disabled={importLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-background transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: COLOR }}>
                  {importLoading ? <RotateCcw size={13} className="animate-spin" /> : <Upload size={13} />}
                  Import {importRows.length} fans
                </button>
              )}
            </div>
          </div>

          {/* Import result */}
          {importResult && (
            <div className="flex items-center gap-3 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-4 py-3 mb-4">
              <Check size={14} />
              <span>
                <strong>{importResult.imported}</strong> fans imported successfully.
                {importResult.skipped > 0 && ` ${importResult.skipped} rows skipped (invalid).`}
              </span>
            </div>
          )}
          {importError && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-4 py-3 mb-4">
              <AlertCircle size={14} />{importError}
            </div>
          )}

          {/* Preview table */}
          {importRows.length > 0 && (
            <div className="glass-card rounded-xl overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>
                  Preview — first {Math.min(10, importRows.length)} of {importRows.length} rows
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-2">
                      {Object.keys(importRows[0]).map(h => (
                        <th key={h} className="px-4 py-2 text-left font-black uppercase tracking-wider text-text-muted text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className={`border-b border-border last:border-0 ${i % 2 ? "bg-surface-2/30" : ""}`}>
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-4 py-2 text-text-muted truncate max-w-[140px]">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* SEGMENTS TAB                                        */}
      {/* ════════════════════════════════════════════════════ */}
      {tab === "segments" && (
        <div>
          {/* New segment form */}
          <div className="glass-card rounded-xl p-5 mb-5">
            <p className="text-sm font-black text-text-primary mb-3">Create Segment / List</p>
            <div className="flex flex-wrap gap-3 items-end">
              <input className={`${inputCls} flex-1 min-w-[180px]`} placeholder="Segment name (e.g. VIP fans, Joburg audience)"
                value={newSegName} onChange={e => setNewSegName(e.target.value)} />
              <input className={`${inputCls} flex-1 min-w-[180px]`} placeholder="Description (optional)"
                value={newSegDesc} onChange={e => setNewSegDesc(e.target.value)} />
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted">Colour</label>
                <input type="color" value={newSegColor} onChange={e => setNewSegColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent" />
              </div>
              <button onClick={handleAddSegment} disabled={segSaving || !newSegName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-background disabled:opacity-40 transition-all hover:opacity-80"
                style={{ backgroundColor: COLOR }}>
                {segSaving ? <RotateCcw size={13} className="animate-spin" /> : <Plus size={13} />}
                Create
              </button>
            </div>
          </div>

          {/* Segments list */}
          {segLoading ? (
            <p className="text-sm text-text-muted text-center py-8">Loading…</p>
          ) : segments.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm font-semibold text-text-primary mb-1">No segments yet</p>
              <p className="text-xs text-text-muted">Create your first audience segment above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {segments.map(seg => (
                <div key={seg.id} className="glass-card rounded-xl p-5 flex items-start justify-between gap-3 group">
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: seg.color }} />
                    <div>
                      <p className="font-bold text-sm text-text-primary">{seg.name}</p>
                      {seg.description && <p className="text-xs text-text-muted mt-0.5">{seg.description}</p>}
                      <p className="text-xs font-semibold mt-1.5" style={{ color: seg.color }}>
                        {seg.member_count} {seg.member_count === 1 ? "member" : "members"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteSegment(seg.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-text-muted hover:text-error transition-all flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="glass-card rounded-xl p-4 flex items-start gap-3"
            style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}06` }}>
            <span className="text-sm flex-shrink-0">💡</span>
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="font-semibold" style={{ color: COLOR }}>How to add fans to a segment:</span> Select fans
              in the Contacts tab, then use the bulk-action menu to assign them to a segment. Segments are used to
              target broadcast messages to specific audiences.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* TEMPLATES TAB                                       */}
      {/* ════════════════════════════════════════════════════ */}
      {tab === "templates" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-muted">
              Reusable broadcast templates. Use <span className="font-mono text-brand text-xs">[Fan Name]</span>,{" "}
              <span className="font-mono text-brand text-xs">[Artist Name]</span>,{" "}
              <span className="font-mono text-brand text-xs">[Track Title]</span> as placeholders.
            </p>
            <button onClick={() => setShowNewTpl(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-background transition-all hover:opacity-80"
              style={{ backgroundColor: COLOR }}>
              <Plus size={14} />
              New Template
            </button>
          </div>

          {/* New template form */}
          {showNewTpl && (
            <div className="glass-card rounded-xl p-5 mb-5" style={{ borderColor: `${COLOR}30` }}>
              <p className="text-sm font-black mb-4" style={{ color: COLOR }}>New Broadcast Template</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input className={inputCls} placeholder="Template name *" value={newTpl.name}
                  onChange={e => setNewTpl(t => ({ ...t, name: e.target.value }))} />
                <select value={newTpl.channel} onChange={e => setNewTpl(t => ({ ...t, channel: e.target.value as BroadcastTemplate["channel"] }))}
                  className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              {newTpl.channel === "email" && (
                <input className={`${inputCls} mb-3`} placeholder="Email subject line" value={newTpl.subject}
                  onChange={e => setNewTpl(t => ({ ...t, subject: e.target.value }))} />
              )}
              <textarea className={`${inputCls} h-28 resize-y mb-3`}
                placeholder="Message body — use [Fan Name], [Artist Name] etc. as placeholders"
                value={newTpl.body} onChange={e => setNewTpl(t => ({ ...t, body: e.target.value }))} />
              <div className="flex gap-2">
                <button onClick={handleAddTemplate} disabled={tplSaving || !newTpl.name || !newTpl.body}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-background disabled:opacity-40 hover:opacity-80 transition-all"
                  style={{ backgroundColor: COLOR }}>
                  {tplSaving ? <RotateCcw size={13} className="animate-spin" /> : <Save size={13} />}
                  Save Template
                </button>
                <button onClick={() => setShowNewTpl(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-text-muted border border-border hover:border-text-muted transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Templates list */}
          {tplLoading ? (
            <p className="text-sm text-text-muted text-center py-8">Loading…</p>
          ) : (
            <div className="space-y-3 mb-6">
              {templates.map(tpl => {
                const meta = CHANNEL_META[tpl.channel];
                const isExpanded = expandedTpl === tpl.id;
                return (
                  <div key={tpl.id} className="glass-card rounded-xl overflow-hidden group">
                    <button
                      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-brand/5 transition-colors"
                      onClick={() => setExpandedTpl(isExpanded ? null : tpl.id)}
                    >
                      <span className="text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0"
                        style={{ color: meta.color, backgroundColor: meta.bg }}>
                        {meta.label}
                      </span>
                      <span className="flex-1 text-sm font-semibold text-text-primary">{tpl.name}</span>
                      {tpl.subject && (
                        <span className="text-xs text-text-muted italic truncate max-w-[250px]">{tpl.subject}</span>
                      )}
                      <ChevronRight size={14} className={`text-text-muted transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-4 border-t border-border">
                        {tpl.subject && (
                          <p className="text-xs text-text-muted mb-2">
                            <span className="font-semibold">Subject:</span> {tpl.subject}
                          </p>
                        )}
                        <pre className="text-xs text-text-muted bg-surface-2 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed mb-3">
                          {tpl.body}
                        </pre>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { navigator.clipboard.writeText(tpl.body); }}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary hover:border-brand/40 transition-all">
                            Copy body
                          </button>
                          <button onClick={() => handleDeleteTemplate(tpl.id)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-error hover:border-error/30 transition-all ml-auto opacity-0 group-hover:opacity-100">
                            <Trash2 size={11} />Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* CAMPAIGNS TAB                                       */}
      {/* ════════════════════════════════════════════════════ */}
      {tab === "campaigns" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-muted">
              Send email or WhatsApp broadcasts to your fans.{" "}
              Use <span className="font-mono text-brand text-xs">[Fan Name]</span>,{" "}
              <span className="font-mono text-brand text-xs">[Artist Name]</span> as placeholders.
              Only fans with POPIA consent will receive messages.
            </p>
            <button onClick={() => setShowNewCamp(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-background transition-all hover:opacity-80 flex-shrink-0"
              style={{ backgroundColor: COLOR }}>
              <Plus size={14} />
              New Campaign
            </button>
          </div>

          {/* No senders hint */}
          {senders.length === 0 && !sendersLoading && (
            <div className="glass-card rounded-xl p-4 mb-4 flex items-center gap-3"
              style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}08` }}>
              <UserCircle2 size={16} style={{ color: COLOR }} className="flex-shrink-0" />
              <p className="text-xs text-text-muted leading-relaxed">
                <span className="font-semibold" style={{ color: COLOR }}>Set up a Sender Profile first</span> — go to the{" "}
                <button onClick={() => setTab("senders")}
                  className="underline font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: COLOR }}>
                  Senders tab
                </button>{" "}
                to create an artist or label identity for your campaigns.
              </p>
            </div>
          )}

          {/* New campaign form */}
          {showNewCamp && (
            <div className="glass-card rounded-xl p-5 mb-5" style={{ borderColor: `${COLOR}30` }}>
              <p className="text-sm font-black mb-4" style={{ color: COLOR }}>New Campaign</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input className={inputCls} placeholder="Campaign name *"
                  value={newCamp.name} onChange={e => setNewCamp(c => ({ ...c, name: e.target.value }))} />
                <select value={newCamp.channel}
                  onChange={e => setNewCamp(c => ({ ...c, channel: e.target.value as "email" | "whatsapp" }))}
                  className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <select value={newCamp.sender_profile_id}
                  onChange={e => setNewCamp(c => ({ ...c, sender_profile_id: e.target.value }))}
                  className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand">
                  <option value="">No sender profile</option>
                  {senders.map(s => <option key={s.id} value={s.id}>{s.display_name} ({s.type})</option>)}
                </select>
                <select value={newCamp.segment_id}
                  onChange={e => setNewCamp(c => ({ ...c, segment_id: e.target.value }))}
                  className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand">
                  <option value="">All fans (POPIA consented)</option>
                  {segments.map(s => <option key={s.id} value={s.id}>{s.name} ({s.member_count})</option>)}
                </select>
              </div>
              {newCamp.channel === "email" && (
                <input className={`${inputCls} mb-3`} placeholder="Email subject line"
                  value={newCamp.subject} onChange={e => setNewCamp(c => ({ ...c, subject: e.target.value }))} />
              )}
              {/* Body + live preview side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">Message body</p>
                  <textarea className={`${inputCls} h-36 resize-y`}
                    placeholder="Message body — use [Fan Name], [Artist Name] as personalisation tokens"
                    value={newCamp.body} onChange={e => setNewCamp(c => ({ ...c, body: e.target.value }))} />
                </div>
                {/* Live preview */}
                {newCamp.body.trim() && (() => {
                  const selectedSender = senders.find(s => s.id === newCamp.sender_profile_id);
                  const fromName = selectedSender?.display_name ?? "ROSTER";
                  const preview = newCamp.body
                    .replace(/\[Fan Name\]/g, "Thabo")
                    .replace(/\[Artist Name\]/g, fromName);
                  const wpPreview = preview.trimStart().startsWith(fromName)
                    ? preview
                    : `*${fromName}:*\n\n${preview}`;
                  const emailFrom = selectedSender?.email_from_name
                    ? selectedSender.email_from_name
                    : selectedSender
                      ? `${fromName} via ROSTER`
                      : "ROSTER";
                  return (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                        Preview — fan sees this
                      </p>
                      {newCamp.channel === "whatsapp" ? (
                        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#0B141A" }}>
                          {/* WhatsApp chrome */}
                          <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: "#1F2C34" }}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: "#25D366" }}>R</div>
                            <div>
                              <p className="text-[11px] font-semibold text-white leading-none">ROSTER</p>
                              <p className="text-[9px] text-gray-400">WhatsApp Business</p>
                            </div>
                          </div>
                          {/* Bubble */}
                          <div className="p-3">
                            <div className="rounded-lg rounded-tl-none p-3 max-w-[85%]" style={{ backgroundColor: "#1F2C34" }}>
                              <p className="text-[12px] leading-relaxed whitespace-pre-wrap"
                                style={{ color: "#E9EDF0", fontFamily: "system-ui" }}>
                                {wpPreview.replace(/\*(.*?)\*/g, "$1")}
                              </p>
                              <p className="text-[9px] text-right mt-1" style={{ color: "#8696A0" }}>now ✓✓</p>
                            </div>
                          </div>
                          <p className="text-[9px] text-center pb-2" style={{ color: "#8696A0" }}>
                            First line shown in bold on device
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-border overflow-hidden bg-surface-2">
                          {/* Email chrome */}
                          <div className="px-3 py-2 border-b border-border bg-surface-2">
                            <p className="text-[10px] text-text-muted">
                              <span className="font-semibold">From:</span>{" "}
                              <span className="text-text-primary">{emailFrom}</span>
                              <span className="text-text-muted"> &lt;noreply@rosterapp.ai&gt;</span>
                            </p>
                            {newCamp.subject && (
                              <p className="text-[10px] text-text-muted mt-0.5">
                                <span className="font-semibold">Subject:</span>{" "}
                                <span className="text-text-primary">
                                  {newCamp.subject.replace(/\[Fan Name\]/g, "Thabo").replace(/\[Artist Name\]/g, fromName)}
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="px-3 py-2.5">
                            <p className="text-[12px] text-text-muted leading-relaxed whitespace-pre-wrap">{preview}</p>
                          </div>
                        </div>
                      )}
                      <p className="text-[9px] text-text-muted mt-1 italic">
                        Sample shows [Fan Name] → Thabo
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={handleCreateAndSendCampaign}
                  disabled={campSaving || !newCamp.name.trim() || !newCamp.body.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-background disabled:opacity-40 hover:opacity-80 transition-all"
                  style={{ backgroundColor: COLOR }}>
                  {campSaving ? <RotateCcw size={13} className="animate-spin" /> : <Send size={13} />}
                  Save &amp; Send
                </button>
                <button onClick={handleCreateCampaign}
                  disabled={campSaving || !newCamp.name.trim() || !newCamp.body.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-border text-text-primary disabled:opacity-40 hover:border-text-muted transition-all">
                  {campSaving ? <RotateCcw size={13} className="animate-spin" /> : <Save size={13} />}
                  Save as Draft
                </button>
                <button onClick={() => setShowNewCamp(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-text-muted border border-border hover:border-text-muted transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Campaign list */}
          {campLoading ? (
            <p className="text-sm text-text-muted text-center py-8">Loading campaigns…</p>
          ) : campaigns.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-3xl mb-3">📣</p>
              <p className="text-sm font-semibold text-text-primary mb-1">No campaigns yet</p>
              <p className="text-xs text-text-muted">Create your first broadcast campaign above.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {campaigns.map(camp => {
                const isExpanded = expandedCamp === camp.id;
                const isSending  = sendingId === camp.id;
                const chMeta     = CHANNEL_META[camp.channel];
                const statusMeta: Record<Campaign["status"], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
                  draft:   { label: "Draft",   color: "#94a3b8", bg: "rgba(148,163,184,0.10)", icon: <Clock size={10} /> },
                  sending: { label: "Sending", color: COLOR,     bg: `${COLOR}18`,             icon: <RotateCcw size={10} className="animate-spin" /> },
                  sent:    { label: "Sent",    color: "#22c55e", bg: "rgba(34,197,94,0.10)",   icon: <CheckCircle2 size={10} /> },
                  failed:  { label: "Failed",  color: "#ef4444", bg: "rgba(239,68,68,0.10)",   icon: <XCircle size={10} /> },
                };
                const sm = statusMeta[camp.status];
                return (
                  <div key={camp.id} className="glass-card rounded-xl overflow-hidden group">
                    <div className="flex items-center gap-3 px-5 py-4">
                      {/* Channel badge */}
                      <span className="text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0"
                        style={{ color: chMeta.color, backgroundColor: chMeta.bg }}>
                        {chMeta.label}
                      </span>
                      {/* Name + sender */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{camp.name}</p>
                        <p className="text-[10px] text-text-muted truncate">
                          {camp.sender_profile?.display_name ?? "No sender"}{" "}
                          {camp.segment ? `· ${camp.segment.name}` : "· All fans"}
                        </p>
                      </div>
                      {/* Status badge */}
                      <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0"
                        style={{ color: sm.color, backgroundColor: sm.bg }}>
                        {sm.icon}{sm.label}
                      </span>
                      {/* Send button (draft only) */}
                      {camp.status === "draft" && (
                        <button onClick={() => handleSendCampaign(camp.id)} disabled={isSending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-background disabled:opacity-50 hover:opacity-80 transition-all flex-shrink-0"
                          style={{ backgroundColor: COLOR }}>
                          {isSending ? <RotateCcw size={11} className="animate-spin" /> : <Send size={11} />}
                          {isSending ? "Sending…" : "Send now"}
                        </button>
                      )}
                      {/* Sent stats */}
                      {camp.status === "sent" && (
                        <span className="text-[10px] text-text-muted flex-shrink-0">
                          {camp.sent_count}/{camp.total_recipients} delivered
                          {camp.failed_count > 0 && ` · ${camp.failed_count} failed`}
                        </span>
                      )}
                      {/* Expand toggle */}
                      <button onClick={() => setExpandedCamp(isExpanded ? null : camp.id)}
                        className="p-1 rounded text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
                        <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="px-5 pb-4 border-t border-border">
                        {camp.subject && (
                          <p className="text-xs text-text-muted mt-3 mb-1">
                            <span className="font-semibold">Subject:</span> {camp.subject}
                          </p>
                        )}
                        <pre className="text-xs text-text-muted bg-surface-2 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed mt-3">
                          {camp.body}
                        </pre>
                        {camp.status === "sent" && (
                          <div className="flex gap-4 mt-3 text-xs text-text-muted">
                            <span className="text-success font-semibold">✓ {camp.sent_count} sent</span>
                            {camp.failed_count > 0 && <span className="text-error font-semibold">✗ {camp.failed_count} failed</span>}
                            {camp.sent_at && <span>Sent {new Date(camp.sent_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                          </div>
                        )}
                        <p className="text-[10px] text-text-muted mt-2">
                          Created {new Date(camp.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* POPIA reminder */}
          <div className="glass-card rounded-xl p-4 flex items-start gap-3"
            style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
            <span className="text-base flex-shrink-0">🔒</span>
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="font-semibold text-error">POPIA guard active:</span> Campaigns only reach fans
              with explicit POPIA consent. Fans can opt out by replying STOP to WhatsApp messages or the
              unsubscribe footer in emails.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* SENDERS TAB                                         */}
      {/* ════════════════════════════════════════════════════ */}
      {tab === "senders" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-muted">
              Sender profiles define who a campaign comes from — your artist name, a label identity
              (Def Jam, Hype Records), or a co-branded identity. Each profile can have separate
              email and WhatsApp configurations.
            </p>
            <button onClick={() => setShowNewSender(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-background transition-all hover:opacity-80 flex-shrink-0"
              style={{ backgroundColor: COLOR }}>
              <Plus size={14} />
              New Sender
            </button>
          </div>

          {/* New sender form */}
          {showNewSender && (
            <div className="glass-card rounded-xl p-5 mb-5" style={{ borderColor: `${COLOR}30` }}>
              <p className="text-sm font-black mb-4" style={{ color: COLOR }}>New Sender Profile</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input className={inputCls} placeholder="Display name * (e.g. Thabiso, Hype Records)"
                  value={newSender.display_name}
                  onChange={e => setNewSender(s => ({ ...s, display_name: e.target.value }))} />
                <select value={newSender.type}
                  onChange={e => setNewSender(s => ({ ...s, type: e.target.value as SenderProfile["type"] }))}
                  className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand">
                  <option value="artist">Artist</option>
                  <option value="label">Label</option>
                  <option value="cobrand">Co-brand</option>
                </select>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2 mt-1">Email settings</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input className={inputCls} placeholder="From name (e.g. Thabiso via ROSTER)"
                  value={newSender.email_from_name}
                  onChange={e => setNewSender(s => ({ ...s, email_from_name: e.target.value }))} />
                <input className={inputCls} placeholder="Reply-to email address" type="email"
                  value={newSender.email_reply_to}
                  onChange={e => setNewSender(s => ({ ...s, email_reply_to: e.target.value }))} />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">WhatsApp settings</p>
              <div className="mb-4">
                <input className={inputCls} placeholder="WhatsApp Business number (e.g. +27 71 000 0000)"
                  value={newSender.whatsapp_number}
                  onChange={e => setNewSender(s => ({ ...s, whatsapp_number: e.target.value }))} />
                <p className="text-[10px] text-text-muted mt-1">
                  Optional. Leave blank to use the ROSTER shared WhatsApp number.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateSender}
                  disabled={senderSaving || !newSender.display_name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-background disabled:opacity-40 hover:opacity-80 transition-all"
                  style={{ backgroundColor: COLOR }}>
                  {senderSaving ? <RotateCcw size={13} className="animate-spin" /> : <Save size={13} />}
                  Save Sender
                </button>
                <button onClick={() => setShowNewSender(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-text-muted border border-border hover:border-text-muted transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Senders grid */}
          {sendersLoading ? (
            <p className="text-sm text-text-muted text-center py-8">Loading…</p>
          ) : senders.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-3xl mb-3">🎙️</p>
              <p className="text-sm font-semibold text-text-primary mb-1">No sender profiles yet</p>
              <p className="text-xs text-text-muted">Create a profile to represent your artist or label identity in campaigns.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {senders.map(s => (
                <div key={s.id} className="glass-card rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-sm text-text-primary">{s.display_name}</p>
                      <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 inline-block"
                        style={{ color: COLOR, backgroundColor: `${COLOR}15` }}>
                        {s.type}
                      </span>
                    </div>
                    <UserCircle2 size={20} className="text-text-muted flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="space-y-1.5">
                    {s.email_from_name && (
                      <p className="text-[11px] text-text-muted flex items-center gap-1.5">
                        <Mail size={10} className="text-indigo-400 flex-shrink-0" />
                        <span className="font-semibold text-text-primary">{s.email_from_name}</span>
                        {s.email_reply_to && <span className="truncate">· reply to {s.email_reply_to}</span>}
                      </p>
                    )}
                    {s.whatsapp_number && (
                      <p className="text-[11px] text-text-muted flex items-center gap-1.5">
                        <Phone size={10} className="text-green-400 flex-shrink-0" />
                        <span>{s.whatsapp_number}</span>
                      </p>
                    )}
                    {!s.email_from_name && !s.whatsapp_number && (
                      <p className="text-[11px] text-text-muted italic">No channel configured yet</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* OPT-IN LINKS TAB                                    */}
      {/* ════════════════════════════════════════════════════ */}
      {tab === "optin" && (
        <div>
          <div className="flex items-start justify-between mb-4 gap-4">
            <div>
              <p className="text-sm text-text-muted leading-relaxed max-w-xl">
                Create a shareable link fans can click to join your WhatsApp list. Each link generates
                a branded opt-in page at <span className="font-mono text-brand text-xs">your-domain.com/join/[slug]</span>.
                Supports <span className="font-mono text-brand text-xs">[Fan Name]</span> and{" "}
                <span className="font-mono text-brand text-xs">[Artist Name]</span> in the welcome message.
              </p>
            </div>
            <button onClick={() => setShowNewOptin(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-background transition-all hover:opacity-80 flex-shrink-0"
              style={{ backgroundColor: COLOR }}>
              <Plus size={14} />
              New Link
            </button>
          </div>

          {/* New opt-in form */}
          {showNewOptin && (
            <div className="glass-card rounded-xl p-5 mb-5" style={{ borderColor: `${COLOR}30` }}>
              <p className="text-sm font-black mb-4" style={{ color: COLOR }}>New Opt-In Link</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input className={inputCls} placeholder="Internal name (e.g. Afrobeats Summer Tour)"
                  value={newOptin.name} onChange={e => setNewOptin(o => ({ ...o, name: e.target.value }))} />
                <div>
                  <input className={inputCls} placeholder="URL slug (e.g. thabiso-summer-25)"
                    value={newOptin.slug}
                    onChange={e => setNewOptin(o => ({
                      ...o,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
                    }))} />
                  {newOptin.slug && (
                    <p className="text-[10px] text-text-muted mt-1 font-mono truncate">
                      {typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/join/{newOptin.slug}
                    </p>
                  )}
                </div>
                <input className={inputCls} placeholder="Artist / Label name (shown on page) *"
                  value={newOptin.artist_display_name}
                  onChange={e => setNewOptin(o => ({ ...o, artist_display_name: e.target.value }))} />
                <input className={inputCls} placeholder="Page headline (e.g. Stay connected with me)"
                  value={newOptin.headline}
                  onChange={e => setNewOptin(o => ({ ...o, headline: e.target.value }))} />
                <input className={`${inputCls} col-span-2`}
                  placeholder="Page description (optional — what will fans receive?)"
                  value={newOptin.description}
                  onChange={e => setNewOptin(o => ({ ...o, description: e.target.value }))} />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                Welcome message (sent via WhatsApp immediately after opt-in)
              </p>
              <textarea className={`${inputCls} resize-none mb-3`} rows={3}
                placeholder="Hey [Fan Name]! It's [Artist Name] 👋 You're now on my exclusive WhatsApp list. Stay tuned for updates, drops and early access 🎵"
                value={newOptin.welcome_message}
                onChange={e => setNewOptin(o => ({ ...o, welcome_message: e.target.value }))} />
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Sender profile (optional)</p>
                <select value={newOptin.sender_profile_id}
                  onChange={e => setNewOptin(o => ({ ...o, sender_profile_id: e.target.value }))}
                  className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand w-full sm:w-auto">
                  <option value="">Default (ROSTER shared number)</option>
                  {senders.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateOptinCampaign}
                  disabled={optinSaving || !newOptin.name.trim() || !newOptin.slug.trim() || !newOptin.artist_display_name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-background disabled:opacity-40 hover:opacity-80 transition-all"
                  style={{ backgroundColor: COLOR }}>
                  {optinSaving ? <RotateCcw size={13} className="animate-spin" /> : <Save size={13} />}
                  Create Link
                </button>
                <button onClick={() => setShowNewOptin(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-text-muted border border-border hover:border-text-muted transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Opt-in links list */}
          {optinLoading ? (
            <p className="text-sm text-text-muted text-center py-8">Loading…</p>
          ) : optinCampaigns.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-3xl mb-3">🔗</p>
              <p className="text-sm font-semibold text-text-primary mb-1">No opt-in links yet</p>
              <p className="text-xs text-text-muted">Create a link and share it in your bio, stories, or at shows to grow your WhatsApp list.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {optinCampaigns.map(oc => {
                const url = typeof window !== "undefined"
                  ? `${window.location.origin}/join/${oc.slug}`
                  : `/join/${oc.slug}`;
                const isCopied = copiedSlug === oc.slug;
                return (
                  <div key={oc.id} className="glass-card rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-sm text-text-primary truncate">{oc.name}</p>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${
                            oc.is_active
                              ? "text-green-400 bg-green-400/10"
                              : "text-text-muted bg-surface-2"
                          }`}>
                            {oc.is_active ? "Active" : "Paused"}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mb-2 truncate font-mono">{url}</p>
                        <p className="text-xs text-text-muted">
                          <span className="font-semibold text-text-primary">{oc.artist_display_name}</span>
                          {" · "}
                          <span style={{ color: COLOR }} className="font-bold">{oc.opt_in_count} opt-ins</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Toggle active */}
                        <button onClick={() => handleToggleOptin(oc.id, oc.is_active)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                          title={oc.is_active ? "Pause link" : "Activate link"}>
                          {oc.is_active
                            ? <ToggleRight size={18} className="text-green-400" />
                            : <ToggleLeft size={18} />}
                        </button>
                        {/* Open page */}
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-text-muted hover:text-brand transition-colors"
                          title="Preview page">
                          <ExternalLink size={15} />
                        </a>
                        {/* Copy link */}
                        <button onClick={() => copyOptinLink(oc.slug)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isCopied
                              ? "text-green-400 bg-green-400/10"
                              : "text-background hover:opacity-80"
                          }`}
                          style={{ backgroundColor: isCopied ? undefined : COLOR }}>
                          {isCopied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy link</>}
                        </button>
                      </div>
                    </div>
                    {oc.welcome_message && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">Welcome message</p>
                        <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{oc.welcome_message}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
