import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { teams } from "./teams";

export const reportFrequencyEnum = pgEnum("report_frequency", [
  "daily",
  "weekly",
  "monthly",
]);

export const reportTypeEnum = pgEnum("report_type", [
  "usage_summary",
  "billing_summary",
  "team_activity",
  "project_overview",
]);

export const scheduledReports = pgTable("scheduled_reports", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: reportTypeEnum("type").notNull(),
  frequency: reportFrequencyEnum("frequency").notNull(),
  recipients: text("recipients").array().notNull().default([]),
  enabled: boolean("enabled").default(true).notNull(),
  lastSentAt: timestamp("last_sent_at"),
  nextRunAt: timestamp("next_run_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const scheduledReportRelations = relations(scheduledReports, ({ one }) => ({
  team: one(teams, {
    fields: [scheduledReports.teamId],
    references: [teams.id],
  }),
}));

export function computeNextRunAt(
  frequency: "daily" | "weekly" | "monthly",
  from: Date = new Date()
): Date {
  const next = new Date(from);
  if (frequency === "daily") next.setDate(next.getDate() + 1);
  else if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  // Normalise to 9am UTC
  next.setUTCHours(9, 0, 0, 0);
  return next;
}

export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type NewScheduledReport = typeof scheduledReports.$inferInsert;
