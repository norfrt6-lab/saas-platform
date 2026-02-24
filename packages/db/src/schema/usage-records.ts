import {
  pgTable,
  text,
  timestamp,
  bigint,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { teams } from "./teams";

export const usageMetricEnum = pgEnum("usage_metric", [
  "api_calls",
  "file_uploads",
  "storage_bytes",
  "bandwidth_bytes",
]);

export const usageRecords = pgTable(
  "usage_records",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id),
    metric: usageMetricEnum("metric").notNull(),
    value: bigint("value", { mode: "number" }).notNull(),
    period: text("period").notNull(), // YYYY-MM format
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  },
  (t) => [
    index("usage_records_team_period_metric_idx").on(
      t.teamId,
      t.period,
      t.metric,
    ),
  ],
);

export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;
