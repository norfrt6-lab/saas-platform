import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { getActiveTeamId } from "@/lib/tenant-middleware";
import { listProjects } from "@/lib/api/projects";
import { getTeamMembers } from "@/lib/api/teams";
import { getAuditLogs } from "@/lib/api/audit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saas/ui/card";
import { Badge } from "@saas/ui/badge";
import {
  FolderKanban,
  Users,
  Activity,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const teamId = await getActiveTeamId();

  if (!teamId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Select a team to get started
          </p>
        </div>
      </div>
    );
  }

  const [projectsResult, members, auditResult] = await Promise.all([
    listProjects({ teamId, limit: 100 }),
    getTeamMembers(teamId),
    getAuditLogs({ teamId, limit: 5 }),
  ]);

  const projectCount = projectsResult.data.length;
  const memberCount = members.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your team&apos;s activity and usage
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={String(projectCount)}
          icon={FolderKanban}
        />
        <StatCard
          title="Team Members"
          value={String(memberCount)}
          icon={Users}
        />
        <StatCard
          title="Audit Events"
          value={String(auditResult.data.length)}
          icon={Activity}
        />
        <StatCard
          title="Active"
          value={projectCount > 0 ? "Healthy" : "Setup"}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest events in your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditResult.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity recorded yet. Create a project to get started.
                </p>
              ) : (
                auditResult.data.map((event) => (
                  <div key={event.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{event.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.targetType}: {event.targetId.slice(0, 8)}...
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(new Date(event.createdAt))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Link
                href="/projects/new"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium">Create Project</span>
                <Badge variant="secondary">
                  <ArrowUpRight className="h-3 w-3" />
                </Badge>
              </Link>
              <Link
                href="/settings/team"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium">Invite Member</span>
                <Badge variant="secondary">
                  <ArrowUpRight className="h-3 w-3" />
                </Badge>
              </Link>
              <Link
                href="/settings/api-keys"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium">Generate API Key</span>
                <Badge variant="secondary">
                  <ArrowUpRight className="h-3 w-3" />
                </Badge>
              </Link>
              <Link
                href="/settings/audit-log"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium">View Audit Log</span>
                <Badge variant="secondary">
                  <ArrowUpRight className="h-3 w-3" />
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
