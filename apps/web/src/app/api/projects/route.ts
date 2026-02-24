import { requireSession } from "@saas/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createAuditLog } from "@/lib/api/audit";
import { withErrorHandler } from "@/lib/api/errors";
import { createProject, listProjects } from "@/lib/api/projects";
import { verifyTeamMembership } from "@/lib/api/teams";
import { getActiveTeamId } from "@/lib/tenant-middleware";

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const session = await requireSession();
    const teamId = await getActiveTeamId();

    if (!teamId) {
      return NextResponse.json({ error: "No team selected" }, { status: 400 });
    }

    const membership = await verifyTeamMembership(teamId, session.user.id);
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const limitParam = Number(searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20;

    const result = await listProjects({ teamId, cursor, limit });
    return NextResponse.json(result);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const session = await requireSession();
    const teamId = await getActiveTeamId();

    if (!teamId) {
      return NextResponse.json({ error: "No team selected" }, { status: 400 });
    }

    const membership = await verifyTeamMembership(teamId, session.user.id);
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);

    if (
      !body?.name ||
      typeof body.name !== "string" ||
      body.name.length < 2 ||
      body.name.length > 100
    ) {
      return NextResponse.json(
        { error: "Project name is required (2-100 characters)" },
        { status: 400 },
      );
    }

    const project = await createProject({
      name: body.name,
      description: body.description,
      teamId,
    });

    if (!project) {
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }

    await createAuditLog({
      teamId,
      userId: session.user.id,
      action: "project.created",
      targetType: "project",
      targetId: project.id,
      metadata: { name: project.name },
    });

    return NextResponse.json(project, { status: 201 });
  });
}
