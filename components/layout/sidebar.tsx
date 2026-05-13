"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Video, CalendarDays, Settings,
  LogOut, Users2, GraduationCap, PenLine, History, FolderOpen,
  Users, Star,
} from "lucide-react";
import { ConstellationIcon } from "@/components/icons/constellation-icon";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTranslation } from "@/lib/i18n/hooks";
import { useState, useEffect } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { t }    = useTranslation();
  const [isExpert, setIsExpert] = useState(false);

  useEffect(() => {
    const checkExpert = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("experts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsExpert(!!data);
    };
    checkExpert();
  }, []);

  const mainNav = [
    { href: "/dashboard",               label: t("nav.dashboard"),        icon: LayoutDashboard },
    { href: "/dashboard/library",       label: "Toolkit",                 icon: BookOpen },
    { href: "/dashboard/workspace",     label: "Workspace",               icon: FolderOpen },
    { href: "/dashboard/calendar",      label: "Calendar",                icon: CalendarDays },
    { href: "/dashboard/masterclasses", label: t("nav.masterclasses"),    icon: Video },
    { href: "/dashboard/experts",       label: "Meet the Experts",        icon: Users },
    { href: "/dashboard/contacts",      label: t("nav.directory"),        icon: Users2 },
    { href: "/dashboard/signing",       label: "eSignature",              icon: PenLine },
    { href: "/dashboard/audit-trail",   label: t("nav.auditTrail"),       icon: History },
    { href: "/dashboard/learn",         label: t("nav.learn"),            icon: GraduationCap },
    ...(isExpert ? [{ href: "/dashboard/expert", label: t("nav.expertDashboard"), icon: Star }] : []),
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col z-40 hidden lg:flex border-r"
      style={{
        width: "244px",
        background: "color-mix(in oklab, var(--bg) 90%, transparent)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--line)",
      }}
      aria-label={t("nav.dashboard")}
    >
      {/* Wordmark */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--line)" }}>
        <Link href="/" className="flex items-center gap-2.5" aria-label={APP_NAME}>
          <div
            className="w-8 h-8 rounded-[8px] shrink-0 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              boxShadow: "0 0 20px color-mix(in oklab, var(--accent) 45%, transparent)",
            }}
          >
            <span className="font-mono text-[9px] font-bold" style={{ color: "var(--accent-on)" }}>R</span>
          </div>
          <div>
            <div
              className="text-[17px] font-bold tracking-[0.16em] leading-none"
              style={{ color: "var(--ink)" }}
            >
              {APP_NAME}
            </div>
            <div className="font-mono text-[8.5px] uppercase tracking-[0.22em] mt-0.5" style={{ color: "var(--mute)" }}>
              by JO:LA Labs
            </div>
          </div>
        </Link>
      </div>


      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3" aria-label={t("nav.dashboard")}>
        <div className="space-y-0.5">
          {mainNav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="w-full flex items-center gap-3 px-3 h-9 rounded-[8px] text-[13px] transition-all relative group"
                style={{
                  color: active ? "var(--ink)" : "var(--mute)",
                  fontWeight: active ? 600 : 400,
                  background: active
                    ? "linear-gradient(90deg, color-mix(in oklab, var(--accent) 14%, transparent), transparent 80%)"
                    : "transparent",
                  textDecoration: "none",
                }}
              >
                {active && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r"
                    style={{
                      background: "var(--accent)",
                      boxShadow: "0 0 12px var(--accent)",
                    }}
                  />
                )}
                <Icon
                  size={15}
                  className="shrink-0"
                  style={{ opacity: active ? 1 : 0.75, color: active ? "var(--accent)" : "currentColor" }}
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* ROSTER AI */}
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--line)" }}>
          <Link
            href="/dashboard/assistant"
            aria-current={isActive("/dashboard/assistant") ? "page" : undefined}
            className="w-full flex items-center gap-3 px-3 h-9 rounded-[8px] text-[13px] transition-all relative"
            style={{
              color: isActive("/dashboard/assistant") ? "var(--ink)" : "var(--mute)",
              fontWeight: isActive("/dashboard/assistant") ? 600 : 500,
              background: isActive("/dashboard/assistant")
                ? "linear-gradient(90deg, color-mix(in oklab, var(--accent) 16%, transparent), color-mix(in oklab, var(--accent-2) 8%, transparent) 80%)"
                : "color-mix(in oklab, var(--accent) 5%, transparent)",
              border: "1px solid color-mix(in oklab, var(--accent) 20%, transparent)",
              textDecoration: "none",
            }}
          >
            <ConstellationIcon size={15} style={{ color: "var(--accent)" }} />
            <span>{t("nav.assistant")}</span>
            <span
              className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full"
              style={{
                color: "var(--accent-3)",
                border: "1px solid color-mix(in oklab, var(--accent-3) 35%, transparent)",
              }}
            >
              Beta
            </span>
          </Link>
        </div>
      </nav>


      {/* Bottom */}
      <div className="px-2.5 py-3 border-t space-y-0.5" style={{ borderColor: "var(--line)" }}>
        <Link
          href="/dashboard/settings"
          className="w-full flex items-center gap-3 px-3 h-9 rounded-[8px] text-[13px] transition-all"
          style={{
            color: isActive("/dashboard/settings") ? "var(--ink)" : "var(--mute)",
            background: isActive("/dashboard/settings") ? "var(--surface-2)" : "transparent",
            textDecoration: "none",
          }}
        >
          <Settings size={14} />
          {t("nav.settings")}
        </Link>

        <div className="pt-2 mt-1 border-t" style={{ borderColor: "var(--line)" }}>
          <div className="px-2 py-2 flex items-center gap-2.5">
            {/* Avatar placeholder */}
            <div
              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-mono text-[11px] font-bold"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                color: "var(--accent-on)",
              }}
            >
              U
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] truncate leading-tight" style={{ color: "var(--ink)" }}>Account</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] truncate" style={{ color: "var(--mute)" }}>
                ROSTER
              </div>
            </div>
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: "var(--accent-3)", boxShadow: "0 0 8px var(--accent-3)" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 pt-1">
          <button
            onClick={handleSignOut}
            className="flex-1 flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] transition-all whitespace-nowrap"
            style={{ color: "var(--mute)" }}
          >
            <LogOut size={14} />
            {t("nav.signOut")}
          </button>
          <ThemeToggle className="flex-shrink-0" />
          <LanguageSwitcher className="flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
