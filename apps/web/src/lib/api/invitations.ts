import { db } from "@saas/db";
import { invitations, teamMembers } from "@saas/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { requireTeamRole } from "./teams";
import { ConflictError, NotFoundError, BadRequestError } from "./errors";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createInvitation(params: {
  teamId: string;
  email: string;
  role: "admin" | "member";
  invitedBy: string;
}) {
  await requireTeamRole(params.teamId, params.invitedBy, ["owner", "admin"]);

  const [existing] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.teamId, params.teamId),
        eq(invitations.email, params.email),
        eq(invitations.status, "pending"),
      ),
    )
    .limit(1);

  if (existing) {
    throw new ConflictError("An invitation is already pending for this email");
  }

  const token = generateToken();
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [invitation] = await db
    .insert(invitations)
    .values({
      teamId: params.teamId,
      email: params.email,
      role: params.role,
      invitedBy: params.invitedBy,
      token: hashedToken,
      expiresAt,
    })
    .returning();

  return { ...invitation, plainToken: token };
}

export async function acceptInvitation(token: string, userId: string) {
  const hashedToken = hashToken(token);

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.token, hashedToken),
        eq(invitations.status, "pending"),
      ),
    )
    .limit(1);

  if (!invitation) {
    throw new NotFoundError("Invitation not found or already used");
  }

  if (invitation.expiresAt < new Date()) {
    await db
      .update(invitations)
      .set({ status: "expired" })
      .where(eq(invitations.id, invitation.id));
    throw new BadRequestError("Invitation has expired");
  }

  await db.transaction(async (tx) => {
    const [existingMember] = await tx
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, invitation.teamId),
          eq(teamMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!existingMember) {
      await tx.insert(teamMembers).values({
        teamId: invitation.teamId,
        userId,
        role: invitation.role,
      });
    }

    await tx
      .update(invitations)
      .set({ status: "accepted" })
      .where(eq(invitations.id, invitation.id));
  });

  return invitation;
}

export async function getTeamInvitations(
  teamId: string,
  userId: string,
) {
  await requireTeamRole(teamId, userId, ["owner", "admin", "member"]);

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

export async function revokeInvitation(
  invitationId: string,
  teamId: string,
  userId: string,
) {
  await requireTeamRole(teamId, userId, ["owner", "admin"]);

  await db
    .delete(invitations)
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.teamId, teamId),
      ),
    );
}
