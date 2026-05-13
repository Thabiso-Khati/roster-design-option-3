// ============================================================
// ROSTER — Expert Dashboard
// ------------------------------------------------------------
// Self-service profile + pricing management for experts. The
// page serves two phases:
//
//   1. Onboarding — after claim, is_active=false and the profile
//      is bare. The checklist shows what's missing (avatar, bio,
//      long bio, highlights, pricing) and the "Go Live" button
//      stays disabled until every box is ticked.
//   2. Live management — once active, the checklist collapses,
//      the Go Live button becomes a "Pause profile" toggle, and
//      the expert sees upcoming bookings + earnings.
//
// Avatars upload to the `expert-avatars` Supabase Storage bucket
// as `{user_id}/avatar.<ext>` — RLS in the migration locks writes
// to the owner and allows public reads for the directory.
// ============================================================

"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar, DollarSign, Clock, User, Plus, Trash2, Save,
  Upload, CheckCircle2, Circle, Radio, PauseCircle, Sparkles,
  AlertCircle, Loader2, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { PaystackConnectCard } from "@/components/experts/paystack-connect-card";
import { useTranslation } from "@/lib/i18n/hooks";
import type { TranslationPath } from "@/lib/i18n";
import Image from "next/image";

const CURRENCY_OPTIONS = ["ZAR", "NGN", "GHS", "KES", "USD", "GBP"];

const COUNTRIES = [
  "South Africa", "Nigeria", "Ghana", "Kenya", "Tanzania", "Uganda",
  "Zimbabwe", "Zambia", "Botswana", "Namibia", "Senegal", "Côte d'Ivoire",
  "Ethiopia", "Rwanda", "Cameroon", "United Kingdom", "United States",
  "Brazil", "India", "Other",
];

// Profile-completion thresholds. Tuned for "useful enough for a
// stranger to decide whether to book you".
const BIO_MIN_CHARS = 50;
const LONG_BIO_MIN_CHARS = 200;
const HIGHLIGHTS_MIN = 3;

interface SessionType {
  id?: string;
  duration_minutes: number;
  price: number;
  currency: string;
  is_available: boolean;
}

interface BookingRow {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  expert_payout: number;
  profiles: { full_name: string | null } | null;
}

interface PaystackConnection {
  bankName: string | null;
  accountLast4: string | null;
  accountName: string | null;
  subaccountCode: string | null;
  connectedAt: string | null;
}

const EMPTY_PAYSTACK: PaystackConnection = {
  bankName: null,
  accountLast4: null,
  accountName: null,
  subaccountCode: null,
  connectedAt: null,
};

