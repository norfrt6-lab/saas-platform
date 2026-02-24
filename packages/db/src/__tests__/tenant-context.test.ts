import { describe, it, expect } from "vitest";
import {
  runWithTenant,
  getTenantContext,
  getTenantContextOrNull,
  requireTeamId,
  type TenantContext,
} from "../tenant/context";

describe("Tenant Context", () => {
  const mockContext: TenantContext = {
    teamId: "team_123",
    userId: "user_456",
    role: "admin",
  };

  describe("runWithTenant", () => {
    it("should provide tenant context within the callback", () => {
      const result = runWithTenant(mockContext, () => {
        const ctx = getTenantContext();
        return ctx.teamId;
      });
      expect(result).toBe("team_123");
    });

    it("should support nested contexts", () => {
      const innerContext: TenantContext = {
        teamId: "team_789",
        userId: "user_012",
        role: "member",
      };

      runWithTenant(mockContext, () => {
        expect(getTenantContext().teamId).toBe("team_123");

        runWithTenant(innerContext, () => {
          expect(getTenantContext().teamId).toBe("team_789");
        });

        // Outer context should be restored
        expect(getTenantContext().teamId).toBe("team_123");
      });
    });

    it("should return the callback result", () => {
      const result = runWithTenant(mockContext, () => 42);
      expect(result).toBe(42);
    });
  });

  describe("getTenantContext", () => {
    it("should throw when called outside runWithTenant", () => {
      expect(() => getTenantContext()).toThrow(
        "Tenant context not found",
      );
    });
  });

  describe("getTenantContextOrNull", () => {
    it("should return null when called outside runWithTenant", () => {
      expect(getTenantContextOrNull()).toBeNull();
    });

    it("should return context when called inside runWithTenant", () => {
      runWithTenant(mockContext, () => {
        const ctx = getTenantContextOrNull();
        expect(ctx).toEqual(mockContext);
      });
    });
  });

  describe("requireTeamId", () => {
    it("should return teamId when in tenant context", () => {
      runWithTenant(mockContext, () => {
        expect(requireTeamId()).toBe("team_123");
      });
    });

    it("should throw when called outside context", () => {
      expect(() => requireTeamId()).toThrow("Tenant context not found");
    });
  });

  describe("isolation guarantees", () => {
    it("should isolate concurrent tenant contexts", async () => {
      const results: string[] = [];

      const team1 = new Promise<void>((resolve) => {
        setTimeout(() => {
          runWithTenant(
            { teamId: "team_a", userId: "user_1", role: "owner" },
            () => {
              results.push(getTenantContext().teamId);
              resolve();
            },
          );
        }, 10);
      });

      const team2 = new Promise<void>((resolve) => {
        setTimeout(() => {
          runWithTenant(
            { teamId: "team_b", userId: "user_2", role: "member" },
            () => {
              results.push(getTenantContext().teamId);
              resolve();
            },
          );
        }, 5);
      });

      await Promise.all([team1, team2]);

      expect(results).toContain("team_a");
      expect(results).toContain("team_b");
      expect(results).toHaveLength(2);
    });

    it("should not leak context between async operations", async () => {
      const check = async (teamId: string): Promise<string> => {
        return runWithTenant(
          { teamId, userId: "user_1", role: "owner" },
          async () => {
            await new Promise((r) => setTimeout(r, Math.random() * 20));
            return getTenantContext().teamId;
          },
        );
      };

      const results = await Promise.all([
        check("team_1"),
        check("team_2"),
        check("team_3"),
      ]);

      expect(results).toEqual(["team_1", "team_2", "team_3"]);
    });
  });
});
