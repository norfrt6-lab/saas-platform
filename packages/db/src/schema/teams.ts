import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";
import { projects } from "./projects";

export const planEnum = pgEnum("plan", ["free", "pro", "enterprise"]);
export const teamRoleEnum = pgEnum("team_role", ["owner", "admin", "member"]);
export const billingStatusEnum = pgEnum("billing_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
]);

export const teams = pgTable("teams", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  plan: planEnum("plan").default("free").notNull(),
  billingStatus: billingStatusEnum("billing_status"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  gracePeriodEndsAt: timestamp("grace_period_ends_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  projects: many(projects),
}));

export const teamMembers = pgTable(
  "team_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    role: teamRoleEnum("role").default("member").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [unique("team_members_user_team_unique").on(t.userId, t.teamId)],
);

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
}));

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
