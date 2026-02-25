import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockRequireSession = vi.fn();
const mockGetUserTeams = vi.fn();
const mockCreateTeam = vi.fn();
const mockCreateAuditLog = vi.fn();

vi.mock("@saas/auth", () => ({
  requireSession: () => mockRequireSession(),
}));
vi.mock("@/lib/api/teams", () => ({
  getUserTeams: (...args: unknown[]) => mockGetUserTeams(...args),
  createTeam: (...args: unknown[]) => mockCreateTeam(...args),
}));
vi.mock("@/lib/api/audit", () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

import { GET, POST } from "../../app/api/teams/route";

describe("Teams Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue({ user: { id: "user1" } });
    mockCreateAuditLog.mockResolvedValue(undefined);
  });

  describe("GET /api/teams", () => {
    it("should return user teams", async () => {
      const teams = [{ team: { id: "t1", name: "Team 1" }, role: "owner" }];
      mockGetUserTeams.mockResolvedValue(teams);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(teams);
    });

    it("should return empty array for user with no teams", async () => {
      mockGetUserTeams.mockResolvedValue([]);

      const response = await GET();
      const body = await response.json();

      expect(body).toEqual([]);
    });
  });

  describe("POST /api/teams", () => {
    it("should create team with valid name", async () => {
      const team = { id: "t1", name: "My Team", slug: "my-team" };
      mockCreateTeam.mockResolvedValue(team);

      const request = new NextRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: JSON.stringify({ name: "My Team" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.name).toBe("My Team");
      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: "team.created" }),
      );
    });

    it("should return 400 for missing name", async () => {
      const request = new NextRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 for name too short", async () => {
      const request = new NextRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: JSON.stringify({ name: "A" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 for name too long", async () => {
      const request = new NextRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: JSON.stringify({ name: "A".repeat(51) }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should handle invalid JSON body", async () => {
      const request = new NextRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: "not json",
        headers: { "content-type": "application/json" },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
