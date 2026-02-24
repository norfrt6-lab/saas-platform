import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";
import { teams } from "./teams";

export const auditLogs = pgTable("audit_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  action: text("action").notNull(),
  userId: text("user_id").references(() => users.id),
  teamId: text("team_id").references(() => teams.id),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
