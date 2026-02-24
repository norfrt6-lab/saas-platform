import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSession } from "@saas/auth";
import { getActiveTeamId } from "@/lib/tenant-middleware";
import { createProject, listProjects } from "@/lib/api/projects";

export async function GET(request: NextRequest) {
  await requireSession();
  const teamId = await getActiveTeamId();

  if (!teamId) {
    return NextResponse.json({ error: "No team selected" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "20");

  const result = await listProjects({ teamId, cursor, limit });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  await requireSession();
  const teamId = await getActiveTeamId();

  if (!teamId) {
    return NextResponse.json({ error: "No team selected" }, { status: 400 });
  }

  const body = await request.json();

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 },
    );
  }

  const project = await createProject({
    name: body.name,
    description: body.description,
    teamId,
  });

  return NextResponse.json(project, { status: 201 });
}
