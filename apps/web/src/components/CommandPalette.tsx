"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Command {
  id: string;
  label: string;
  description?: string;
  href?: string;
  action?: () => void;
  keywords?: string[];
}

const defaultCommands: Command[] = [
  { id: "dashboard", label: "Go to Dashboard", href: "/dashboard", keywords: ["home"] },
  { id: "projects", label: "Go to Projects", href: "/projects", keywords: ["work"] },
  { id: "teams", label: "Go to Teams", href: "/teams", keywords: ["members"] },
  { id: "billing", label: "Go to Billing", href: "/billing", keywords: ["plan", "subscription"] },
  { id: "settings", label: "Go to Settings", href: "/settings", keywords: ["config", "profile"] },
  { id: "new-project", label: "New Project", href: "/projects/new", description: "Create a new project" },
];

function filterCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) return commands;
  const q = query.toLowerCase();
  return commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(q)),
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const results = filterCommands(defaultCommands, query);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const runCommand = useCallback(
    (cmd: Command) => {
      close();
      if (cmd.href) router.push(cmd.href);
      else cmd.action?.();
    },
    [close, router],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      runCommand(results[selectedIndex]!);
    } else if (e.key === "Escape") {
      close();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={close}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command or search..."
          className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <ul className="max-h-72 overflow-y-auto py-2">
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">No results found</li>
          )}
          {results.map((cmd, i) => (
            <li
              key={cmd.id}
              className={`flex cursor-pointer flex-col px-4 py-2 text-sm ${
                i === selectedIndex ? "bg-accent text-accent-foreground" : ""
              }`}
              onClick={() => runCommand(cmd)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="font-medium">{cmd.label}</span>
              {cmd.description && (
                <span className="text-xs text-muted-foreground">{cmd.description}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
