import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-guard";
import { getActiveTeamId } from "@/lib/tenant-middleware";
import { getAuditLogs } from "@/lib/api/audit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saas/ui/card";
import { Badge } from "@saas/ui/badge";
import { Activity } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Audit Log",
};

function getActionColor(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action.includes("deleted") || action.includes("revoked")) return "destructive";
  if (action.includes("created") || action.includes("joined")) return "default";
  return "secondary";
}

export default async function AuditLogPage() {
  await requireAuth();
  const teamId = await getActiveTeamId();

  if (!teamId) {
    return <div>No team selected</div>;
  }

  const { data: logs } = await getAuditLogs({ teamId });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          Immutable record of all team activity
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>
            All actions performed by team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Activity className="mb-4 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No activity recorded yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {log.targetType}:{log.targetId.slice(0, 8)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      by {log.userId.slice(0, 8)}...
                      {log.ipAddress && ` from ${log.ipAddress}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
