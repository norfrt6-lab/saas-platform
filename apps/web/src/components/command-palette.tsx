"use client";

import { signOut } from "@saas/auth";
import { Dialog, DialogContent } from "@saas/ui/dialog";
import { Input } from "@saas/ui/input";
import {
  Activity,
  CreditCard,
  FolderKanban,
  Key,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  group: string;
  keywords?: string[];
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const commands: CommandItem[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: LayoutDashboard,
      action: () => router.push("/dashboard"),
      group: "Navigation",
    },
    {
      id: "projects",
      label: "Go to Projects",
      icon: FolderKanban,
      action: () => router.push("/projects"),
      group: "Navigation",
    },
    {
      id: "team",
      label: "Go to Team Settings",
      icon: Users,
      action: () => router.push("/settings/team"),
      group: "Navigation",
    },
    {
      id: "billing",
      label: "Go to Billing",
      icon: CreditCard,
      action: () => router.push("/settings/billing"),
      group: "Navigation",
    },
    {
      id: "api-keys",
      label: "Go to API Keys",
      icon: Key,
      action: () => router.push("/settings/api-keys"),
      group: "Navigation",
    },
    {
      id: "audit-log",
      label: "Go to Audit Log",
      icon: Activity,
      action: () => router.push("/settings/audit-log"),
      group: "Navigation",
    },
    {
      id: "settings",
      label: "Go to Settings",
      icon: Settings,
      action: () => router.push("/settings"),
      group: "Navigation",
    },
    {
      id: "new-project",
      label: "Create New Project",
      icon: Plus,
      action: () => router.push("/projects/new"),
      group: "Actions",
      keywords: ["create", "add"],
    },
    {
      id: "invite-member",
      label: "Invite Team Member",
      icon: Users,
      action: () => router.push("/settings/team"),
      group: "Actions",
      keywords: ["add", "member", "invite"],
    },
    {
      id: "sign-out",
      label: "Sign Out",
      icon: LogOut,
      action: async () => {
        await signOut();
        router.push("/auth/login");
      },
      group: "Account",
    },
  ];

  const filtered = query
    ? commands.filter((cmd) => {
        const searchStr = `${cmd.label} ${cmd.keywords?.join(" ") ?? ""}`.toLowerCase();
        return searchStr.includes(query.toLowerCase());
      })
    : commands;

  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group]!.push(cmd);
    return acc;
  }, {});

  const handleSelect = useCallback(
    (cmd: CommandItem) => {
      setOpen(false);
      setQuery("");
      cmd.action();
    },
    [],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {group}
              </p>
              {items.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <cmd.icon className="h-4 w-4" />
                  {cmd.label}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No results found
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
