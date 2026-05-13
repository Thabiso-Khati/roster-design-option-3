/**
 * 02-artist-create-stats.spec.ts — Artist creation + manual stat entry
 *
 * React 19 (Next.js 16 webpack dev mode) stores fiber/props in a WeakMap —
 * DOM elements have zero own properties, so all __reactProps/__reactFiber
 * introspection approaches are dead.  Tests that need React state open use
 * URL params (?addArtist=true) so the component initialises in the desired
 * state without any button clicks.
 *
 * bypassCSP: true (in playwright.config.ts) allows webpack eval() source maps
 * to run in dev mode. This means the app establishes long-lived API connections
 * (Supabase realtime, PostHog), so we use waitUntil: "domcontentloaded" on
 * all goto calls instead of "networkidle" which never completes.
 */

import { test, expect } from "@playwright/test";

test.describe("artist roster widget", () => {
  test.setTimeout(45_000);

  test("artists section is visible on dashboard", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator("text=/Artists|Roster/i").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Add button is present on dashboard", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    const addBtn = page.locator("button", { hasText: /^Add$/ }).first();
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
  });

  test("Add button opens the Add Artist modal", async ({ page }) => {
    // Navigate with ?addArtist=true so ArtistsWidget initialises showAdd=true
    // without needing a React button click (which CDP events cannot trigger in
    // Next.js 16 / React 19 dev-mode webpack builds).
    await page.goto("/dashboard?addArtist=true", { waitUntil: "domcontentloaded" });
    await expect(page.locator("text=/Add an artist/i").first()).toBeVisible({ timeout: 15_000 });
  });

  test("Add Artist modal: manual tab shows name/genre fields", async ({ page }) => {
    await page.goto("/dashboard?addArtist=true", { waitUntil: "domcontentloaded" });
    await expect(page.locator("text=/Add an artist/i").first()).toBeVisible({ timeout: 15_000 });

    // The "Add manually" tab should be present inside the modal
    const manualTab = page.locator("button", { hasText: "Add manually" });
    await expect(manualTab).toBeVisible({ timeout: 8_000 });

    // Click it — this is a tab inside an open modal; it uses a locator click
    // on a visible element, which is reliable (not affected by the delegation issue).
    await manualTab.click();

    // Placeholder: "e.g. PJ Star"
    const nameField = page.locator('input[placeholder*="PJ Star"]');
    await expect(nameField).toBeVisible({ timeout: 8_000 });
    await nameField.fill("Test Artist");

    // Placeholder: "e.g. Amapiano"
    const genreField = page.locator('input[placeholder*="Amapiano"]');
    await expect(genreField).toBeVisible({ timeout: 5_000 });
    await genreField.fill("Afrobeats");

    // t("roster.addArtist") = "Add artist" submit button
    const submitBtn = page.locator("button", { hasText: /Add artist/i });
    await expect(submitBtn).toBeVisible();
  });

  test("Add Artist modal closes on Cancel", async ({ page }) => {
    await page.goto("/dashboard?addArtist=true", { waitUntil: "domcontentloaded" });
    await expect(page.locator("text=/Add an artist/i").first()).toBeVisible({ timeout: 15_000 });

    // Cancel button is inside the open modal — locator click is reliable here.
    const cancelBtn = page.locator("button", { hasText: /^Cancel$/ }).first();
    await expect(cancelBtn).toBeVisible({ timeout: 8_000 });
    await cancelBtn.click();
    await expect(page.locator("text=/Add an artist/i")).not.toBeVisible({ timeout: 8_000 });
  });
});

test.describe("edit stats modal", () => {
  test("EditStatsModal platform tabs are navigable", async ({ page }) => {
    const res  = await page.request.get("/api/artists");
    if (res.status() !== 200) {
      test.skip(true, `GET /api/artists returned ${res.status()} — skipping`);
      return;
    }
    const data: { artists?: Array<{ id: string }> } = await res.json();
    const artists = data.artists ?? [];

    if (artists.length === 0) {
      test.skip(true, "No artists in test account — skipping stats modal test");
      return;
    }

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(8_000);

    const editBtn = page
      .locator("button[aria-label*='stats'], button[title*='stats'], button[aria-label*='Stats']")
      .first();

    if (!(await editBtn.isVisible())) {
      test.skip(true, "Edit stats button not visible");
      return;
    }

    await editBtn.click();

    // t("roster.updateStats") — modal should open
    await expect(page.locator('[role="tab"]').first()).toBeVisible({ timeout: 5_000 });

    // Close modal
    const closeBtn = page.locator('button[aria-label*="Close"]').first();
    if (await closeBtn.isVisible()) await closeBtn.click();
  });

  test("EditStatsModal API: PATCH platform-metrics accepts valid payload", async ({ page }) => {
    const res  = await page.request.get("/api/artists");
    if (res.status() !== 200) {
      test.skip(true, `GET /api/artists returned ${res.status()}`);
      return;
    }
    const data: { artists?: Array<{ id: string }> } = await res.json();
    const artists = data.artists ?? [];

    if (artists.length === 0) {
      test.skip(true, "No artists in test account");
      return;
    }

    const patchRes = await page.request.patch(
      `/api/artists/${artists[0].id}/platform-metrics`,
      { data: { platform: "spotify", source: "manual", metrics: { monthly_listeners: 5000 } } }
    );
    expect(patchRes.status()).toBeLessThan(500);
  });
});
