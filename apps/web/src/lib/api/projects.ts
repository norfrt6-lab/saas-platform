import { db } from "@saas/db";
import { projects } from "@saas/db/schema";
import { and, desc, eq, isNull, lt } from "drizzle-orm";

import { slugify } from "@/lib/utils";

export async function createProject(params: {
  name: string;
  description?: string;
  teamId: string;
}) {
  const slug = slugify(params.name);

  const [project] = await db
    .insert(projects)
    .values({
      name: params.name,
      slug,
      description: params.description ?? null,
      teamId: params.teamId,
    })
    .returning();

  return project;
}

export async function updateProject(params: {
  projectId: string;
  teamId: string;
  name?: string;
  description?: string;
}) {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (params.name) {
    updates.name = params.name;
    updates.slug = slugify(params.name);
  }
  if (params.description !== undefined) {
    updates.description = params.description;
  }

  const [project] = await db
    .update(projects)
    .set(updates)
    .where(
      and(
        eq(projects.id, params.projectId),
        eq(projects.teamId, params.teamId),
        isNull(projects.deletedAt),
      ),
    )
    .returning();

  return project;
}

export async function getProject(projectId: string, teamId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.teamId, teamId),
        isNull(projects.deletedAt),
      ),
    )
    .limit(1);

  return project ?? null;
}

interface ListProjectsParams {
  teamId: string;
  cursor?: string;
  limit?: number;
}

export async function listProjects({
  teamId,
  cursor,
  limit = 20,
}: ListProjectsParams) {
  const conditions = [
    eq(projects.teamId, teamId),
    isNull(projects.deletedAt),
  ];

  if (cursor) {
    conditions.push(lt(projects.id, cursor));
  }

  const items = await db
    .select()
    .from(projects)
    .where(and(...conditions))
    .orderBy(desc(projects.createdAt))
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

  return { data, nextCursor, hasMore };
}

export async function softDeleteProject(params: {
  projectId: string;
  teamId: string;
  deletedBy: string;
}) {
  const scheduledPurgeAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const [project] = await db
    .update(projects)
    .set({
      deletedAt: new Date(),
      deletedBy: params.deletedBy,
      scheduledPurgeAt,
    })
    .where(
      and(
        eq(projects.id, params.projectId),
        eq(projects.teamId, params.teamId),
        isNull(projects.deletedAt),
      ),
    )
    .returning();

  return project;
}

export async function restoreProject(projectId: string, teamId: string) {
  const [project] = await db
    .update(projects)
    .set({
      deletedAt: null,
      deletedBy: null,
      scheduledPurgeAt: null,
    })
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.teamId, teamId),
      ),
    )
    .returning();

  return project;
}

export async function hardDeleteProject(projectId: string) {
  await db.delete(projects).where(eq(projects.id, projectId));
}
