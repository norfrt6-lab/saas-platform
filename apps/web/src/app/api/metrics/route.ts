import { exportMetrics } from "@saas/logger/metrics";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Prometheus-compatible metrics endpoint.
 * Protected by METRICS_SECRET bearer token to prevent public access.
 */
export async function GET(request: NextRequest) {
  const metricsSecret = process.env.METRICS_SECRET;

  if (metricsSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${metricsSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = exportMetrics();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
