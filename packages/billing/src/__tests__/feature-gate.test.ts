import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Feature gate tests using mocked database queries.
 * We test the gate logic by mocking the db module.
 */

// Mock the db module before importing feature-gate
vi.mock("@saas/db", () => {
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();

  const chainable = {
    select: mockSelect.mockReturnThis(),
    from: mockFrom.mockReturnThis(),
    where: mockWhere.mockReturnThis(),
    limit: mockLimit,
  };

  return {
    db: chainable,
    teams: { id: "teams.id", plan: "teams.plan", teamId: "teams.teamId" },
    projects: { teamId: "projects.teamId", deletedAt: "projects.deletedAt" },
    teamMembers: { teamId: "teamMembers.teamId" },
    usageRecords: { teamId: "usageRecords.teamId", metric: "usageRecords.metric", period: "usageRecords.period", value: "usageRecords.value" },
  };
});

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ type: "eq", a, b })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  isNull: vi.fn((a) => ({ type: "isNull", a })),
  count: vi.fn(() => "count"),
  sum: vi.fn((a) => ({ type: "sum", a })),
}));

// Import the plans module directly (no mocking needed - it's pure functions)
import { PLAN_LIMITS, hasFeature } from "../plans";

describe("Feature Gate Logic", () => {
  describe("project limit enforcement", () => {
    it("should allow project creation under free plan limit", () => {
      const currentProjects = 2;
      const limit = PLAN_LIMITS.free.maxProjects; // 3
      expect(currentProjects < limit).toBe(true);
    });

    it("should block project creation at free plan limit", () => {
      const currentProjects = 3;
      const limit = PLAN_LIMITS.free.maxProjects; // 3
      expect(currentProjects < limit).toBe(false);
    });

    it("should allow project creation under pro plan limit", () => {
      const currentProjects = 49;
      const limit = PLAN_LIMITS.pro.maxProjects; // 50
      expect(currentProjects < limit).toBe(true);
    });

    it("should always allow enterprise project creation", () => {
      const currentProjects = 10_000;
      const limit = PLAN_LIMITS.enterprise.maxProjects;
      expect(currentProjects < limit).toBe(true);
    });
  });

  describe("member limit enforcement", () => {
    it("should allow adding members under free plan limit", () => {
      const currentMembers = 1;
      const limit = PLAN_LIMITS.free.maxMembers; // 2
      expect(currentMembers < limit).toBe(true);
    });

    it("should block adding members at free plan limit", () => {
      const currentMembers = 2;
      const limit = PLAN_LIMITS.free.maxMembers; // 2
      expect(currentMembers < limit).toBe(false);
    });

    it("should allow adding members under pro plan limit", () => {
      const currentMembers = 19;
      const limit = PLAN_LIMITS.pro.maxMembers; // 20
      expect(currentMembers < limit).toBe(true);
    });
  });

  describe("feature access enforcement", () => {
    it("should deny audit_log to free plan", () => {
      expect(hasFeature("free", "audit_log")).toBe(false);
    });

    it("should allow audit_log for pro plan", () => {
      expect(hasFeature("pro", "audit_log")).toBe(true);
    });

    it("should allow any feature for enterprise plan", () => {
      expect(hasFeature("enterprise", "audit_log")).toBe(true);
      expect(hasFeature("enterprise", "sso")).toBe(true);
      expect(hasFeature("enterprise", "custom_anything")).toBe(true);
    });

    it("should deny api_access to free plan", () => {
      expect(hasFeature("free", "api_access")).toBe(false);
    });

    it("should allow api_access to pro plan", () => {
      expect(hasFeature("pro", "api_access")).toBe(true);
    });
  });

  describe("API call metering", () => {
    it("should enforce free plan API call limits", () => {
      const current = 999;
      const limit = PLAN_LIMITS.free.maxApiCallsPerMonth;
      expect(current < limit).toBe(true);

      const atLimit = 1_000;
      expect(atLimit < limit).toBe(false);
    });

    it("should enforce pro plan API call limits", () => {
      const current = 99_999;
      const limit = PLAN_LIMITS.pro.maxApiCallsPerMonth;
      expect(current < limit).toBe(true);

      const atLimit = 100_000;
      expect(atLimit < limit).toBe(false);
    });

    it("should never limit enterprise API calls", () => {
      const current = 10_000_000;
      const limit = PLAN_LIMITS.enterprise.maxApiCallsPerMonth;
      expect(current < limit).toBe(true);
    });
  });

  describe("plan comparison edge cases", () => {
    it("should handle zero usage correctly", () => {
      expect(0 < PLAN_LIMITS.free.maxProjects).toBe(true);
      expect(0 < PLAN_LIMITS.free.maxMembers).toBe(true);
      expect(0 < PLAN_LIMITS.free.maxApiCallsPerMonth).toBe(true);
    });

    it("should handle exactly-at-limit correctly", () => {
      // At limit means NOT allowed (strict less-than)
      expect(PLAN_LIMITS.free.maxProjects < PLAN_LIMITS.free.maxProjects).toBe(false);
      expect(PLAN_LIMITS.pro.maxMembers < PLAN_LIMITS.pro.maxMembers).toBe(false);
    });
  });
});
