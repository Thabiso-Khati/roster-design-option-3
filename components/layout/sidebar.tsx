"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Video, CalendarDays, Settings,
  LogOut, ChevronRight, Star, Users2,
  GraduationCap, PenLine, History, FolderOpen, Users,
} from "lucide-react";
import { ConstellationIcon } from "@/components/icons/constellation-icon";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTranslation } from "@/lib/i18n/hooks";
import { useState, useEffect } from "react";

export function Sidebar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const { t }      = useTranslation();
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
    { href: "/dashboard",               label: t("nav.dashboard"),     icon: LayoutDashboard },
    { href: "/dashboard/library",       label: "Toolkit",             icon: BookOpen },
    { href: "/dashboard/workspace",     label: "Workspace",           icon: FolderOpen },
    { href: "/dashboard/calendar",       label: "Calendar",            icon: CalendarDays },
    { href: "/dashboard/masterclasses", label: t("nav.masterclasses"), icon: Video },
    { href: "/dashboard/experts",       label: "Meet the Experts",    icon: Users },
    { href: "/dashboard/contacts",      label: t("nav.directory"),    icon: Users2 },
    { href: "/dashboard/signing",       label: "eSignature",          icon: PenLine },
    { href: "/dashboard/audit-trail",   label: t("nav.auditTrail"),   icon: History },
    { href: "/dashboard/learn",         label: t("nav.learn"),        icon: GraduationCap },
    ...(isExpert ? [{ href: "/dashboard/expert", label: t("nav.expertDashboard"), icon: Star }] : []),
  ];

  const bottomNav = [
    { href: "/dashboard/settings", label: t("nav.settings"), icon: Settings },
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
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border flex flex-col z-40 hidden lg:flex" aria-label={t("nav.dashboard")}>
      <div className="px-6 py-6 border-b border-border">
        <Link href="/" className="block" aria-label={`${APP_NAME} — ${t("nav.home")}`}>
          <span className="text-lg font-black tracking-widest text-gold">{APP_NAME}</span>
          <span className="block text-[9px] font-semibold tracking-widest text-text-muted uppercase mt-0.5">
            by JO:LA LABS
          </span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-5 overflow-y-auto" aria-label={t("nav.dashboard")}>
        <div className="space-y-0.5">
          {mainNav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const isWorkspace = href === "/dashboard/workspace";
            return (
              <Link key={href} href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? isWorkspace
                      ? "bg-brand/15 text-brand"
                      : "bg-brand/10 text-brand"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-2"
                )}>
                <Icon size={17} aria-hidden="true" style={active && isWorkspace ? { color: "#C9A84C" } : undefined} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto text-brand/60" aria-hidden="true" />}
              </Link>
            );
          })}
        </div>
        {/* ROSTER AI — visually separated */}
        <div className="mt-3 pt-3 border-t border-border">
          <Link
            href="/dashboard/assistant"
            aria-current={isActive("/dashboard/assistant") ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              isActive("/dashboard/assistant")
                ? "bg-brand/10 text-brand"
                : "text-text-muted hover:text-text-primary hover:bg-surface-2"
            )}
          >
            <ConstellationIcon size={17} aria-hidden="true" />
            {t("nav.assistant")}
            {isActive("/dashboard/assistant") && (
              <ChevronRight size={14} className="ml-auto text-brand/60" aria-hidden="true" />
            )}
          </Link>
        </div>
      </nav>
      <div className="px-3 py-4 border-t border-border space-y-0.5">
        {bottomNav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all">
            <Icon size={17} aria-hidden="true" />
            {label}
          </Link>
        ))}
        <div className="flex items-center gap-1">
          <button onClick={handleSignOut}
            className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-error hover:bg-error/5 transition-all whitespace-nowrap">
            <LogOut size={17} aria-hidden="true" />
            {t("nav.signOut")}
          </button>
          <ThemeToggle className="flex-shrink-0" />
          <LanguageSwitcher className="flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
