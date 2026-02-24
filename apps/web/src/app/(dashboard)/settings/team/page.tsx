import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-guard";
import { getActiveTeamId } from "@/lib/tenant-middleware";
import { getTeamMembers } from "@/lib/api/teams";
import { db } from "@saas/db";
import { teams } from "@saas/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saas/ui/card";
import { Badge } from "@saas/ui/badge";

export const metadata: Metadata = {
  title: "Team Settings",
};

export default async function TeamSettingsPage() {
  const session = await requireAuth();
  const teamId = await getActiveTeamId();

  if (!teamId) {
    return <div>No team selected</div>;
  }

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const members = await getTeamMembers(teamId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Settings</h1>
        <p className="text-muted-foreground">
          Manage your team and its members
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
          <CardDescription>
            Basic information about your team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Name</p>
            <p className="text-sm text-muted-foreground">{team.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Slug</p>
            <p className="text-sm text-muted-foreground">{team.slug}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Plan</p>
            <Badge variant="secondary">{team.plan}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>
            People who have access to this team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="text-sm font-medium">{member.userId}</div>
                <Badge variant="outline">{member.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
