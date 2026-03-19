import { getTenantContext } from "@/lib/tenant/context";
import { randomBytes } from "crypto";

export type InviteRole = "admin" | "member" | "viewer";

export interface TeamInvite {
  id: string;
  teamId: string;
  tenantId: string;
  email: string;
  role: InviteRole;
  token: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdBy: string;
  createdAt: Date;
}

const INVITE_EXPIRY_HOURS = 48;
const inviteStore = new Map<string, TeamInvite>();

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createInvite(
  teamId: string,
  email: string,
  role: InviteRole,
): Promise<TeamInvite> {
  const { tenantId, userId, userRole } = getTenantContext();

  if (userRole !== "owner" && userRole !== "admin") {
    throw new Error("Only owners and admins can invite team members");
  }

  const existing = Array.from(inviteStore.values()).find(
    (inv) =>
      inv.tenantId === tenantId &&
      inv.teamId === teamId &&
      inv.email === email &&
      !inv.acceptedAt &&
      inv.expiresAt > new Date(),
  );

  if (existing) {
    throw new Error(`An active invite already exists for ${email}`);
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + INVITE_EXPIRY_HOURS);

  const invite: TeamInvite = {
    id: crypto.randomUUID(),
    teamId,
    tenantId,
    email,
    role,
    token: generateToken(),
    expiresAt,
    acceptedAt: null,
    createdBy: userId,
    createdAt: new Date(),
  };

  inviteStore.set(invite.id, invite);
  return invite;
}

export async function acceptInvite(token: string, userId: string): Promise<TeamInvite> {
  const invite = Array.from(inviteStore.values()).find(
    (inv) => inv.token === token && !inv.acceptedAt,
  );

  if (!invite) throw new Error("Invite not found or already used");
  if (invite.expiresAt < new Date()) throw new Error("Invite has expired");

  const updated = { ...invite, acceptedAt: new Date() };
  inviteStore.set(invite.id, updated);

  // In production: create the team membership record here
  console.log(`User ${userId} accepted invite to team ${invite.teamId} as ${invite.role}`);

  return updated;
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { tenantId, userRole } = getTenantContext();
  const invite = inviteStore.get(inviteId);

  if (!invite || invite.tenantId !== tenantId) {
    throw new Error("Invite not found");
  }
  if (userRole !== "owner" && userRole !== "admin") {
    throw new Error("Insufficient permissions to revoke invite");
  }

  inviteStore.delete(inviteId);
}
