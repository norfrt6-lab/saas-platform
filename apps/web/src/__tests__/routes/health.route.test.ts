import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExecute = vi.fn();

vi.mock("@saas/db", () => ({
  db: { get execute() { return mockExecute; } },
}));
vi.mock("drizzle-orm", () => ({
  sql: (strings: TemplateStringsArray) => strings.join(""),
}));

import { GET } from "../../app/api/health/route";

describe("Health Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return healthy when db is up", async () => {
    mockExecute.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks.database.status).toBe("pass");
    expect(body.checks.memory.status).toBe("pass");
    expect(body.version).toBeDefined();
    expect(body.uptime).toBeGreaterThanOrEqual(0);
    expect(body.timestamp).toBeDefined();
  });

  it("should return unhealthy when db is down", async () => {
    mockExecute.mockRejectedValue(new Error("Connection refused"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks.database.status).toBe("fail");
    expect(body.checks.database.message).toContain("Connection refused");
  });

  it("should include latency measurements", async () => {
    mockExecute.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(typeof body.checks.database.latencyMs).toBe("number");
    expect(body.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("should include memory usage info", async () => {
    mockExecute.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(body.checks.memory.message).toMatch(/\d+MB \/ \d+MB \(\d+%\)/);
  });
});
