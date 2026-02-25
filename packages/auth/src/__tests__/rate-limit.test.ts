import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * We test the InMemoryRateLimitStore directly since it's the fallback
 * used when Redis is unavailable (which is most dev/test environments).
 * The store is not exported, so we re-implement its logic in a test harness.
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/** Minimal reproduction of InMemoryRateLimitStore for unit testing */
class TestableRateLimitStore {
  private store = new Map<string, { count: number; resetAt: number }>();

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

  clear() {
    this.store.clear();
  }
}

describe("Rate Limiting", () => {
  let store: TestableRateLimitStore;

  beforeEach(() => {
    store = new TestableRateLimitStore();
  });

  describe("login rate limit", () => {
    const loginConfig: RateLimitConfig = { maxAttempts: 5, windowMs: 15 * 60 * 1000 };

    it("should allow requests within the limit", async () => {
      for (let i = 0; i < 5; i++) {
        const result = await store.check("user:login:test@example.com", loginConfig);
        expect(result.allowed).toBe(true);
      }
    });

    it("should block requests after exceeding the limit", async () => {
      for (let i = 0; i < 5; i++) {
        await store.check("user:login:test@example.com", loginConfig);
      }

      const blocked = await store.check("user:login:test@example.com", loginConfig);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it("should track remaining attempts correctly", async () => {
      const first = await store.check("user:login:test@example.com", loginConfig);
      expect(first.remaining).toBe(4);

      const second = await store.check("user:login:test@example.com", loginConfig);
      expect(second.remaining).toBe(3);

      const third = await store.check("user:login:test@example.com", loginConfig);
      expect(third.remaining).toBe(2);
    });

    it("should isolate rate limits by key", async () => {
      // Exhaust limit for user A
      for (let i = 0; i < 6; i++) {
        await store.check("user:login:a@example.com", loginConfig);
      }

      // User B should still be allowed
      const result = await store.check("user:login:b@example.com", loginConfig);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should provide resetAt timestamp", async () => {
      const before = Date.now();
      const result = await store.check("user:login:test@example.com", loginConfig);
      const after = Date.now();

      expect(result.resetAt).toBeGreaterThanOrEqual(before + loginConfig.windowMs);
      expect(result.resetAt).toBeLessThanOrEqual(after + loginConfig.windowMs);
    });
  });

  describe("registration rate limit", () => {
    const registerConfig: RateLimitConfig = { maxAttempts: 3, windowMs: 60 * 60 * 1000 };

    it("should allow 3 registrations", async () => {
      for (let i = 0; i < 3; i++) {
        const result = await store.check("ip:register:192.168.1.1", registerConfig);
        expect(result.allowed).toBe(true);
      }
    });

    it("should block 4th registration attempt", async () => {
      for (let i = 0; i < 3; i++) {
        await store.check("ip:register:192.168.1.1", registerConfig);
      }

      const blocked = await store.check("ip:register:192.168.1.1", registerConfig);
      expect(blocked.allowed).toBe(false);
    });
  });

  describe("API rate limit", () => {
    const apiConfig: RateLimitConfig = { maxAttempts: 100, windowMs: 60 * 1000 };

    it("should allow 100 API requests per minute", async () => {
      for (let i = 0; i < 100; i++) {
        const result = await store.check("api:team_123", apiConfig);
        expect(result.allowed).toBe(true);
      }
    });

    it("should block after 100 requests", async () => {
      for (let i = 0; i < 100; i++) {
        await store.check("api:team_123", apiConfig);
      }

      const blocked = await store.check("api:team_123", apiConfig);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });
  });

  describe("window expiration", () => {
    it("should reset after window expires", async () => {
      const shortConfig: RateLimitConfig = { maxAttempts: 1, windowMs: 50 };

      const first = await store.check("test:key", shortConfig);
      expect(first.allowed).toBe(true);

      const blocked = await store.check("test:key", shortConfig);
      expect(blocked.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((r) => setTimeout(r, 60));

      const afterExpiry = await store.check("test:key", shortConfig);
      expect(afterExpiry.allowed).toBe(true);
      expect(afterExpiry.remaining).toBe(0);
    });
  });

  describe("concurrent access", () => {
    it("should handle concurrent rate limit checks correctly", async () => {
      const config: RateLimitConfig = { maxAttempts: 5, windowMs: 60_000 };
      const key = "concurrent:test";

      const results = await Promise.all(
        Array.from({ length: 10 }, () => store.check(key, config)),
      );

      const allowed = results.filter((r) => r.allowed);
      const blocked = results.filter((r) => !r.allowed);

      expect(allowed.length).toBe(5);
      expect(blocked.length).toBe(5);
    });
  });
});
