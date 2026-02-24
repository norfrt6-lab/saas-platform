import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const processedWebhooks = pgTable("processed_webhooks", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

export type ProcessedWebhook = typeof processedWebhooks.$inferSelect;
export type NewProcessedWebhook = typeof processedWebhooks.$inferInsert;
