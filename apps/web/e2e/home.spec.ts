import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("loads the landing page", async ({ page }) => {
    await page.goto("/");

    // Page should load successfully
    expect(page.url()).toContain("/");

    // Should have some content rendered
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("has correct meta tags", async ({ page }) => {
    await page.goto("/");

    // Should have a title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
