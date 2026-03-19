import { getTenantContext } from "@/lib/tenant/context";

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  status: "active" | "archived" | "draft";
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: Project["status"];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: Project["status"];
}

// In-memory store — replace with DB in production
const projectStore = new Map<string, Project>();

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { tenantId, userId } = getTenantContext();

  const project: Project = {
    id: crypto.randomUUID(),
    tenantId,
    name: input.name,
    description: input.description ?? null,
    status: input.status ?? "draft",
    ownerId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  projectStore.set(project.id, project);
  return project;
}

export async function getProject(projectId: string): Promise<Project | null> {
  const { tenantId } = getTenantContext();
  const project = projectStore.get(projectId) ?? null;
  if (!project || project.tenantId !== tenantId || project.deletedAt) return null;
  return project;
}

export async function listProjects(
  includeArchived = false,
): Promise<Project[]> {
  const { tenantId } = getTenantContext();
  return Array.from(projectStore.values()).filter(
    (p) =>
      p.tenantId === tenantId &&
      !p.deletedAt &&
      (includeArchived || p.status !== "archived"),
  );
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  const updated: Project = {
    ...project,
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.status !== undefined && { status: input.status }),
    updatedAt: new Date(),
  };

  projectStore.set(projectId, updated);
  return updated;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const project = await getProject(projectId);
  if (!project) return false;
  projectStore.set(projectId, { ...project, deletedAt: new Date() });
  return true;
}
