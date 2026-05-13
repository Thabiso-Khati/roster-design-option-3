"use client";
/**
 * Dropdown — ROSTER UI primitive
 *
 * A lightweight trigger + panel pattern for action menus.
 * Uses CSS + focus-outside detection rather than Radix to avoid
 * adding a dependency for a common pattern.
 *
 * Usage:
 *   <Dropdown
 *     trigger={<Button variant="ghost" size="sm"><MoreHorizontal size={16} /></Button>}
 *     items={[
 *       { label: "Edit",   icon: <Pencil size={14} />, onClick: () => {} },
 *       { label: "Delete", icon: <Trash2 size={14} />, onClick: () => {}, danger: true },
 *     ]}
 *   />
 */
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  label:     string;
  icon?:     ReactNode;
  onClick:   () => void;
  danger?:   boolean;
  disabled?: boolean;
  dividerBefore?: boolean;
}

type DropdownAlign = "left" | "right";

interface DropdownProps {
  trigger:    ReactNode;
  items:      DropdownItem[];
  align?:     DropdownAlign;
  className?: string;
}

export function Dropdown({ trigger, items, align = "right", className }: DropdownProps) {
  const [open, setOpen]   = useState(false);
  const containerRef      = useRef<HTMLDivElement>(null);

  // Close on outside click or focus-out
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | FocusEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("focusin",   handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("focusin",   handler);
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleItemClick = useCallback((item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick();
    setOpen(false);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {/* Trigger */}
      <div onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
        {trigger}
      </div>

      {/* Panel */}
      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={cn(
            "absolute z-50 mt-1 min-w-[160px] py-1",
            "bg-surface border border-border rounded-xl shadow-xl",
            "animate-fade-in",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) => (
            <div key={i}>
              {item.dividerBefore && (
                <div className="my-1 border-t border-border" role="separator" />
              )}
              <button
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left",
                  "transition-colors duration-100",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  item.danger
                    ? "text-error hover:bg-error/10"
                    : "text-text-primary hover:bg-surface-2"
                )}
              >
                {item.icon && (
                  <span className={cn("flex-shrink-0", item.danger ? "text-error" : "text-text-muted")}>
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
