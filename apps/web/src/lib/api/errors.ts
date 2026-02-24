import { NextResponse } from "next/server";

/**
 * Custom API error classes for structured error handling.
 * Use these instead of throwing generic Error with string matching.
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Insufficient permissions") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Resource already exists") {
    super(409, message);
    this.name = "ConflictError";
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Invalid request") {
    super(400, message);
    this.name = "BadRequestError";
  }
}

/**
 * Wraps an API route handler with consistent error handling.
 * Converts known error types to proper HTTP responses.
 */
export function withErrorHandler(
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  return handler().catch((error: unknown) => {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    // PostgreSQL unique violation
    if (
      error != null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "Resource already exists" },
        { status: 409 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  });
}
