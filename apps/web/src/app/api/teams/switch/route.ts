import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSession } from "@saas/auth";
import { verifyTeamMembership } from "@/lib/api/teams";
import { setActiveTeamId } from "@/lib/tenant-middleware";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json().catch(() => null);

    if (!body?.teamId || typeof body.teamId !== "string") {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 },
      );
    }

    // Verify the user is actually a member of the target team
    const membership = await verifyTeamMembership(body.teamId, session.user.id);

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this team" },
        { status: 403 },
      );
    }

    await setActiveTeamId(body.teamId);

    return NextResponse.json({ success: true, teamId: body.teamId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
