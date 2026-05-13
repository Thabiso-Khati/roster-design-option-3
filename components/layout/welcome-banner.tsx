"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { X, ArrowRight, BookOpen, Video, Calendar } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/hooks";

export function WelcomeBanner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      setShow(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [searchParams, router]);

  if (!show) return null;

  const quickStart = [
    {
      icon: <BookOpen size={16} />,
      color: "#C9A84C",
      title: t("widget.exploreToolkit"),
      desc: t("widget.exploreToolkitDesc"),
      href: "/dashboard/library",
    },
    {
      icon: <Video size={16} />,
      color: "#8B5CF6",
      title: t("widget.watchMasterclass"),
      desc: t("widget.watchMasterclassDesc"),
      href: "/dashboard/masterclasses",
    },
    {
      icon: <Calendar size={16} />,
      color: "#10B981",
      title: t("widget.bookExpert"),
      desc: t("widget.bookExpertDesc"),
      href: "/dashboard/experts",
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShow(false)} />
      <div className="relative bg-surface border border-brand/20 rounded-2xl p-8 max-w-md w-full shadow-2xl gold-glow animate-slide-up">
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-lg transition-all"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-2xl mb-5">
          🎤
        </div>

        <h2 className="text-2xl font-black text-text-primary mb-2">{t("widget.welcomeTitle")}</h2>
        <p className="text-text-muted text-sm mb-6 leading-relaxed">{t("widget.welcomeDesc")}</p>

        <div className="space-y-2.5 mb-7">
          {quickStart.map(({ icon, color, title, desc, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setShow(false)}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-2 hover:bg-surface border border-transparent hover:border-border transition-all group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20`, color }}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{title}</p>
                <p className="text-xs text-text-muted">{desc}</p>
              </div>
              <ArrowRight size={14} className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          ))}
        </div>

        <button
          onClick={() => setShow(false)}
          className="w-full bg-gold-gradient text-background font-bold text-sm py-3 rounded-xl hover:brightness-110 transition-all"
        >
          {t("widget.letsGo")}
        </button>
      </div>
    </div>
  );
}
