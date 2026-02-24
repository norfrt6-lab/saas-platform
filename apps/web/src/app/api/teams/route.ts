import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSession } from "@saas/auth";
import { createTeam, getUserTeams } from "@/lib/api/teams";
import { createAuditLog } from "@/lib/api/audit";
import { withErrorHandler } from "@/lib/api/errors";

export async function GET() {
  return withErrorHandler(async () => {
    const session = await requireSession();
    const teams = await getUserTeams(session.user.id);
    return NextResponse.json(teams);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const session = await requireSession();

    const body = await request.json().catch(() => null);

    if (
      !body?.name ||
      typeof body.name !== "string" ||
      body.name.length < 2 ||
      body.name.length > 50
    ) {
      return NextResponse.json(
        { error: "Team name is required (2-50 characters)" },
        { status: 400 },
      );
    }

    const team = await createTeam({
      name: body.name,
      userId: session.user.id,
    });

    await createAuditLog({
      teamId: team.id,
      userId: session.user.id,
      action: "team.created",
      targetType: "team",
      targetId: team.id,
      metadata: { name: team.name },
    });

    return NextResponse.json(team, { status: 201 });
  });
}
