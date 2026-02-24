import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";
import { teams, teamRoleEnum } from "./teams";

export const invitations = pgTable("invitations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  role: teamRoleEnum("role").default("member").notNull(),
  invitedBy: text("invited_by")
    .notNull()
    .references(() => users.id),
  token: text("token").notNull().unique(),
  status: text("status", {
    enum: ["pending", "accepted", "expired"],
  })
    .default("pending")
    .notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
