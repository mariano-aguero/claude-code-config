---
name: dev-tooling
description: Development tooling configuration including pnpm, ESLint, Prettier, Husky, lint-staged, and TypeScript setup. Use when setting up new projects, configuring linting/formatting, adding git hooks, or optimizing the development workflow. Triggers on tasks involving package.json scripts, ESLint/Prettier configuration, pre-commit hooks, or tsconfig.json setup.
---

# Development Tooling

## Package Manager: pnpm

pnpm is the preferred package manager. Faster installs, strict dependency resolution, and efficient disk space usage through content-addressable storage.

### Installation

```bash
# macOS/Linux
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Or with npm (one-time)
npm install -g pnpm

# Or with Homebrew
brew install pnpm
```

### Basic Commands

```bash
# Install dependencies
pnpm install              # or pnpm i

# Add dependencies
pnpm add package-name           # production dependency
pnpm add -D package-name        # dev dependency
pnpm add -g package-name        # global

# Remove dependencies
pnpm remove package-name        # or pnpm rm

# Update dependencies
pnpm update                     # update all
pnpm update package-name        # update specific

# Run scripts
pnpm run dev                    # or pnpm dev
pnpm run build                  # or pnpm build
pnpm run test                   # or pnpm test

# Execute packages without installing
pnpm dlx package-name           # like npx

# List dependencies
pnpm list                       # or pnpm ls
pnpm list --depth=0             # top-level only
pnpm why package-name           # why is it installed?
```

### Workspace (Monorepo)

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```bash
# Run command in all packages
pnpm -r run build

# Run command in specific package
pnpm --filter @myorg/app run dev

# Add dependency to specific package
pnpm add react --filter @myorg/app

# Add workspace dependency
pnpm add @myorg/shared --filter @myorg/app --workspace
```

### Configuration

```ini
# .npmrc
auto-install-peers=true
strict-peer-dependencies=false
shamefully-hoist=true  # compatibility with some packages
```

---

## Version Control: Git

### Commit Convention (Conventional Commits)

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting (no code change)
- `refactor`: Code restructuring (no feature/fix)
- `perf`: Performance improvement
- `test`: Adding/fixing tests
- `chore`: Build, dependencies, tooling
- `ci`: CI/CD changes

**Examples:**
```bash
git commit -m "feat(auth): add OAuth2 login flow"
git commit -m "fix(api): handle null response from endpoint"
git commit -m "chore(deps): update dependencies"
```

### Branch Naming

```
<type>/<ticket-id>-<short-description>

# Examples
feat/AUTH-123-oauth-login
fix/BUG-456-null-pointer
chore/update-dependencies
```

### Git Hooks with Husky

```bash
pnpm add -D husky lint-staged

# Initialize
pnpm dlx husky init
```

```json
// package.json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
pnpm lint-staged

# .husky/commit-msg
pnpm dlx commitlint --edit $1
```

---

## Linting & Formatting

### ESLint 9 (Flat Config)

```bash
pnpm add -D eslint @eslint/js typescript-eslint
```

```typescript
// eslint.config.mjs
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ignores: ["dist/", "node_modules/", ".next/"],
  }
);
```

### Prettier

```bash
pnpm add -D prettier eslint-config-prettier
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

```json
// .prettierignore
node_modules
dist
.next
pnpm-lock.yaml
```

### Package Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --fix",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "check": "pnpm lint && pnpm typecheck && pnpm format"
  }
}
```

---

## Environment Variables

### .env Files

```bash
# .env.local (git ignored, local overrides)
DATABASE_URL=postgresql://localhost:5432/mydb
NEXT_PUBLIC_API_URL=http://localhost:3000

# .env.development
NEXT_PUBLIC_API_URL=http://localhost:3000

# .env.production
NEXT_PUBLIC_API_URL=https://api.production.com
```

### Validation with Zod

```typescript
// env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
```

### .env.example

```bash
# .env.example (committed to git)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
NEXT_PUBLIC_API_URL=http://localhost:3000
JWT_SECRET=your-secret-key-at-least-32-characters
```

---

## Project Structure

### Next.js App Router

```
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   └── [...route]/
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/
│   ├── ui/              # shadcn/ui components
│   └── features/        # Feature-specific components
├── lib/
│   ├── utils.ts
│   └── api.ts
├── hooks/
├── types/
├── public/
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Monorepo (Turborepo)

```
├── apps/
│   ├── web/             # Next.js app
│   └── api/             # API server
├── packages/
│   ├── ui/              # Shared UI components
│   ├── config/          # Shared configs (eslint, ts)
│   └── utils/           # Shared utilities
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

## Testing

### Vitest (Unit/Integration)

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/", "test/"],
    },
  },
});
```

```typescript
// test/setup.ts
import "@testing-library/jest-dom/vitest";
```

### Playwright (E2E)

```bash
pnpm add -D @playwright/test
pnpm dlx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## CI/CD: GitHub Actions

### Lint, Test, Build

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

### Preview Deployments (Vercel)

```yaml
# .github/workflows/preview.yml
name: Preview

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Best Practices Summary

1. **Use pnpm** - Fast, strict, efficient disk usage
2. **Conventional Commits** - Consistent commit messages
3. **Husky + lint-staged** - Pre-commit checks
4. **ESLint + Prettier** - Consistent code style
5. **TypeScript strict mode** - Catch errors at compile time
6. **Zod for env validation** - Runtime type safety
7. **Vitest for unit tests** - Fast, modern test runner
8. **Playwright for E2E** - Cross-browser testing
9. **GitHub Actions** - Automated CI/CD
10. **Turborepo for monorepos** - Optimized builds with caching
