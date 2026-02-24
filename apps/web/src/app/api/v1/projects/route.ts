import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authenticateApiRequest, requireScope } from "@/lib/api/api-middleware";
import { createProject, listProjects } from "@/lib/api/projects";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return auth.error;

  const scopeError = requireScope(auth.context, "projects:read");
  if (scopeError) return scopeError;

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);

  const result = await listProjects({
    teamId: auth.context.teamId,
    cursor,
    limit,
  });

  return NextResponse.json({
    data: result.data,
    pagination: {
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return auth.error;

  const scopeError = requireScope(auth.context, "projects:write");
  if (scopeError) return scopeError;

  const body = await request.json().catch(() => null);

  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json(
      { error: "validation_error", message: "name is required" },
      { status: 400 },
    );
  }

  const project = await createProject({
    name: body.name,
    description: body.description,
    teamId: auth.context.teamId,
  });

  return NextResponse.json({ data: project }, { status: 201 });
}
