import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { teams } from "./teams";

export const usageAlerts = pgTable("usage_alerts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  metric: text("metric").notNull(), // e.g. "api_calls", "storage_gb", "seats"
  thresholdPercent: integer("threshold_percent").notNull(), // 50, 75, 90, 100
  notifyEmail: boolean("notify_email").default(true).notNull(),
  notifyInApp: boolean("notify_in_app").default(true).notNull(),
  triggeredAt: timestamp("triggered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usageAlertRelations = relations(usageAlerts, ({ one }) => ({
  team: one(teams, {
    fields: [usageAlerts.teamId],
    references: [teams.id],
  }),
}));

export type UsageAlert = typeof usageAlerts.$inferSelect;
export type NewUsageAlert = typeof usageAlerts.$inferInsert;
