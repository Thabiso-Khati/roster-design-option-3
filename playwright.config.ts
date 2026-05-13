import { defineConfig, devices } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * ROSTER E2E Test Configuration
 *
 * Run locally:
 *   npx playwright test
 *   npx playwright test --ui               (interactive mode)
 *   npx playwright test e2e/02-artist      (single spec)
 *
 * First time setup:
 *   npm install --save-dev @playwright/test
 *   npx playwright install chromium
 *   cp .env.test.local.example .env.test.local   # then fill in real creds
 *
 * Auth credentials are read from:
 *   1. Shell environment (E2E_TEST_EMAIL / E2E_TEST_PASSWORD)
 *   2. .env.test.local  (takes precedence over .env.local for overrides)
 *   3. .env.local       (picks up NEXT_PUBLIC_SUPABASE_URL etc.)
 */

// ─── Load .env files ─────────────────────────────────────────────────────────
// global-setup.ts runs outside Next.js, so we load env files ourselves here
// (before defineConfig, so both setup and test workers inherit the values).

function loadEnvFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key   = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      // Don't override values already set in the shell environment
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // File not found is fine — it's optional
  }
}

// Load in priority order: shell > .env.test.local > .env.local
loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env.test.local")); // overrides .env.local

// ─── Config ──────────────────────────────────────────────────────────────────

const AUTH_STATE_PATH = ".auth/user.json";

/** True when test credentials look like they've been filled in */
const hasRealCreds =
  !!process.env.E2E_TEST_EMAIL &&
  process.env.E2E_TEST_EMAIL !== "your-test-user@example.com" &&
  !!process.env.E2E_TEST_PASSWORD &&
  process.env.E2E_TEST_PASSWORD !== "your-test-password";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // sequential — authenticated tests share auth state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    // Next.js dev-mode webpack uses eval() for source maps, which is blocked
    // by the app's nonce-based Content-Security-Policy.  bypassCSP lets the
    // Playwright browser ignore CSP so the JS bundles execute normally and
    // React can hydrate the page.  This has no effect on the deployed app.
    bypassCSP: true,
  },

  projects: [
    // ── Phase 1: global auth setup ───────────────────────────────────────────
    // Only runs when real credentials are present.
    // If credentials are missing, the setup project still runs but exits
    // immediately with a helpful message (no "did not run" cascade).
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
    },

    // ── Phase 2: all E2E specs ───────────────────────────────────────────────
    {
      name: "e2e",
      use: {
        ...devices["Desktop Chrome"],
        // If auth state file doesn't exist yet (credentials not configured),
        // Playwright will still run but unauthenticated tests will pass and
        // auth-required tests will fail as expected.
        storageState: fs.existsSync(AUTH_STATE_PATH) ? AUTH_STATE_PATH : undefined,
      },
      dependencies: ["setup"],
      testMatch: /\d{2}-.*\.spec\.ts/,
    },
  ],

  // Start dev server automatically if not already running
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
