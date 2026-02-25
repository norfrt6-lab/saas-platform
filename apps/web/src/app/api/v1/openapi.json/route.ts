import { NextResponse } from "next/server";

export const dynamic = "force-static";

const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "SaaS Platform API",
    version: "1.0.0",
    description: "Public API for the SaaS Platform. Authenticate with a Bearer API key.",
  },
  servers: [
    {
      url: "/api/v1",
      description: "Current environment",
    },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "API key obtained from the dashboard. Format: sk_live_...",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "not_found" },
              message: { type: "string", example: "Resource not found" },
            },
            required: ["code", "message"],
          },
        },
        required: ["error"],
      },
      Pagination: {
        type: "object",
        properties: {
          hasMore: { type: "boolean" },
          nextCursor: { type: "string", nullable: true },
        },
        required: ["hasMore", "nextCursor"],
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string", format: "cuid2" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          teamId: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          deletedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
    },
    parameters: {
      cursor: {
        name: "cursor",
        in: "query",
        schema: { type: "string" },
        description: "Cursor for pagination (project ID to start after)",
      },
      limit: {
        name: "limit",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        description: "Number of items to return",
      },
    },
    responses: {
      Unauthorized: {
        description: "Invalid or missing API key",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              error: { code: "unauthorized", message: "Invalid or expired API key" },
            },
          },
        },
      },
      Forbidden: {
        description: "API key lacks required scope",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      RateLimited: {
        description: "Rate limit exceeded",
        headers: {
          "Retry-After": { schema: { type: "integer" }, description: "Seconds until rate limit resets" },
          "X-RateLimit-Remaining": { schema: { type: "integer" } },
          "X-RateLimit-Reset": { schema: { type: "integer" } },
        },
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
  },
  paths: {
    "/projects": {
      get: {
        operationId: "listProjects",
        summary: "List projects",
        description: "Returns a paginated list of projects for the authenticated team.",
        tags: ["Projects"],
        parameters: [
          { $ref: "#/components/parameters/cursor" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          200: {
            description: "Paginated list of projects",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Project" },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          429: { $ref: "#/components/responses/RateLimited" },
        },
      },
      post: {
        operationId: "createProject",
        summary: "Create a project",
        tags: ["Projects"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", minLength: 1 },
                  description: { type: "string" },
                },
                required: ["name"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Project created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Project" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          429: { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
  },
};

export function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
