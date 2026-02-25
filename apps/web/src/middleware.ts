import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCSP, SECURITY_HEADERS } from "@/lib/security";

const CORRELATION_ID_HEADER = "x-correlation-id";

const publicPaths = new Set([
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/pricing",
  "/about",
  "/blog",
]);

const publicPrefixes = ["/api/auth/", "/api/webhooks/", "/api/health"];

function isPublicPath(pathname: string): boolean {
  if (publicPaths.has(pathname)) return true;
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set("Content-Security-Policy", getCSP());
  return response;
}

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Propagate or generate correlation ID for request tracing
  const correlationId =
    request.headers.get(CORRELATION_ID_HEADER) ?? globalThis.crypto.randomUUID();

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuthenticated = !!sessionToken;
  const isPublic = isPublicPath(pathname);

  // Redirect authenticated users away from auth pages and landing page
  if (isAuthenticated && (pathname === "/" || pathname.startsWith("/auth/"))) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.headers.set(CORRELATION_ID_HEADER, correlationId);
    return applySecurityHeaders(response);
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set(CORRELATION_ID_HEADER, correlationId);
    return applySecurityHeaders(response);
  }

  const response = NextResponse.next();
  // Forward correlation ID to downstream handlers via request header
  response.headers.set(CORRELATION_ID_HEADER, correlationId);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CORRELATION_ID_HEADER, correlationId);

  // Server-Timing header for response time visibility in browser DevTools
  const durationMs = Date.now() - startTime;
  response.headers.set("Server-Timing", `middleware;dur=${durationMs}`);

  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
