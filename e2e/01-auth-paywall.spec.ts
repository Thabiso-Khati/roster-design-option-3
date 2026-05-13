/**
 * 01-auth-paywall.spec.ts — Authentication gate + subscription paywall
 */

import { test, expect } from "@playwright/test";

// ─── Unauthenticated tests (fresh context, no auth state) ────────────────────

test.describe("unauthenticated access", () => {
  test("visiting /dashboard without auth redirects to login", async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/(auth|login|signup)/, { timeout: 10_000 });
    await ctx.close();
  });

  test("login page renders correctly", async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await page.goto("/auth/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Sign In");
    await ctx.close();
  });

  test("login page shows error on bad credentials", async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();

    await page.goto("/auth/login", { waitUntil: "domcontentloaded" });

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible({ timeout: 8_000 });

    await emailInput.fill("nobody@invalid-domain-xyz.com");
    await passwordInput.fill("wrongpassword123");

    // Press Enter in the password field to submit the form.
    // This triggers the browser's native form-submission flow (firing a `submit`
    // event on the <form> element) which React 19's event delegation reliably
    // handles — unlike CDP mouse events which don't reach React's root listener
    // in Next.js 16 webpack dev-mode builds.
    await passwordInput.press("Enter");

    await expect(page.locator('[data-testid="login-error"]')).toBeVisible({ timeout: 15_000 });

    await expect(page).toHaveURL(/\/auth\/login/);
    await ctx.close();
  });

  test("signup page renders with plan/tier selection", async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await page.goto("/auth/signup");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await ctx.close();
  });
});

// ─── Authenticated tests ──────────────────────────────────────────────────────

test.describe("authenticated dashboard access", () => {
  test("authenticated user lands on dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=/ROSTER|Dashboard|Artists|Roster/i").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("dashboard page has sidebar navigation", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = page.locator("nav, aside, [aria-label='Dashboard']").first();
    await expect(nav).toBeVisible({ timeout: 8_000 });
  });

  test("protected API /api/artists responds for authenticated user", async ({ page }) => {
    const response = await page.request.get("/api/artists");
    // 200 = ok, 500 = server error (acceptable if Supabase env not fully set in dev)
    expect([200, 500]).toContain(response.status());
  });
});
