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
  invitations: {
    id: "invitations.id",
    teamId: "invitations.teamId",
    email: "invitations.email",
    status: "invitations.status",
    token: "invitations.token",
    createdAt: "invitations.createdAt",
  },
  teamMembers: {
    teamId: "teamMembers.teamId",
    userId: "teamMembers.userId",
    role: "teamMembers.role",
  },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ type: "eq", a, b })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
}));

import { ConflictError, NotFoundError, ForbiddenError } from "../lib/api/errors";
import {
  createInvitation,
  acceptInvitation,
  getTeamInvitations,
  revokeInvitation,
} from "../lib/api/invitations";

import { createInvitation as createInvitationFixture, createTeamMember } from "./helpers/fixtures";

describe("Invitations Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createInvitation", () => {
    it("should create invitation when authorized", async () => {
      mockSelect
        .mockReturnValueOnce(chainable([{ role: "admin" }]))
        .mockReturnValueOnce(chainable([]));

      const invitation = createInvitationFixture();
      mockInsert.mockReturnValue(chainable([invitation]));

      const result = await createInvitation({
        teamId: "team1",
        email: "new@test.com",
        role: "member",
        invitedBy: "user1",
      });

      expect(result.plainToken).toBeDefined();
      expect(result.id).toBe(invitation.id);
    });

    it("should throw ConflictError for duplicate invite", async () => {
      mockSelect
        .mockReturnValueOnce(chainable([{ role: "owner" }]))
        .mockReturnValueOnce(chainable([createInvitationFixture()]));

      await expect(
        createInvitation({
          teamId: "team1",
          email: "existing@test.com",
          role: "member",
          invitedBy: "user1",
        }),
      ).rejects.toThrow(ConflictError);
    });

    it("should throw ForbiddenError for members", async () => {
      mockSelect.mockReturnValue(chainable([{ role: "member" }]));

      await expect(
        createInvitation({
          teamId: "team1",
          email: "new@test.com",
          role: "member",
          invitedBy: "user1",
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("acceptInvitation", () => {
    it("should accept valid invitation", async () => {
      const invitation = createInvitationFixture({
        expiresAt: new Date(Date.now() + 86400000),
      });
      mockSelect.mockReturnValue(chainable([invitation]));

      const txMock = {
        select: vi.fn().mockReturnValue(chainable([])),
        insert: vi.fn().mockReturnValue(chainable()),
        update: vi.fn().mockReturnValue(chainable()),
      };
      mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(txMock));

      const result = await acceptInvitation("valid_token", "user1");
      expect(result.id).toBe(invitation.id);
    });

    it("should throw NotFoundError for invalid token", async () => {
      mockSelect.mockReturnValue(chainable([]));

      await expect(
        acceptInvitation("invalid_token", "user1"),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError for expired invite", async () => {
      const expired = createInvitationFixture({
        expiresAt: new Date("2020-01-01"),
      });
      mockSelect.mockReturnValue(chainable([expired]));
      mockUpdate.mockReturnValue(chainable());

      await expect(
        acceptInvitation("expired_token", "user1"),
      ).rejects.toThrow("Invitation has expired");
    });

    it("should skip insert if already a member", async () => {
      const invitation = createInvitationFixture({
        expiresAt: new Date(Date.now() + 86400000),
      });
      mockSelect.mockReturnValue(chainable([invitation]));

      const existingMember = createTeamMember();
      const txMock = {
        select: vi.fn().mockReturnValue(chainable([existingMember])),
        insert: vi.fn().mockReturnValue(chainable()),
        update: vi.fn().mockReturnValue(chainable()),
      };
      mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(txMock));

      await acceptInvitation("token", "user1");
      expect(txMock.insert).not.toHaveBeenCalled();
    });
  });

  describe("getTeamInvitations", () => {
    it("should return pending invitations", async () => {
      const invites = [createInvitationFixture(), createInvitationFixture()];
      mockSelect
        .mockReturnValueOnce(chainable([{ role: "member" }]))
        .mockReturnValueOnce(chainable(invites));

      const result = await getTeamInvitations("team1", "user1");
      expect(result).toHaveLength(2);
    });
  });

  describe("revokeInvitation", () => {
    it("should delete invitation when authorized", async () => {
      mockSelect.mockReturnValue(chainable([{ role: "admin" }]));
      mockDelete.mockReturnValue(chainable());

      await revokeInvitation("inv1", "team1", "user1");
      expect(mockDelete).toHaveBeenCalled();
    });

    it("should throw ForbiddenError for members", async () => {
      mockSelect.mockReturnValue(chainable([{ role: "member" }]));

      await expect(
        revokeInvitation("inv1", "team1", "user1"),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
