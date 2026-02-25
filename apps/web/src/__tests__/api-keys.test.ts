import { describe, it, expect, vi, beforeEach } from "vitest";

function chainable(resolvedValue: unknown = []) {
  const chain: Record<string, unknown> = {};
  const thenResult = {
    then: (r: (v: unknown) => void) => { r(resolvedValue); return thenResult; },
    catch: vi.fn().mockReturnValue({ then: vi.fn(), catch: vi.fn() }),
  };
  const proxy = new Proxy(chain, {
    get(_t, prop: string) {
      if (prop === "then") return thenResult.then;
      if (prop === "catch") return thenResult.catch;
      if (!chain[prop]) chain[prop] = vi.fn().mockReturnValue(proxy);
      return chain[prop];
    },
  });
  return proxy;
}

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@saas/db", () => ({
  db: {
    get select() { return mockSelect; },
    get insert() { return mockInsert; },
    get update() { return mockUpdate; },
    get delete() { return mockDelete; },
  },
}));
vi.mock("@saas/db/schema", () => ({
  apiKeys: {
    id: "apiKeys.id",
    teamId: "apiKeys.teamId",
    hashedKey: "apiKeys.hashedKey",
    isActive: "apiKeys.isActive",
    name: "apiKeys.name",
    prefix: "apiKeys.prefix",
    scopes: "apiKeys.scopes",
    lastUsedAt: "apiKeys.lastUsedAt",
    expiresAt: "apiKeys.expiresAt",
    createdAt: "apiKeys.createdAt",
  },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ type: "eq", a, b })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  count: vi.fn(() => "count"),
}));
vi.mock("@saas/billing/plans", () => ({
  PLAN_LIMITS: {
    free: { maxApiKeys: 2 },
    pro: { maxApiKeys: 20 },
    enterprise: { maxApiKeys: 1000 },
  },
}));
vi.mock("@saas/logger", () => ({
  createChildLogger: vi.fn(() => ({
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  })),
}));

import { BadRequestError } from "../lib/api/errors";
import {
  createApiKey,
  validateApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
} from "../lib/api/api-keys";
import { createApiKey as createApiKeyFixture } from "./helpers/fixtures";

describe("API Keys Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createApiKey", () => {
    it("should create a key and return plain key", async () => {
      mockSelect.mockReturnValue(chainable([{ count: 0 }]));
      const keyFixture = createApiKeyFixture();
      mockInsert.mockReturnValue(chainable([keyFixture]));

      const result = await createApiKey({
        teamId: "team1",
        name: "Test Key",
        scopes: ["projects:read"],
        createdBy: "user1",
      });

      expect(result.key).toBeDefined();
      expect(result.key).toContain("sk_live_");
      expect(result.id).toBe(keyFixture.id);
    });

    it("should enforce plan-based key limits", async () => {
      mockSelect.mockReturnValue(chainable([{ count: 2 }]));

      await expect(
        createApiKey({
          teamId: "team1",
          name: "Over Limit",
          scopes: ["projects:read"],
          createdBy: "user1",
          teamPlan: "free",
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it("should allow keys under pro plan limit", async () => {
      mockSelect.mockReturnValue(chainable([{ count: 5 }]));
      mockInsert.mockReturnValue(chainable([createApiKeyFixture()]));

      const result = await createApiKey({
        teamId: "team1",
        name: "Pro Key",
        scopes: ["*"],
        createdBy: "user1",
        teamPlan: "pro",
      });

      expect(result.key).toBeDefined();
    });

    it("should use default max when no plan specified", async () => {
      mockSelect.mockReturnValue(chainable([{ count: 49 }]));
      mockInsert.mockReturnValue(chainable([createApiKeyFixture()]));

      const result = await createApiKey({
        teamId: "team1",
        name: "Default Max",
        scopes: [],
        createdBy: "user1",
      });

      expect(result).toBeDefined();
    });
  });

  describe("validateApiKey", () => {
    it("should return key when valid", async () => {
      const key = createApiKeyFixture({ lastUsedAt: null });
      mockSelect.mockReturnValue(chainable([key]));
      mockUpdate.mockReturnValue(chainable());

      const result = await validateApiKey("sk_live_test123");

      expect(result).toBeDefined();
      expect(result!.id).toBe(key.id);
    });

    it("should return null for invalid key", async () => {
      mockSelect.mockReturnValue(chainable([]));

      const result = await validateApiKey("sk_live_invalid");
      expect(result).toBeNull();
    });

    it("should deactivate expired key", async () => {
      const expired = createApiKeyFixture({
        expiresAt: new Date("2020-01-01"),
      });
      mockSelect.mockReturnValue(chainable([expired]));
      mockUpdate.mockReturnValue(chainable());

      const result = await validateApiKey("sk_live_expired");
      expect(result).toBeNull();
    });

    it("should skip lastUsedAt update when recently used", async () => {
      const recentlyUsed = createApiKeyFixture({
        lastUsedAt: new Date(),
      });
      mockSelect.mockReturnValue(chainable([recentlyUsed]));

      const result = await validateApiKey("sk_live_recent");

      expect(result).toBeDefined();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("listApiKeys", () => {
    it("should return keys for a team", async () => {
      const keys = [createApiKeyFixture(), createApiKeyFixture()];
      mockSelect.mockReturnValue(chainable(keys));

      const result = await listApiKeys("team1");
      expect(result).toHaveLength(2);
    });
  });

  describe("revokeApiKey", () => {
    it("should deactivate the key", async () => {
      const revoked = createApiKeyFixture({ isActive: false });
      mockUpdate.mockReturnValue(chainable([revoked]));

      const result = await revokeApiKey("key1", "team1");
      expect(result!.isActive).toBe(false);
    });
  });

  describe("deleteApiKey", () => {
    it("should permanently delete the key", async () => {
      mockDelete.mockReturnValue(chainable());

      await deleteApiKey("key1", "team1");
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
