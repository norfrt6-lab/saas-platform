import {
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { teams } from "./teams";
import { users } from "./users";

export const projects = pgTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["active", "archived"],
    })
      .default("active")
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by").references(() => users.id),
    scheduledPurgeAt: timestamp("scheduled_purge_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (t) => [unique("projects_team_slug_unique").on(t.teamId, t.slug)],
);

export const projectsRelations = relations(projects, ({ one }) => ({
  team: one(teams, { fields: [projects.teamId], references: [teams.id] }),
}));

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
