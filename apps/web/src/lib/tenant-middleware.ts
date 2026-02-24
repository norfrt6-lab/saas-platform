import { cookies } from "next/headers";
import { db } from "@saas/db";
import { teams, teamMembers } from "@saas/db/schema";
import { eq, and } from "drizzle-orm";
import { runWithTenant, type TenantContext } from "@saas/db/tenant";
import { requireSession } from "@saas/auth";
import { BadRequestError, ForbiddenError } from "./api/errors";

const TEAM_COOKIE = "active-team-id";

export async function withTenantContext<T>(fn: () => T): Promise<T> {
  const session = await requireSession();
  const cookieStore = await cookies();
  const teamId = cookieStore.get(TEAM_COOKIE)?.value;

  if (!teamId) {
    throw new BadRequestError("No active team selected");
  }

  // Verify the user is a member of this team
  const [membership] = await db
    .select({
      role: teamMembers.role,
    })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new ForbiddenError("Not a member of this team");
  }

  const context: TenantContext = {
    teamId,
    userId: session.user.id,
    role: membership.role,
  };

  return runWithTenant(context, fn);
}

export async function getActiveTeamId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TEAM_COOKIE)?.value ?? null;
}

export async function setActiveTeamId(teamId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TEAM_COOKIE, teamId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
