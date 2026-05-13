/**
 * Lighthouse CI configuration
 * Docs: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 *
 * Pages audited: landing page + login page (publicly accessible, no auth required).
 * The dashboard is auth-gated so we audit the public-facing entry points.
 *
 * Thresholds — raise these as the product matures:
 *   Performance 75   → target 90 before public launch
 *   Accessibility 85 → target 95 before enterprise deals
 *   Best Practices 85
 *   SEO 80
 */

module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3001/",           // Landing / marketing page
        "http://localhost:3001/auth/login", // Login page
      ],
      numberOfRuns: 2,
      settings: {
        // Simulate a mid-range mobile device on a 4G connection
        preset: "desktop",
        throttlingMethod: "simulate",
      },
    },

    assert: {
      assertions: {
        // ── Core Web Vitals ─────────────────────────────────────────────
        "categories:performance":     ["warn",  { minScore: 0.75 }],
        "categories:accessibility":   ["error", { minScore: 0.85 }],
        "categories:best-practices":  ["warn",  { minScore: 0.85 }],
        "categories:seo":             ["warn",  { minScore: 0.80 }],

        // ── Specific metrics ────────────────────────────────────────────
        "first-contentful-paint":     ["warn",  { maxNumericValue: 3000 }],  // 3s
        "largest-contentful-paint":   ["warn",  { maxNumericValue: 4000 }],  // 4s
        "cumulative-layout-shift":    ["warn",  { maxNumericValue: 0.1  }],
        "total-blocking-time":        ["warn",  { maxNumericValue: 600  }],  // 600ms

        // ── Accessibility hard gates ────────────────────────────────────
        "color-contrast":             ["error", { minScore: 1 }],
        "image-alt":                  ["error", { minScore: 1 }],
        "document-title":             ["error", { minScore: 1 }],
      },
    },

    upload: {
      target: "temporary-public-storage",
      // To persist reports: use "lhci" target with a self-hosted LHCI server,
      // or "filesystem" to save reports as build artefacts:
      // target: "filesystem",
      // outputDir: "./lighthouse-reports",
    },
  },
};
