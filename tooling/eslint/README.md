# ESLint Shared Configuration

This package provides the shared ESLint configuration used across all workspaces in the monorepo.

## Usage

In your `eslint.config.js` (ESLint v9 flat config):

```js
import { config } from "@saas/eslint-config";
export default config;
```

## Included Rule Sets

- `@eslint/js` — recommended JavaScript rules
- `typescript-eslint` — strict TypeScript-aware linting
- `eslint-plugin-react` — React best practices
- `eslint-plugin-react-hooks` — enforces Rules of Hooks
- `eslint-plugin-import` — import order and resolution
- `eslint-plugin-jsx-a11y` — accessibility checks

## Key Rules

| Rule | Setting | Reason |
|------|---------|--------|
| `no-console` | `warn` | Use structured logger instead |
| `@typescript-eslint/no-explicit-any` | `error` | Enforce strict typing |
| `@typescript-eslint/no-unused-vars` | `error` | Catch dead code |
| `import/order` | `error` | Consistent import grouping |
| `react-hooks/exhaustive-deps` | `error` | Prevent stale closures |

## Ignoring Files

Add files to `.eslintignore` or use the `ignores` array in `eslint.config.js`.
Generated files like `.next/` and `dist/` are ignored by default.
