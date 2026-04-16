import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { teams } from "./teams";

export const webhookStatusEnum = pgEnum("webhook_status", [
  "active",
  "disabled",
]);

export const webhookDeliveryStatusEnum = pgEnum("webhook_delivery_status", [
  "pending",
  "success",
  "failed",
  "retrying",
]);

export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  description: text("description"),
  events: text("events").array().notNull().default([]),
  status: webhookStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  endpointId: text("endpoint_id")
    .notNull()
    .references(() => webhookEndpoints.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  payload: jsonb("payload").notNull(),
  status: webhookDeliveryStatusEnum("status").default("pending").notNull(),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  attemptCount: integer("attempt_count").default(0).notNull(),
  nextRetryAt: timestamp("next_retry_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhookEndpointRelations = relations(
  webhookEndpoints,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [webhookEndpoints.teamId],
      references: [teams.id],
    }),
    deliveries: many(webhookDeliveries),
  })
);

export const webhookDeliveryRelations = relations(
  webhookDeliveries,
  ({ one }) => ({
    endpoint: one(webhookEndpoints, {
      fields: [webhookDeliveries.endpointId],
      references: [webhookEndpoints.id],
    }),
  })
);

export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type NewWebhookEndpoint = typeof webhookEndpoints.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
