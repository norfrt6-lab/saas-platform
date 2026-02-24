import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saas/ui/card";
import { Badge } from "@saas/ui/badge";
import {
  FolderKanban,
  Users,
  Activity,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ title, value, change, trend, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {trend === "up" ? (
            <ArrowUpRight className="h-3 w-3 text-green-500" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-500" />
          )}
          <span className={trend === "up" ? "text-green-500" : "text-red-500"}>
            {change}
          </span>{" "}
          from last month
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await requireAuth();

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
          value="12"
          change="+2"
          trend="up"
          icon={FolderKanban}
        />
        <StatCard
          title="Team Members"
          value="8"
          change="+1"
          trend="up"
          icon={Users}
        />
        <StatCard
          title="API Requests"
          value="24.5K"
          change="+12%"
          trend="up"
          icon={Activity}
        />
        <StatCard
          title="Usage"
          value="67%"
          change="-3%"
          trend="down"
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
              {[
                {
                  action: "Created project",
                  target: "marketing-site",
                  user: session.user.name,
                  time: "2 hours ago",
                },
                {
                  action: "Invited member",
                  target: "jane@example.com",
                  user: session.user.name,
                  time: "5 hours ago",
                },
                {
                  action: "Updated billing",
                  target: "Pro plan",
                  user: session.user.name,
                  time: "1 day ago",
                },
                {
                  action: "Deployed",
                  target: "api-v2",
                  user: session.user.name,
                  time: "2 days ago",
                },
              ].map((event, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{event.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.target} by {event.user}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {event.time}
                  </span>
                </div>
              ))}
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
              {[
                { label: "Create Project", badge: "New" },
                { label: "Invite Member", badge: null },
                { label: "Generate API Key", badge: null },
                { label: "View Audit Log", badge: "3 new" },
              ].map((action) => (
                <div
                  key={action.label}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium">{action.label}</span>
                  {action.badge && (
                    <Badge variant="secondary">{action.badge}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
