import { NextRequest, NextResponse } from "next/server";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  message?: string;
  statusCode?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

// In-memory sliding window store (replace with Redis in production)
interface WindowEntry {
  timestamps: number[];
}
const store = new Map<string, WindowEntry>();

function getClientKey(req: NextRequest, prefix: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]!.trim() : "unknown";
  const path = new URL(req.url).pathname;
  return `${prefix}:${ip}:${path}`;
}

export function slidingWindowRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Evict timestamps outside the window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  const count = entry.timestamps.length;
  const allowed = count < config.maxRequests;

  if (allowed) {
    entry.timestamps.push(now);
  }

  const oldest = entry.timestamps[0] ?? now;
  const resetAt = new Date(oldest + config.windowMs);
  const remaining = Math.max(0, config.maxRequests - entry.timestamps.length);

  return { allowed, remaining, resetAt, limit: config.maxRequests };
}

export function withRateLimit(config: RateLimitConfig) {
  return function rateLimitMiddleware(
    handler: (req: NextRequest) => Promise<NextResponse>
  ) {
    return async function (req: NextRequest): Promise<NextResponse> {
      const key = getClientKey(req, config.keyPrefix ?? "rl");
      const result = slidingWindowRateLimit(key, config);

      const headers: Record<string, string> = {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": result.resetAt.toISOString(),
      };

      if (!result.allowed) {
        return NextResponse.json(
          { error: config.message ?? "Too many requests" },
          { status: config.statusCode ?? 429, headers }
        );
      }

      const response = await handler(req);
      Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      return response;
    };
  };
}

// Preset configurations
export const API_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 60,
  keyPrefix: "api",
};

export const AUTH_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60_000,
  maxRequests: 10,
  keyPrefix: "auth",
  message: "Too many authentication attempts, please try again later.",
};

export const STRICT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 10,
  keyPrefix: "strict",
};
