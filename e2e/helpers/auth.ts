/**
 * Shared auth helpers for E2E specs.
 */

import { Page, expect } from "@playwright/test";

/** Navigate to /auth/login and sign in with given credentials. */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  await expect(page).toHaveURL(/\/dashboard/);
}

/** Log out by navigating to the sign-out endpoint. */
export async function logout(page: Page) {
  await page.goto("/api/auth/signout");
}
