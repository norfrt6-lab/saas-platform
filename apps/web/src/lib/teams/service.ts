import { getTenantContext } from "@/lib/tenant/context";

export interface Team {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeamInput {
  name: string;
  description?: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
}

// In production, replace with actual DB queries via @saas/db
const store = new Map<string, Team>();

function newId(): string {
  return crypto.randomUUID();
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const { tenantId } = getTenantContext();
  const team: Team = {
    id: newId(),
    tenantId,
    name: input.name,
    description: input.description ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.set(team.id, team);
  return team;
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const { tenantId } = getTenantContext();
  const team = store.get(teamId) ?? null;
  // Enforce tenant isolation
  if (team && team.tenantId !== tenantId) return null;
  return team;
}

export async function listTeams(): Promise<Team[]> {
  const { tenantId } = getTenantContext();
  return Array.from(store.values()).filter((t) => t.tenantId === tenantId);
}

export async function updateTeam(
  teamId: string,
  input: UpdateTeamInput,
): Promise<Team | null> {
  const team = await getTeam(teamId);
  if (!team) return null;

  const updated: Team = {
    ...team,
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    updatedAt: new Date(),
  };
  store.set(teamId, updated);
  return updated;
}

export async function deleteTeam(teamId: string): Promise<boolean> {
  const team = await getTeam(teamId);
  if (!team) return false;
  store.delete(teamId);
  return true;
}
