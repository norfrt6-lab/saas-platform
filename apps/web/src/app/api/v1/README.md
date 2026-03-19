# Public REST API v1

Base URL: `https://app.example.com/api/v1`

## Authentication

All endpoints require a bearer token in the `Authorization` header:

```
Authorization: Bearer sk_live_<your-api-key>
```

API keys are created in **Settings > API Keys**. Each key has a set of scopes
that limit what it can access.

## Rate Limiting

| Plan       | Rate Limit           |
|------------|----------------------|
| Free       | 60 requests/minute   |
| Pro        | 600 requests/minute  |
| Enterprise | 6000 requests/minute |

Rate limit headers are returned on every response:
- `X-RateLimit-Limit` — max requests per window
- `X-RateLimit-Remaining` — remaining requests
- `X-RateLimit-Reset` — Unix timestamp when the window resets

## Endpoints

### Projects

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| `GET` | `/api/v1/projects` | `projects:read` | List all projects |
| `POST` | `/api/v1/projects` | `projects:write` | Create a project |
| `GET` | `/api/v1/projects/:id` | `projects:read` | Get a project |
| `PATCH` | `/api/v1/projects/:id` | `projects:write` | Update a project |
| `DELETE` | `/api/v1/projects/:id` | `projects:write` | Soft-delete a project |

### Teams

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| `GET` | `/api/v1/teams` | `teams:read` | List all teams |
| `POST` | `/api/v1/teams` | `teams:write` | Create a team |
| `POST` | `/api/v1/teams/:id/invites` | `teams:write` | Invite a member |

### Audit Log

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| `GET` | `/api/v1/audit-log` | `audit:read` | List audit events |

## Error Responses

All errors follow this shape:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Project not found",
    "status": 404
  }
}
```

Common error codes: `UNAUTHORIZED`, `FORBIDDEN`, `RESOURCE_NOT_FOUND`,
`VALIDATION_ERROR`, `RATE_LIMITED`, `PLAN_LIMIT_EXCEEDED`.

## Pagination

List endpoints support cursor-based pagination:

```
GET /api/v1/projects?limit=20&cursor=<next_cursor>
```

Response includes `data` array and `nextCursor` (null if no more pages).
