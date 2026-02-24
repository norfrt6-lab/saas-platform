import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantContext {
  teamId: string;
  userId: string;
  role: "owner" | "admin" | "member";
}

const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function runWithTenant<T>(
  context: TenantContext,
  fn: () => T,
): T {
  return tenantStorage.run(context, fn);
}

export function getTenantContext(): TenantContext {
  const context = tenantStorage.getStore();
  if (!context) {
    throw new Error(
      "Tenant context not found. Wrap the operation with runWithTenant().",
    );
  }
  return context;
}

export function getTenantContextOrNull(): TenantContext | null {
  return tenantStorage.getStore() ?? null;
}

export function requireTeamId(): string {
  return getTenantContext().teamId;
}
