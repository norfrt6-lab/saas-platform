import { NextResponse } from "next/server";
import { purgeExpiredProjects } from "@/lib/api/soft-delete";

/**
 * Cron endpoint: Purge expired soft-deleted projects.
 * Protected by CRON_SECRET — always required.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured. Endpoint disabled." },
      { status: 503 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const purgedCount = await purgeExpiredProjects();

    return NextResponse.json({
      success: true,
      purgedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
