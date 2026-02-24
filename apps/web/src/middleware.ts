import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCSP, SECURITY_HEADERS } from "@/lib/security";

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
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuthenticated = !!sessionToken;
  const isPublic = isPublicPath(pathname);

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && pathname.startsWith("/auth/")) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    return applySecurityHeaders(response);
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    return applySecurityHeaders(response);
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
