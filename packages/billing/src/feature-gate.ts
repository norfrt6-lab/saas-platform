import { db, teams, projects, teamMembers, usageRecords } from "@saas/db";
import { eq, and, isNull, count, sum } from "drizzle-orm";
import { PLAN_LIMITS, hasFeature, type Plan } from "./plans";

export interface UsageCheck {
  allowed: boolean;
  current: number;
  limit: number;
  plan: Plan;
}

/**
 * Fetch team plan once and reuse across multiple limit checks.
 */
async function getTeamPlan(teamId: string): Promise<Plan> {
  const [team] = await db
    .select({ plan: teams.plan })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) throw new Error("Team not found");
  return team.plan;
}

export async function checkProjectLimit(teamId: string): Promise<UsageCheck> {
  const plan = await getTeamPlan(teamId);

  const [result] = await db
    .select({ count: count() })
    .from(projects)
    .where(
      and(eq(projects.teamId, teamId), isNull(projects.deletedAt)),
    );

  const current = result?.count ?? 0;
  const limit = PLAN_LIMITS[plan].maxProjects;

  return { allowed: current < limit, current, limit, plan };
}

export async function checkMemberLimit(teamId: string): Promise<UsageCheck> {
  const plan = await getTeamPlan(teamId);

  const [result] = await db
    .select({ count: count() })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));

  const current = result?.count ?? 0;
  const limit = PLAN_LIMITS[plan].maxMembers;

  return { allowed: current < limit, current, limit, plan };
}

export async function checkFeatureAccess(
  teamId: string,
  feature: string,
): Promise<{ allowed: boolean; plan: Plan }> {
  const plan = await getTeamPlan(teamId);

  return {
    allowed: hasFeature(plan, feature),
    plan,
  };
}

/**
 * Get the current billing period string (YYYY-MM format).
 */
function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getTeamUsageSummary(teamId: string) {
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) throw new Error("Team not found");

  const limits = PLAN_LIMITS[team.plan];
  const currentPeriod = getCurrentPeriod();

  // Run all count queries in parallel
  const [projectCount, memberCount, apiCallUsage] = await Promise.all([
    db
      .select({ count: count() })
      .from(projects)
      .where(
        and(eq(projects.teamId, teamId), isNull(projects.deletedAt)),
      )
      .then((r) => r[0]?.count ?? 0),
    db
      .select({ count: count() })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId))
      .then((r) => r[0]?.count ?? 0),
    db
      .select({ total: sum(usageRecords.value) })
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.teamId, teamId),
          eq(usageRecords.metric, "api_calls"),
          eq(usageRecords.period, currentPeriod),
        ),
      )
      .then((r) => Number(r[0]?.total ?? 0)),
  ]);

  return {
    plan: team.plan,
    billingStatus: team.billingStatus,
    usage: {
      projects: { current: projectCount, limit: limits.maxProjects },
      members: { current: memberCount, limit: limits.maxMembers },
      apiCalls: { current: apiCallUsage, limit: limits.maxApiCallsPerMonth },
    },
    features: limits.features,
  };
}
