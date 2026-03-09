# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude Code configuration repository containing specialized agents, skills, and commands for modern full-stack and Web3 development. It extends Claude Code with expert personas and technical reference materials.

## Architecture

### Agents (`.claude/agents/`)

Expert personas with behavioral traits and response methodologies:

- `frontend-expert` - React 19, Next.js 16+, TanStack ecosystem
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
- `better-auth.md` - Better Auth setup, session, OAuth, middleware protection
- `drizzle.md` - Drizzle ORM schema, queries, relations, transactions, migrations
- `testing.md`, `database.md` - Testing and data patterns
- `hooks.md` - Claude Code hook types, env vars, configuration patterns
- `solidity/`, `web3/` - Progressive folders with `SKILL.md` + `references/`

### Commands (`.claude/commands/`)

Slash command templates: `/react/*`, `/git/*`, `/testing/*`, `/api/*`, `/db/*`, `/web3/*`, `/infra/*`

## Hook Toggles

Control formatting and linting per project via `.claude/settings.local.json` (not committed to git):

```json
{
  "env": {
    "CLAUDE_FORMAT": "0",
    "CLAUDE_LINT": "0",
    "CLAUDE_ANALYSIS": "0",
    "CLAUDE_TYPECHECK": "0",
    "CLAUDE_RUN_TESTS": "1"
  }
}
```

| Variable           | Default | Effect                                                                                      |
| ------------------ | ------- | ------------------------------------------------------------------------------------------- |
| `CLAUDE_FORMAT`    | `"1"`   | Set `"0"` to skip Prettier on every Write/Edit                                              |
| `CLAUDE_LINT`      | `"1"`   | Set `"0"` to skip ESLint on every Write/Edit                                                |
| `CLAUDE_ANALYSIS`  | `"1"`   | Set `"0"` to skip advisory analysis (missing tests, complexity, dead-code, duplicates)      |
| `CLAUDE_TYPECHECK` | `"1"`   | Set `"0"` to disable tsc. Auto-skips on projects > 300 TS files; set `"1"` to force it back |
| `CLAUDE_RUN_TESTS` | `"0"`   | Set `"1"` to run `pnpm test` at every session Stop                                          |

Note: Secrets detection (`analysis.js`) always runs regardless of any toggle — it cannot be disabled. `CLAUDE_ANALYSIS=0` skips only the advisory checks (missing tests, complexity, dead-code, duplicates).
