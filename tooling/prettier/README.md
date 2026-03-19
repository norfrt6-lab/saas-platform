# Prettier Shared Configuration

This package provides the shared Prettier configuration used across all workspaces in the monorepo.

## Usage

In your `prettier.config.js`:

```js
export { default } from "@saas/prettier-config";
```

Or reference it in `package.json`:

```json
{
  "prettier": "@saas/prettier-config"
}
```

## Configuration

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## Tailwind CSS Class Sorting

The `prettier-plugin-tailwindcss` plugin automatically sorts Tailwind CSS classes
according to the recommended order. It reads your `tailwind.config.ts` to resolve
custom classes.

## Editor Integration

Install the [Prettier VS Code extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
and set it as the default formatter. The `.vscode/settings.json` in this repo
enables format-on-save automatically.
