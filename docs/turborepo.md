# Turborepo Monorepo Structure

This project uses [Turborepo](https://turbo.build/repo) to manage the monorepo build pipeline.

## Workspace Layout

```
saas-platform/
├── apps/
│   └── web/          # Next.js 14 application
├── packages/
│   ├── db/           # Drizzle ORM schema and client
│   ├── ui/           # Shared React component library
│   └── env/          # Zod-based environment validation
└── tooling/
    ├── eslint/       # Shared ESLint configuration
    └── prettier/     # Shared Prettier configuration
```

## Pipeline Configuration (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

## Key Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all workspaces |
| `pnpm typecheck` | Run TypeScript checks across all packages |
| `pnpm test` | Run all tests with coverage |

## Caching

Turborepo caches task outputs locally in `.turbo/`. Remote caching can be enabled
via Vercel Remote Cache or a self-hosted Turborepo Remote Cache server.

Set `TURBO_TOKEN` and `TURBO_TEAM` environment variables to enable remote caching.

## Adding a New Package

1. Create `packages/<name>/package.json` with `"name": "@saas/<name>"`
2. Add it as a dependency in the consuming workspace
3. Run `pnpm install` from the root to link workspaces
4. Add relevant pipeline tasks to `turbo.json` if needed
