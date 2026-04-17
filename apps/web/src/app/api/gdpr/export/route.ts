import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@saas/db/client";
import { users } from "@saas/db/schema/users";
import { teams } from "@saas/db/schema/teams";
import { projects } from "@saas/db/schema/projects";
import { auditLogs } from "@saas/db/schema/audit-logs";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, userTeams, userProjects, userAuditLogs] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.teams.findMany({
      where: eq(teams.id, userId), // teams owned by user
    }),
    db.query.projects.findMany({ where: eq(projects.createdById, userId) }),
    db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .limit(1000),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      createdAt: user?.createdAt,
    },
    teams: userTeams.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.plan,
    })),
    projects: userProjects.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
    })),
    auditLog: userAuditLogs.map((log) => ({
      action: log.action,
      createdAt: log.createdAt,
      metadata: log.metadata,
    })),
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="data-export-${userId}-${Date.now()}.json"`,
    },
  });
}
