import { describe, it, expect } from "vitest";
import { apiKeys } from "@saas/db/schema";

describe("API Keys Schema", () => {
  it("should have isActive field for key revocation", () => {
    expect(apiKeys.isActive).toBeDefined();
    expect(apiKeys.isActive.name).toBe("is_active");
  });

  it("should default isActive to true", () => {
    expect(apiKeys.isActive.hasDefault).toBe(true);
  });

  it("should have required core fields", () => {
    expect(apiKeys.id).toBeDefined();
    expect(apiKeys.name).toBeDefined();
    expect(apiKeys.hashedKey).toBeDefined();
    expect(apiKeys.prefix).toBeDefined();
    expect(apiKeys.teamId).toBeDefined();
    expect(apiKeys.createdBy).toBeDefined();
    expect(apiKeys.scopes).toBeDefined();
    expect(apiKeys.lastUsedAt).toBeDefined();
    expect(apiKeys.expiresAt).toBeDefined();
    expect(apiKeys.createdAt).toBeDefined();
  });
});
