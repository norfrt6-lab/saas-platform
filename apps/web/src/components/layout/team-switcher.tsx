"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@saas/ui/utils";
import { Button } from "@saas/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@saas/ui/dropdown-menu";

interface Team {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

interface TeamSwitcherProps {
  teams: Team[];
  activeTeamId: string | null;
}

export function TeamSwitcher({ teams, activeTeamId }: TeamSwitcherProps) {
  const router = useRouter();
  const activeTeam = teams.find((t) => t.id === activeTeamId) ?? teams[0];

  async function switchTeam(teamId: string) {
    try {
      const response = await fetch("/api/teams/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Failed to switch team:", data.error);
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to switch team:", error);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
              {activeTeam?.name?.[0]?.toUpperCase() ?? "T"}
            </div>
            <span className="truncate">{activeTeam?.name ?? "Select team"}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Teams</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {teams.map((team) => (
          <DropdownMenuItem
            key={team.id}
            onClick={() => switchTeam(team.id)}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold mr-2">
              {team.name[0].toUpperCase()}
            </div>
            <span className="flex-1 truncate">{team.name}</span>
            {team.id === activeTeamId && (
              <Check className="ml-2 h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/teams/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
