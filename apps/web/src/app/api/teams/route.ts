import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSession } from "@saas/auth";
import { createTeam, getUserTeams } from "@/lib/api/teams";

export async function GET() {
  const session = await requireSession();
  const teams = await getUserTeams(session.user.id);
  return NextResponse.json(teams);
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  const body = await request.json();

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json(
      { error: "Team name is required" },
      { status: 400 },
    );
  }

  const team = await createTeam({
    name: body.name,
    userId: session.user.id,
  });

  return NextResponse.json(team, { status: 201 });
}
