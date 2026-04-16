import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@saas/db/client";
import { projects } from "@saas/db/schema/projects";
import { usageRecords } from "@saas/db/schema/usage-records";
import { auditLogs } from "@saas/db/schema/audit-logs";
import { eq, gte, count, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  const range = (searchParams.get("range") ?? "30") as string;

  if (!teamId) {
    return Response.json({ error: "teamId required" }, { status: 400 });
  }

  const days = Math.min(parseInt(range, 10) || 30, 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [projectStats, usageStats, activityStats] = await Promise.all([
    // Project counts
    db
      .select({ total: count() })
      .from(projects)
      .where(eq(projects.teamId, teamId))
      .then((r) => r[0]),

    // Usage aggregated by day
    db
      .select({
        date: sql<string>`date_trunc('day', ${usageRecords.createdAt})::date`,
        total: sql<number>`sum(${usageRecords.quantity})`,
      })
      .from(usageRecords)
      .where(
        sql`${usageRecords.teamId} = ${teamId} AND ${usageRecords.createdAt} >= ${since}`
      )
      .groupBy(sql`date_trunc('day', ${usageRecords.createdAt})`)
      .orderBy(sql`date_trunc('day', ${usageRecords.createdAt})`),

    // Activity events by type
    db
      .select({
        action: auditLogs.action,
        count: count(),
      })
      .from(auditLogs)
      .where(
        sql`${auditLogs.teamId} = ${teamId} AND ${auditLogs.createdAt} >= ${since}`
      )
      .groupBy(auditLogs.action)
      .orderBy(sql`count(*) desc`)
      .limit(10),
  ]);

  return Response.json({
    projects: projectStats?.total ?? 0,
    usage: usageStats,
    activity: activityStats,
    range: days,
  });
}
