"use client";

/**
 * LanguageSwitcher
 *
 * A compact dropdown that lets users switch the UI language between
 * English, Français, Kiswahili, Português, and العربية.
 *
 * Persistence: writes to localStorage (and Supabase profile when
 * connected) via locale-context's setUILanguage(). The change is
 * instant — no page reload required.
 *
 * Usage:
 *   <LanguageSwitcher />                    // compact (flag + code)
 *   <LanguageSwitcher showName />           // flag + native name
 *   <LanguageSwitcher variant="minimal" />  // flag only
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/context/locale-context";
import { LANGUAGES, type UILanguage } from "@/lib/i18n";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

interface LanguageSwitcherProps {
  showName?: boolean;
  variant?: "default" | "minimal";
  className?: string;
}

export function LanguageSwitcher({
  showName = false,
  variant = "default",
  className = "",
}: LanguageSwitcherProps) {
  const { uiLanguage, setUILanguage } = useLocale();
  const router                        = useRouter();
  const [open, setOpen]               = useState(false);
  const buttonRef                     = useRef<HTMLButtonElement>(null);
  const menuRef                       = useFocusTrap(open) as React.RefObject<HTMLDivElement>;

  const current = LANGUAGES.find(l => l.code === uiLanguage) ?? LANGUAGES[0];

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, menuRef]);

  const select = async (lang: UILanguage) => {
    setUILanguage(lang);
    setOpen(false);
    buttonRef.current?.focus();
    // Give the Supabase fire-and-forget write ~600 ms to land, then
    // refresh server components so WORKSPACE strings re-render in the new language.
    await new Promise(r => setTimeout(r, 600));
    router.refresh();
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.nameEn}. Click to change.`}
        onClick={() => setOpen(o => !o)}
        className={[
          "flex items-center gap-1.5 rounded-lg border border-border",
          "bg-surface text-sm text-text-secondary hover:text-text",
          "hover:bg-surface-raised transition-colors",
          variant === "minimal"
            ? "p-1.5"
            : "px-2.5 py-1.5",
        ].join(" ")}
      >
        <span aria-hidden="true" className="text-base leading-none">{current.flag}</span>
        {variant !== "minimal" && (
          <span className="font-medium tracking-wide">
            {showName ? current.name : current.code.toUpperCase()}
          </span>
        )}
        {variant !== "minimal" && (
          <svg
            aria-hidden="true"
            className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Select language"
          className={[
            "absolute z-50 mt-1.5 min-w-[160px] rounded-xl border border-border",
            "bg-surface shadow-lg py-1",
            // RTL: open to left if Arabic is active so it doesn't clip
            uiLanguage === "ar" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {LANGUAGES.map(lang => {
            const isCurrent = lang.code === uiLanguage;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isCurrent}
                type="button"
                onClick={() => select(lang.code)}
                dir={lang.dir}
                className={[
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm",
                  "transition-colors hover:bg-surface-raised",
                  isCurrent
                    ? "text-brand font-semibold"
                    : "text-text-secondary hover:text-text",
                  lang.dir === "rtl" ? "flex-row-reverse text-right" : "text-left",
                ].join(" ")}
              >
                <span aria-hidden="true" className="text-base shrink-0">{lang.flag}</span>
                <span className="flex-1">{lang.name}</span>
                {isCurrent && (
                  <svg
                    aria-hidden="true"
                    className="w-3.5 h-3.5 text-brand shrink-0"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
