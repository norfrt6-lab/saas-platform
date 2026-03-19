import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "archived" | "draft";
  updatedAt: string;
}

// In production, fetch from listProjects() service or API route
async function getProjects(): Promise<Project[]> {
  return [
    {
      id: "1",
      name: "Alpha Launch",
      description: "Initial product launch campaign",
      status: "active",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Beta Onboarding",
      description: null,
      status: "draft",
      updatedAt: new Date().toISOString(),
    },
  ];
}

const statusColors: Record<Project["status"], string> = {
  active: "bg-emerald-100 text-emerald-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-600",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No projects yet.</p>
          <Link href="/projects/new" className="mt-2 text-sm text-primary underline">
            Create your first project
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{project.name}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[project.status]}`}
                  >
                    {project.status}
                  </span>
                </div>
                {project.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
