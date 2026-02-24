interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60_000);

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
  register: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  forgotPassword: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  api: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 per minute
};

export function checkRateLimit(
  key: string,
  action: keyof typeof RATE_LIMITS = "api",
): { allowed: boolean; remaining: number; resetAt: number } {
  const config = RATE_LIMITS[action];
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: now + config.windowMs,
    };
  }

  entry.count++;

  if (entry.count > config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetAt: entry.resetAt,
  };
}
