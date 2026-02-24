import { createChildLogger } from "@saas/logger";

const log = createChildLogger({ module: "rate-limit" });

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  register: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
  forgotPassword: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
  api: { maxAttempts: 100, windowMs: 60 * 1000 },
};

interface RateLimitStore {
  check(key: string, config: RateLimitConfig): Promise<RateLimitResult>;
}

/**
 * Redis-backed rate limiter for distributed deployments.
 * Falls back to in-memory store if Redis is unavailable.
 */
class RedisRateLimitStore implements RateLimitStore {
  private redis: import("ioredis").default | null = null;
  private fallback: InMemoryRateLimitStore;
  private connecting = false;

  constructor() {
    this.fallback = new InMemoryRateLimitStore();
    this.connect();
  }

  private async connect() {
    if (this.connecting) return;
    this.connecting = true;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      log.warn("REDIS_URL not set, using in-memory rate limiter (not suitable for multi-instance deployments)");
      this.connecting = false;
      return;
    }

    try {
      const Redis = (await import("ioredis")).default;
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      await this.redis.connect();
      log.info("Rate limiter connected to Redis");
    } catch {
      log.warn("Failed to connect to Redis for rate limiting, using in-memory fallback");
      this.redis = null;
    } finally {
      this.connecting = false;
    }
  }

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    if (!this.redis) {
      return this.fallback.check(key, config);
    }

    try {
      const redisKey = `ratelimit:${key}`;
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Use sorted set with sliding window
      const pipeline = this.redis.pipeline();
      pipeline.zremrangebyscore(redisKey, 0, windowStart);
      pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
      pipeline.zcard(redisKey);
      pipeline.pexpire(redisKey, config.windowMs);

      const results = await pipeline.exec();
      const count = (results?.[2]?.[1] as number) ?? 0;

      return {
        allowed: count <= config.maxAttempts,
        remaining: Math.max(0, config.maxAttempts - count),
        resetAt: now + config.windowMs,
      };
    } catch {
      log.warn("Redis rate limit check failed, falling back to in-memory");
      return this.fallback.check(key, config);
    }
  }
}

/**
 * In-memory rate limiter. Only suitable for single-instance deployments.
 */
class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetAt: number }>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (entry.resetAt < now) this.store.delete(key);
      }
    }, 60_000);

    // Allow process to exit cleanly
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      this.store.set(key, { count: 1, resetAt: now + config.windowMs });
      return { allowed: true, remaining: config.maxAttempts - 1, resetAt: now + config.windowMs };
    }

    entry.count++;

    if (entry.count > config.maxAttempts) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    return {
      allowed: true,
      remaining: config.maxAttempts - entry.count,
      resetAt: entry.resetAt,
    };
  }
}

const store: RateLimitStore = new RedisRateLimitStore();

export async function checkRateLimit(
  key: string,
  action: keyof typeof RATE_LIMITS = "api",
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action];
  if (!config) {
    return { allowed: true, remaining: 999, resetAt: Date.now() + 60_000 };
  }
  return store.check(key, config);
}
