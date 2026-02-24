# ADR-003: Drizzle ORM over Prisma

## Status
Accepted

## Context
Need a type-safe ORM for PostgreSQL that works well in a multi-tenant
environment with high query volume.

Options:
1. Prisma — most popular, large ecosystem, query engine binary
2. Drizzle ORM — lightweight, no engine overhead, SQL-like syntax
3. Raw SQL with pg — maximum control, no type safety

## Decision
Use Drizzle ORM.

## Consequences
- (+) Zero query engine overhead (no Prisma binary)
- (+) Type-safe SQL-like syntax, easier to optimize
- (+) Better for serverless (no cold start penalty from engine)
- (+) Direct control over query patterns (important for tenant scoping)
- (-) Smaller ecosystem than Prisma
- (-) Less mature documentation
- (-) No Prisma Studio equivalent (use Drizzle Studio)
