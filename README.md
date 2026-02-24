# SaaS Platform

> Production-grade, multi-tenant SaaS platform with revenue-safe billing, tenant isolation, observability, and a clear scaling path to 10x growth.

Designed for 10k+ tenants | 99.9% uptime target | Sub-200ms P95 API response

## Tech Stack

- **Framework:** Next.js 15 (App Router, RSC, PPR)
- **Language:** TypeScript 5.x (strict mode)
- **Monorepo:** Turborepo
- **Database:** PostgreSQL 16 + Drizzle ORM
- **Auth:** Better Auth
- **API:** tRPC v11 (internal) + REST/OpenAPI (external)
- **Payments:** Stripe (Subscriptions + Metered Billing)
- **Background Jobs:** Trigger.dev
- **Caching:** Redis (Upstash) + Next.js Cache
- **UI:** Tailwind CSS 4 + shadcn/ui + Radix + Framer Motion
- **Testing:** Vitest + Playwright + k6
- **CI/CD:** GitHub Actions

## Architecture

```
Request → Edge Middleware → Tenant Context → tRPC Router → Service Layer → Repository → PostgreSQL
                                                ↑ Zod          ↑ Feature Gate    ↑ Tenant Scope
                                                ↑ Auth         ↑ Audit Log       ↑ Soft Delete
```

## Features

- Multi-tenant with row-level isolation + enterprise schema option
- Stripe subscriptions + metered billing + dunning + grace periods
- Idempotent webhook processing
- RBAC (Owner > Admin > Member) enforced at service layer
- Background job queue with retry + dead letter queue
- Cursor-based pagination everywhere
- GDPR: data export + tenant erasure
- Immutable audit logging
- 4-layer caching (CDN > Next.js > Redis > DB)
- 330+ tests: unit, integration, E2E, security, load
- Architecture Decision Records (ADRs)
- Production runbooks

## Getting Started

```bash
git clone https://github.com/norfrt6-lab/saas-platform.git
cd saas-platform
pnpm install
cp .env.example .env.local
docker compose up -d
pnpm db:push
pnpm dev
```

## Git Branching Strategy

```
main (production)
  └── dev (integration)
        ├── feat/* (features → PR into dev)
        └── fix/*  (fixes → PR into dev)
```

## License

MIT
