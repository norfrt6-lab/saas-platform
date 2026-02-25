import { createChildLogger } from "@saas/logger";
import type { NextRequest } from "next/server";

const log = createChildLogger({ module: "api" });

const CORRELATION_ID_HEADER = "x-correlation-id";

interface RequestLogContext {
  correlationId: string;
  method: string;
  path: string;
  startTime: number;
}

/**
 * Extract correlation ID from the incoming request.
 * The middleware generates one if not present, so it should always exist.
 */
export function getCorrelationId(request: NextRequest): string {
  return request.headers.get(CORRELATION_ID_HEADER) ?? "unknown";
}

/**
 * Start timing a request. Returns a context object and a `finish` function
 * to log the completed request with its duration.
 */
export function startRequestLog(request: NextRequest): {
  context: RequestLogContext;
  finish: (statusCode: number) => void;
} {
  const correlationId = getCorrelationId(request);
  const { pathname } = new URL(request.url);

  const context: RequestLogContext = {
    correlationId,
    method: request.method,
    path: pathname,
    startTime: Date.now(),
  };

  log.info(
    { correlationId, method: context.method, path: context.path },
    "Request started",
  );

  const finish = (statusCode: number) => {
    const durationMs = Date.now() - context.startTime;
    const logFn = statusCode >= 500 ? log.error.bind(log) : statusCode >= 400 ? log.warn.bind(log) : log.info.bind(log);

    logFn(
      {
        correlationId,
        method: context.method,
        path: context.path,
        statusCode,
        durationMs,
      },
      "Request completed",
    );
  };

  return { context, finish };
}

/**
 * Create a child logger scoped to a specific request's correlation ID.
 */
export function createCorrelatedLogger(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  return {
    logger: log.child({ correlationId }),
    correlationId,
  };
}
