import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockRequireSession = vi.fn();
const mockGetActiveTeamId = vi.fn();
const mockVerifyTeamMembership = vi.fn();
const mockListProjects = vi.fn();
const mockCreateProject = vi.fn();
const mockCreateAuditLog = vi.fn();

vi.mock("@saas/auth", () => ({
  requireSession: () => mockRequireSession(),
}));
vi.mock("@/lib/tenant-middleware", () => ({
  getActiveTeamId: () => mockGetActiveTeamId(),
}));
vi.mock("@/lib/api/teams", () => ({
  verifyTeamMembership: (...args: unknown[]) => mockVerifyTeamMembership(...args),
}));
vi.mock("@/lib/api/projects", () => ({
  listProjects: (...args: unknown[]) => mockListProjects(...args),
  createProject: (...args: unknown[]) => mockCreateProject(...args),
}));
vi.mock("@/lib/api/audit", () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

import { GET, POST } from "../../app/api/projects/route";

describe("Projects Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue({ user: { id: "user1" } });
    mockGetActiveTeamId.mockResolvedValue("team1");
    mockVerifyTeamMembership.mockResolvedValue({ role: "member" });
    mockCreateAuditLog.mockResolvedValue(undefined);
  });

  describe("GET /api/projects", () => {
    it("should return paginated projects", async () => {
      const result = {
        data: [{ id: "p1", name: "Project 1" }],
        hasMore: false,
        nextCursor: null,
      };
      mockListProjects.mockResolvedValue(result);

      const request = new NextRequest("http://localhost:3000/api/projects");
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(1);
    });

    it("should return 400 when no team selected", async () => {
      mockGetActiveTeamId.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/projects");
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it("should return 403 when not a member", async () => {
      mockVerifyTeamMembership.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/projects");
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it("should pass query params for pagination", async () => {
      mockListProjects.mockResolvedValue({ data: [], hasMore: false, nextCursor: null });

      const request = new NextRequest("http://localhost:3000/api/projects?cursor=abc&limit=10");
      await GET(request);

      expect(mockListProjects).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: "abc", limit: 10 }),
      );
    });
  });

  describe("POST /api/projects", () => {
    it("should create project with valid data", async () => {
      const project = { id: "p1", name: "New Project", slug: "new-project" };
      mockCreateProject.mockResolvedValue(project);

      const request = new NextRequest("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "New Project" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.name).toBe("New Project");
      expect(mockCreateAuditLog).toHaveBeenCalled();
    });

    it("should return 400 for missing name", async () => {
      const request = new NextRequest("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 for name too short", async () => {
      const request = new NextRequest("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "A" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 when no team selected", async () => {
      mockGetActiveTeamId.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
