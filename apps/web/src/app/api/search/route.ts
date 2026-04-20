import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@saas/db/client";
import { projects } from "@saas/db/schema/projects";
import { teams } from "@saas/db/schema/teams";
import { user } from "@saas/db/schema/auth";
import { ilike, or, sql } from "drizzle-orm";

interface SearchResult {
  type: "project" | "team" | "member" | "page";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

const STATIC_PAGES: SearchResult[] = [
  { type: "page", id: "dashboard", title: "Dashboard", href: "/dashboard" },
  { type: "page", id: "projects", title: "Projects", href: "/projects" },
  { type: "page", id: "analytics", title: "Analytics", href: "/analytics" },
  { type: "page", id: "billing", title: "Billing", subtitle: "Plans & invoices", href: "/settings/billing" },
  { type: "page", id: "members", title: "Team Members", href: "/settings/members" },
  { type: "page", id: "security", title: "Security", subtitle: "2FA, sessions", href: "/settings/security" },
  { type: "page", id: "webhooks", title: "Webhooks", href: "/settings/webhooks" },
  { type: "page", id: "api-keys", title: "API Keys", href: "/settings/api-keys" },
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 1) {
    return Response.json({ results: STATIC_PAGES.slice(0, 5) });
  }

  const pattern = `%${q}%`;

  const [projectHits, teamHits, memberHits] = await Promise.all([
    db
      .select({ id: projects.id, name: projects.name, teamId: projects.teamId })
      .from(projects)
      .where(ilike(projects.name, pattern))
      .limit(5),
    db
      .select({ id: teams.id, name: teams.name, slug: teams.slug })
      .from(teams)
      .where(or(ilike(teams.name, pattern), ilike(teams.slug, pattern)))
      .limit(5),
    db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(or(ilike(user.name, pattern), ilike(user.email, pattern)))
      .limit(5),
  ]);

  const pageHits = STATIC_PAGES.filter((p) =>
    p.title.toLowerCase().includes(q.toLowerCase())
  );

  const results: SearchResult[] = [
    ...pageHits,
    ...projectHits.map((p) => ({
      type: "project" as const,
      id: p.id,
      title: p.name,
      href: `/projects/${p.id}`,
    })),
    ...teamHits.map((t) => ({
      type: "team" as const,
      id: t.id,
      title: t.name,
      subtitle: t.slug,
      href: `/teams/${t.slug}`,
    })),
    ...memberHits.map((m) => ({
      type: "member" as const,
      id: m.id,
      title: m.name,
      subtitle: m.email,
      href: `/settings/members`,
    })),
  ];

  return Response.json({ results: results.slice(0, 15) });
}
