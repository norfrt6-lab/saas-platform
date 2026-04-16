import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { teams } from "./teams";

export const ssoProviderEnum = pgEnum("sso_provider", ["saml", "oidc"]);

export const ssoConfigurations = pgTable("sso_configurations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  teamId: text("team_id")
    .notNull()
    .unique()
    .references(() => teams.id, { onDelete: "cascade" }),
  provider: ssoProviderEnum("provider").notNull(),
  // SAML fields
  entryPoint: text("entry_point"),
  issuer: text("issuer"),
  certificate: text("certificate"),
  // OIDC fields
  clientId: text("client_id"),
  clientSecret: text("client_secret"),
  discoveryUrl: text("discovery_url"),
  // Shared
  enabled: boolean("enabled").default(false).notNull(),
  enforced: boolean("enforced").default(false).notNull(),
  allowedDomains: text("allowed_domains").array().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const ssoConfigRelations = relations(ssoConfigurations, ({ one }) => ({
  team: one(teams, {
    fields: [ssoConfigurations.teamId],
    references: [teams.id],
  }),
}));

export type SsoConfiguration = typeof ssoConfigurations.$inferSelect;
export type NewSsoConfiguration = typeof ssoConfigurations.$inferInsert;
