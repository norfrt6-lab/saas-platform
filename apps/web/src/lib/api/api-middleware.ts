import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateApiKey } from "./api-keys";
import { checkRateLimit } from "@saas/auth/rate-limit";

export interface ApiContext {
  teamId: string;
  keyId: string;
  scopes: string[];
}

export async function authenticateApiRequest(
  request: NextRequest,
): Promise<{ context: ApiContext } | { error: NextResponse }> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        {
          error: "unauthorized",
          message: "Missing or invalid Authorization header. Use: Bearer sk_live_...",
        },
        { status: 401 },
      ),
    };
  }

  const apiKey = authHeader.slice(7);
  const key = await validateApiKey(apiKey);

  if (!key) {
    return {
      error: NextResponse.json(
        {
          error: "unauthorized",
          message: "Invalid or expired API key",
        },
        { status: 401 },
      ),
    };
  }

  // Rate limiting by API key (now async for Redis support)
  const rateLimit = await checkRateLimit(`api:${key.id}`, "api");
  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
    return {
      error: NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message: "Too many requests",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.resetAt),
          },
        },
      ),
    };
  }

  return {
    context: {
      teamId: key.teamId,
      keyId: key.id,
      scopes: key.scopes,
    },
  };
}

export function requireScope(context: ApiContext, scope: string): NextResponse | null {
  if (!context.scopes.includes("*") && !context.scopes.includes(scope)) {
    return NextResponse.json(
      {
        error: "forbidden",
        message: `This API key does not have the '${scope}' scope`,
      },
      { status: 403 },
    );
  }
  return null;
}
