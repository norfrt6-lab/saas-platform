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
const mockTransaction = vi.fn();

vi.mock("@saas/db", () => ({
  db: {
    get select() { return mockSelect; },
    get insert() { return mockInsert; },
    get update() { return mockUpdate; },
    get delete() { return mockDelete; },
    get transaction() { return mockTransaction; },
  },
}));
vi.mock("@saas/db/schema", () => ({
  teams: { id: "teams.id", name: "teams.name" },
  teamMembers: {
    id: "teamMembers.id",
    teamId: "teamMembers.teamId",
    userId: "teamMembers.userId",
    role: "teamMembers.role",
    joinedAt: "teamMembers.joinedAt",
  },
  user: {
    id: "user.id",
    name: "user.name",
    email: "user.email",
    image: "user.image",
  },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ type: "eq", a, b })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
}));
vi.mock("@/lib/utils", () => ({
  slugify: vi.fn((text: string) => text.toLowerCase().replace(/\s+/g, "-")),
}));

import { ForbiddenError, BadRequestError } from "../lib/api/errors";
import {
  verifyTeamMembership,
  requireTeamRole,
  createTeam,
  updateTeam,
  deleteTeam,
  getUserTeams,
  getTeamMembers,
  updateMemberRole,
  removeMember,
} from "../lib/api/teams";

import { createTeam as createTeamFixture, createTeamMember } from "./helpers/fixtures";

describe("Teams Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("verifyTeamMembership", () => {
    it("should return role when user is a member", async () => {
      mockSelect.mockReturnValue(chainable([{ role: "admin" }]));

      const result = await verifyTeamMembership("team1", "user1");
      expect(result).toEqual({ role: "admin" });
    });

    it("should return null when user is not a member", async () => {
      mockSelect.mockReturnValue(chainable([]));

      const result = await verifyTeamMembership("team1", "user1");
      expect(result).toBeNull();
    });
  });

  describe("requireTeamRole", () => {
    it("should return membership when role matches", async () => {
      mockSelect.mockReturnValue(chainable([{ role: "owner" }]));

      const result = await requireTeamRole("team1", "user1", ["owner"]);
      expect(result).toEqual({ role: "owner" });
    });

    it("should throw ForbiddenError when not a member", async () => {
      mockSelect.mockReturnValue(chainable([]));

      await expect(
        requireTeamRole("team1", "user1", ["owner"]),
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError for insufficient role", async () => {
      mockSelect.mockReturnValue(chainable([{ role: "member" }]));

      await expect(
        requireTeamRole("team1", "user1", ["owner", "admin"]),
      ).rejects.toThrow("Insufficient permissions");
    });
  });

  describe("createTeam", () => {
    it("should create team and assign owner", async () => {
      const team = createTeamFixture({ id: "new_team" });
      mockInsert.mockReturnValue(chainable([team]));

      const result = await createTeam({ name: "My Team", userId: "user1" });

      expect(result).toEqual(team);
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it("should throw BadRequestError when insert fails", async () => {
      mockInsert.mockReturnValue(chainable([undefined]));

      await expect(
        createTeam({ name: "Bad Team", userId: "user1" }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("updateTeam", () => {
    it("should update team when user is owner/admin", async () => {
      const updated = createTeamFixture({ name: "Updated" });
      mockSelect.mockReturnValue(chainable([{ role: "owner" }]));
      mockUpdate.mockReturnValue(chainable([updated]));

      const result = await updateTeam({
        teamId: "team1",
        userId: "user1",
        name: "Updated",
      });

      expect(result).toEqual(updated);
    });

    it("should throw ForbiddenError for member role", async () => {
      mockSelect.mockReturnValue(chainable([{ role: "member" }]));

      await expect(
        updateTeam({ teamId: "team1", userId: "user1", name: "X" }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("deleteTeam", () => {
    it("should delete team when user is owner", async () => {
      mockSelect.mockReturnValue(chainable([{ role: "owner" }]));
      mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const txMock = {
          delete: vi.fn().mockReturnValue(chainable()),
        };
        return fn(txMock);
      });

      await deleteTeam("team1", "user1");
      expect(mockTransaction).toHaveBeenCalled();
    });

    it("should throw ForbiddenError for non-owner", async () => {
      mockSelect.mockReturnValue(chainable([{ role: "admin" }]));

      await expect(deleteTeam("team1", "user1")).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe("getUserTeams", () => {
    it("should return teams with roles for user", async () => {
      const team = createTeamFixture();
      mockSelect.mockReturnValue(chainable([{ team, role: "owner" }]));

      const result = await getUserTeams("user1");
      expect(result).toEqual([{ team, role: "owner" }]);
    });

    it("should return empty array for user with no teams", async () => {
      mockSelect.mockReturnValue(chainable([]));

      const result = await getUserTeams("user1");
      expect(result).toEqual([]);
    });
  });

  describe("getTeamMembers", () => {
    it("should return members with user info", async () => {
      const member = {
        ...createTeamMember({ teamId: "team1", userId: "user1", role: "owner" }),
        userName: "Alice",
        userEmail: "alice@test.com",
        userImage: null,
      };
      mockSelect.mockReturnValue(chainable([member]));

      const result = await getTeamMembers("team1");
      expect(result).toHaveLength(1);
      expect(result[0]!.userName).toBe("Alice");
    });
  });

  describe("updateMemberRole", () => {
    it("should update role when actor is owner", async () => {
      const updated = createTeamMember({ role: "admin" });
      mockSelect
        .mockReturnValueOnce(chainable([{ role: "owner" }]))
        .mockReturnValueOnce(
          chainable([
            createTeamMember({ role: "owner", userId: "user1" }),
            createTeamMember({ role: "owner", userId: "user2" }),
          ]),
        );
      mockUpdate.mockReturnValue(chainable([updated]));

      const result = await updateMemberRole({
        teamId: "team1",
        targetUserId: "user2",
        actorUserId: "user1",
        role: "admin",
      });

      expect(result).toEqual(updated);
    });

    it("should prevent demoting the last owner", async () => {
      mockSelect
        .mockReturnValueOnce(chainable([{ role: "owner" }]))
        .mockReturnValueOnce(
          chainable([createTeamMember({ role: "owner", userId: "target1" })]),
        );

      await expect(
        updateMemberRole({
          teamId: "team1",
          targetUserId: "target1",
          actorUserId: "user1",
          role: "member",
        }),
      ).rejects.toThrow("Cannot demote the last owner");
    });
  });

  describe("removeMember", () => {
    it("should allow self-removal", async () => {
      mockSelect.mockReturnValue(
        chainable([createTeamMember({ role: "owner", userId: "other" })]),
      );
      mockDelete.mockReturnValue(chainable());

      await removeMember("team1", "user1", "user1");
      expect(mockDelete).toHaveBeenCalled();
    });

    it("should prevent removing the last owner", async () => {
      mockSelect.mockReturnValue(
        chainable([createTeamMember({ role: "owner", userId: "user1" })]),
      );

      await expect(
        removeMember("team1", "user1", "user1"),
      ).rejects.toThrow("Cannot remove the last owner");
    });

    it("should require admin/owner to remove others", async () => {
      mockSelect.mockReturnValue(chainable([{ role: "member" }]));

      await expect(
        removeMember("team1", "target1", "actor1"),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
