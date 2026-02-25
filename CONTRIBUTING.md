# Contributing to SaaS Platform

Thank you for your interest in contributing! This guide will help you get set up and understand our development workflow.

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 10.x (`corepack enable` to activate)
- **Docker** & **Docker Compose** (for PostgreSQL, Redis, Meilisearch)
- **Git** with conventional commit knowledge

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/norfrt6-lab/saas-platform.git
cd saas-platform
pnpm install

# 2. Start infrastructure
docker compose up -d   # PostgreSQL, Redis, Meilisearch

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your local values (see below)

# 4. Push database schema
pnpm db:push

# 5. (Optional) Seed database
pnpm db:seed

# 6. Start development server
pnpm dev
```

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://saas:saas_dev_password@localhost:5432/saas_platform` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) | Random string |
| `STRIPE_SECRET_KEY` | Stripe test secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `RESEND_API_KEY` | Resend email API key | `re_...` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |

See `.env.example` for the full list including optional variables.

## Project Structure

```
saas-platform/
├── apps/
│   └── web/                 # Next.js 15 application
├── packages/
│   ├── auth/                # Authentication (Better Auth)
│   ├── billing/             # Stripe billing integration
│   ├── db/                  # Drizzle ORM schema & client
│   ├── email/               # Email templates (Resend)
│   ├── jobs/                # Background jobs (Trigger.dev)
│   ├── logger/              # Pino logging + metrics
│   ├── ui/                  # Shared UI components (shadcn/ui)
│   └── validators/          # Shared Zod schemas
├── tooling/
│   └── eslint/              # Shared ESLint configuration
├── docs/
│   ├── adr/                 # Architecture Decision Records
│   └── runbooks/            # Operational runbooks
└── .github/
    └── workflows/           # CI/CD pipelines
```

## Git Branching Strategy

```
main (production)
  └── dev (integration)
        ├── feat/*   → new features
        ├── fix/*    → bug fixes
        └── hotfix/* → urgent production fixes (PR into main)
```

- All feature and fix branches are created **from `dev`**
- PRs target `dev` unless it's a hotfix
- `dev` is merged into `main` for releases

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<short-description>` | `feat/team-invitations` |
| Bug fix | `fix/<short-description>` | `fix/stripe-webhook-retry` |
| Hotfix | `hotfix/<short-description>` | `hotfix/auth-session-leak` |

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `chore` | Build process, dependency updates |
| `perf` | Performance improvement |

### Scope (optional)

Use the package or area name: `auth`, `billing`, `db`, `web`, `ci`, etc.

### Examples

```
feat(billing): add metered usage tracking
fix(auth): prevent session fixation on team switch
test(api): add stripe webhook handler tests
docs: update contributing guide
```

## Development Workflow

### 1. Create a branch

```bash
git checkout dev
git pull origin dev
git checkout -b feat/my-feature
```

### 2. Make changes

- Follow existing code patterns and conventions
- Use TypeScript strict mode (no `any` types)
- Add tests for new business logic

### 3. Run checks locally

```bash
pnpm lint          # ESLint
pnpm typecheck     # TypeScript strict checks
pnpm test          # Vitest unit/integration tests
pnpm format:check  # Prettier formatting
```

### 4. Submit a PR

- Push your branch and open a PR targeting `dev`
- Fill out the PR template completely
- Ensure CI passes before requesting review

## Testing

We use **Vitest** for unit and integration tests.

### Running Tests

```bash
pnpm test              # Run all tests
pnpm test:unit         # Unit tests only
pnpm test:integration  # Integration tests only
```

### Writing Tests

- Test files go in `apps/web/src/__tests__/`
- Route tests go in `apps/web/src/__tests__/routes/`
- Use test helpers from `apps/web/src/__tests__/helpers/`
- Mock the database using the Proxy-based mock in `helpers/db-mock.ts`
- See existing tests for patterns (e.g., `teams.test.ts`, `projects.test.ts`)

### What to Test

- **Always test:** Service layer business logic, API route handlers, middleware, validation
- **Don't test:** Framework internals, third-party libraries, trivial getters/setters

## Code Style

- **Formatting:** Prettier (run `pnpm format` to auto-fix)
- **Linting:** ESLint with shared config from `tooling/eslint/`
- **Imports:** Use `@/` alias for `apps/web/src/` imports
- **Types:** No `any` — use `unknown` + type narrowing when type is uncertain

## Need Help?

- Check existing ADRs in `docs/adr/` for architectural context
- Read runbooks in `docs/runbooks/` for operational procedures
- Open an issue for questions or feature requests
