import { describe, it, expect, vi, beforeEach } from "vitest";

function chainable(resolvedValue: unknown = []) {
  const chain: Record<string, unknown> = {};
  const proxy = new Proxy(chain, {
    get(_t, prop: string) {
      if (prop === "then") return (r: (v: unknown) => void) => r(resolvedValue);
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
  projects: {
    id: "projects.id",
    teamId: "projects.teamId",
    deletedAt: "projects.deletedAt",
    createdAt: "projects.createdAt",
  },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ type: "eq", a, b })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  isNull: vi.fn((a) => ({ type: "isNull", a })),
  desc: vi.fn((a) => ({ type: "desc", a })),
  lt: vi.fn((a, b) => ({ type: "lt", a, b })),
}));
vi.mock("@/lib/utils", () => ({
  slugify: vi.fn((text: string) => text.toLowerCase().replace(/\s+/g, "-")),
}));

import {
  createProject,
  updateProject,
  getProject,
  listProjects,
  softDeleteProject,
  restoreProject,
  hardDeleteProject,
} from "../lib/api/projects";
import { createProject as createProjectFixture } from "./helpers/fixtures";

describe("Projects Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProject", () => {
    it("should create a project with slug", async () => {
      const project = createProjectFixture({ name: "My Project", slug: "my-project" });
      mockInsert.mockReturnValue(chainable([project]));

      const result = await createProject({
        name: "My Project",
        teamId: "team1",
      });

      expect(result).toEqual(project);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("should create project with description", async () => {
      const project = createProjectFixture({ description: "A test project" });
      mockInsert.mockReturnValue(chainable([project]));

      const result = await createProject({
        name: "Test",
        description: "A test project",
        teamId: "team1",
      });

      expect(result.description).toBe("A test project");
    });
  });

  describe("updateProject", () => {
    it("should update project name and slug", async () => {
      const updated = createProjectFixture({ name: "Updated", slug: "updated" });
      mockUpdate.mockReturnValue(chainable([updated]));

      const result = await updateProject({
        projectId: "proj1",
        teamId: "team1",
        name: "Updated",
      });

      expect(result).toEqual(updated);
    });

    it("should return undefined for nonexistent project", async () => {
      mockUpdate.mockReturnValue(chainable([undefined]));

      const result = await updateProject({
        projectId: "nonexistent",
        teamId: "team1",
        name: "X",
      });

      expect(result).toBeUndefined();
    });
  });

  describe("getProject", () => {
    it("should return project by id and team", async () => {
      const project = createProjectFixture({ id: "proj1", teamId: "team1" });
      mockSelect.mockReturnValue(chainable([project]));

      const result = await getProject("proj1", "team1");
      expect(result).toEqual(project);
    });

    it("should return null when project not found", async () => {
      mockSelect.mockReturnValue(chainable([]));

      const result = await getProject("nonexistent", "team1");
      expect(result).toBeNull();
    });
  });

  describe("listProjects", () => {
    it("should return paginated projects", async () => {
      const items = Array.from({ length: 3 }, (_, i) =>
        createProjectFixture({ id: `proj_${i}` }),
      );
      mockSelect.mockReturnValue(chainable(items));

      const result = await listProjects({ teamId: "team1", limit: 20 });

      expect(result.data).toHaveLength(3);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("should detect hasMore when over limit", async () => {
      const items = Array.from({ length: 4 }, (_, i) =>
        createProjectFixture({ id: `proj_${i}` }),
      );
      mockSelect.mockReturnValue(chainable(items));

      const result = await listProjects({ teamId: "team1", limit: 3 });

      expect(result.data).toHaveLength(3);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe("proj_2");
    });

    it("should use default limit of 20", async () => {
      mockSelect.mockReturnValue(chainable([]));

      const result = await listProjects({ teamId: "team1" });

      expect(result.data).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe("softDeleteProject", () => {
    it("should set deletedAt and scheduledPurgeAt", async () => {
      const now = Date.now();
      const deleted = createProjectFixture({
        deletedAt: new Date(now),
        deletedBy: "user1",
        scheduledPurgeAt: new Date(now + 30 * 24 * 60 * 60 * 1000),
      });
      mockUpdate.mockReturnValue(chainable([deleted]));

      const result = await softDeleteProject({
        projectId: "proj1",
        teamId: "team1",
        deletedBy: "user1",
      });

      expect(result).toBeDefined();
      expect(result!.deletedAt).toBeTruthy();
      expect(result!.scheduledPurgeAt).toBeTruthy();
    });

    it("should return undefined for already deleted", async () => {
      mockUpdate.mockReturnValue(chainable([undefined]));

      const result = await softDeleteProject({
        projectId: "proj1",
        teamId: "team1",
        deletedBy: "user1",
      });

      expect(result).toBeUndefined();
    });
  });

  describe("restoreProject", () => {
    it("should clear delete fields", async () => {
      const restored = createProjectFixture({
        deletedAt: null,
        deletedBy: null,
        scheduledPurgeAt: null,
      });
      mockUpdate.mockReturnValue(chainable([restored]));

      const result = await restoreProject("proj1", "team1");

      expect(result!.deletedAt).toBeNull();
      expect(result!.scheduledPurgeAt).toBeNull();
    });
  });

  describe("hardDeleteProject", () => {
    it("should permanently delete the project", async () => {
      mockDelete.mockReturnValue(chainable());

      await hardDeleteProject("proj1");
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
