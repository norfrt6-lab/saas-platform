import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSession } from "@saas/auth";
import { createInvitation, getTeamInvitations } from "@/lib/api/invitations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  await requireSession();
  const { teamId } = await params;
  const invites = await getTeamInvitations(teamId);
  return NextResponse.json(invites);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const session = await requireSession();
  const { teamId } = await params;
  const body = await request.json();

  if (!body.email || typeof body.email !== "string") {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 },
    );
  }

  const invitation = await createInvitation({
    teamId,
    email: body.email,
    role: body.role ?? "member",
    invitedBy: session.user.id,
  });

  return NextResponse.json(invitation, { status: 201 });
}
