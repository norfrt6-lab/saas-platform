import { getTenantContext } from "@/lib/tenant/context";

export interface SoftDeletable {
  id: string;
  tenantId: string;
  deletedAt: Date | null;
}

const RESTORE_WINDOW_DAYS = 30;

export function buildSoftDelete(): Pick<SoftDeletable, "deletedAt"> {
  return { deletedAt: new Date() };
}

export function isRestorable(record: SoftDeletable): boolean {
  if (!record.deletedAt) return false;
  const windowMs = RESTORE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - record.deletedAt.getTime() < windowMs;
}

export function buildRestore(
  record: SoftDeletable,
): Pick<SoftDeletable, "deletedAt"> {
  if (!record.deletedAt) {
    throw new Error("Record is not deleted and cannot be restored");
  }
  if (!isRestorable(record)) {
    throw new Error(
      `Record cannot be restored -- deleted more than ${RESTORE_WINDOW_DAYS} days ago`,
    );
  }
  return { deletedAt: null };
}

export function assertTenantOwnership(record: SoftDeletable): void {
  const { tenantId } = getTenantContext();
  if (record.tenantId !== tenantId) {
    throw new Error(
      `Tenant isolation violation: record belongs to ${record.tenantId}`,
    );
  }
}

export function notDeleted<T extends SoftDeletable>(records: T[]): T[] {
  return records.filter((r) => r.deletedAt === null);
}

export function restorableRecords<T extends SoftDeletable>(records: T[]): T[] {
  return records.filter((r) => r.deletedAt !== null && isRestorable(r));
}