export default function ExpertDashboardPage() {
  const searchParams = useSearchParams();
  const showWelcome = searchParams.get("welcome") === "1";
  const { t } = useTranslation();

  const DURATION_OPTIONS = [
    { value: 30,  label: t("experts.dur30") },
    { value: 45,  label: t("experts.dur45") },
    { value: 60,  label: t("experts.dur60") },
    { value: 120, label: t("experts.dur120") },
  ];

  const [expertId, setExpertId] = useState<string | null>(null);
  const [isExpert, setIsExpert] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Profile fields
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [longBio, setLongBio] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);

  // Sessions + bookings
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingRow[]>([]);

  // Paystack payout connection
  const [paystack, setPaystack] = useState<PaystackConnection>(EMPTY_PAYSTACK);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [goingLive, setGoingLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load expert data on mount ────────────────────────────
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsExpert(false); return; }
      setUserId(user.id);

      const { data: expert } = await supabase
        .from("experts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!expert) { setIsExpert(false); return; }

      setIsExpert(true);
      setExpertId(expert.id);
      setIsActive(!!expert.is_active);
      setName(expert.name || "");
      setAvatarUrl(expert.avatar_url || null);
      setSpecialty(expert.specialty || "");
      setCountry(expert.country || "");
      setBio(expert.bio || "");
      setLongBio(expert.long_bio || "");
      setHighlights(Array.isArray(expert.highlights) ? expert.highlights : []);

      // Rehydrate Paystack connection from the same experts row
      setPaystack({
        bankName: expert.paystack_bank_name ?? null,
        accountLast4: expert.paystack_account_last4 ?? null,
        accountName: expert.paystack_account_name ?? null,
        subaccountCode: expert.paystack_subaccount_code ?? null,
        connectedAt: expert.paystack_connected_at ?? null,
      });

      const { data: sessionData } = await supabase
        .from("expert_sessions")
        .select("*")
        .eq("expert_id", expert.id);
      setSessions(sessionData || []);

      const { data: bookingData } = await supabase
        .from("bookings")
        .select("id, scheduled_at, duration_minutes, expert_payout, profiles(full_name)")
        .eq("expert_id", expert.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5);
      setUpcomingBookings((bookingData as unknown as BookingRow[]) || []);
    };
    load();
  }, []);

  // ── Derived: profile completion checklist ────────────────
  const availableSessions = sessions.filter((s) => s.is_available).length;
  const checklist = [
    { key: "avatar",     label: t("experts.checkAvatar"),                                                          done: !!avatarUrl },
    { key: "specialty",  label: t("experts.checkSpecialty"),                                                       done: specialty.trim().length > 0 },
    { key: "country",    label: t("experts.checkCountry"),                                                         done: country.trim().length > 0 },
    { key: "bio",        label: t("experts.checkBio").replace("{min}", String(BIO_MIN_CHARS)),                      done: bio.trim().length >= BIO_MIN_CHARS },
    { key: "long_bio",   label: t("experts.checkLongBio").replace("{min}", String(LONG_BIO_MIN_CHARS)),            done: longBio.trim().length >= LONG_BIO_MIN_CHARS },
    { key: "highlights", label: t("experts.checkHighlights").replace("{min}", String(HIGHLIGHTS_MIN)),             done: highlights.filter((h) => h.trim().length > 0).length >= HIGHLIGHTS_MIN },
    { key: "sessions",   label: t("experts.checkSessions"),                                                        done: availableSessions >= 1 },
    { key: "paystack",   label: t("experts.checkPaystack"),                                                        done: !!paystack.subaccountCode },
  ];
  const checklistComplete = checklist.every((c) => c.done);
  const doneCount = checklist.filter((c) => c.done).length;

  // ── Avatar upload ────────────────────────────────────────
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId || !expertId) return;

    setError(null);
    if (!file.type.startsWith("image/")) {
      setError(t("experts.errImageType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("experts.errImageSize"));
      return;
    }

    setUploadingAvatar(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    // Folder name MUST match auth.uid() — the storage RLS policy
    // (see migration) uses storage.foldername(name)[1] to gate writes.
    // Timestamp suffix busts CDN cache on re-upload.
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("expert-avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setError(t("experts.errUpload").replace("{msg}", uploadError.message));
      setUploadingAvatar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("expert-avatars")
      .getPublicUrl(path);

    // Persist immediately so a refresh doesn't lose the upload.
    await supabase.from("experts").update({ avatar_url: publicUrl }).eq("id", expertId);
    setAvatarUrl(publicUrl);
    setUploadingAvatar(false);
  }

  // ── Highlights management ────────────────────────────────
  function updateHighlight(i: number, val: string) {
    setHighlights((h) => h.map((item, idx) => idx === i ? val : item));
  }
  function addHighlight() {
    if (highlights.length >= 8) return;
    setHighlights((h) => [...h, ""]);
  }
  function removeHighlight(i: number) {
    setHighlights((h) => h.filter((_, idx) => idx !== i));
  }

  // ── Sessions management ──────────────────────────────────
  const addSession = () => {
    setSessions((s) => [...s, { duration_minutes: 60, price: 1000, currency: "ZAR", is_available: true }]);
  };
  const removeSession = (i: number) => {
    setSessions((s) => s.filter((_, idx) => idx !== i));
  };
  const updateSession = (i: number, key: keyof SessionType, val: string | number | boolean) => {
    setSessions((s) => s.map((sess, idx) => idx === i ? { ...sess, [key]: val } : sess));
  };

  // ── Save (profile + sessions) ────────────────────────────
  const handleSave = async () => {
    if (!expertId) return;
    setError(null);
    setSaving(true);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("experts")
      .update({
        bio,
        long_bio: longBio,
        specialty,
        country,
        highlights: highlights.filter((h) => h.trim().length > 0),
      })
      .eq("id", expertId);

    if (updateError) {
      setError(t("experts.errSave").replace("{msg}", updateError.message));
      setSaving(false);
      return;
    }

    // Upsert sessions. Keeping the simple row-by-row pattern the
    // existing dashboard used — volume per expert is tiny (<10).
    for (const sess of sessions) {
      if (sess.id) {
        await supabase.from("expert_sessions").update({
          duration_minutes: sess.duration_minutes,
          price: sess.price,
          currency: sess.currency,
          is_available: sess.is_available,
        }).eq("id", sess.id);
      } else {
        await supabase.from("expert_sessions").insert({
          expert_id: expertId,
          duration_minutes: sess.duration_minutes,
          price: sess.price,
          currency: sess.currency,
          is_available: sess.is_available,
        });
      }
    }

    // Re-fetch session IDs so subsequent saves hit UPDATE not INSERT.
    const { data: refreshed } = await supabase
      .from("expert_sessions")
      .select("*")
      .eq("expert_id", expertId);
    setSessions(refreshed || []);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  // ── Go Live / Pause ──────────────────────────────────────
  const handleToggleLive = async () => {
    if (!expertId) return;
    if (!isActive && !checklistComplete) return;
    setGoingLive(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("experts")
      .update({
        is_active: !isActive,
        profile_completed_at: !isActive ? new Date().toISOString() : null,
      })
      .eq("id", expertId);

    if (updateError) {
      setError(t("experts.errLiveStatus").replace("{msg}", updateError.message));
      setGoingLive(false);
      return;
    }
    setIsActive(!isActive);
    setGoingLive(false);
  };

  // ── Render: loading ──────────────────────────────────────
  if (isExpert === null) {
    return (
      <div className="flex items-center gap-2 text-text-muted p-8">
        <Loader2 size={16} className="animate-spin" /> {t("signing.loading")}
      </div>
    );
  }

  // ── Render: not an expert ────────────────────────────────
  if (isExpert === false) {
    return (
      <div className="animate-fade-in">
        <div className="glass-card rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-5">
            <User size={24} className="text-brand" />
          </div>
          <h2 className="text-xl font-black text-text-primary mb-3">{t("experts.notExpertTitle")}</h2>
          <p className="text-text-muted text-sm mb-6 max-w-xs mx-auto">
            {t("experts.notExpertDesc")}
          </p>
          <a
            href="/become-expert"
            className="inline-flex items-center gap-2 bg-gold-gradient text-background font-bold text-sm px-6 py-3 rounded-lg"
          >
            {t("experts.applyExpert")}
          </a>
        </div>
      </div>
    );
  }

  // ── Render: expert dashboard ─────────────────────────────
  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Welcome banner — first-visit celebration */}
      {showWelcome && (
        <div className="mb-6 glass-card rounded-2xl p-6 border-brand/20 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-brand" />
          </div>
          <div>
            <h2 className="font-bold text-text-primary mb-1">
              {name ? `Welcome, ${name.split(" ")[0]}. ` : "Welcome. "}{t("experts.welcomeMsg")}
            </h2>
            <p className="text-sm text-text-muted">
              {t("experts.welcomeDesc").replace("{cta}", t("experts.goLive"))}
            </p>
          </div>
        </div>
      )}

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary">{t("experts.dashTitle")}</h1>
          <p className="text-text-muted mt-2">{t("experts.dashSubtitle")}</p>
        </div>
        <LiveStatusBadge isActive={isActive} t={t} />
      </div>

      {/* Profile completion checklist (onboarding) */}
      {(!isActive || !checklistComplete) && (
        <div className="mb-6 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest">
              {t("experts.profileCompletion")}
            </h2>
            <span className="text-xs font-semibold text-text-muted">
              {doneCount} / {checklist.length}
            </span>
          </div>
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${(doneCount / checklist.length) * 100}%` }}
            />
          </div>
          <div className="space-y-2">
            {checklist.map((c) => (
              <div key={c.key} className="flex items-center gap-2.5 text-sm">
                {c.done ? (
                  <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                ) : (
                  <Circle size={14} className="text-text-muted/50 flex-shrink-0" />
                )}
                <span className={c.done ? "text-text-muted line-through" : "text-text-primary"}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming bookings */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">
          <Calendar size={13} className="inline mr-1.5" />
          {t("experts.upcomingBookings")} ({upcomingBookings.length})
        </h2>
        {upcomingBookings.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center text-text-muted text-sm">
            {t("experts.noUpcomingBookings")}
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((b) => (
              <div key={b.id} className="glass-card rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text-primary text-sm">
                    {b.profiles?.full_name || t("experts.clientFallback")}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(b.scheduled_at).toLocaleDateString("en-ZA", { weekday: "long", month: "short", day: "numeric" })} · {b.duration_minutes} min
                  </p>
                </div>
                <span className="text-sm font-bold text-success">
                  R{(b.expert_payout || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="glass-card rounded-2xl p-7 mb-6">
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-5">
          <User size={13} className="inline mr-1.5" />{t("experts.profilePhoto")}
        </h2>
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-2xl bg-surface-2 border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={name} width={96} height={96} className="w-full h-full object-cover" unoptimized />
            ) : (
              <User size={32} className="text-text-muted/50" />
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="inline-flex items-center gap-2 bg-surface-2 hover:bg-surface border border-border text-text-primary font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploadingAvatar ? t("experts.uploading") : avatarUrl ? t("experts.replacePhoto") : t("experts.uploadPhoto")}
            </button>
            <p className="text-xs text-text-muted mt-2">
              {t("experts.photoHint")}
            </p>
          </div>
        </div>
      </div>

      {/* Profile text fields */}
      <div className="glass-card rounded-2xl p-7 mb-6">
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-5">
          <User size={13} className="inline mr-1.5" />{t("experts.profileSection")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{t("experts.specialty")}</label>
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Music Law & Contracts"
              className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              <MapPin size={10} className="inline mr-1" />{t("settings.country")}
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary transition-all"
            >
              <option value="">{t("experts.selectCountry")}</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>{t("experts.shortBio")}</span>
              <span className={bio.length >= BIO_MIN_CHARS ? "text-success" : "text-text-muted"}>
                {bio.length} / {BIO_MIN_CHARS}+
              </span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="One or two sentences that show on your expert card."
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary resize-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>{t("experts.longBio")}</span>
              <span className={longBio.length >= LONG_BIO_MIN_CHARS ? "text-success" : "text-text-muted"}>
                {longBio.length} / {LONG_BIO_MIN_CHARS}+
              </span>
            </label>
            <textarea
              value={longBio}
              onChange={(e) => setLongBio(e.target.value)}
              rows={6}
              placeholder="Full background — roles, highlights, notable clients, what you'll help with."
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary resize-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="glass-card rounded-2xl p-7 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">
            <Sparkles size={13} className="inline mr-1.5" />{t("experts.expertiseHighlights")}
          </h2>
          <button
            type="button"
            onClick={addHighlight}
            disabled={highlights.length >= 8}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-light disabled:opacity-40 transition-colors"
          >
            <Plus size={13} />{t("experts.addHighlight")}
          </button>
        </div>
        <p className="text-xs text-text-muted mb-4">
          {t("experts.highlightsHint")}
        </p>
        {highlights.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-4">
            {t("experts.noHighlights")}
          </p>
        ) : (
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={h}
                  onChange={(e) => updateHighlight(i, e.target.value)}
                  placeholder="e.g. 15+ years in entertainment law"
                  className="flex-1 bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => removeHighlight(i)}
                  className="text-text-muted hover:text-error transition-colors p-2"
                  aria-label="Remove highlight"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session pricing */}
      <div className="glass-card rounded-2xl p-7 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">
            <DollarSign size={13} className="inline mr-1.5" />{t("experts.sessionPricing")}
          </h2>
          <button
            type="button"
            onClick={addSession}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-light transition-colors"
          >
            <Plus size={13} />{t("experts.addSession")}
          </button>
        </div>

        {sessions.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-4">
            {t("experts.noSessions")}
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess, i) => (
              <div key={sess.id ?? `new-${i}`} className="bg-surface-2 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-text-muted mb-1.5">
                      <Clock size={10} className="inline mr-1" />{t("experts.duration")}
                    </label>
                    <select
                      value={sess.duration_minutes}
                      onChange={(e) => updateSession(i, "duration_minutes", Number(e.target.value))}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text-primary"
                    >
                      {DURATION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1.5">{t("experts.price")}</label>
                    <input
                      type="number"
                      value={sess.price}
                      onChange={(e) => updateSession(i, "price", Number(e.target.value))}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1.5">{t("settings.currency")}</label>
                    <select
                      value={sess.currency}
                      onChange={(e) => updateSession(i, "currency", e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text-primary"
                    >
                      {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sess.is_available}
                      onChange={(e) => updateSession(i, "is_available", e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-brand"
                    />
                    {t("experts.availableBooking")}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSession(i)}
                    className="text-text-muted hover:text-error transition-colors p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paystack payouts */}
      <div className="mb-6">
        <PaystackConnectCard
          connection={paystack}
          onConnected={setPaystack}
          onDisconnected={() => setPaystack(EMPTY_PAYSTACK)}
        />
      </div>

      {/* Error / Saved banners */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 text-sm text-error mb-4 flex items-start gap-2">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {saved && (
        <div className="bg-success/10 border border-success/20 rounded-lg px-4 py-3 text-sm text-success mb-4">
          ✓ {t("experts.profileSaved")}
        </div>
      )}

      {/* Actions row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleSave} loading={saving} size="lg" className="flex-1">
          <Save size={15} className="mr-2" />{t("settings.saveChanges")}
        </Button>
        <button
          type="button"
          onClick={handleToggleLive}
          disabled={goingLive || (!isActive && !checklistComplete)}
          className={`flex-1 rounded-xl font-semibold py-3 px-5 text-sm flex items-center justify-center gap-2 transition-colors ${
            isActive
              ? "bg-surface-2 hover:bg-surface border border-border text-text-primary"
              : checklistComplete
                ? "bg-success hover:bg-success/90 text-background"
                : "bg-surface-2 border border-border text-text-muted/60 cursor-not-allowed"
          }`}
        >
          {goingLive ? (
            <Loader2 size={15} className="animate-spin" />
          ) : isActive ? (
            <PauseCircle size={15} />
          ) : (
            <Radio size={15} />
          )}
          {goingLive
            ? t("experts.updating")
            : isActive
              ? t("experts.pauseProfile")
              : checklistComplete
                ? t("experts.goLive")
                : t("experts.completeChecklist").replace("{done}", String(doneCount)).replace("{total}", String(checklist.length))}
        </button>
      </div>

      {!isActive && checklistComplete && (
        <p className="text-center text-xs text-success mt-3">
          🎉 {t("experts.readyToGoLive")}
        </p>
      )}
    </div>
  );
}

// ─── Live status pill (top-right) ──────────────────────────
function LiveStatusBadge({ isActive, t }: { isActive: boolean; t: (key: TranslationPath) => string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${
      isActive
        ? "bg-success/10 border border-success/20 text-success"
        : "bg-surface-2 border border-border text-text-muted"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-success animate-pulse" : "bg-text-muted"}`} />
      {isActive ? t("experts.expertLive") : t("experts.expertHidden")}
    </div>
  );
}
