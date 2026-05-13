"use client";
/**
 * ROSTER — ThemeToggle
 *
 * Compact icon button that cycles through:
 *   dark → light → system → dark → …
 *
 * Shows the CURRENT mode as the icon. Tooltip reveals the label.
 * Sits in the sidebar footer beside LanguageSwitcher.
 */

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/context/theme-context";
import { cn } from "@/lib/utils";

const CYCLE: Theme[] = ["dark", "light", "system"];

const META: Record<Theme, { icon: React.ReactNode; label: string }> = {
  dark:   { icon: <Moon size={15} />,    label: "Dark" },
  light:  { icon: <Sun size={15} />,     label: "Light" },
  system: { icon: <Monitor size={15} />, label: "System" },
};

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const handleClick = () => {
    const idx = CYCLE.indexOf(theme);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setTheme(next);
  };

  const { icon, label } = META[theme];

  return (
    <button
      onClick={handleClick}
      title={`Theme: ${label} — click to cycle`}
      aria-label={`Switch theme (current: ${label})`}
      className={cn(
        "p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all",
        className
      )}
    >
      {icon}
    </button>
  );
}
