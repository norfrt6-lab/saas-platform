import pino from "pino";
import crypto from "crypto";

export const log = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
    bindings: () => ({}),
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "*.password",
      "**.password",
      "hashedPassword",
      "*.hashedPassword",
      "**.hashedPassword",
      "hashedKey",
      "*.hashedKey",
      "**.hashedKey",
      "token",
      "*.token",
      "**.token",
      "secret",
      "*.secret",
      "**.secret",
      "req.query.token",
      "req.query.email",
    ],
    censor: "[REDACTED]",
  },
  transport:
    process.env.NODE_ENV === "development" && !process.env.NEXT_RUNTIME
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

export function createChildLogger(bindings: Record<string, unknown>) {
  return log.child(bindings);
}

/**
 * Generate a unique request ID for correlating logs across async boundaries.
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Create a request-scoped logger with a trace ID for correlation.
 */
export function createRequestLogger(requestId?: string) {
  const traceId = requestId ?? generateRequestId();
  return {
    logger: log.child({ traceId }),
    traceId,
  };
}

export type Logger = typeof log;

/**
 * Standard log fields for structured log aggregation.
 * Use these when logging to ensure consistent field names across services.
 */
export const LogFields = {
  CORRELATION_ID: "correlationId",
  TEAM_ID: "teamId",
  USER_ID: "userId",
  METHOD: "method",
  PATH: "path",
  STATUS_CODE: "statusCode",
  DURATION_MS: "durationMs",
  ERROR_CODE: "errorCode",
} as const;

/**
 * Create a structured log entry with consistent field naming.
 * Useful for log aggregation tools (Datadog, ELK, Loki, etc.)
 */
export function structuredLog(
  level: "info" | "warn" | "error" | "debug",
  message: string,
  fields: Record<string, unknown>,
): void {
  log[level](fields, message);
}
