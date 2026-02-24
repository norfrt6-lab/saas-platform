import { eq, and, isNull, type SQL } from "drizzle-orm";
import type { PgTableWithColumns, TableConfig } from "drizzle-orm/pg-core";
import { getTenantContext } from "./context";

type TableWithTeamId = PgTableWithColumns<
  TableConfig & {
    columns: {
      teamId: { dataType: "string"; notNull: true };
    };
  }
>;

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
    deletedAt: { dataType: "date" };
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
