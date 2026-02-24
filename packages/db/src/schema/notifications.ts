import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "team.invite",
  "team.role_changed",
  "project.created",
  "project.deleted",
  "billing.payment_failed",
  "billing.plan_changed",
  "system.announcement",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    read: boolean("read").default(false).notNull(),
    actionUrl: text("action_url"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("notifications_user_unread_idx").on(t.userId, t.read),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
