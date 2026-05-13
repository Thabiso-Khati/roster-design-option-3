"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Video, CalendarDays, Menu, X, FolderOpen,
  Star, LogOut, Users2, Users,
  GraduationCap, PenLine, History,
} from "lucide-react";
import { ConstellationIcon } from "@/components/icons/constellation-icon";
import { useState, useEffect } from "react";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/hooks";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isExpert, setIsExpert] = useState(false);
  const drawerRef = useFocusTrap(drawerOpen);

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
    void checkExpert();
  }, []);

  // ── 5 primary tabs ──────────────────────────────────────────
  const bottomTabs = [
    { href: "/dashboard",           label: t("nav.dashboard"), icon: LayoutDashboard, exact: true },
    { href: "/dashboard/library",   label: "Toolkit",         icon: BookOpen },
    { href: "/dashboard/workspace", label: "Workspace",       icon: FolderOpen },
  ];

  // ── Drawer links — mirrors desktop sidebar order ────────────
  const drawerLinks = [
    { href: "/dashboard",               label: t("nav.dashboard"),     icon: LayoutDashboard },
    { href: "/dashboard/library",       label: "Toolkit",              icon: BookOpen },
    { href: "/dashboard/workspace",     label: "Workspace",            icon: FolderOpen },
    { href: "/dashboard/calendar",       label: "Calendar",             icon: CalendarDays },
    { href: "/dashboard/masterclasses", label: t("nav.masterclasses"),  icon: Video },
    { href: "/dashboard/experts",       label: "Meet the Experts",     icon: Users },
    { href: "/dashboard/contacts",      label: t("nav.directory"),     icon: Users2 },
    { href: "/dashboard/signing",       label: "eSignature",           icon: PenLine },
    { href: "/dashboard/audit-trail",   label: t("nav.auditTrail"),    icon: History },
    { href: "/dashboard/learn",         label: t("nav.learn"),         icon: GraduationCap },
    ...(isExpert ? [{ href: "/dashboard/expert", label: t("nav.expertDashboard"), icon: Star }] : []),
  ];

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const isAIActive = pathname.startsWith("/dashboard/assistant");

  return (
    <>
      {/* ── Bottom nav bar ─────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface/95 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch h-[72px]">
          {/* Left 3 tabs */}
          {bottomTabs.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 transition-all",
                  active ? "text-brand" : "text-text-muted hover:text-text-primary"
                )}>
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
                <span className="text-[10px] font-semibold tracking-wide leading-none">{label}</span>
              </Link>
            );
          })}

          {/* ROSTER AI — centrepiece tab */}
          <Link
            href="/dashboard/assistant"
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 transition-all",
              isAIActive ? "text-brand" : "text-brand/55 hover:text-brand"
            )}
          >
            <ConstellationIcon
              size={21}
              aria-hidden="true"
              className={isAIActive ? "text-brand" : "text-brand/55"}
            />
            <span className={cn(
              "text-[10px] font-semibold tracking-wide leading-none",
              isAIActive ? "text-brand" : "text-brand/55"
            )}>ROSTER AI</span>
          </Link>

          {/* More tab */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-text-muted hover:text-text-primary transition-all"
            aria-label={t("nav.openMenu")}
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
          >
            <Menu size={21} strokeWidth={1.8} aria-hidden="true" />
            <span className="text-[10px] font-semibold tracking-wide leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* ── Drawer ─────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-drawer"
            ref={drawerRef as React.RefObject<HTMLDivElement>}
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.openMenu")}
            className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl border-t border-border animate-slide-up max-h-[92vh] flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-surface-2" />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <Link href="/" onClick={() => setDrawerOpen(false)} className="flex flex-col">
                <span className="text-base font-black tracking-widest text-gold leading-none">{APP_NAME}</span>
                <span className="text-[8px] font-semibold tracking-widest text-text-muted uppercase mt-0.5">by JO:LA LABS</span>
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label={t("nav.closeMenu")}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <nav className="px-3 py-3">
                {drawerLinks.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                  return (
                    <Link key={href} href={href} onClick={() => setDrawerOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-0.5",
                        active ? "bg-brand/10 text-brand" : "text-text-muted hover:text-text-primary hover:bg-surface-2"
                      )}>
                      <Icon size={18} aria-hidden="true" />
                      {label}
                    </Link>
                  );
                })}
                {/* ROSTER AI — separated at bottom of drawer */}
                <div className="mt-2 pt-2 border-t border-border">
                  <Link
                    href="/dashboard/assistant"
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isAIActive ? "bg-brand/10 text-brand" : "text-text-muted hover:text-text-primary hover:bg-surface-2"
                    )}
                  >
                    <ConstellationIcon size={18} aria-hidden="true" />
                    ROSTER AI
                  </Link>
                </div>
              </nav>
            </div>
            <div className="px-3 pb-4 border-t border-border pt-3 flex-shrink-0 space-y-1">
              <div className="px-1 pb-1">
                <LanguageSwitcher showName className="w-full" />
              </div>
              <button onClick={() => { void handleSignOut(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:text-error hover:bg-error/5 transition-all">
                <LogOut size={18} aria-hidden="true" />
                {t("nav.signOut")}
              </button>
            </div>
            <div style={{ height: "env(safe-area-inset-bottom)" }} />
          </div>
        </div>
      )}
    </>
  );
}
