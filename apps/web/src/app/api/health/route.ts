import { NextResponse } from "next/server";
import { db } from "@saas/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<
    string,
    {
      status: "pass" | "fail";
      latencyMs: number;
      message?: string;
    }
  >;
  version: string;
  uptime: number;
  timestamp: string;
}

const startTime = Date.now();

export async function GET() {
  const checks: HealthCheck["checks"] = {};
  let overallStatus: HealthCheck["status"] = "healthy";

  // Database check
  const dbStart = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = {
      status: "pass",
      latencyMs: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: "fail",
      latencyMs: Date.now() - dbStart,
      message: error instanceof Error ? error.message : "Unknown error",
    };
    overallStatus = "unhealthy";
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const heapPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  checks.memory = {
    status: heapPercent < 90 ? "pass" : "fail",
    latencyMs: 0,
    message: `${heapUsedMB}MB / ${heapTotalMB}MB (${heapPercent}%)`,
  };

  if (heapPercent >= 90) {
    overallStatus = overallStatus === "healthy" ? "degraded" : overallStatus;
  }

  const health: HealthCheck = {
    status: overallStatus,
    checks,
    version: process.env.APP_VERSION ?? "0.1.0",
    uptime: Math.round((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  };

  const statusCode = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(health, { status: statusCode });
}
