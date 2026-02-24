import { db } from "@saas/db";
import { teams, teamMembers } from "@saas/db/schema";
import { eq, and } from "drizzle-orm";
import { slugify } from "@/lib/utils";

export async function createTeam(params: {
  name: string;
  userId: string;
}) {
  const slug = slugify(params.name);

  const [team] = await db
    .insert(teams)
    .values({
      name: params.name,
      slug,
    })
    .returning();

  // Add creator as owner
  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: params.userId,
    role: "owner",
  });

  return team;
}

export async function updateTeam(params: {
  teamId: string;
  name?: string;
  slug?: string;
}) {
  const updates: Record<string, unknown> = {};
  if (params.name) updates.name = params.name;
  if (params.slug) updates.slug = slugify(params.slug);

  const [team] = await db
    .update(teams)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(teams.id, params.teamId))
    .returning();

  return team;
}

export async function deleteTeam(teamId: string) {
  await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
  await db.delete(teams).where(eq(teams.id, teamId));
}

export async function getUserTeams(userId: string) {
  const memberships = await db
    .select({
      team: teams,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId))
    .orderBy(teams.name);

  return memberships;
}

export async function getTeamMembers(teamId: string) {
  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(teamMembers.joinedAt);

  return members;
}

export async function updateMemberRole(params: {
  teamId: string;
  userId: string;
  role: "owner" | "admin" | "member";
}) {
  const [member] = await db
    .update(teamMembers)
    .set({ role: params.role })
    .where(
      and(
        eq(teamMembers.teamId, params.teamId),
        eq(teamMembers.userId, params.userId),
      ),
    )
    .returning();

  return member;
}

export async function removeMember(teamId: string, userId: string) {
  await db
    .delete(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId),
      ),
    );
}
