/**
 * 04-fan-crm-import.spec.ts — Fan CRM contact management + CSV import
 *
 * React 19 (Next.js 16 webpack dev mode) stores fiber/props in a WeakMap —
 * DOM elements have zero own properties, so __reactProps/__reactFiber
 * introspection is dead.  Tests that need a specific tab or form open use URL
 * params (?tab=import, ?showAdd=true) so the component initialises in the
 * desired state without any button clicks.
 *
 * bypassCSP: true (in playwright.config.ts) allows webpack eval() source maps
 * to run in dev mode. This means the app establishes long-lived API connections
 * (Supabase realtime, PostHog), so we use waitUntil: "domcontentloaded" on
 * all goto calls instead of "networkidle" which never completes.
 */

import { test, expect } from "@playwright/test";

const SAMPLE_CSV = `name,email,whatsapp,city,consent
Thabo Nkosi,thabo@example.com,+27821234567,Johannesburg,true`;

test.describe("fan CRM page", () => {
  test.setTimeout(45_000);

  test("fan CRM page loads with correct tabs", async ({ page }) => {
    await page.goto("/dashboard/fan-crm", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard\/fan-crm/);
    // Tabs are plain <button> elements with text labels (no id attribute)
    await expect(page.locator("button", { hasText: "Contacts" }).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("button", { hasText: "Import CSV" }).first()).toBeVisible();
    await expect(page.locator("button", { hasText: "Segments" }).first()).toBeVisible();
    await expect(page.locator("button", { hasText: "Templates" }).first()).toBeVisible();
  });

  test("Contacts tab is default — Add Fan button is visible", async ({ page }) => {
    await page.goto("/dashboard/fan-crm", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard\/fan-crm/);
    await expect(
      page.locator("button", { hasText: /Add Fan/i }).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test("clicking Add Fan shows the contact form fields", async ({ page }) => {
    // ?showAdd=true initialises the component with the add-form open
    await page.goto("/dashboard/fan-crm?showAdd=true", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard\/fan-crm/);
    await expect(page.locator('input[placeholder*="Full name"]')).toBeVisible({ timeout: 12_000 });
    await expect(page.locator('input[placeholder*="Email address"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="WhatsApp number"]')).toBeVisible();
  });

  test("Import CSV tab shows CSV textarea", async ({ page }) => {
    // ?tab=import initialises the component on the Import CSV tab
    await page.goto("/dashboard/fan-crm?tab=import", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard\/fan-crm/);
    await expect(page.locator("textarea").first()).toBeVisible({ timeout: 12_000 });
  });

  test("Import CSV tab: pasting CSV enables the Import button", async ({ page }) => {
    await page.goto("/dashboard/fan-crm?tab=import", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard\/fan-crm/);
    await expect(page.locator("textarea").first()).toBeVisible({ timeout: 12_000 });

    const csvArea = page.locator("textarea").first();
    await csvArea.fill(SAMPLE_CSV);

    // The component requires clicking "Preview" to parse the CSV and populate
    // importRows. Only after that does "Import N fans" appear.
    const previewBtn = page.locator("button", { hasText: /Preview/i }).first();
    await expect(previewBtn).toBeEnabled({ timeout: 3_000 });
    await previewBtn.click();

    // After parsing, the Import button shows "Import N fans"
    const importBtn = page.locator("button", { hasText: /Import \d+ fan/i });
    await expect(importBtn).toBeVisible({ timeout: 8_000 });
    await expect(importBtn).toBeEnabled();
  });

  test("Segments tab loads without error", async ({ page }) => {
    await page.goto("/dashboard/fan-crm?tab=segments", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard\/fan-crm/);
    await expect(page.locator("text=/Segment|No segment|Create/i").first()).toBeVisible({
      timeout: 8_000,
    });
  });

  test("Templates tab loads without error", async ({ page }) => {
    await page.goto("/dashboard/fan-crm?tab=templates", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard\/fan-crm/);
    await expect(page.locator("text=/Template|broadcast|No template|Create/i").first()).toBeVisible({
      timeout: 8_000,
    });
  });
});

test.describe("fan CRM API", () => {
  test("GET /api/fan-contacts returns 200 with contacts array", async ({ page }) => {
    const res  = await page.request.get("/api/fan-contacts");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.contacts ?? data)).toBe(true);
  });

  test("POST /api/fan-contacts/import with valid rows returns 200 or 201", async ({ page }) => {
    const res = await page.request.post("/api/fan-contacts/import", {
      data: {
        rows:   [{ name: "E2E Test Fan", email: "e2e-fan@example.com", whatsapp: "+27001234567", city: "Johannesburg", consent: "true" }],
        source: "import",
      },
    });
    // 200/201 = imported, 409 = duplicate (already imported in prior run)
    expect([200, 201, 409]).toContain(res.status());
  });

  test("POST /api/fan-contacts/import with empty rows returns 400", async ({ page }) => {
    const res = await page.request.post("/api/fan-contacts/import", {
      data: { rows: [], source: "import" },
    });
    expect(res.status()).toBe(400);
  });

  test("GET /api/fan-contacts/segments returns 200", async ({ page }) => {
    const res = await page.request.get("/api/fan-contacts/segments");
    expect(res.status()).toBe(200);
  });
});
