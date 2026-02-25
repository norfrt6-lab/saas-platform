import { createChildLogger } from "@saas/logger";

const log = createChildLogger({ module: "billing-cache" });

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Simple in-memory TTL cache for billing lookups.
 * Reduces database round-trips for frequently accessed team plan data.
 *
 * In production with multiple instances, replace with Redis via REDIS_URL.
 */
export class BillingCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTLMs: number;
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(defaultTTLMs = 60_000) {
    this.defaultTTLMs = defaultTTLMs;

    // Periodic cleanup of expired entries
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (entry.expiresAt < now) {
          this.store.delete(key);
        }
      }
    }, 30_000);

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTLMs),
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

/** Shared billing cache instance - 60 second TTL by default */
export const billingCache = new BillingCache(60_000);

/**
 * Cache-through helper: returns cached value if available,
 * otherwise calls the fetcher and caches the result.
 */
export async function cacheThrough<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number,
): Promise<T> {
  const cached = billingCache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const value = await fetcher();
  billingCache.set(key, value, ttlMs);
  return value;
}
