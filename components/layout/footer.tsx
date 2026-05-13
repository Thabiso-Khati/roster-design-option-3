"use client";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/hooks";

export function Footer() {
  const { t } = useTranslation();

  const platformLinks = [
    [t("library.title"),         "/#platform"],
    [t("masterclasses.title"),   "/#masterclasses"],
    [t("action.bookSession"),    "/#experts"],
    ["Pricing",                  "/pricing"],
  ] as const;

  const accountLinks = [
    [t("action.signUp"),         "/auth/signup"],
    [t("action.signIn"),         "/auth/login"],
    [t("nav.dashboard"),         "/dashboard"],
  ] as const;

  return (
    <footer className="bg-surface border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <span className="text-2xl font-black tracking-widest text-gold">
              {APP_NAME}
            </span>
            <p className="mt-3 text-text-muted text-sm leading-relaxed max-w-xs">
              {t("footer.brandDesc")}
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
              {t("footer.platform")}
            </h4>
            <ul className="space-y-2.5">
              {platformLinks.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
              {t("footer.account")}
            </h4>
            <ul className="space-y-2.5">
              {accountLinks.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            {t("misc.copyright", { year: String(new Date().getFullYear()) })}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-text-muted hover:text-text-primary transition-colors">
              {t("misc.privacyPolicy")}
            </Link>
            <Link href="/terms" className="text-xs text-text-muted hover:text-text-primary transition-colors">
              {t("misc.termsOfService")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
