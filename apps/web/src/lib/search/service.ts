import { db } from "@saas/db";
import { projects, teams, users } from "@saas/db/schema";
import { ilike, or, and, eq, sql } from "drizzle-orm";
import { z } from "zod";

export const searchQuerySchema = z.object({
  query: z.string().min(1).max(200),
  tenantId: z.string().cuid(),
  types: z.array(z.enum(["project", "team", "user"])).default(["project", "team", "user"]),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export interface SearchResult {
  id: string;
  type: "project" | "team" | "user";
  title: string;
  subtitle: string;
  url: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  took: number;
}

export async function search(input: SearchQuery): Promise<SearchResponse> {
  const parsed = searchQuerySchema.parse(input);
  const { query, tenantId, types, limit, offset } = parsed;
  const startedAt = Date.now();
  const pattern = `%${query}%`;
  const results: SearchResult[] = [];

  if (types.includes("project")) {
    const rows = await db
      .select({ id: projects.id, name: projects.name, description: projects.description })
      .from(projects)
      .where(
        and(
          eq(projects.tenantId, tenantId),
          or(ilike(projects.name, pattern), ilike(projects.description, pattern))
        )
      )
      .limit(limit);

    for (const row of rows) {
      results.push({
        id: row.id,
        type: "project",
        title: row.name,
        subtitle: row.description ?? "",
        url: `/dashboard/projects/${row.id}`,
        score: scoreMatch(query, row.name, row.description ?? ""),
      });
    }
  }

  if (types.includes("team")) {
    const rows = await db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(and(eq(teams.tenantId, tenantId), ilike(teams.name, pattern)))
      .limit(limit);

    for (const row of rows) {
      results.push({
        id: row.id,
        type: "team",
        title: row.name,
        subtitle: "Team",
        url: `/dashboard/teams/${row.id}`,
        score: scoreMatch(query, row.name),
      });
    }
  }

  if (types.includes("user")) {
    const rows = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          or(ilike(users.name, pattern), ilike(users.email, pattern))
        )
      )
      .limit(limit);

    for (const row of rows) {
      results.push({
        id: row.id,
        type: "user",
        title: row.name ?? row.email,
        subtitle: row.email,
        url: `/dashboard/members/${row.id}`,
        score: scoreMatch(query, row.name ?? "", row.email),
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  const paginated = results.slice(offset, offset + limit);

  return { results: paginated, total: results.length, took: Date.now() - startedAt };
}

function scoreMatch(query: string, ...fields: string[]): number {
  const q = query.toLowerCase();
  let score = 0;
  for (const field of fields) {
    const f = field.toLowerCase();
    if (f === q) score += 100;
    else if (f.startsWith(q)) score += 50;
    else if (f.includes(q)) score += 25;
  }
  return score;
}
