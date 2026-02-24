import type { NextRequest, NextResponse } from "next/server";
import { log, generateRequestId } from "./index";

const SLOW_REQUEST_THRESHOLD_MS = Number(
  process.env.SLOW_REQUEST_THRESHOLD_MS ?? "3000",
);

export function logRequest(
  request: NextRequest,
  response: NextResponse,
  startTime: number,
) {
  const duration = Date.now() - startTime;
  const { pathname, searchParams } = new URL(request.url);

  // Use existing trace ID from header or generate one
  const traceId =
    request.headers.get("x-request-id") ?? generateRequestId();

  const logData = {
    traceId,
    method: request.method,
    path: pathname,
    query: Object.fromEntries(searchParams),
    status: response.status,
    duration,
    userAgent: request.headers.get("user-agent")?.slice(0, 200),
    ip:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip"),
  };

  if (response.status >= 500) {
    log.error(logData, "Server error");
  } else if (response.status >= 400) {
    log.warn(logData, "Client error");
  } else if (duration > SLOW_REQUEST_THRESHOLD_MS) {
    log.warn(logData, "Slow request");
  } else {
    log.info(logData, "Request completed");
  }
}
