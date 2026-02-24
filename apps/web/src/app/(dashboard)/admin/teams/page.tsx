import { db } from "@saas/db";
import { teams, type Team } from "@saas/db/schema";
import { Badge } from "@saas/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@saas/ui/card";
import { desc } from "drizzle-orm";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth-guard";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin - Teams",
};

export default async function AdminTeamsPage() {
  await requireAdmin();

  const allTeams = await db
    .select()
    .from(teams)
    .orderBy(desc(teams.createdAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
        <p className="text-muted-foreground">
          All teams on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Teams ({allTeams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Slug</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Plan</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {allTeams.map((team: Team) => (
                  <tr key={team.id} className="border-b">
                    <td className="px-4 py-3 text-sm font-medium">{team.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {team.slug}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={team.plan === "enterprise" ? "default" : "secondary"}>
                        {team.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          team.billingStatus === "active"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {team.billingStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(team.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
