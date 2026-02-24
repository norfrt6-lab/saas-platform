import { Badge } from "@saas/ui/badge";
import { Button } from "@saas/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saas/ui/card";
import { Key, Plus } from "lucide-react";
import type { Metadata } from "next";

import { listApiKeys } from "@/lib/api/api-keys";
import { requireAuth } from "@/lib/auth-guard";
import { getActiveTeamId } from "@/lib/tenant-middleware";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "API Keys",
};

export default async function ApiKeysPage() {
  await requireAuth();
  const teamId = await getActiveTeamId();

  if (!teamId) {
    return <div>No team selected</div>;
  }

  const keys = await listApiKeys(teamId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for programmatic access
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Keys</CardTitle>
          <CardDescription>
            Keys are shown with a prefix only. The full key is only shown once
            when created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Key className="mb-4 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No API keys yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{key.name}</p>
                      <Badge
                        variant={key.isActive ? "outline" : "destructive"}
                      >
                        {key.isActive ? "Active" : "Revoked"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        {key.prefix}...
                      </code>
                      <span>&middot;</span>
                      <span>Created {formatDate(key.createdAt)}</span>
                      {key.lastUsedAt && (
                        <>
                          <span>&middot;</span>
                          <span>
                            Last used {formatRelativeTime(key.lastUsedAt)}
                          </span>
                        </>
                      )}
                      {key.expiresAt && (
                        <>
                          <span>&middot;</span>
                          <span>Expires {formatDate(key.expiresAt)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-1 pt-1">
                      {key.scopes?.map((scope) => (
                        <Badge key={scope} variant="secondary" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="destructive" size="sm">
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
