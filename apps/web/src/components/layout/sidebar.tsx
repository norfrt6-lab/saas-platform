"use client";

import { Button } from "@saas/ui/button";
import { cn } from "@saas/ui/utils";
import {
  Activity,
  CreditCard,
  FolderKanban,
  Key,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { TeamSwitcher } from "./team-switcher";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Team", href: "/settings/team", icon: Users },
  { name: "Billing", href: "/settings/billing", icon: CreditCard },
  { name: "API Keys", href: "/settings/api-keys", icon: Key },
  { name: "Audit Log", href: "/settings/audit-log", icon: Activity },
  { name: "Security", href: "/settings/security", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface Team {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { team: Team; role: string }[] | Team[]) => {
        // API returns { team, role }[] from getUserTeams
        const teamList = data.map((item: { team: Team; role: string } | Team) =>
          "team" in item ? item.team : item
        );
        setTeams(teamList);
        const first = teamList[0];
        if (first) {
          setActiveTeamId(first.id);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">S</span>
          </div>
          <span className="text-lg font-semibold">SaaS Platform</span>
        </Link>
      </div>
      <div className="p-3 pb-0">
        <TeamSwitcher teams={teams} activeTeamId={activeTeamId} />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Button
              key={item.name}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isActive && "font-medium",
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
