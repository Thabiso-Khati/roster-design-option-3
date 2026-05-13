/**
 * @type {import('tailwindcss').Config}
 *
 * ROSTER — Stage direction · Option 3: Bordeaux (oxblood / dusty rose)
 *
 * Palette-aware tokens use CSS vars so they switch automatically when
 * data-palette="bordeaux" is set on <html>. The downside: Tailwind's
 * /N opacity modifier can't parse CSS vars — use the hand-rolled
 * color-mix() utilities in globals.css instead (bg-accent/10, etc.).
 *
 * For Tailwind opacity modifiers on the accent, accent hex is also
 * registered as `accent-hex` so old code that uses bg-brand/10 etc.
 * still works via the legacy-alias block in globals.css.
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
        /* ── Stage palette tokens (CSS-var driven, palette-aware) ── */
        bg:          "var(--bg)",
        surface:     "var(--surface)",
        "surface-2": "var(--surface-2)",
        line:        "var(--line)",
        "line-hi":   "var(--line-hi)",
        ink:         "var(--ink)",
        mute:        "var(--mute)",
        accent:      "var(--accent)",
        "accent-2":  "var(--accent-2)",
        "accent-3":  "var(--accent-3)",
        "accent-on": "var(--accent-on)",

        /* ── Legacy aliases so existing components compile ── */
        background:  "var(--bg)",
        border:      "var(--line)",
        brand: {
          DEFAULT: "#B83A52",   /* Bordeaux oxblood hex — for /N modifiers */
          light:   "#E3A4B0",
          muted:   "#7A2235",
        },
        text: {
          primary: "#EFEDED",
          muted:   "#8A8189",
          subtle:  "#21262F",
        },
        success: "#10B981",
        error:   "#EF4444",
        warning: "#F59E0B",
        info:    "#06B6D4",
      },
      fontFamily: {
        sans:    ["Sora", "system-ui", "sans-serif"],
        display: ["Sora", "system-ui", "sans-serif"],
        mono:    ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      borderRadius: {
        sm:    "6px",
        DEFAULT: "8px",
        md:    "8px",
        lg:    "10px",
        xl:    "12px",
        "2xl": "14px",
        "3xl": "16px",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, var(--accent), var(--accent-2))",
        "dark-gradient":   "linear-gradient(180deg, var(--bg) 0%, var(--surface) 100%)",
        "hero-gradient":   "radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--accent) 12%, transparent) 0%, transparent 70%)",
        "gold-gradient":   "linear-gradient(135deg, var(--accent), var(--accent-2))",
      },
      animation: {
        "fade-in":  "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "marquee":  "marquee 60s linear infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
    },
  },
  plugins: [],
};

module.exports = config;
