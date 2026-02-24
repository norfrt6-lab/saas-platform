import { db } from "@saas/db";
import { projects, teams, users } from "@saas/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saas/ui/card";
import { count } from "drizzle-orm";
import { Building2, FolderKanban, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  await requireAdmin();

  const [userResult, teamResult, projectResult] = await Promise.all([
    db.select({ count: count() }).from(users) as Promise<{ count: number }[]>,
    db.select({ count: count() }).from(teams) as Promise<{ count: number }[]>,
    db.select({ count: count() }).from(projects) as Promise<{ count: number }[]>,
  ]);

  const stats = [
    {
      title: "Total Users",
      value: userResult[0]?.count ?? 0,
      icon: Users,
      href: "/admin/users",
    },
    {
      title: "Total Teams",
      value: teamResult[0]?.count ?? 0,
      icon: Building2,
      href: "/admin/teams",
    },
    {
      title: "Total Projects",
      value: projectResult[0]?.count ?? 0,
      icon: FolderKanban,
      href: "/admin/teams",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform-wide overview and management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Platform status overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium">Auth Service</p>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium">Stripe</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
