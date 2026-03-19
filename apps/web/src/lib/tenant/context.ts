import { AsyncLocalStorage } from "async_hooks";

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  plan: "free" | "pro" | "enterprise";
  userId: string;
  userRole: "owner" | "admin" | "member" | "viewer";
}

const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Run a callback within a tenant context. All async operations inside
 * the callback can access the tenant via `getTenantContext()`.
 */
export function withTenantContext<T>(
  ctx: TenantContext,
  fn: () => Promise<T>,
): Promise<T> {
  return tenantStorage.run(ctx, fn);
}

/**
 * Retrieve the current tenant context. Throws if called outside a
 * `withTenantContext` scope, which prevents accidental cross-tenant access.
 */
export function getTenantContext(): TenantContext {
  const ctx = tenantStorage.getStore();
  if (!ctx) {
    throw new Error(
      "getTenantContext() called outside of a tenant context. " +
        "Ensure the request is wrapped with withTenantContext().",
    );
  }
  return ctx;
}

/** Returns the context or null if not within a tenant scope. */
export function tryGetTenantContext(): TenantContext | null {
  return tenantStorage.getStore() ?? null;
}

/** Assert that the current tenant matches the expected tenant ID. */
export function assertTenant(expectedTenantId: string): void {
  const ctx = getTenantContext();
  if (ctx.tenantId !== expectedTenantId) {
    throw new Error(
      `Tenant isolation violation: expected ${expectedTenantId}, got ${ctx.tenantId}`,
    );
  }
}
