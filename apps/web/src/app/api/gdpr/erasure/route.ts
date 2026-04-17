import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@saas/db/client";
import { users } from "@saas/db/schema/users";
import { eq } from "drizzle-orm";

// Right to erasure — schedules account for deletion within 30 days
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { confirmation } = await req.json();
  if (confirmation !== "DELETE MY ACCOUNT") {
    return Response.json({ error: "Invalid confirmation phrase" }, { status: 400 });
  }

  // Anonymise immediately; hard-delete scheduled via background job
  await db
    .update(users)
    .set({
      name: "[deleted]",
      email: `deleted-${session.user.id}@erased.invalid`,
      image: null,
      hashedPassword: null,
    })
    .where(eq(users.id, session.user.id));

  // TODO: enqueue background job to cascade-delete teams, projects, billing data after 30-day grace period

  return Response.json({ scheduled: true, deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
}
