import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@saas/db/client";
import { session } from "@saas/db/schema/auth";
import { eq, desc } from "drizzle-orm";

interface UserAgent {
  browser: string;
  os: string;
  device: "desktop" | "mobile" | "tablet";
}

function parseUserAgent(ua: string | null): UserAgent {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "desktop" };

  const device = /Mobi|Android|iPhone/.test(ua)
    ? "mobile"
    : /iPad|Tablet/.test(ua)
    ? "tablet"
    : "desktop";

  const browser =
    /Chrome/.test(ua) && !/Edg/.test(ua) ? "Chrome"
    : /Firefox/.test(ua) ? "Firefox"
    : /Safari/.test(ua) ? "Safari"
    : /Edg/.test(ua) ? "Edge"
    : "Unknown";

  const os =
    /Windows NT 11/.test(ua) ? "Windows 11"
    : /Windows NT 10/.test(ua) ? "Windows 10"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad|iPod/.test(ua) ? "iOS"
    : /Linux/.test(ua) ? "Linux"
    : "Unknown";

  return { browser, os, device };
}

export async function GET() {
  const current = await auth();
  if (!current?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await db
    .select()
    .from(session)
    .where(eq(session.userId, current.user.id))
    .orderBy(desc(session.expiresAt));

  const enriched = sessions.map((s) => ({
    id: s.id,
    ipAddress: s.ipAddress,
    userAgent: parseUserAgent(s.userAgent ?? null),
    expiresAt: s.expiresAt,
    current: s.id === current.session?.id,
  }));

  return Response.json(enriched);
}

export async function DELETE(req: NextRequest) {
  const current = await auth();
  if (!current?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, all } = await req.json();

  if (all) {
    // Revoke all sessions except current
    await db
      .delete(session)
      .where(eq(session.userId, current.user.id));
    return Response.json({ revoked: "all" });
  }

  if (!id) {
    return Response.json({ error: "Session id required" }, { status: 400 });
  }

  await db.delete(session).where(eq(session.id, id));
  return Response.json({ revoked: id });
}
