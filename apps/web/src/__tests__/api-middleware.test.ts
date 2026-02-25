import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api/api-keys", () => ({
  validateApiKey: vi.fn(),
}));
vi.mock("@saas/auth/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

import { checkRateLimit } from "@saas/auth/rate-limit";

import { validateApiKey } from "../lib/api/api-keys";
import { authenticateApiRequest, requireScope, type ApiContext } from "../lib/api/api-middleware";

const mockValidateApiKey = vi.mocked(validateApiKey);
const mockCheckRateLimit = vi.mocked(checkRateLimit);

function createRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost:3000/api/v1/projects", { headers });
}

describe("API Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetAt: Date.now() + 60000,
    });
  });

  describe("authenticateApiRequest", () => {
    it("should return 401 when no auth header", async () => {
      const req = createRequest();
      const result = await authenticateApiRequest(req);

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error.status).toBe(401);
      }
    });

    it("should return 401 for non-Bearer auth", async () => {
      const req = createRequest({ authorization: "Basic abc123" });
      const result = await authenticateApiRequest(req);

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error.status).toBe(401);
      }
    });

    it("should return 401 for invalid API key", async () => {
      mockValidateApiKey.mockResolvedValue(null);
      const req = createRequest({ authorization: "Bearer sk_live_invalid" });
      const result = await authenticateApiRequest(req);

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error.status).toBe(401);
        const body = await result.error.json();
        expect(body.message).toContain("Invalid or expired");
      }
    });

    it("should return context for valid API key", async () => {
      mockValidateApiKey.mockResolvedValue({
        id: "key1",
        teamId: "team1",
        scopes: ["projects:read", "projects:write"],
      } as any);

      const req = createRequest({ authorization: "Bearer sk_live_valid" });
      const result = await authenticateApiRequest(req);

      expect("context" in result).toBe(true);
      if ("context" in result) {
        expect(result.context.teamId).toBe("team1");
        expect(result.context.keyId).toBe("key1");
        expect(result.context.scopes).toContain("projects:read");
      }
    });

    it("should return 429 when rate limited", async () => {
      mockValidateApiKey.mockResolvedValue({
        id: "key1",
        teamId: "team1",
        scopes: ["*"],
      } as any);
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 30000,
      });

      const req = createRequest({ authorization: "Bearer sk_live_valid" });
      const result = await authenticateApiRequest(req);

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error.status).toBe(429);
        expect(result.error.headers.get("Retry-After")).toBeDefined();
      }
    });
  });

  describe("requireScope", () => {
    it("should return null when scope matches", () => {
      const ctx: ApiContext = { teamId: "t1", keyId: "k1", scopes: ["projects:read"] };
      const result = requireScope(ctx, "projects:read");
      expect(result).toBeNull();
    });

    it("should return null for wildcard scope", () => {
      const ctx: ApiContext = { teamId: "t1", keyId: "k1", scopes: ["*"] };
      const result = requireScope(ctx, "projects:write");
      expect(result).toBeNull();
    });

    it("should return 403 when scope missing", () => {
      const ctx: ApiContext = { teamId: "t1", keyId: "k1", scopes: ["projects:read"] };
      const result = requireScope(ctx, "projects:write");
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
    });

    it("should return 403 for empty scopes", () => {
      const ctx: ApiContext = { teamId: "t1", keyId: "k1", scopes: [] };
      const result = requireScope(ctx, "projects:read");
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
    });
  });
});
