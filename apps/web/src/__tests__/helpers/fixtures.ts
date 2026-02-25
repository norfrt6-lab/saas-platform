/**
 * Test data factories for consistent, realistic test data.
 * Each factory returns a full object with sensible defaults that can be overridden.
 */

let counter = 0;
function nextId(): string {
  counter++;
  return `test_${counter.toString().padStart(4, "0")}`;
}

export function resetFixtureCounter() {
  counter = 0;
}

export function createUser(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    name: `User ${id}`,
    email: `${id}@test.com`,
    emailVerified: true,
    image: null,
    role: "user" as const,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createTeam(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    name: `Team ${id}`,
    slug: `team-${id}`,
    plan: "free" as const,
    billingStatus: "active" as const,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    gracePeriodEndsAt: null,
    trialEndsAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createTeamMember(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    teamId: "team_default",
    userId: "user_default",
    role: "member" as const,
    joinedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createProject(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    name: `Project ${id}`,
    slug: `project-${id}`,
    description: null,
    teamId: "team_default",
    deletedAt: null,
    deletedBy: null,
    scheduledPurgeAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createApiKey(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    teamId: "team_default",
    name: `Key ${id}`,
    hashedKey: `hashed_${id}`,
    prefix: "sk_live_abc1",
    scopes: ["projects:read", "projects:write"],
    isActive: true,
    lastUsedAt: null,
    expiresAt: null,
    createdBy: "user_default",
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createInvitation(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    teamId: "team_default",
    email: `invite_${id}@test.com`,
    role: "member" as const,
    token: `hashed_token_${id}`,
    status: "pending" as const,
    invitedBy: "user_default",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createAuditLog(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    teamId: "team_default",
    userId: "user_default",
    action: "project.created" as const,
    targetType: "project",
    targetId: "project_default",
    metadata: {},
    ipAddress: "127.0.0.1",
    userAgent: "test-agent",
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}
