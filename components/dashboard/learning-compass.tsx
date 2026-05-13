"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, X, Video, UserRound, ArrowRight } from "lucide-react";
import { MOCK_RECOMMENDATIONS } from "@/lib/mock/dashboard-data";
import { useTranslation } from "@/lib/i18n/hooks";

export function LearningCompass() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const rec = MOCK_RECOMMENDATIONS[index % MOCK_RECOMMENDATIONS.length];
  const Icon = rec.kind === "masterclass" ? Video : UserRound;

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col relative overflow-hidden">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-text-muted/60 hover:text-text-primary transition-colors z-10"
        aria-label="Dismiss recommendation"
      >
        <X size={14} />
      </button>

      <header className="mb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-text-muted font-medium mb-1">
          <Compass size={12} />
          {t("widget.compass")}
        </div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t("widget.whereToFocusNext")}
        </h2>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-brand bg-brand/10 border border-brand/20 px-2 py-1 rounded-md">
            <Icon size={11} />
            {rec.kind === "masterclass" ? t("nav.masterclasses") : t("widget.expertLabel")}
          </span>
        </div>

        <h3 className="text-xl font-semibold text-text-primary tracking-tight mb-3 leading-snug">
          {rec.title}
        </h3>

        <div className="mb-5 p-3 rounded-lg bg-surface/40 border border-white/5">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-1">
            {t("widget.because")}
          </p>
          <p className="text-sm text-text-muted leading-relaxed">{rec.because}</p>
        </div>

        <p className="text-xs text-text-muted mb-5">{rec.meta}</p>

        <div className="mt-auto flex items-center justify-between gap-3">
          <button
            onClick={() => setIndex(i => i + 1)}
            className="text-xs text-text-muted hover:text-brand transition-colors"
          >
            {t("widget.showMeAnother")}
          </button>
          <Link
            href={rec.href}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-background bg-brand hover:bg-brand-light transition-colors rounded-lg"
          >
            {rec.cta}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
