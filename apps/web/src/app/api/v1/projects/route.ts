import type { NextRequest } from "next/server";

import { authenticateApiRequest, requireScope } from "@/lib/api/api-middleware";
import { cachedJsonResponse } from "@/lib/api/cache-headers";
import { createProject, listProjects } from "@/lib/api/projects";
import { apiSuccess, apiError, ErrorCodes } from "@/lib/api/response";

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

  return cachedJsonResponse(request, {
    data: result.data,
    pagination: {
      hasMore: result.hasMore,
      nextCursor: result.nextCursor ?? null,
    },
  }, {
    maxAge: 5,
    staleWhileRevalidate: 30,
    isPrivate: true,
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return auth.error;

  const scopeError = requireScope(auth.context, "projects:write");
  if (scopeError) return scopeError;

  const body = await request.json().catch(() => null);

  if (!body?.name || typeof body.name !== "string") {
    return apiError(ErrorCodes.VALIDATION_ERROR, "name is required", 400);
  }

  const project = await createProject({
    name: body.name,
    description: body.description,
    teamId: auth.context.teamId,
  });

  return apiSuccess(project, 201);
}
