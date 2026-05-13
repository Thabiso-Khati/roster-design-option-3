"use client";
import Link from "next/link";
import { ChevronLeft, Compass } from "lucide-react";
import { CompassCard } from "@/components/dashboard/compass-card";
import { useTranslation } from "@/lib/i18n/hooks";

export default function CompassPage() {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15} /> {t("compassPage.backToDash")}
      </Link>

      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: "#C9A84C25" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#C9A84C15" }}>
            <Compass size={26} style={{ color: "#C9A84C" }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#C9A84C" }}>{t("compassPage.aiTier")}</p>
            <h1 className="text-2xl font-black text-text-primary">{t("widget.compass")}</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {t("compassPage.pageDesc")}
            </p>
          </div>
        </div>
      </div>

      <CompassCard limit={50} />

      <div
        className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3"
        style={{ borderColor: "rgba(201,168,76,0.25)", backgroundColor: "rgba(201,168,76,0.06)" }}
      >
        <Compass size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#C9A84C" }} />
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">{t("compassPage.howTitle")}</span>{" "}
          {t("compassPage.howDesc", {
            open:    t("action.view"),
            snooze:  t("widget.snooze"),
            dismiss: t("widget.dismiss"),
          })}
        </p>
      </div>
    </div>
  );
}
