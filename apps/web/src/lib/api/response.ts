import { NextResponse } from "next/server";

/**
 * Standardized API response format.
 *
 * Success responses:
 *   { data: T }
 *   { data: T[], pagination: { hasMore, nextCursor } }
 *
 * Error responses:
 *   { error: { code: string, message: string } }
 */

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Create a standardized success response.
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data } satisfies ApiSuccessResponse<T>, { status });
}

/**
 * Create a standardized list response with cursor-based pagination.
 */
export function apiList<T>(
  data: T[],
  pagination: { hasMore: boolean; nextCursor: string | null },
  status = 200,
): NextResponse {
  return NextResponse.json(
    { data, pagination } satisfies ApiListResponse<T>,
    { status },
  );
}

/**
 * Create a standardized error response.
 */
export function apiError(
  code: string,
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json(
    { error: { code, message } } satisfies ApiErrorResponse,
    { status },
  );
}

/**
 * Standard error codes used across the API.
 */
export const ErrorCodes = {
  BAD_REQUEST: "bad_request",
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  RATE_LIMITED: "rate_limit_exceeded",
  VALIDATION_ERROR: "validation_error",
  INTERNAL_ERROR: "internal_error",
} as const;
