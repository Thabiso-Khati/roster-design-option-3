/**
 * RosterAIBadge — the canonical ✦ ROSTER AI pill.
 *
 * Uses the ConstellationIcon SVG (same as sidebar) so the mark is
 * always consistent across every surface that references ROSTER AI.
 *
 * Usage:
 *   <RosterAIBadge />                        — default gold pill
 *   <RosterAIBadge size="lg" />              — larger variant
 *   <RosterAIBadge className="ml-2" />       — with layout overrides
 */

import { ConstellationIcon } from "@/components/icons/constellation-icon";
import { cn } from "@/lib/utils";

type BadgeSize = "sm" | "md" | "lg";

const SIZE: Record<BadgeSize, { icon: number; text: string; px: string; py: string }> = {
  sm: { icon: 8,  text: "text-[9px]",  px: "px-1",   py: "py-0.5" },
  md: { icon: 10, text: "text-[10px]", px: "px-1.5", py: "py-0.5" },
  lg: { icon: 13, text: "text-xs",     px: "px-2",   py: "py-1"   },
};

export function RosterAIBadge({
  size = "md",
  className,
}: {
  size?: BadgeSize;
  className?: string;
}) {
  const s = SIZE[size];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-black uppercase rounded flex-shrink-0",
        s.text,
        s.px,
        s.py,
        className
      )}
      style={{ color: "#C9A84C", backgroundColor: "rgba(201,168,76,0.12)" }}
    >
      <ConstellationIcon size={s.icon} />
      ROSTER AI
    </span>
  );
}
