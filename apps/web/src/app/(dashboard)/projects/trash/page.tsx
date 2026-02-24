import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-guard";
import { getActiveTeamId } from "@/lib/tenant-middleware";
import { listDeletedProjects } from "@/lib/api/soft-delete";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saas/ui/card";
import { Badge } from "@saas/ui/badge";
import { Button } from "@saas/ui/button";
import { formatDate } from "@/lib/utils";
import { Trash2, RotateCcw } from "lucide-react";

export const metadata: Metadata = {
  title: "Deleted Projects",
};

export default async function TrashPage() {
  await requireAuth();
  const teamId = await getActiveTeamId();

  if (!teamId) {
    return <div>No team selected</div>;
  }

  const deletedProjects = await listDeletedProjects(teamId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deleted Projects</h1>
        <p className="text-muted-foreground">
          Projects are permanently deleted 30 days after being moved to trash
        </p>
      </div>

      {deletedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Trash2 className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Trash is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleted projects will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {deletedProjects.map((project) => (
            <Card key={project.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Deleted {project.deletedAt ? formatDate(project.deletedAt) : "Unknown"}
                    {project.scheduledPurgeAt && (
                      <> &middot; Purge scheduled {formatDate(project.scheduledPurgeAt)}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Deleted</Badge>
                  <Button size="sm" variant="outline">
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Restore
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
