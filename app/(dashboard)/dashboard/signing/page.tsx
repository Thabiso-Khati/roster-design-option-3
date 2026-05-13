"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, FileText, Send, Eye, Check, X, Clock, Mail, ExternalLink, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";

const COLOR = "#C9A84C";

interface SigningRow {
  id: string;
  recipientEmail: string;
  recipientName: string;
  contractType: string;
  contractTitle: string;
  status: "draft" | "sent" | "viewed" | "signed" | "declined" | "expired" | "cancelled";
  sentAt: string | null;
  firstViewedAt: string | null;
  signedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
  expiresAt: string;
  createdAt: string;
}

export default function SigningInboxPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<SigningRow[] | null>(null);
  const [filter, setFilter] = useState<"all" | SigningRow["status"]>("all");

  useEffect(() => {
    fetch("/api/sign/list")
      .then((r) => r.json())
      .then((d) => setRows(d.requests ?? []))
      .catch(() => setRows([]));
  }, []);

  // Build STATUS_META lazily so it picks up current t()
  const STATUS_META: Record<SigningRow["status"], { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
    draft:     { label: t("signing.statusDraft"),     color: "#94A3B8", icon: FileText },
    sent:      { label: t("signing.statusSent"),      color: "#3B82F6", icon: Send },
    viewed:    { label: t("signing.statusViewed"),    color: "#F59E0B", icon: Eye },
    signed:    { label: t("signing.statusSigned"),    color: "#10B981", icon: Check },
    declined:  { label: t("signing.statusDeclined"),  color: "#EF4444", icon: X },
    expired:   { label: t("signing.statusExpired"),   color: "#94A3B8", icon: Clock },
    cancelled: { label: t("signing.statusCancelled"), color: "#94A3B8", icon: X },
  };

  const filtered = rows
    ? filter === "all"
      ? rows
      : rows.filter((r) => r.status === filter)
    : [];

  const counts = rows
    ? {
        all:      rows.length,
        sent:     rows.filter((r) => r.status === "sent" || r.status === "viewed").length,
        signed:   rows.filter((r) => r.status === "signed").length,
        declined: rows.filter((r) => r.status === "declined").length,
      }
    : { all: 0, sent: 0, signed: 0, declined: 0 };

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15} /> {t("compassPage.backToDash")}
      </Link>

      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${COLOR}15` }}>
            <Mail size={26} style={{ color: COLOR }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: COLOR }}>{t("signing.tagline")}</p>
            <h1 className="text-2xl font-black text-text-primary">{t("signing.title")}</h1>
            <p className="text-sm text-text-muted mt-0.5">{t("signing.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label={t("signing.total")}   value={counts.all.toString()}      color={COLOR}      active={filter === "all"}      onClick={() => setFilter("all")} />
        <SummaryCard label={t("signing.inFlight")} value={counts.sent.toString()}    color="#3B82F6"    active={filter === "sent"}     onClick={() => setFilter("sent")} />
        <SummaryCard label={t("signing.statusSigned")}  value={counts.signed.toString()}  color="#10B981" active={filter === "signed"}  onClick={() => setFilter("signed")} />
        <SummaryCard label={t("signing.statusDeclined")} value={counts.declined.toString()} color="#EF4444" active={filter === "declined"} onClick={() => setFilter("declined")} />
      </div>

      {rows === null ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Loader2 size={28} className="mx-auto mb-3 animate-spin text-text-muted" />
          <p className="text-sm text-text-muted">{t("signing.loading")}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Mail size={28} className="mx-auto mb-3 opacity-40" style={{ color: COLOR }} />
          <p className="font-bold text-text-primary mb-1">{t("signing.noRequests")}</p>
          <p className="text-sm text-text-muted mb-4">
            {t("signing.noRequestsDesc", { cta: "" })}
            <span className="text-text-primary font-semibold">{t("signing.sendForSig")}</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const meta = STATUS_META[r.status];
            const Icon = meta.icon;
            return (
              <div key={r.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${meta.color}15` }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text-primary">{r.contractTitle}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {r.contractType} · {t("signing.sentTo")} <span className="text-text-primary">{r.recipientName}</span> ({r.recipientEmail})
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded" style={{ color: meta.color, backgroundColor: `${meta.color}15` }}>
                    {meta.label}
                  </span>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-3 mt-3 flex-wrap text-[11px] text-text-muted">
                  {r.sentAt && (
                    <span className="inline-flex items-center gap-1"><Send size={11} /> {t("signing.statusSent")} {fmtDate(r.sentAt)}</span>
                  )}
                  {r.firstViewedAt && (
                    <span className="inline-flex items-center gap-1"><Eye size={11} /> {t("signing.statusViewed")} {fmtDate(r.firstViewedAt)}</span>
                  )}
                  {r.signedAt && (
                    <span className="inline-flex items-center gap-1 text-emerald-400"><Check size={11} /> {t("signing.statusSigned")} {fmtDate(r.signedAt)}</span>
                  )}
                  {r.declinedAt && (
                    <span className="inline-flex items-center gap-1 text-red-400"><X size={11} /> {t("signing.statusDeclined")} {fmtDate(r.declinedAt)}</span>
                  )}
                  {(r.status === "sent" || r.status === "viewed") && (
                    <span className="inline-flex items-center gap-1"><Clock size={11} /> {t("signing.expires")} {fmtDate(r.expiresAt)}</span>
                  )}
                </div>

                {r.declineReason && (
                  <div className="mt-3 rounded-lg p-3 text-xs text-text-muted" style={{ backgroundColor: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.20)", borderWidth: 1 }}>
                    <span className="font-semibold text-text-primary">{t("signing.reason")}: </span>{r.declineReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div
        className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3"
        style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}06` }}
      >
        <FileText size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLOR }} />
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">{t("signing.auditTitle")}</span>{" "}
          {t("signing.auditDesc")}
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, active, onClick }: { label: string; value: string; color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass-card rounded-xl p-4 text-left transition-all"
      style={active ? { borderColor: color, backgroundColor: `${color}10` } : undefined}
    >
      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
      <p className="text-2xl font-black text-text-primary">{value}</p>
    </button>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
