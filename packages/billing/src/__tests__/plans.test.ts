import { describe, it, expect } from "vitest";
import { PLAN_LIMITS, hasFeature, isWithinLimit, isUnlimited, type Plan } from "../plans";

describe("Plan Definitions", () => {
  describe("PLAN_LIMITS", () => {
    it("should define free, pro, and enterprise plans", () => {
      expect(PLAN_LIMITS).toHaveProperty("free");
      expect(PLAN_LIMITS).toHaveProperty("pro");
      expect(PLAN_LIMITS).toHaveProperty("enterprise");
    });

    it("free plan should have restrictive limits", () => {
      const free = PLAN_LIMITS.free;
      expect(free.maxProjects).toBe(3);
      expect(free.maxMembers).toBe(2);
      expect(free.maxApiCallsPerMonth).toBe(1_000);
      expect(free.maxFileUploadMB).toBe(10);
      expect(free.maxApiKeys).toBe(1);
    });

    it("pro plan should have higher limits than free", () => {
      const pro = PLAN_LIMITS.pro;
      const free = PLAN_LIMITS.free;
      expect(pro.maxProjects).toBeGreaterThan(free.maxProjects);
      expect(pro.maxMembers).toBeGreaterThan(free.maxMembers);
      expect(pro.maxApiCallsPerMonth).toBeGreaterThan(free.maxApiCallsPerMonth);
      expect(pro.maxApiKeys).toBeGreaterThan(free.maxApiKeys);
    });

    it("enterprise plan should have unlimited core resources", () => {
      const enterprise = PLAN_LIMITS.enterprise;
      expect(isUnlimited(enterprise.maxProjects)).toBe(true);
      expect(isUnlimited(enterprise.maxMembers)).toBe(true);
      expect(isUnlimited(enterprise.maxApiCallsPerMonth)).toBe(true);
    });
  });

  describe("hasFeature", () => {
    it("free plan should only have basic_analytics", () => {
      expect(hasFeature("free", "basic_analytics")).toBe(true);
      expect(hasFeature("free", "advanced_analytics")).toBe(false);
      expect(hasFeature("free", "custom_domain")).toBe(false);
      expect(hasFeature("free", "audit_log")).toBe(false);
    });

    it("pro plan should have all standard features", () => {
      expect(hasFeature("pro", "basic_analytics")).toBe(true);
      expect(hasFeature("pro", "advanced_analytics")).toBe(true);
      expect(hasFeature("pro", "custom_domain")).toBe(true);
      expect(hasFeature("pro", "priority_support")).toBe(true);
      expect(hasFeature("pro", "api_access")).toBe(true);
      expect(hasFeature("pro", "audit_log")).toBe(true);
      expect(hasFeature("pro", "data_export")).toBe(true);
    });

    it("pro plan should NOT have features not in its list", () => {
      expect(hasFeature("pro", "sso")).toBe(false);
      expect(hasFeature("pro", "white_label")).toBe(false);
    });

    it("enterprise plan should have ALL features via wildcard", () => {
      expect(hasFeature("enterprise", "basic_analytics")).toBe(true);
      expect(hasFeature("enterprise", "advanced_analytics")).toBe(true);
      expect(hasFeature("enterprise", "sso")).toBe(true);
      expect(hasFeature("enterprise", "white_label")).toBe(true);
      expect(hasFeature("enterprise", "any_future_feature")).toBe(true);
    });
  });

  describe("isWithinLimit", () => {
    it("should return true when under the limit", () => {
      expect(isWithinLimit("free", "maxProjects", 0)).toBe(true);
      expect(isWithinLimit("free", "maxProjects", 2)).toBe(true);
    });

    it("should return false when at or over the limit", () => {
      expect(isWithinLimit("free", "maxProjects", 3)).toBe(false);
      expect(isWithinLimit("free", "maxProjects", 10)).toBe(false);
    });

    it("should handle pro plan limits", () => {
      expect(isWithinLimit("pro", "maxProjects", 49)).toBe(true);
      expect(isWithinLimit("pro", "maxProjects", 50)).toBe(false);
    });

    it("should always return true for enterprise unlimited resources", () => {
      expect(isWithinLimit("enterprise", "maxProjects", 1_000_000)).toBe(true);
      expect(isWithinLimit("enterprise", "maxMembers", 1_000_000)).toBe(true);
    });

    it("should check member limits correctly", () => {
      expect(isWithinLimit("free", "maxMembers", 1)).toBe(true);
      expect(isWithinLimit("free", "maxMembers", 2)).toBe(false);
      expect(isWithinLimit("pro", "maxMembers", 19)).toBe(true);
      expect(isWithinLimit("pro", "maxMembers", 20)).toBe(false);
    });

    it("should check API call limits correctly", () => {
      expect(isWithinLimit("free", "maxApiCallsPerMonth", 999)).toBe(true);
      expect(isWithinLimit("free", "maxApiCallsPerMonth", 1_000)).toBe(false);
      expect(isWithinLimit("pro", "maxApiCallsPerMonth", 99_999)).toBe(true);
      expect(isWithinLimit("pro", "maxApiCallsPerMonth", 100_000)).toBe(false);
    });
  });

  describe("isUnlimited", () => {
    it("should return true for Number.MAX_SAFE_INTEGER", () => {
      expect(isUnlimited(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it("should return false for normal numbers", () => {
      expect(isUnlimited(0)).toBe(false);
      expect(isUnlimited(100)).toBe(false);
      expect(isUnlimited(1_000_000)).toBe(false);
    });
  });

  describe("plan upgrade path validation", () => {
    const plans: Plan[] = ["free", "pro", "enterprise"];

    it("each plan should have progressively more features", () => {
      for (let i = 0; i < plans.length - 1; i++) {
        const current = PLAN_LIMITS[plans[i]!];
        const next = PLAN_LIMITS[plans[i + 1]!];
        expect(next.maxProjects).toBeGreaterThanOrEqual(current.maxProjects);
        expect(next.maxMembers).toBeGreaterThanOrEqual(current.maxMembers);
        expect(next.maxApiCallsPerMonth).toBeGreaterThanOrEqual(current.maxApiCallsPerMonth);
      }
    });
  });
});
