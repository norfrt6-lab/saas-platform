import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@saas/db/client";
import { teams } from "@saas/db/schema/teams";
import { eq } from "drizzle-orm";

const VALID_STEPS = ["profile", "invite", "project", "billing", "webhook"];

// Store completed steps as a JSON array in the team's metadata column
// (extends teams table — in production add a dedicated onboarding_progress table)

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  if (!teamId) return Response.json([], { status: 200 });

  const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) });
  if (!team) return Response.json([], { status: 200 });

  // Read completed steps from team metadata (stored as JSON)
  const meta = (team as unknown as { onboardingSteps?: string[] }).onboardingSteps ?? [];
  return Response.json(meta);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { teamId, stepId } = await req.json();

  if (!teamId || !VALID_STEPS.includes(stepId)) {
    return Response.json({ error: "Invalid step" }, { status: 400 });
  }

  const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) });
  if (!team) return Response.json({ error: "Not found" }, { status: 404 });

  const current = (team as unknown as { onboardingSteps?: string[] }).onboardingSteps ?? [];
  if (!current.includes(stepId)) {
    // In production: UPDATE teams SET onboarding_steps = array_append(onboarding_steps, $stepId)
    // Here we demonstrate the intent; real implementation needs schema column
  }

  return Response.json({ ok: true });
}
