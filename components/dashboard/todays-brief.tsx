"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { DailyBrief, BriefLabel } from "@/lib/brief/build-brief";
import { useTranslation } from "@/lib/i18n/hooks";
import type { TranslationPath } from "@/lib/i18n";

interface TodaysBriefProps {
  name: string;
  brief: DailyBrief;
}

const LABEL_STYLES: Record<BriefLabel, string> = {
  "Pick up":  "text-brand border-brand/30 bg-brand/5",
  Upcoming:   "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
  "Try this": "text-violet-300 border-violet-300/30 bg-violet-300/5",
  "Watch out":"text-rose-300 border-rose-300/30 bg-rose-300/5",
};

// Maps BriefLabel enum values to i18n keys so labels localise
// without changing the underlying data contract.
const LABEL_KEYS: Record<BriefLabel, TranslationPath> = {
  "Pick up":  "widget.labelPickUp",
  Upcoming:   "widget.labelUpcoming",
  "Try this": "widget.labelTryThis",
  "Watch out":"widget.labelWatchOut",
};

export function TodaysBrief({ name, brief }: TodaysBriefProps) {
  const { t } = useTranslation();

  // Hydrate on client so time-of-day greeting reflects user's local time,
  // not server time. Avoids hydration mismatch.
  const [greeting, setGreeting] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    setGreeting(getTimeGreeting(name, now.getHours(), t));
    setDateStr(
      now.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
  }, [name, t]);

  return (
    <section
      className="glass-card rounded-2xl p-8 md:p-10 mb-6 animate-fade-in relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 0% 0%, rgba(201,168,76,0.08) 0%, rgba(17,24,39,0.6) 60%)",
      }}
    >
      {/* Date strip */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">
          {t("widget.todaysBrief")} · {dateStr || " "}
        </p>
        <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted/60">
          {t("widget.briefCurated")}
        </span>
      </div>

      {/* Greeting */}
      <h1 className="text-2xl md:text-[32px] font-semibold text-text-primary leading-tight mb-2 tracking-tight">
        {greeting || `Hi, ${name}.`}
      </h1>
      <p className="text-sm md:text-[15px] text-text-muted mb-8 max-w-xl leading-relaxed">
        {brief.greeting}
      </p>

      {/* Prompts */}
      <div className="space-y-3">
        {brief.prompts.length === 0 ? (
          <p className="text-sm text-text-muted py-4">
            {t("widget.nothingOnRadar")}
          </p>
        ) : (
          brief.prompts.map((p, i) => {
            const labelClass =
              LABEL_STYLES[p.label] ?? "text-text-muted border-text-muted/20";
            const labelText = LABEL_KEYS[p.label]
              ? t(LABEL_KEYS[p.label])
              : p.label;
            const content = (
              <div className="flex items-start gap-4 group">
                <span
                  className={`text-[10px] uppercase tracking-[0.15em] font-semibold px-2 py-1 rounded-md border ${labelClass} flex-shrink-0 mt-0.5 w-[5.5rem] text-center inline-block`}
                >
                  {labelText}
                </span>
                <p className="text-[15px] md:text-base text-text-primary leading-relaxed flex-1">
                  {p.sentence}
                </p>
                {p.href && (
                  <ArrowUpRight
                    size={18}
                    className="text-text-muted group-hover:text-brand transition-colors mt-1 flex-shrink-0"
                  />
                )}
              </div>
            );

            return p.href ? (
              <Link
                key={i}
                href={p.href}
                className="block py-3 border-t border-white/5 first:border-t-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors"
              >
                {content}
              </Link>
            ) : (
              <div
                key={i}
                className="py-3 border-t border-white/5 first:border-t-0 -mx-2 px-2"
              >
                {content}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function getTimeGreeting(
  name: string,
  hour: number,
  t: (path: TranslationPath, vars?: Record<string, string | number>) => string,
): string {
  if (hour < 5)  return t("widget.greetingLate",      { name });
  if (hour < 12) return t("widget.greetingMorning",   { name });
  if (hour < 17) return t("widget.greetingAfternoon", { name });
  if (hour < 21) return t("widget.greetingEvening",   { name });
  return               t("widget.greetingNight",       { name });
}
