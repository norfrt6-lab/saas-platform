import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@saas/db/client";
import { notifications } from "@saas/db/schema/notifications";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const where = unreadOnly
    ? and(eq(notifications.userId, session.user.id), eq(notifications.read, false))
    : eq(notifications.userId, session.user.id);

  const items = await db
    .select()
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return Response.json(items);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { ids, readAll } = await req.json();

  if (readAll) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, session.user.id));
  } else if (Array.isArray(ids)) {
    for (const id of ids) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));
    }
  }

  return Response.json({ ok: true });
}
