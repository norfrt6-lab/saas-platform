import pino, { type Logger, type LoggerOptions } from "pino";
import { tryGetTenantContext } from "@/lib/tenant/context";

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

const pinoOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  base: {
    service: "saas-platform",
    version: process.env.npm_package_version ?? "unknown",
    env: process.env.NODE_ENV ?? "development",
  },
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" },
    },
  }),
  ...(isTest && { level: "silent" }),
};

export const logger: Logger = pino(pinoOptions);

type LogMethod = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

function withTenantContext(extra: LogContext = {}): LogContext {
  const ctx = tryGetTenantContext();
  if (!ctx) return extra;
  return {
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    ...extra,
  };
}

export function logInfo(message: string, ctx?: LogContext): void {
  logger.info(withTenantContext(ctx), message);
}

export function logWarn(message: string, ctx?: LogContext): void {
  logger.warn(withTenantContext(ctx), message);
}

export function logError(message: string, error?: unknown, ctx?: LogContext): void {
  const errObj =
    error instanceof Error
      ? { err: { message: error.message, stack: error.stack, name: error.name } }
      : error !== undefined
        ? { err: error }
        : {};

  logger.error({ ...withTenantContext(ctx), ...errObj }, message);
}

export function logDebug(message: string, ctx?: LogContext): void {
  logger.debug(withTenantContext(ctx), message);
}

export function createChildLogger(bindings: LogContext): Logger {
  return logger.child(bindings);
}

/** Middleware-compatible request logger factory. */
export function createRequestLogger(requestId: string): {
  log: (method: LogMethod, message: string, ctx?: LogContext) => void;
} {
  const child = logger.child({ requestId });
  return {
    log: (method, message, ctx) => child[method](withTenantContext(ctx), message),
  };
}
