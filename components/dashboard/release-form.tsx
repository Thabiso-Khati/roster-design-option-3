"use client";

// ============================================================
// ROSTER — Release form
// ------------------------------------------------------------
// Client component. Inserts directly via the browser Supabase
// client (RLS scopes the row to the authed user), then routes
// back to the dashboard so the new release shows up in the
// pipeline + brief.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { ReleaseType, ReleaseStatus } from "@/lib/data/releases";
import { useWorkspaceTracking } from "@/lib/hooks/use-workspace-tracking";
import { useTranslation } from "@/lib/i18n/hooks";

interface ArtistOption {
  id: string;
  name: string;
}

interface ReleaseFormProps {
  artists: ArtistOption[];
}


const DSP_OPTIONS = [
  "Spotify",
  "Apple Music",
  "YouTube Music",
  "Tidal",
  "Deezer",
  "Amazon Music",
  "Audiomack",
  "Boomplay",
  "SoundCloud",
];

export function ReleaseForm({ artists }: ReleaseFormProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const RELEASE_TYPES: { value: ReleaseType; label: string }[] = [
    { value: "single",      label: t("library.typeSingle") },
    { value: "EP",          label: t("library.typeEP") },
    { value: "album",       label: t("library.typeAlbum") },
    { value: "mixtape",     label: t("library.typeMixtape") },
    { value: "compilation", label: t("library.typeCompilation") },
    { value: "live",        label: t("library.typeLive") },
  ];

  const RELEASE_STATUSES: { value: ReleaseStatus; label: string }[] = [
    { value: "planned",     label: t("widget.statusPlanned") },
    { value: "in_progress", label: t("widget.statusInProgress") },
    { value: "delivered",   label: t("widget.statusDelivered") },
    { value: "live",        label: t("widget.statusLive") },
    { value: "cancelled",   label: t("widget.statusCancelled") },
  ];

  // Form state
  const [artistId, setArtistId] = useState<string>("");
  const [artistNameFallback, setArtistNameFallback] = useState<string>("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReleaseType>("single");
  const [releaseDate, setReleaseDate] = useState<string>("");
  const [status, setStatus] = useState<ReleaseStatus>("planned");
  const [dsps, setDsps] = useState<string[]>(["Spotify", "Apple Music"]);
  const [distributor, setDistributor] = useState("");
  const [isrc, setIsrc] = useState("");
  const [upc, setUpc] = useState("");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // ── Workspace tracking ───────────────────────────────────
  // Plan a Release is the first tool wired into Phase 2 state
  // surfacing. While this form is open and unsaved, the artifact
  // is tracked as "tool:plan-a-release". On successful submit we
  // emit `completed` on the tool, then `opened` on the resulting
  // release so the dashboard can pick it up as a release artifact.
  //
  // Completion definition for the tool:
  //   title (40%), artist (20%), release_date (20%), >=1 DSP (20%).
  const computeCompletion = () => {
    let pct = 0;
    if (title.trim().length > 0) pct += 0.4;
    if (artistId || artistNameFallback.trim().length > 0) pct += 0.2;
    if (releaseDate) pct += 0.2;
    if (dsps.length > 0) pct += 0.2;
    return pct;
  };

  const tracking = useWorkspaceTracking({
    artifactType: "tool",
    artifactId: "tool:plan-a-release",
    artifactLabel: "Plan a Release",
    computeCompletion,
    dependencies: [
      title,
      artistId,
      artistNameFallback,
      releaseDate,
      dsps.length,
      type,
      status,
      distributor,
      isrc,
      upc,
      artworkUrl,
      notes,
    ],
  });

  function toggleDsp(dsp: string) {
    setDsps(prev =>
      prev.includes(dsp) ? prev.filter(d => d !== dsp) : [...prev, dsp],
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError(t("library.releaseErrTitle"));
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(t("library.releaseErrSignIn"));
        setSubmitting(false);
        return;
      }

      // Resolve artist linkage:
      //  - Prefer the dropdown selection (artist_id FK + denormalised name)
      //  - Fall back to free-text artist_name with artist_id = null when the
      //    user hasn't seeded their roster yet.
      const linkedArtist = artists.find(a => a.id === artistId);

      const payload = {
        user_id: user.id,
        artist_id: linkedArtist?.id ?? null,
        artist_name:
          linkedArtist?.name ?? (artistNameFallback.trim() || null),
        title: title.trim(),
        type,
        release_date: releaseDate || null, // null = TBC
        status,
        dsps,
        distributor: distributor.trim() || null,
        isrc: isrc.trim() || null,
        upc: upc.trim() || null,
        artwork_url: artworkUrl.trim() || null,
        notes: notes.trim() || null,
      };

      const { data: inserted, error: insertError } = await supabase
        .from("releases")
        .insert(payload)
        .select("id, title")
        .single();

      if (insertError) {
        setError(insertError.message);
        setSubmitting(false);
        return;
      }

      // Tool flow done — fire the completion event on the planner,
      // then register the resulting release as its own tracked
      // artifact so dashboard cards can surface it as a release.
      tracking.markCompleted();
      if (inserted?.id) {
        // Side-channel emit (don't await — keepalive in the hook
        // covers the navigation race).
        void fetch("/api/workspace/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            artifactType: "release",
            artifactId: inserted.id,
            artifactLabel: inserted.title || title.trim(),
            eventType: "opened",
            completionPct: 0.2, // a planned-but-empty release sits at ~20% lifecycle
            metadata: { release_date: releaseDate || null, status },
          }),
          keepalive: true,
        });

        // Auto-save to Workspace (fire-and-forget, non-fatal)
        void fetch("/api/workspace/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:       inserted.title || title.trim(),
            doc_type:    "release_plan",
            source_type: "releases",
            source_id:   inserted.id,
            content:     { release_date: releaseDate || null, status, title: inserted.title },
            privacy:     "private",
          }),
          keepalive: true,
        });
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("library.releaseErrGeneric"));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
        {/* Artist */}
        <Field label={t("library.releaseArtist")} hint={t("library.releaseArtistHint")}>
          {artists.length > 0 ? (
            <select
              value={artistId}
              onChange={e => setArtistId(e.target.value)}
              className="form-input"
            >
              <option value="">— Pick an artist —</option>
              {artists.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={artistNameFallback}
              onChange={e => setArtistNameFallback(e.target.value)}
              placeholder="e.g. De Mthuda"
              className="form-input"
            />
          )}
          {artists.length > 0 && !artistId && (
            <input
              type="text"
              value={artistNameFallback}
              onChange={e => setArtistNameFallback(e.target.value)}
              placeholder="…or type a name"
              className="form-input mt-2"
            />
          )}
        </Field>

        {/* Title */}
        <Field label={t("library.releaseTitle")} required>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Untitled Track"
            className="form-input"
            required
          />
        </Field>

        {/* Type + Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label={t("library.releaseType")}>
            <select
              value={type}
              onChange={e => setType(e.target.value as ReleaseType)}
              className="form-input"
            >
              {RELEASE_TYPES.map(rt => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("library.releaseStatus")}>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as ReleaseStatus)}
              className="form-input"
            >
              {RELEASE_STATUSES.map(rs => (
                <option key={rs.value} value={rs.value}>
                  {rs.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Release date */}
        <Field
          label={t("library.releaseDateLabel")}
          hint={t("library.releaseDateHint")}
        >
          <input
            type="date"
            value={releaseDate}
            onChange={e => setReleaseDate(e.target.value)}
            className="form-input"
          />
        </Field>

        {/* DSPs */}
        <Field label={t("library.releaseDsps")} hint={t("library.releaseDspsHint")}>
          <div className="flex flex-wrap gap-2">
            {DSP_OPTIONS.map(dsp => {
              const on = dsps.includes(dsp);
              return (
                <button
                  type="button"
                  key={dsp}
                  onClick={() => toggleDsp(dsp)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    on
                      ? "bg-brand/10 border-brand/40 text-brand"
                      : "bg-white/[0.02] border-white/10 text-text-muted hover:border-white/20"
                  }`}
                >
                  {dsp}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Distributor */}
        <Field label={t("library.releaseDistributor")} hint={t("library.releaseDistributorHint")}>
          <input
            type="text"
            value={distributor}
            onChange={e => setDistributor(e.target.value)}
            placeholder="e.g. Africori"
            className="form-input"
          />
        </Field>

        {/* ISRC + UPC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label={t("library.releaseIsrc")} hint={t("library.releaseIsrcHint")}>
            <input
              type="text"
              value={isrc}
              onChange={e => setIsrc(e.target.value)}
              placeholder="ZA-XXX-26-XXXXX"
              className="form-input"
            />
          </Field>
          <Field label={t("library.releaseUpc")} hint={t("library.releaseUpcHint")}>
            <input
              type="text"
              value={upc}
              onChange={e => setUpc(e.target.value)}
              placeholder="123456789012"
              className="form-input"
            />
          </Field>
        </div>

        {/* Artwork URL */}
        <Field label={t("library.releaseArtworkUrl")} hint={t("library.releaseArtworkHint")}>
          <input
            type="url"
            value={artworkUrl}
            onChange={e => setArtworkUrl(e.target.value)}
            placeholder="https://…"
            className="form-input"
          />
        </Field>

        {/* Notes */}
        <Field label={t("library.releaseNotes")}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anything you'd want to remember on the pre-release sprint…"
            rows={4}
            className="form-input resize-y"
          />
        </Field>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          {t("compassPage.backToDash")}
        </Link>
        <Button type="submit" loading={submitting}>
          {submitting ? t("status.saving") : t("library.releaseAddToPipeline")}
        </Button>
      </div>

      {/* Inline form input styles — keeps the form self-contained without
          adding a new global class. */}
      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          color: var(--text-primary, #f5f5f5);
          font-size: 0.875rem;
          line-height: 1.4;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        :global(.form-input:focus) {
          outline: none;
          border-color: rgba(201, 168, 76, 0.45);
          background: rgba(255, 255, 255, 0.05);
        }
        :global(.form-input::placeholder) {
          color: rgba(255, 255, 255, 0.3);
        }
        :global(select.form-input option) {
          background: #111827;
          color: #f5f5f5;
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.15em] font-semibold text-text-muted mb-1.5">
        {label}
        {required && <span className="text-brand ml-1">*</span>}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] text-text-muted/70 mt-1.5 leading-relaxed">
          {hint}
        </span>
      )}
    </label>
  );
}
