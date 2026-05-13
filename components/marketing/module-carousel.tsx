"use client";

// ============================================================
// ModuleCarousel — animated 2×2 grid for the Platform section
// ------------------------------------------------------------
// Cycles through all 15 ROSTER modules one card at a time.
// Each swap animates as a 3D card flip:
//   1. Card rotates forward to 90° (edge-on, invisible)
//   2. Content swaps instantly while edge-on
//   3. Card rotates in from -90° back to 0° (new face revealed)
//
// Rotates round-robin across the 4 grid positions.
// Pauses on hover so visitors can read the card.
// ============================================================

import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MODULES } from "@/lib/constants";
import { ModuleIcon } from "@/components/icons/module-icons";

const SWAP_INTERVAL_MS = 2800; // ms between swaps
const FLIP_OUT_MS      = 220;  // card rotates edge-on (0° → 90°)
const FLIP_IN_MS       = 280;  // new face rotates into view (−90° → 0°)

type FlipPhase = "out" | "in-start" | "in" | null;

export function ModuleCarousel() {
  const [slots, setSlots]           = useState<number[]>([0, 1, 2, 3]);
  const [flippingSlot, setFlippingSlot] = useState<number | null>(null);
  const [flipPhase, setFlipPhase]   = useState<FlipPhase>(null);
  const [paused, setPaused]         = useState(false);

  const nextModuleRef = useRef(4);
  const nextSlotRef   = useRef(0);

  const runSwap = useCallback(() => {
    const slotToFlip  = nextSlotRef.current;
    const moduleToShow = nextModuleRef.current % MODULES.length;

    // ── Phase 1: flip out (rotate forward to edge) ──────────
    setFlippingSlot(slotToFlip);
    setFlipPhase("out");

    setTimeout(() => {
      // ── Phase 2: swap content + jump to back-edge (-90°) ──
      setSlots((prev) => {
        const next = [...prev];
        next[slotToFlip] = moduleToShow;
        return next;
      });
      setFlipPhase("in-start");

      nextModuleRef.current += 1;
      nextSlotRef.current = (nextSlotRef.current + 1) % 4;

      // ── Phase 3: on next paint, animate from -90° → 0° ───
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFlipPhase("in");

          setTimeout(() => {
            setFlippingSlot(null);
            setFlipPhase(null);
          }, FLIP_IN_MS);
        });
      });
    }, FLIP_OUT_MS);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(runSwap, SWAP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, runSwap]);

  // ── Per-card 3D transform style ──────────────────────────
  function cardStyle(slotIdx: number, color: string): CSSProperties {
    const isFlipping = flippingSlot === slotIdx;

    let transform          = "rotateY(0deg)";
    let transitionDuration = `${FLIP_IN_MS}ms`;
    let transitionEasing   = "cubic-bezier(0.4, 0, 0.2, 1)";

    if (isFlipping) {
      if (flipPhase === "out") {
        transform          = "rotateY(90deg)";
        transitionDuration = `${FLIP_OUT_MS}ms`;
        transitionEasing   = "cubic-bezier(0.4, 0, 1, 1)"; // ease-in for flip out
      } else if (flipPhase === "in-start") {
        transform          = "rotateY(-90deg)";
        transitionDuration = "0ms"; // instant jump — card is edge-on, invisible
      } else if (flipPhase === "in") {
        transform          = "rotateY(0deg)";
        transitionDuration = `${FLIP_IN_MS}ms`;
        transitionEasing   = "cubic-bezier(0, 0, 0.2, 1)"; // ease-out for flip in
      }
    }

    return {
      borderColor: `${color}22`,
      transform,
      transition: `transform ${transitionDuration} ${transitionEasing}, border-color 200ms ease`,
      transformOrigin: "center center",
      willChange: "transform",
    };
  }

  return (
    <div
      className="mb-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {slots.map((moduleIdx, slotIdx) => {
          const mod = MODULES[moduleIdx];

          return (
            // Perspective wrapper per slot — gives each card its own
            // vanishing point so the flip reads cleanly regardless of
            // grid position.
            <div
              key={slotIdx}
              style={{ perspective: "900px", perspectiveOrigin: "50% 50%" }}
            >
              <Link
                href="/auth/signup"
                className="group glass-card rounded-2xl p-8 block hover:scale-[1.01] h-full"
                style={cardStyle(slotIdx, mod.color)}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${mod.color}12` }}
                >
                  <ModuleIcon id={mod.id} size={26} style={{ color: mod.color }} />
                </div>

                <p
                  className="text-[11px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: mod.color }}
                >
                  {mod.subtitle}
                </p>

                <h3 className="text-xl font-black text-text-primary mb-3 group-hover:text-gold transition-colors">
                  {mod.title}
                </h3>

                <p className="text-sm text-text-muted leading-relaxed">
                  {mod.description}
                </p>

                <div
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold"
                  style={{ color: mod.color }}
                >
                  Explore module
                  <ArrowRight
                    size={13}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Progress pips */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {MODULES.map((_, i) => {
          const isVisible = slots.includes(i);
          return (
            <div
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width: isVisible ? 16 : 4,
                height: 4,
                backgroundColor: isVisible
                  ? MODULES[i].color
                  : "rgba(255,255,255,0.12)",
              }}
            />
          );
        })}
      </div>

      {paused && (
        <p className="text-center text-[10px] text-text-muted/50 mt-2 tracking-wide">
          Paused — move away to resume
        </p>
      )}
    </div>
  );
}
