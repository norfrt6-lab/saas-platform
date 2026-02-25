# ADR-006: Testing Strategy

## Status

Accepted

## Context

The platform has grown to include multi-tenant RBAC, billing integration, API key management, invitations, and audit logging. As complexity increases, we need a clear testing strategy to prevent regressions and give contributors confidence when making changes.

Previously, test coverage was limited to schema validation and utility functions. Core business logic in the service layer (teams, projects, billing, API keys) had no automated tests.

## Decision

We adopt a **testing pyramid** approach with three tiers:

### 1. Unit Tests (Vitest) — Primary focus

- **What:** Service layer functions, API middleware, response helpers, utility functions
- **How:** Mock external dependencies (database, Stripe, email) using Vitest mocks
- **Where:** `apps/web/src/__tests__/`
- **Coverage target:** 70%+ on `apps/web/src/lib/api/`

The database layer is mocked using a Proxy-based chainable mock (`__tests__/helpers/db-mock.ts`) that simulates Drizzle ORM's query builder pattern. This lets us test business logic in isolation without a running database.

### 2. Integration Tests (Vitest) — Secondary focus

- **What:** API route handlers (testing the full request-response cycle within Next.js route handlers)
- **How:** Import route handler functions directly, mock auth sessions and database
- **Where:** `apps/web/src/__tests__/routes/`

Route handler tests verify:
- Authentication enforcement (session-based and API key-based)
- Request validation and error responses
- Correct HTTP status codes and response shapes
- Audit log creation for state-changing operations

### 3. E2E Tests (Playwright) — Future

- **What:** Critical user flows (login, create team, manage project, billing)
- **How:** Browser-based tests against a running application
- **Where:** `apps/web/e2e/`
- **Scope:** Smoke tests for core flows, not exhaustive UI testing

## Testing Conventions

### File naming
- Service tests: `<module>.test.ts` (e.g., `teams.test.ts`)
- Route tests: `routes/<module>.route.test.ts` (e.g., `routes/teams.route.test.ts`)
- E2E tests: `e2e/<flow>.spec.ts` (e.g., `e2e/auth.spec.ts`)

### Mock patterns
- Use `vi.mock()` with getter pattern to avoid hoisting issues:
  ```typescript
  const mockSelect = vi.fn();
  vi.mock("@saas/db", () => ({
    db: { get select() { return mockSelect; } },
  }));
  ```
- Use `vi.hoisted()` when environment variables must be set before module evaluation
- Use test fixtures from `__tests__/helpers/fixtures.ts` for consistent test data

### What to test
- RBAC enforcement (owner-only, admin-only operations)
- Tenant isolation (resources scoped to correct team)
- Edge cases (last owner protection, expired tokens, duplicate prevention)
- Error paths (validation failures, not found, forbidden)

### What NOT to test
- Framework internals (Next.js routing, React rendering)
- Third-party library behavior (Stripe SDK, Drizzle query building)
- Trivial code (simple getters, re-exports, type definitions)

## Consequences

### Positive
- Contributors can run `pnpm test` to verify changes don't break existing functionality
- Service layer tests document expected behavior for complex business rules
- Mocked database tests run in milliseconds, enabling fast feedback loops
- CI enforces test passage on every PR

### Negative
- Mocked database tests may diverge from actual Drizzle behavior over time
- Maintaining mock chainable proxies adds complexity
- E2E tests require infrastructure setup (database, Redis) in CI

### Mitigations
- Periodically verify mock behavior against real database in development
- Keep mock helpers centralized to reduce duplication
- Use Docker Compose for E2E infrastructure in CI when implemented
