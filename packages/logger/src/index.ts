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
