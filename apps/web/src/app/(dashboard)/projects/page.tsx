import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { getActiveTeamId } from "@/lib/tenant-middleware";
import { listProjects } from "@/lib/api/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saas/ui/card";
import { Badge } from "@saas/ui/badge";
import { Button } from "@saas/ui/button";
import { Plus, FolderKanban } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  await requireAuth();
  const teamId = await getActiveTeamId();

  if (!teamId) {
    return <div>No team selected</div>;
  }

  const { data: projects } = await listProjects({ teamId });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your team&apos;s projects
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first project to get started
          </p>
          <Button asChild className="mt-4">
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <Badge variant="outline">{project.slug}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description ?? "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Created {formatRelativeTime(project.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
