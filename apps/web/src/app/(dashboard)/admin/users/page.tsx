import { db } from "@saas/db";
import { users } from "@saas/db/schema";
import { Badge } from "@saas/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@saas/ui/card";
import { desc } from "drizzle-orm";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth-guard";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin - Users",
};

export default async function AdminUsersPage() {
  await requireAdmin();

  const allUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          All registered users on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({allUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={user.role === "admin" ? "default" : "secondary"}
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
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
