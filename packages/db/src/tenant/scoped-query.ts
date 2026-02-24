import { eq, and, isNull, type SQL, type Column } from "drizzle-orm";
import { getTenantContext } from "./context";

interface TableWithTeamId {
  teamId: Column;
}

/**
 * Applies tenant scoping to a query condition.
 * Ensures all queries are scoped to the current team.
 */
export function withTenantScope<T extends TableWithTeamId>(
  table: T,
  ...conditions: (SQL | undefined)[]
): SQL {
  const { teamId } = getTenantContext();
  const tenantCondition = eq(table.teamId, teamId);
  const validConditions = conditions.filter(Boolean) as SQL[];

  if (validConditions.length === 0) {
    return tenantCondition;
  }

  return and(tenantCondition, ...validConditions)!;
}

/**
 * Applies tenant + soft-delete scoping.
 * Use for tables with a deletedAt column.
 */
export function withActiveTenantScope<
  T extends TableWithTeamId & {
    deletedAt: Column;
  },
>(
  table: T,
  ...conditions: (SQL | undefined)[]
): SQL {
  return withTenantScope(
    table,
    isNull(table.deletedAt),
    ...conditions,
  );
}
