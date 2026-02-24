import { NextResponse } from "next/server";
import { purgeExpiredProjects } from "@/lib/api/soft-delete";

/**
 * Cron endpoint: Purge expired soft-deleted projects.
 * Should be called by a cron job (e.g., Vercel Cron, GitHub Actions).
 * Protected by CRON_SECRET header.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const purgedCount = await purgeExpiredProjects();

  return NextResponse.json({
    success: true,
    purgedCount,
    timestamp: new Date().toISOString(),
  });
}
