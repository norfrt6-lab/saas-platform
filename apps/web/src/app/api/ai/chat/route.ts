import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@saas/db/client";
import { teams } from "@saas/db/schema/teams";
import { eq } from "drizzle-orm";

const SYSTEM_PROMPT = `You are a helpful assistant embedded in a SaaS platform.
You help users with:
- Platform features (projects, team management, billing, settings)
- Troubleshooting common issues
- Best practices for team workflows

Keep answers concise and actionable. If you don't know something specific about the user's data, say so clearly.
Do not reveal internal system details or discuss competitors.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, teamId } = await req.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }

  // Verify user belongs to team
  if (teamId) {
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });
    if (!team) {
      return Response.json({ error: "Team not found" }, { status: 404 });
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI not configured" }, { status: 503 });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-20), // keep last 20 messages for context
      ],
      stream: true,
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenAI error:", err);
    return Response.json({ error: "AI service error" }, { status: 502 });
  }

  // Stream the response directly to the client
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
