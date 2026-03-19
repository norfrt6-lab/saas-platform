import { describe, it, expect, beforeEach } from "vitest";
import {
  withTenantContext,
  getTenantContext,
  assertTenant,
  tryGetTenantContext,
} from "@/lib/tenant/context";

const makeTenantCtx = (
  tenantId: string,
  userId = "user-1",
  plan: "free" | "pro" | "enterprise" = "free",
) => ({
  tenantId,
  tenantSlug: `slug-${tenantId}`,
  plan,
  userId,
  userRole: "member" as const,
});

describe("tenant context isolation", () => {
  it("provides correct tenant context within scope", async () => {
    await withTenantContext(makeTenantCtx("tenant-A"), async () => {
      const ctx = getTenantContext();
      expect(ctx.tenantId).toBe("tenant-A");
    });
  });

  it("throws outside of tenant context", () => {
    expect(() => getTenantContext()).toThrow(
      "getTenantContext() called outside of a tenant context",
    );
  });

  it("returns null for tryGetTenantContext outside scope", () => {
    expect(tryGetTenantContext()).toBeNull();
  });

  it("isolates parallel tenant contexts from each other", async () => {
    const results: string[] = [];

    await Promise.all([
      withTenantContext(makeTenantCtx("tenant-A"), async () => {
        await new Promise((r) => setTimeout(r, 10));
        results.push(getTenantContext().tenantId);
      }),
      withTenantContext(makeTenantCtx("tenant-B"), async () => {
        results.push(getTenantContext().tenantId);
      }),
    ]);

    expect(results).toContain("tenant-A");
    expect(results).toContain("tenant-B");
    // Contexts must not bleed into each other
    expect(results.filter((id) => id === "tenant-A")).toHaveLength(1);
    expect(results.filter((id) => id === "tenant-B")).toHaveLength(1);
  });

  it("does not leak context after scope ends", async () => {
    await withTenantContext(makeTenantCtx("tenant-A"), async () => {
      expect(getTenantContext().tenantId).toBe("tenant-A");
    });
    expect(tryGetTenantContext()).toBeNull();
  });

  it("assertTenant passes for matching tenant", async () => {
    await withTenantContext(makeTenantCtx("tenant-A"), async () => {
      expect(() => assertTenant("tenant-A")).not.toThrow();
    });
  });

  it("assertTenant throws for mismatched tenant", async () => {
    await withTenantContext(makeTenantCtx("tenant-A"), async () => {
      expect(() => assertTenant("tenant-B")).toThrow("Tenant isolation violation");
    });
  });

  it("nested contexts use innermost tenant", async () => {
    await withTenantContext(makeTenantCtx("tenant-outer"), async () => {
      await withTenantContext(makeTenantCtx("tenant-inner"), async () => {
        expect(getTenantContext().tenantId).toBe("tenant-inner");
      });
      // Back to outer context
      expect(getTenantContext().tenantId).toBe("tenant-outer");
    });
  });
});
