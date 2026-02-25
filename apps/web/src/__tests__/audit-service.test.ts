import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuditLog as createAuditLogFixture } from "./helpers/fixtures";

function chainable(resolvedValue: unknown = []) {
  const chain: Record<string, unknown> = {};
  const proxy = new Proxy(chain, {
    get(_t, prop: string) {
      if (prop === "then") return (r: (v: unknown) => void) => r(resolvedValue);
      if (!chain[prop]) chain[prop] = vi.fn().mockReturnValue(proxy);
      return chain[prop];
    },
  });
  return proxy;
}

const mockSelect = vi.fn();
const mockInsert = vi.fn();

vi.mock("@saas/db", () => ({
  db: {
    get select() { return mockSelect; },
    get insert() { return mockInsert; },
  },
}));
vi.mock("@saas/db/schema", () => ({
  auditLogs: {
    id: "auditLogs.id",
    teamId: "auditLogs.teamId",
    action: "auditLogs.action",
    createdAt: "auditLogs.createdAt",
  },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ type: "eq", a, b })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  desc: vi.fn((a) => ({ type: "desc", a })),
  lt: vi.fn((a, b) => ({ type: "lt", a, b })),
}));

import { createAuditLog, getAuditLogs } from "../lib/api/audit";

describe("Audit Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAuditLog", () => {
    it("should insert an audit log entry", async () => {
      mockInsert.mockReturnValue(chainable());

      await createAuditLog({
        teamId: "team1",
        userId: "user1",
        action: "project.created",
        targetType: "project",
        targetId: "proj1",
      });

      expect(mockInsert).toHaveBeenCalled();
    });

    it("should include metadata when provided", async () => {
      mockInsert.mockReturnValue(chainable());

      await createAuditLog({
        teamId: "team1",
        userId: "user1",
        action: "billing.plan_changed",
        targetType: "team",
        targetId: "team1",
        metadata: { from: "free", to: "pro" },
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      });

      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe("getAuditLogs", () => {
    it("should return paginated audit logs", async () => {
      const logs = Array.from({ length: 3 }, (_, i) =>
        createAuditLogFixture({ id: `log_${i}` }),
      );
      mockSelect.mockReturnValue(chainable(logs));

      const result = await getAuditLogs({ teamId: "team1", limit: 50 });

      expect(result.data).toHaveLength(3);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("should detect hasMore when over limit", async () => {
      const logs = Array.from({ length: 4 }, (_, i) =>
        createAuditLogFixture({ id: `log_${i}` }),
      );
      mockSelect.mockReturnValue(chainable(logs));

      const result = await getAuditLogs({ teamId: "team1", limit: 3 });

      expect(result.data).toHaveLength(3);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe("log_2");
    });

    it("should filter by action", async () => {
      mockSelect.mockReturnValue(chainable([]));

      const result = await getAuditLogs({
        teamId: "team1",
        action: "project.created",
      });

      expect(result.data).toHaveLength(0);
    });

    it("should apply cursor-based pagination", async () => {
      mockSelect.mockReturnValue(chainable([]));

      const result = await getAuditLogs({
        teamId: "team1",
        cursor: "last_id",
      });

      expect(result.hasMore).toBe(false);
    });

    it("should use default limit of 50", async () => {
      mockSelect.mockReturnValue(chainable([]));

      const result = await getAuditLogs({ teamId: "team1" });

      expect(result.data).toEqual([]);
    });
  });
});
