import crypto from "crypto";

import { NextResponse } from "next/server";

/**
 * HTTP caching utilities for API responses.
 * Applies Cache-Control, ETag, and conditional response headers.
 */

export interface CacheOptions {
  /** Max-age in seconds for Cache-Control */
  maxAge?: number;
  /** Whether the response is private (user-specific) or public */
  isPrivate?: boolean;
  /** stale-while-revalidate seconds */
  staleWhileRevalidate?: number;
}

/**
 * Apply Cache-Control headers to a response.
 */
export function withCacheHeaders(
  response: NextResponse,
  options: CacheOptions = {},
): NextResponse {
  const {
    maxAge = 0,
    isPrivate = true,
    staleWhileRevalidate,
  } = options;

  const parts: string[] = [];
  parts.push(isPrivate ? "private" : "public");

  if (maxAge > 0) {
    parts.push(`max-age=${maxAge}`);
  } else {
    parts.push("no-cache");
  }

  if (staleWhileRevalidate && staleWhileRevalidate > 0) {
    parts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  response.headers.set("Cache-Control", parts.join(", "));
  return response;
}

/**
 * Generate an ETag from response body content.
 */
export function generateETag(body: string): string {
  const hash = crypto.createHash("md5").update(body).digest("hex").slice(0, 16);
  return `"${hash}"`;
}

/**
 * Apply ETag and check If-None-Match for conditional responses.
 * Returns a 304 Not Modified response if the ETag matches.
 */
export function withETag(
  request: { headers: { get(name: string): string | null } },
  body: string,
  response: NextResponse,
): NextResponse | null {
  const etag = generateETag(body);
  response.headers.set("ETag", etag);

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": response.headers.get("Cache-Control") ?? "private, no-cache",
      },
    }) as NextResponse;
  }

  return null;
}

/**
 * Convenience: Create a cached JSON response with ETag support.
 */
export function cachedJsonResponse(
  request: { headers: { get(name: string): string | null } },
  data: unknown,
  options: CacheOptions & { status?: number } = {},
): NextResponse {
  const body = JSON.stringify(data);
  const { status = 200, ...cacheOptions } = options;

  const response = new NextResponse(body, {
    status,
    headers: { "Content-Type": "application/json" },
  }) as NextResponse;

  withCacheHeaders(response, cacheOptions);

  const etag = generateETag(body);
  response.headers.set("ETag", etag);

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": response.headers.get("Cache-Control") ?? "private, no-cache",
      },
    }) as NextResponse;
  }

  return response;
}
