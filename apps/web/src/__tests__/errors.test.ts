import { NextResponse } from "next/server";
import { describe, it, expect } from "vitest";

import {
  ApiError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  withErrorHandler,
} from "../lib/api/errors";

describe("Custom Error Classes", () => {
  describe("ApiError", () => {
    it("should set statusCode and message", () => {
      const error = new ApiError(422, "Validation failed");
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe("Validation failed");
      expect(error.name).toBe("ApiError");
    });

    it("should be an instance of Error", () => {
      const error = new ApiError(500, "test");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });
  });

  describe("NotFoundError", () => {
    it("should default to 404 status", () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Resource not found");
    });

    it("should accept custom message", () => {
      const error = new NotFoundError("Project not found");
      expect(error.message).toBe("Project not found");
    });
  });

  describe("ForbiddenError", () => {
    it("should default to 403 status", () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Insufficient permissions");
    });
  });

  describe("ConflictError", () => {
    it("should default to 409 status", () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe("Resource already exists");
    });
  });

  describe("BadRequestError", () => {
    it("should default to 400 status", () => {
      const error = new BadRequestError();
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Invalid request");
    });
  });
});

describe("withErrorHandler", () => {
  it("should return the handler response on success", async () => {
    const response = await withErrorHandler(async () => {
      return NextResponse.json({ ok: true });
    });

    const body = await response.json();
    expect(body).toEqual({ ok: true });
    expect(response.status).toBe(200);
  });

  it("should convert ApiError to proper HTTP response", async () => {
    const response = await withErrorHandler(async () => {
      throw new ForbiddenError("Not allowed");
    });

    const body = await response.json();
    expect(body).toEqual({ error: "Not allowed" });
    expect(response.status).toBe(403);
  });

  it("should convert NotFoundError to 404", async () => {
    const response = await withErrorHandler(async () => {
      throw new NotFoundError("Team not found");
    });

    expect(response.status).toBe(404);
  });

  it("should convert ConflictError to 409", async () => {
    const response = await withErrorHandler(async () => {
      throw new ConflictError("Already exists");
    });

    expect(response.status).toBe(409);
  });

  it("should handle PostgreSQL unique violation (code 23505)", async () => {
    const response = await withErrorHandler(async () => {
      const pgError = new Error("duplicate key value violates unique constraint");
      (pgError as unknown as Record<string, string>).code = "23505";
      throw pgError;
    });

    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.error).toBe("Resource already exists");
  });

  it("should return 500 for unknown errors", async () => {
    const response = await withErrorHandler(async () => {
      throw new Error("Something unexpected");
    });

    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toBe("Something unexpected");
  });

  it("should handle non-Error throws", async () => {
    const response = await withErrorHandler(async () => {
      throw "string error";
    });

    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
