import { db } from "@saas/db";
import { teamMembers, teams, users } from "@saas/db/schema";
import { and, eq } from "drizzle-orm";

import { slugify } from "@/lib/utils";

import { BadRequestError, ForbiddenError } from "./errors";

export async function verifyTeamMembership(
  teamId: string,
  userId: string,
): Promise<{ role: "owner" | "admin" | "member" } | null> {
  const [membership] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId),
      ),
    )
    .limit(1);

  return membership ?? null;
}

export async function requireTeamRole(
  teamId: string,
  userId: string,
  requiredRoles: Array<"owner" | "admin" | "member">,
): Promise<{ role: "owner" | "admin" | "member" }> {
  const membership = await verifyTeamMembership(teamId, userId);

  if (!membership) {
    throw new ForbiddenError("Not a member of this team");
  }

  if (!requiredRoles.includes(membership.role)) {
    throw new ForbiddenError(
      `Insufficient permissions. Required: ${requiredRoles.join(" or ")}`,
    );
  }

  return membership;
}

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

  if (!team) {
    throw new BadRequestError("Failed to create team");
  }

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: params.userId,
    role: "owner",
  });

  return team;
}

export async function updateTeam(params: {
  teamId: string;
  userId: string;
  name?: string;
  slug?: string;
}) {
  await requireTeamRole(params.teamId, params.userId, ["owner", "admin"]);

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

export async function deleteTeam(teamId: string, userId: string) {
  await requireTeamRole(teamId, userId, ["owner"]);

  await db.transaction(async (tx) => {
    await tx.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
    await tx.delete(teams).where(eq(teams.id, teamId));
  });
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
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      teamId: teamMembers.teamId,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(teamMembers.joinedAt);

  return members;
}

export async function updateMemberRole(params: {
  teamId: string;
  targetUserId: string;
  actorUserId: string;
  role: "owner" | "admin" | "member";
}) {
  await requireTeamRole(params.teamId, params.actorUserId, ["owner"]);

  if (params.role !== "owner") {
    const owners = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, params.teamId),
          eq(teamMembers.role, "owner"),
        ),
      );

    const isTargetOwner = owners.some((o) => o.userId === params.targetUserId);
    if (isTargetOwner && owners.length <= 1) {
      throw new BadRequestError("Cannot demote the last owner. Transfer ownership first.");
    }
  }

  const [member] = await db
    .update(teamMembers)
    .set({ role: params.role })
    .where(
      and(
        eq(teamMembers.teamId, params.teamId),
        eq(teamMembers.userId, params.targetUserId),
      ),
    )
    .returning();

  return member;
}

export async function removeMember(
  teamId: string,
  targetUserId: string,
  actorUserId: string,
) {
  if (targetUserId !== actorUserId) {
    await requireTeamRole(teamId, actorUserId, ["owner", "admin"]);
  }

  const owners = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.role, "owner"),
      ),
    );

  const isTargetOwner = owners.some((o) => o.userId === targetUserId);
  if (isTargetOwner && owners.length <= 1) {
    throw new BadRequestError("Cannot remove the last owner");
  }

  await db
    .delete(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, targetUserId),
      ),
    );
}
