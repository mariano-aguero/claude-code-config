# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude Code configuration repository containing specialized agents, skills, and commands for modern full-stack and Web3 development. It extends Claude Code with expert personas and technical reference materials.

## Architecture

### Agents (`.claude/agents/`)
Expert personas with behavioral traits and response methodologies:
- `frontend-expert` - React 19, Next.js 15+, TanStack ecosystem
- `backend-expert` - Node.js, Hono, Drizzle, PostgreSQL
- `infrastructure-expert` - Docker, CI/CD, GitHub Actions
- `ui-expert` - Tailwind v4, shadcn/ui, Framer Motion
- `web3-expert` - Solidity, Foundry, Viem, Wagmi
- `typescript-expert` - Advanced types, generics, Zod
- `testing-expert` - Vitest, Playwright, MSW, mocking
- `database-expert` - PostgreSQL, Drizzle ORM, migrations
- `security-expert` - OWASP, auth, headers, secrets management
- `code-reviewer` - Evidence-based reviews with severity classification

Format: YAML frontmatter (`name`, `description`, `model`) + Capabilities, Behavioral Traits, Response Approach, Example Interactions.

### Skills (`.claude/skills/`)
Technical reference materials with patterns and code examples:
- `javascript.md` - ES6+, async/await, functional patterns
- `typescript.md` - Generics, conditional types, infer, branded types
- `nodejs.md` - Hono/Fastify, middleware, error handling, auth
- `security.md` - OWASP, JWT, RBAC, headers, input validation
- `react.md`, `nextjs.md`, `ui.md` - Frontend patterns
- `testing.md`, `database.md` - Testing and data patterns
- `solidity/`, `web3/` - Progressive folders with `SKILL.md` + `references/`

### Commands (`.claude/commands/`)
Slash command templates: `/react/*`, `/git/*`, `/testing/*`, `/api/*`, `/db/*`, `/web3/*`, `/infra/*`

## Tech Stack Conventions

| Domain | Technologies |
|--------|--------------|
| Frontend | TypeScript 5.x, React 19, Next.js 16+, TanStack (Query v5, Form v1), Tailwind v4.1, Zustand v5 |
| Backend | Node.js 20+, Hono/Fastify, Drizzle ORM, PostgreSQL, Redis |
| Testing | Vitest, Testing Library, Playwright, MSW |
| Web3 | Solidity 0.8.33, Foundry, OpenZeppelin 5.4, Viem 2.45+, Wagmi 3.4+ |

## Key Principles

- **TanStack for data** - Use Query for client-side server state, Form for forms (never React Hook Form); use `fetch()` or ORM calls directly in Server Components
- **Server Components default** - Use `"use client"` only when necessary
- **TypeScript strict** - No `any`, proper generics, Zod for runtime validation
- **Drizzle for database** - Type-safe queries, proper migrations
- **Web3 security** - CEI pattern, reentrancy guards, simulate before send

## Hook Toggles

Control formatting and linting per project via `.claude/settings.local.json` (not committed to git):

```json
{
  "env": {
    "CLAUDE_FORMAT": "0",
    "CLAUDE_LINT": "0"
  }
}
```

| Variable | Default | Effect when `"0"` |
|---|---|---|
| `CLAUDE_FORMAT` | `"1"` | Skips Prettier on every Write/Edit |
| `CLAUDE_LINT` | `"1"` | Skips ESLint on every Write/Edit |

Note: `detect-secrets` and `typecheck` always run regardless — they catch correctness and security issues, not style.

## Code Intelligence

Claude Code has native LSP support (enabled via `ENABLE_LSP_TOOL=1` in shell). Prefer LSP tools over Grep/Read for code navigation — 900x faster and semantically precise:
- `workspaceSymbol` to find where something is defined
- `findReferences` to see all usages across the codebase
- `goToDefinition` / `goToImplementation` to jump to source
- `hover` for type info without reading the file

Use Grep only for text/pattern searches (comments, strings, config files).

After writing or editing code, check LSP diagnostics and fix errors before proceeding.
