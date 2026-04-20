import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { teams } from "./teams";

export const ipAllowlistEntries = pgTable("ip_allowlist_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  // IPv4 address or CIDR range, e.g. "203.0.113.42" or "203.0.113.0/24"
  cidr: text("cidr").notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ipAllowlistRelations = relations(ipAllowlistEntries, ({ one }) => ({
  team: one(teams, {
    fields: [ipAllowlistEntries.teamId],
    references: [teams.id],
  }),
}));

export type IpAllowlistEntry = typeof ipAllowlistEntries.$inferSelect;
