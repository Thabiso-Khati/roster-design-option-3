/**
 * @type {import('tailwindcss').Config}
 *
 * ── IMPORTANT — colour source of truth ────────────────────────────────────
 * Brand colour values live in lib/design-tokens.ts.
 * Hardcoded hex is required HERE for Tailwind's opacity modifier support
 * (e.g. bg-brand/50). CSS vars cannot carry opacity modifiers.
 *
 * When updating a colour:
 *   1. Change the value in lib/design-tokens.ts  ← START HERE
 *   2. Mirror the change in this file (colours section below)
 *   3. Mirror the change in app/globals.css       (:root / [data-theme="light"])
 * ──────────────────────────────────────────────────────────────────────────
 */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ROSTER brand palette — Midnight Gold (dark theme defaults)
        // Light-theme overrides in app/globals.css [data-theme="light"]
        // Source: lib/design-tokens.ts → tailwindColors
        background: "#080B14",
        surface:    "#111827",
        "surface-2":"#1F2937",
        border:     "#1F2937",
        brand: {
          DEFAULT: "#C9A84C",
          light:   "#F59E0B",
          muted:   "#92712C",
        },
        text: {
          primary: "#F1F5F9",
          muted:   "#64748B",
          subtle:  "#374151",
        },
        success: "#10B981",
        error:   "#EF4444",
      },
      fontFamily: {
        // Source: lib/design-tokens.ts → typography.fontFamily
        sans:    ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        // Source: lib/design-tokens.ts → gradients
        "gold-gradient": "linear-gradient(135deg, #C9A84C 0%, #F59E0B 100%)",
        "dark-gradient": "linear-gradient(180deg, #080B14 0%, #111827 100%)",
        "hero-gradient": "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.15) 0%, rgba(8,11,20,0) 70%)",
      },
      animation: {
        "fade-in":  "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

module.exports = config;
