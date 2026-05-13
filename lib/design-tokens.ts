/**
 * ROSTER Design Tokens — Single Source of Truth
 *
 * This file is the canonical reference for all brand colours, typography,
 * spacing, shadows, and animation values used across the codebase.
 *
 * ── How values flow ──────────────────────────────────────────────────────────
 *
 *   design-tokens.ts   ←  YOU ARE HERE (edit here first)
 *         │
 *         ├──▶  tailwind.config.js        (imported as JS-compatible object)
 *         │
 *         └──▶  app/globals.css           (CSS custom properties — keep in sync
 *                                          manually; values here are the source)
 *
 * ── Figma sync ───────────────────────────────────────────────────────────────
 *   Export via Tokens Studio or Figma Variables using the `colors` object below.
 *   Token names map 1-to-1 with CSS variable names (e.g. `brand` → `--brand`).
 *
 * ── Adding a new token ───────────────────────────────────────────────────────
 *   1. Add to this file (dark value in `colors.dark`, light in `colors.light`)
 *   2. Add CSS var to app/globals.css :root / [data-theme="light"] blocks
 *   3. Add Tailwind alias to tailwind.config.js colors section
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Colour Palette ────────────────────────────────────────────────────────────

export const palette = {
  // Midnight black / navy
  inkDeep:    "#080B14",
  inkDark:    "#111827",
  inkMid:     "#1F2937",
  inkLight:   "#374151",

  // Slate greys
  slateDeep:  "#0F172A",
  slateMid:   "#64748B",
  slateLight: "#94A3B8",
  slateSnow:  "#F1F5F9",

  // Gold — Midnight Gold brand
  goldPure:   "#C9A84C",
  goldBright: "#F59E0B",
  goldDeep:   "#9A7820",
  goldMuted:  "#92712C",
  goldDark:   "#7A5F18",

  // Semantic
  emerald:    "#10B981",
  emeraldDim: "#059669",
  crimson:    "#EF4444",
  crimsonDim: "#DC2626",

  // Light surface
  cloudBase:  "#F4F6FB",
  cloudSurf:  "#FFFFFF",
  cloudMid:   "#EDF0F7",
  cloudEdge:  "#E2E8F0",
} as const;

// ── Semantic Tokens (Dark theme — default) ────────────────────────────────────

export const dark = {
  background:   palette.inkDeep,
  surface:      palette.inkDark,
  "surface-2":  palette.inkMid,
  border:       palette.inkMid,

  brand:        palette.goldPure,
  "brand-rgb":  "201 168 76",
  "brand-light":palette.goldBright,
  "brand-muted":palette.goldMuted,

  "text-primary": palette.slateSnow,
  "text-muted":   palette.slateMid,
  "text-subtle":  palette.inkLight,

  success:      palette.emerald,
  "success-rgb":"16 185 129",
  error:        palette.crimson,
  "error-rgb":  "239 68 68",
} as const;

// ── Semantic Tokens (Light theme) ─────────────────────────────────────────────

export const light = {
  background:   palette.cloudBase,
  surface:      palette.cloudSurf,
  "surface-2":  palette.cloudMid,
  border:       palette.cloudEdge,

  brand:        palette.goldDeep,
  "brand-rgb":  "154 120 32",
  "brand-light":palette.goldPure,
  "brand-muted":palette.goldDark,

  "text-primary": palette.slateDeep,
  "text-muted":   palette.slateMid,
  "text-subtle":  palette.slateLight,

  success:      palette.emeraldDim,
  "success-rgb":"5 150 105",
  error:        palette.crimsonDim,
  "error-rgb":  "220 38 38",
} as const;

// ── Typography ────────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    sans:    ["Inter", "system-ui", "sans-serif"],
    display: ["Inter", "system-ui", "sans-serif"],
    mono:    ["JetBrains Mono", "Fira Code", "monospace"],
  },
  fontSize: {
    xs:   "0.75rem",   // 12px
    sm:   "0.875rem",  // 14px
    base: "1rem",      // 16px
    lg:   "1.125rem",  // 18px
    xl:   "1.25rem",   // 20px
    "2xl":"1.5rem",    // 24px
    "3xl":"1.875rem",  // 30px
    "4xl":"2.25rem",   // 36px
  },
} as const;

// ── Gradients ─────────────────────────────────────────────────────────────────

export const gradients = {
  gold:   `linear-gradient(135deg, ${palette.goldPure} 0%, ${palette.goldBright} 100%)`,
  dark:   `linear-gradient(180deg, ${palette.inkDeep} 0%, ${palette.inkDark} 100%)`,
  hero:   `radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.15) 0%, rgba(8,11,20,0) 70%)`,
} as const;

// ── Shadows ───────────────────────────────────────────────────────────────────

export const shadows = {
  sm:    "0 1px 2px rgba(0,0,0,0.4)",
  md:    "0 4px 12px rgba(0,0,0,0.4)",
  lg:    "0 8px 24px rgba(0,0,0,0.5)",
  brand: `0 0 0 2px rgba(201,168,76,0.4)`,
  glow:  `0 0 20px rgba(201,168,76,0.2)`,
} as const;

// ── Animation ─────────────────────────────────────────────────────────────────

export const animation = {
  duration: {
    fast:   "150ms",
    base:   "200ms",
    slow:   "300ms",
    slower: "500ms",
  },
  easing: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    enter:    "cubic-bezier(0, 0, 0.2, 1)",
    exit:     "cubic-bezier(0.4, 0, 1, 1)",
  },
} as const;

// ── Tailwind-compatible colour map ────────────────────────────────────────────
// Used by tailwind.config.js. Hardcoded hex required for Tailwind opacity
// modifier support (bg-brand/50 etc). CSS vars cannot be used here directly.

export const tailwindColors = {
  background: dark.background,
  surface:    dark.surface,
  "surface-2":dark["surface-2"],
  border:     dark.border,
  brand: {
    DEFAULT: dark.brand,
    light:   dark["brand-light"],
    muted:   dark["brand-muted"],
  },
  text: {
    primary: dark["text-primary"],
    muted:   dark["text-muted"],
    subtle:  dark["text-subtle"],
  },
  success: dark.success,
  error:   dark.error,
} as const;

// ── Default export (full token set) ──────────────────────────────────────────

const tokens = {
  palette,
  dark,
  light,
  typography,
  gradients,
  shadows,
  animation,
  tailwindColors,
} as const;

export default tokens;
