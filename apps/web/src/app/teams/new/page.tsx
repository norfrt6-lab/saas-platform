"use client";

import { Button } from "@saas/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saas/ui/card";
import { Input } from "@saas/ui/input";
import { Label } from "@saas/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to create team");
        setLoading(false);
        return;
      }

      const team = await response.json();

      // Switch to the newly created team
      await fetch("/api/teams/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id }),
      });

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Failed to create team. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create a team</CardTitle>
          <CardDescription>
            Teams let you collaborate with others and manage projects together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Team name</Label>
              <Input
                id="name"
                placeholder="My Team"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                required
                minLength={2}
                maxLength={50}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                2-50 characters. You can change this later.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading || name.length < 2}>
              {loading ? "Creating..." : "Create team"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
