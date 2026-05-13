import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type BadgeVariant = "default" | "success" | "error" | "warning" | "info" | "brand" | "outline";

interface BadgeProps {
  children:  ReactNode;
  variant?:  BadgeVariant;
  size?:     "sm" | "md";
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default:  "bg-surface-2 text-text-muted border border-border",
  brand:    "bg-brand/10 text-brand border border-brand/20",
  success:  "bg-success/10 text-success border border-success/20",
  error:    "bg-error/10 text-error border border-error/20",
  warning:  "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  info:     "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  outline:  "bg-transparent text-text-muted border border-border",
};

const SIZE_CLASSES = {
  sm: "px-1.5 py-0.5 text-[10px] font-medium",
  md: "px-2.5 py-1   text-xs    font-medium",
};

export function Badge({ children, variant = "default", size = "md", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full leading-none whitespace-nowrap",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
    >
      {children}
    </span>
  );
}
