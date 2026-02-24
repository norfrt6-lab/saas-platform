import { auditLogs } from "@saas/db/schema";
import { describe, it, expect } from "vitest";

describe("Audit Log Schema", () => {
  it("should have targetType field matching code usage", () => {
    expect(auditLogs.targetType).toBeDefined();
    expect(auditLogs.targetType.name).toBe("target_type");
  });

  it("should have targetId field matching code usage", () => {
    expect(auditLogs.targetId).toBeDefined();
    expect(auditLogs.targetId.name).toBe("target_id");
  });

  it("should have required core fields", () => {
    expect(auditLogs.id).toBeDefined();
    expect(auditLogs.action).toBeDefined();
    expect(auditLogs.userId).toBeDefined();
    expect(auditLogs.teamId).toBeDefined();
    expect(auditLogs.metadata).toBeDefined();
    expect(auditLogs.ipAddress).toBeDefined();
    expect(auditLogs.userAgent).toBeDefined();
    expect(auditLogs.createdAt).toBeDefined();
  });
});
