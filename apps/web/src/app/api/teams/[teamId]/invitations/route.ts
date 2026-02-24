import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSession } from "@saas/auth";
import { createInvitation, getTeamInvitations } from "@/lib/api/invitations";
import { createAuditLog } from "@/lib/api/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await requireSession();
    const { teamId } = await params;

    const invites = await getTeamInvitations(teamId, session.user.id);
    return NextResponse.json(invites);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("Not a member") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await requireSession();
    const { teamId } = await params;

    const body = await request.json().catch(() => null);

    if (!body?.email || typeof body.email !== "string") {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    const role = body.role === "admin" ? "admin" : "member";

    const invitation = await createInvitation({
      teamId,
      email: body.email,
      role,
      invitedBy: session.user.id,
    });

    await createAuditLog({
      teamId,
      userId: session.user.id,
      action: "member.invited",
      targetType: "invitation",
      targetId: invitation.id,
      metadata: { email: body.email, role },
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    if (message.includes("Not a member") || message.includes("Insufficient")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes("already pending")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
