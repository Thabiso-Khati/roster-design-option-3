"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/hooks";

export function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-widest text-gold leading-none">
              {APP_NAME}
            </span>
            <span className="text-[8px] font-semibold tracking-widest text-text-muted uppercase mt-0.5">
              by JO:LA LABS
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                {t("action.signIn")}
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">{t("action.getStarted")}</Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden text-text-muted hover:text-text-primary p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t(menuOpen ? "nav.closeMenu" : "nav.openMenu")}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-surface border-b border-border animate-fade-in">
          <div className="px-4 py-6 space-y-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-text-muted hover:text-text-primary transition-colors py-2"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-3 border-t border-border">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" size="md" className="w-full">
                  {t("action.signIn")}
                </Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)}>
                <Button size="md" className="w-full">
                  {t("action.getStarted")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
