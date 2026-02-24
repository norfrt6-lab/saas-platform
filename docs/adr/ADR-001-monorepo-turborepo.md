# ADR-001: Monorepo with Turborepo

## Status
Accepted

## Context
We need a project structure that supports multiple apps (web, docs) and shared
packages (db, ui, validators, auth, billing, email, logger) while maintaining
fast build times and clear dependency boundaries.

Options considered:
1. Single Next.js app (monolith)
2. Nx monorepo
3. Turborepo monorepo

## Decision
Use Turborepo with pnpm workspaces.

## Consequences
- (+) Parallel builds with dependency graph caching
- (+) Shared packages with workspace protocol (`workspace:*`)
- (+) Clear separation of concerns
- (+) Each package has its own tsconfig, tests, and build
- (+) Incremental adoption — start small, add packages as needed
- (-) Initial setup complexity
- (-) Must manage cross-package dependencies carefully
