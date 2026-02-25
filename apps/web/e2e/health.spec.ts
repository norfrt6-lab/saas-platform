import { test, expect } from "@playwright/test";

test.describe("Health Check", () => {
  test("GET /api/health returns healthy status", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body).toHaveProperty("status");
    expect(["healthy", "degraded"]).toContain(body.status);
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("checks");
  });
});
