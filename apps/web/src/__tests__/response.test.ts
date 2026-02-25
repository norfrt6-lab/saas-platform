import { describe, it, expect } from "vitest";

import { apiSuccess, apiList, apiError, ErrorCodes } from "../lib/api/response";

describe("API Response Helpers", () => {
  describe("apiSuccess", () => {
    it("should return JSON with data wrapper", async () => {
      const response = apiSuccess({ id: "1", name: "Test" });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ data: { id: "1", name: "Test" } });
    });

    it("should support custom status code", async () => {
      const response = apiSuccess({ created: true }, 201);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data.created).toBe(true);
    });

    it("should handle null data", async () => {
      const response = apiSuccess(null);

      const body = await response.json();
      expect(body.data).toBeNull();
    });

    it("should handle array data", async () => {
      const response = apiSuccess([1, 2, 3]);

      const body = await response.json();
      expect(body.data).toEqual([1, 2, 3]);
    });
  });

  describe("apiList", () => {
    it("should return paginated list response", async () => {
      const items = [{ id: "1" }, { id: "2" }];
      const response = apiList(items, {
        hasMore: true,
        nextCursor: "cursor_2",
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(2);
      expect(body.pagination.hasMore).toBe(true);
      expect(body.pagination.nextCursor).toBe("cursor_2");
    });

    it("should handle empty list", async () => {
      const response = apiList([], {
        hasMore: false,
        nextCursor: null,
      });

      const body = await response.json();
      expect(body.data).toEqual([]);
      expect(body.pagination.hasMore).toBe(false);
      expect(body.pagination.nextCursor).toBeNull();
    });

    it("should support custom status code", async () => {
      const response = apiList(
        [{ id: "1" }],
        { hasMore: false, nextCursor: null },
        200,
      );

      expect(response.status).toBe(200);
    });
  });

  describe("apiError", () => {
    it("should return structured error response", async () => {
      const response = apiError("not_found", "Resource not found", 404);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("not_found");
      expect(body.error.message).toBe("Resource not found");
    });

    it("should handle 400 bad request", async () => {
      const response = apiError("bad_request", "Invalid input", 400);

      expect(response.status).toBe(400);
    });

    it("should handle 500 internal error", async () => {
      const response = apiError("internal_error", "Something broke", 500);

      expect(response.status).toBe(500);
    });
  });

  describe("ErrorCodes", () => {
    it("should define all standard error codes", () => {
      expect(ErrorCodes.BAD_REQUEST).toBe("bad_request");
      expect(ErrorCodes.UNAUTHORIZED).toBe("unauthorized");
      expect(ErrorCodes.FORBIDDEN).toBe("forbidden");
      expect(ErrorCodes.NOT_FOUND).toBe("not_found");
      expect(ErrorCodes.CONFLICT).toBe("conflict");
      expect(ErrorCodes.RATE_LIMITED).toBe("rate_limit_exceeded");
      expect(ErrorCodes.VALIDATION_ERROR).toBe("validation_error");
      expect(ErrorCodes.INTERNAL_ERROR).toBe("internal_error");
    });
  });
});
