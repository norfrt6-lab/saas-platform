import { db } from "@saas/db";
import { projects, teamMembers, invitations, apiKeys, auditLogs, type Project } from "@saas/db/schema";
import { eq, and, isNotNull, lt, inArray } from "drizzle-orm";

/**
 * Lists all soft-deleted projects for a team (trash view).
 */
export async function listDeletedProjects(teamId: string): Promise<Project[]> {
  const result = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.teamId, teamId), isNotNull(projects.deletedAt)),
    )
    .orderBy(projects.deletedAt);
  return result as Project[];
}

/**
 * Purge job: permanently delete projects past their retention period.
 * Uses batch delete instead of per-row queries.
 */
export async function purgeExpiredProjects(): Promise<number> {
  const now = new Date();

  const expired: { id: string }[] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        isNotNull(projects.scheduledPurgeAt),
        lt(projects.scheduledPurgeAt, now),
      ),
    );

  if (expired.length === 0) return 0;

  const expiredIds = expired.map((p) => p.id);

  await db.delete(projects).where(inArray(projects.id, expiredIds));

  return expiredIds.length;
}

/**
 * GDPR: Export all project data for a team.
 */
export async function exportTeamProjectData(teamId: string) {
  const allProjects: Project[] = await db
    .select()
    .from(projects)
    .where(eq(projects.teamId, teamId)) as unknown as Project[];

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
 * Deletes all team-scoped data in the correct order to respect FK constraints.
 */
export async function eraseTeamData(teamId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(auditLogs).where(eq(auditLogs.teamId, teamId));
    await tx.delete(apiKeys).where(eq(apiKeys.teamId, teamId));
    await tx.delete(invitations).where(eq(invitations.teamId, teamId));
    await tx.delete(projects).where(eq(projects.teamId, teamId));
    await tx.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
  });
}
