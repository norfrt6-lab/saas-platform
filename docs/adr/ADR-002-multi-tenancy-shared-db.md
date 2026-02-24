# ADR-002: Multi-Tenancy with Shared Database

## Status
Accepted

## Context
We need to support 10k+ tenants. Options considered:
1. Shared DB with row-level isolation (tenant_id on every table)
2. Schema-per-tenant (PostgreSQL schemas)
3. Database-per-tenant (separate connection strings)

## Decision
Use shared database with mandatory `team_id` (tenant_id) column on all
tenant-scoped tables. Enterprise customers can opt into dedicated schema
via configuration flag.

## Consequences
- (+) Single DB to manage, lower operational cost
- (+) Simple tenant provisioning (create row, not DB/schema)
- (+) Standard connection pooling works out of the box
- (-) Must enforce tenant_id filtering at every query — one miss = data leak
- (-) Noisy neighbor risk — mitigated by per-tenant rate limiting
- Mitigation: Automated cross-tenant leak detection tests in CI
- Mitigation: `getTenantOrThrow()` pattern in all repositories
