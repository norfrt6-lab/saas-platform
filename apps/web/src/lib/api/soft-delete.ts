import { db } from "@saas/db";
import { projects } from "@saas/db/schema";
import { eq, and, isNotNull, lt } from "drizzle-orm";

/**
 * Lists all soft-deleted projects for a team (trash view).
 */
export async function listDeletedProjects(teamId: string) {
  return db
    .select()
    .from(projects)
    .where(
      and(eq(projects.teamId, teamId), isNotNull(projects.deletedAt)),
    )
    .orderBy(projects.deletedAt);
}

/**
 * Purge job: permanently delete projects past their retention period.
 * Should be run on a cron schedule (e.g., daily).
 */
export async function purgeExpiredProjects(): Promise<number> {
  const now = new Date();

  const expired = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        isNotNull(projects.scheduledPurgeAt),
        lt(projects.scheduledPurgeAt, now),
      ),
    );

  if (expired.length === 0) return 0;

  for (const project of expired) {
    await db.delete(projects).where(eq(projects.id, project.id));
  }

  return expired.length;
}

/**
 * GDPR: Export all project data for a team.
 */
export async function exportTeamProjectData(teamId: string) {
  const allProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.teamId, teamId));

  return {
    exportedAt: new Date().toISOString(),
    teamId,
    projects: allProjects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      deletedAt: p.deletedAt,
    })),
  };
}

/**
 * GDPR: Permanently erase all team data.
 */
export async function eraseTeamData(teamId: string): Promise<void> {
  // Delete all projects (both active and soft-deleted)
  await db.delete(projects).where(eq(projects.teamId, teamId));
}
