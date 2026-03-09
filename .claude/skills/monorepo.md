---
name: monorepo-patterns
description: pnpm workspaces and Turborepo patterns for TypeScript monorepos. Use when setting up monorepos, configuring Turborepo pipelines, sharing packages, or managing workspace dependencies.
---

# Monorepo Patterns (pnpm + Turborepo)

## Installation

```bash
pnpm add -D turbo
```

## pnpm-workspace.yaml

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

## Directory Structure

```
my-monorepo/
  apps/
    web/           # Next.js app
    api/           # Hono API
    docs/          # Documentation site
  packages/
    ui/            # Shared React components
    config/        # Shared configs (ESLint, Tailwind, TS)
    types/         # Shared TypeScript types
    utils/         # Shared utilities
  turbo.json
  pnpm-workspace.yaml
  package.json
```

## Root package.json

```json
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "clean": "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.7.0"
  }
}
```

## turbo.json Pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
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
    },
    "clean": {
      "cache": false
    }
  }
}
```

`dependsOn: ["^build"]` means "build my deps first". `persistent: true` keeps dev servers alive. Always exclude `.next/cache` from outputs to avoid cache bloat.

## Shared UI Package (@repo/ui)

```json
// packages/ui/package.json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./button": "./src/button.tsx",
    "./card": "./src/card.tsx",
    "./*": "./src/*.tsx"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@repo/config": "workspace:*"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

```typescript
// packages/ui/src/button.tsx
export { Button } from "./components/button";
export type { ButtonProps } from "./components/button";
```

## Shared Config Package (@repo/config)

```json
// packages/config/package.json
{
  "name": "@repo/config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./eslint": "./eslint.js",
    "./tailwind": "./tailwind.js",
    "./typescript": "./typescript.json"
  }
}
```

```javascript
// packages/config/eslint.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
```

```json
// packages/config/typescript.json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true
  }
}
```

## Shared Types Package (@repo/types)

```json
// packages/types/package.json
{
  "name": "@repo/types",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  }
}
```

```typescript
// packages/types/src/index.ts
export type { User, Post, Comment } from "./models";
export type { ApiResponse, PaginatedResponse } from "./api";
```

## TypeScript Project References

```json
// tsconfig.json (root)
{
  "files": [],
  "references": [
    { "path": "apps/web" },
    { "path": "apps/api" },
    { "path": "packages/ui" },
    { "path": "packages/types" }
  ]
}
```

```json
// apps/web/tsconfig.json
{
  "extends": "@repo/config/typescript",
  "compilerOptions": {
    "outDir": "./.next",
    "composite": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src", "next.config.ts"],
  "references": [
    { "path": "../../packages/ui" },
    { "path": "../../packages/types" }
  ]
}
```

## Consuming Workspace Packages

```json
// apps/web/package.json
{
  "dependencies": {
    "@repo/ui": "workspace:*",
    "@repo/types": "workspace:*"
  }
}
```

```typescript
// apps/web/src/app/page.tsx
import { Button } from "@repo/ui/button";
import type { User } from "@repo/types";
```

## Remote Caching with Vercel

```bash
# Link to Vercel Remote Cache (CI/CD speedup)
npx turbo login
npx turbo link

# Or set in CI via env vars
TURBO_TOKEN=<token>
TURBO_TEAM=<team-slug>
```

## Running Specific Apps

```bash
# Run only the web app in dev mode
turbo dev --filter=web

# Build only packages that web depends on
turbo build --filter=web...

# Run tasks for changed packages since main
turbo build --filter=[main]
```

## Common Pitfalls

- Always define `"exports"` in package.json — without it, TypeScript cannot resolve named imports from workspace packages
- Use `"workspace:*"` (not `"*"`) for internal deps — pnpm replaces it with the actual version on publish
- Circular dependencies between packages will deadlock Turborepo builds — keep `packages/` dependency flow unidirectional
- Never put build artifacts in `"exports"` paths during dev — use `ts-node` or `tsx` source paths, or configure `conditions`
- `persistent: true` tasks (dev) cannot be depended on by other tasks — they run in parallel, not sequence
