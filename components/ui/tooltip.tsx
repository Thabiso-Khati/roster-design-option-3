"use client";
/**
 * Tooltip — ROSTER UI primitive
 *
 * Usage:
 *   <Tooltip content="Delete artist">
 *     <button>…</button>
 *   </Tooltip>
 *
 * Renders as a CSS-only tooltip using :hover + :focus-within so it works
 * without JavaScript and is accessible. For complex rich tooltips use the
 * `asChild` pattern with a Radix tooltip.
 */
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type TooltipSide = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content:    ReactNode;
  children:   ReactNode;
  side?:      TooltipSide;
  className?: string;
  /** Max-width of the tooltip bubble */
  maxWidth?:  string;
}

const SIDE_CLASSES: Record<TooltipSide, { container: string; bubble: string }> = {
  top: {
    container: "flex flex-col items-center",
    bubble:    "bottom-full mb-2 left-1/2 -translate-x-1/2",
  },
  bottom: {
    container: "flex flex-col items-center",
    bubble:    "top-full mt-2 left-1/2 -translate-x-1/2",
  },
  left: {
    container: "flex flex-row items-center",
    bubble:    "right-full mr-2 top-1/2 -translate-y-1/2",
  },
  right: {
    container: "flex flex-row items-center",
    bubble:    "left-full ml-2 top-1/2 -translate-y-1/2",
  },
};

export function Tooltip({
  content,
  children,
  side = "top",
  className,
  maxWidth = "200px",
}: TooltipProps) {
  const { container, bubble } = SIDE_CLASSES[side];

  return (
    <span
      className={cn(
        "relative inline-flex group",
        container,
        className
      )}
    >
      {children}

      <span
        role="tooltip"
        style={{ maxWidth }}
        className={cn(
          "absolute z-50 px-2.5 py-1.5 rounded-lg text-xs font-medium",
          "bg-surface-2 border border-border text-text-primary shadow-lg",
          "pointer-events-none whitespace-nowrap",
          "opacity-0 scale-95 transition-all duration-150",
          "group-hover:opacity-100 group-hover:scale-100",
          "group-focus-within:opacity-100 group-focus-within:scale-100",
          bubble
        )}
      >
        {content}
      </span>
    </span>
  );
}
