import { db } from "@saas/db";
import { invitations, teamMembers, teams } from "@saas/db/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import crypto from "crypto";

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createInvitation(params: {
  teamId: string;
  email: string;
  role: "owner" | "admin" | "member";
  invitedBy: string;
}) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [invitation] = await db
    .insert(invitations)
    .values({
      teamId: params.teamId,
      email: params.email,
      role: params.role,
      invitedBy: params.invitedBy,
      token,
      expiresAt,
    })
    .returning();

  return invitation;
}

export async function acceptInvitation(token: string, userId: string) {
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.token, token),
        eq(invitations.status, "pending"),
      ),
    )
    .limit(1);

  if (!invitation) {
    throw new Error("Invitation not found or already used");
  }

  if (invitation.expiresAt < new Date()) {
    await db
      .update(invitations)
      .set({ status: "expired" })
      .where(eq(invitations.id, invitation.id));
    throw new Error("Invitation has expired");
  }

  // Add user to team
  await db.insert(teamMembers).values({
    teamId: invitation.teamId,
    userId,
    role: invitation.role,
  });

  // Mark invitation as accepted
  await db
    .update(invitations)
    .set({ status: "accepted" })
    .where(eq(invitations.id, invitation.id));

  return invitation;
}

export async function getTeamInvitations(teamId: string) {
  return db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.teamId, teamId),
        eq(invitations.status, "pending"),
      ),
    )
    .orderBy(invitations.createdAt);
}

export async function revokeInvitation(invitationId: string) {
  await db.delete(invitations).where(eq(invitations.id, invitationId));
}
