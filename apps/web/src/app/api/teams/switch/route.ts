import { requireSession } from "@saas/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { withErrorHandler } from "@/lib/api/errors";
import { verifyTeamMembership } from "@/lib/api/teams";
import { setActiveTeamId } from "@/lib/tenant-middleware";

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const session = await requireSession();
    const body = await request.json().catch(() => null);

    if (!body?.teamId || typeof body.teamId !== "string") {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 },
      );
    }

    const membership = await verifyTeamMembership(body.teamId, session.user.id);

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this team" },
        { status: 403 },
      );
    }

    await setActiveTeamId(body.teamId);

    return NextResponse.json({ success: true, teamId: body.teamId });
  });
}
