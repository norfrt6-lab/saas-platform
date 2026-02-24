import { db } from "@saas/db";
import { teams, projects, teamMembers } from "@saas/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";
import { PLAN_LIMITS, hasFeature, isWithinLimit, type Plan } from "./plans";

export interface UsageCheck {
  allowed: boolean;
  current: number;
  limit: number;
  plan: Plan;
}

export async function checkProjectLimit(teamId: string): Promise<UsageCheck> {
  const [team] = await db
    .select({ plan: teams.plan })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) throw new Error("Team not found");

  const [result] = await db
    .select({ count: count() })
    .from(projects)
    .where(
      and(eq(projects.teamId, teamId), isNull(projects.deletedAt)),
    );

  const current = result.count;
  const limit = PLAN_LIMITS[team.plan].maxProjects;

  return {
    allowed: current < limit,
    current,
    limit,
    plan: team.plan,
  };
}

export async function checkMemberLimit(teamId: string): Promise<UsageCheck> {
  const [team] = await db
    .select({ plan: teams.plan })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) throw new Error("Team not found");

  const [result] = await db
    .select({ count: count() })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));

  const current = result.count;
  const limit = PLAN_LIMITS[team.plan].maxMembers;

  return {
    allowed: current < limit,
    current,
    limit,
    plan: team.plan,
  };
}

export async function checkFeatureAccess(
  teamId: string,
  feature: string,
): Promise<{ allowed: boolean; plan: Plan }> {
  const [team] = await db
    .select({ plan: teams.plan })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) throw new Error("Team not found");

  return {
    allowed: hasFeature(team.plan, feature),
    plan: team.plan,
  };
}

export async function getTeamUsageSummary(teamId: string) {
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) throw new Error("Team not found");

  const limits = PLAN_LIMITS[team.plan];

  const [projectCount] = await db
    .select({ count: count() })
    .from(projects)
    .where(
      and(eq(projects.teamId, teamId), isNull(projects.deletedAt)),
    );

  const [memberCount] = await db
    .select({ count: count() })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));

  return {
    plan: team.plan,
    billingStatus: team.billingStatus,
    usage: {
      projects: { current: projectCount.count, limit: limits.maxProjects },
      members: { current: memberCount.count, limit: limits.maxMembers },
      apiCalls: { current: 0, limit: limits.maxApiCallsPerMonth },
    },
    features: limits.features,
  };
}
