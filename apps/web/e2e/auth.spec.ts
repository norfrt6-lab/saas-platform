import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to sign-in page", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to sign-in when not authenticated
    await expect(page).toHaveURL(/sign-in/);
  });

  test("sign-in page renders correctly", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page).toHaveTitle(/sign in|login|saas/i);

    // Should have email input and submit button
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
  });

  test("sign-up page renders correctly", async ({ page }) => {
    await page.goto("/sign-up");

    // Should have registration form fields
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
  });
});
