/**
 * 03-expert-booking.spec.ts — Expert directory → book a session
 */

import { test, expect } from "@playwright/test";

test.describe("expert directory", () => {
  test("experts page loads and shows at least one expert card", async ({ page }) => {
    await page.goto("/dashboard/experts");
    await expect(page).toHaveURL(/\/dashboard\/experts/);
    // At least one expert card link should be present (seed experts are hardcoded)
    await expect(
      page.locator('a[href*="/dashboard/experts/"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("search input is present", async ({ page }) => {
    await page.goto("/dashboard/experts");
    const searchInput = page.locator('input[type="search"], input[type="text"]').first();
    await expect(searchInput).toBeVisible({ timeout: 8_000 });
  });

  test("expert card links to individual detail page", async ({ page }) => {
    await page.goto("/dashboard/experts");
    const firstCardLink = page.locator('a[href*="/dashboard/experts/"]').first();
    await expect(firstCardLink).toBeVisible({ timeout: 10_000 });

    const href = await firstCardLink.getAttribute("href");
    expect(href).toMatch(/\/dashboard\/experts\//);
    await firstCardLink.click();
    await expect(page).toHaveURL(/\/dashboard\/experts\/[^/]+$/, { timeout: 10_000 });
  });
});

test.describe("expert detail page", () => {
  test("expert detail page renders booking CTA", async ({ page }) => {
    await page.goto("/dashboard/experts");
    const firstCardLink = page.locator('a[href*="/dashboard/experts/"]').first();
    await expect(firstCardLink).toBeVisible({ timeout: 10_000 });
    await firstCardLink.click();
    await page.waitForURL(/\/dashboard\/experts\/[^/]+$/, { timeout: 10_000 });

    // t("action.bookSession") — the CTA on the card
    await expect(
      page.locator("text=/Book a Session|Book Session|Book/i").first()
    ).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("bookings API", () => {
  test("bookings API endpoint responds (any 2xx or 4xx — not a server crash)", async ({ page }) => {
    const res = await page.request.get("/api/bookings");
    // Endpoint may be POST-only (405), or not exist (404), or return list (200)
    // We just verify the server didn't crash (no 500)
    expect(res.status()).toBeLessThan(500);
  });
});
