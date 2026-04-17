import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { teams } from "./teams";

export const domainStatusEnum = pgEnum("domain_status", [
  "pending",
  "verifying",
  "active",
  "failed",
]);

export const customDomains = pgTable("custom_domains", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  domain: text("domain").notNull().unique(),
  status: domainStatusEnum("status").default("pending").notNull(),
  verificationToken: text("verification_token")
    .notNull()
    .$defaultFn(() => `verify-${createId()}`),
  sslProvisioned: boolean("ssl_provisioned").default(false).notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const customDomainRelations = relations(customDomains, ({ one }) => ({
  team: one(teams, {
    fields: [customDomains.teamId],
    references: [teams.id],
  }),
}));

export type CustomDomain = typeof customDomains.$inferSelect;
export type NewCustomDomain = typeof customDomains.$inferInsert;
