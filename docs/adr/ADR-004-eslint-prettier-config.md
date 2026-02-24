# ADR-004: ESLint + Prettier Configuration

## Status
Accepted

## Context
Code consistency across a monorepo with multiple packages requires shared linting and formatting rules. Without shared tooling, each package drifts toward different styles, making code review and onboarding harder.

## Decision
- **Prettier** handles all formatting (semi, quotes, trailing commas, print width)
- **ESLint** handles code quality rules only (no formatting rules)
- Shared configs live in `tooling/eslint/` with `base.js` (all packages) and `next.js` (Next.js apps)
- `prettier-plugin-tailwindcss` auto-sorts Tailwind classes
- CI enforces lint + type-check on every PR

## Key Rules
- `consistent-type-imports`: Enforces `import type` for type-only imports (tree-shaking)
- `import/order`: Alphabetical, grouped imports with newlines between groups
- `no-console`: Warns on console.log, allows console.warn/error
- `jsx-a11y`: Accessibility linting for React components

## Consequences
- Consistent code style across all packages
- CI catches lint/type errors before merge
- Developers can auto-fix most issues with editor integration
