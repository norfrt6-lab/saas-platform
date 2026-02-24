import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { getActiveTeamId } from "@/lib/tenant-middleware";
import { getProject } from "@/lib/api/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saas/ui/card";
import { Badge } from "@saas/ui/badge";
import { Button } from "@saas/ui/button";
import { formatDate } from "@/lib/utils";
import { Settings, Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Project Details",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await requireAuth();
  const teamId = await getActiveTeamId();
  const { projectId } = await params;

  if (!teamId) {
    return <div>No team selected</div>;
  }

  const project = await getProject(projectId, teamId);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {project.name}
            </h1>
            <Badge variant="outline">{project.slug}</Badge>
          </div>
          <p className="text-muted-foreground">
            {project.description ?? "No description"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(project.createdAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(project.updatedAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>Active</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
          <CardDescription>
            Project activity and recent changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No activity recorded yet. Start using this project to see activity
            here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
