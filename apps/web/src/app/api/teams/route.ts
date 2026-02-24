import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSession } from "@saas/auth";
import { createTeam, getUserTeams } from "@/lib/api/teams";
import { createAuditLog } from "@/lib/api/audit";

export async function GET() {
  try {
    const session = await requireSession();
    const teams = await getUserTeams(session.user.id);
    return NextResponse.json(teams);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    // PostgreSQL unique violation: code 23505
    if (
      error != null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "A team with this name already exists" },
        { status: 409 },
      );
    }
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
