# claude-code-config

Opinionated Claude Code configuration for TypeScript + React 19 + Next.js 16+ + Hono + Drizzle + Web3 development.

## What you get

- **10 expert agents** — specialized personas for frontend, backend, database, security, Web3, and more, with DO/DON'T rules and stack-aware defaults
- **20+ technical skills** — production-grade reference docs with real, compilable code for every layer of the stack
- **25+ slash commands** — scaffolding templates for components, features, routes, schemas, contracts, and tests
- **Automated hooks** — secrets detection, ESLint, tsc, Prettier, auto-staging, and session context injection on every file edit

## Quick start

```bash
# Clone into your home directory
git clone https://github.com/yourusername/claude-code-config.git ~/.claude-config

# Symlink into Claude Code's config directory
ln -sf ~/.claude-config/.claude ~/.claude

# Or copy directly if you prefer
cp -r ~/.claude-config/.claude ~/.claude
```

Claude Code picks up everything in `~/.claude/` automatically on next launch.

## Agents

Invoke agents explicitly or let them activate based on task type. All agents use `claude-sonnet-4-5`; security, web3, and code review use `claude-opus-4-5` for deeper reasoning.

| Agent                   | What it handles                                            | When to trigger                           |
| ----------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| `frontend-expert`       | React 19, Next.js 16+, TanStack Query v5, TanStack Form v1 | Components, pages, hooks, RSC patterns    |
| `backend-expert`        | Hono v4, Drizzle ORM, PostgreSQL, Redis                    | API routes, DB queries, middleware        |
| `database-expert`       | Drizzle schema, migrations, relations, query optimization  | Schema design, slow queries, migrations   |
| `security-expert`       | OWASP, Better Auth, CSP, secrets management                | Auth flows, headers, input validation     |
| `ui-expert`             | Tailwind v4, shadcn/ui, Framer Motion, a11y                | Layouts, design system, animations        |
| `web3-expert`           | Solidity 0.8.33, Foundry, OpenZeppelin 5.4, Viem, Wagmi    | Smart contracts, DeFi, wallet integration |
| `typescript-expert`     | Advanced generics, conditional types, Zod v4, `satisfies`  | Complex types, runtime validation         |
| `testing-expert`        | Vitest, Playwright, Testing Library, MSW                   | Unit tests, E2E, mocking strategies       |
| `infrastructure-expert` | Docker, GitHub Actions, Turborepo, CI/CD                   | Dockerfiles, workflows, monorepo setup    |
| `code-reviewer`         | Evidence-based review with severity classification         | After finishing a feature or PR           |

## Skills

Reference documents loaded into context automatically when relevant. Each skill contains real, compilable code examples — no pseudocode.

| File                | Topics covered                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `react.md`          | React 19 hooks (`use`, `useOptimistic`), TanStack Query v5, TanStack Form v1, Zustand v5 |
| `nextjs.md`         | App Router, Server Components, Server Actions, `"use cache"`, `dynamicIO`                |
| `nodejs.md`         | Hono v4 RPC, middleware, error handling, streaming, WebSockets                           |
| `hono.md`           | Hono v4 RPC type inference, `zValidator`, `HTTPException`, client generation             |
| `drizzle.md`        | Schema patterns, relations, transactions, migrations, v0.38+ index array form            |
| `typescript.md`     | `satisfies`, `NoInfer`, `infer`, branded types, Zod v4                                   |
| `security.md`       | OWASP Top 10, Better Auth middleware, CSP nonces, RBAC                                   |
| `better-auth.md`    | Full config, Redis secondary storage, OAuth, session middleware                          |
| `redis.md`          | ioredis cache patterns, pipeline, pub/sub, session store                                 |
| `database.md`       | PostgreSQL patterns, indexes, query optimization, connection pooling                     |
| `testing.md`        | Vitest setup, Testing Library, MSW v2, Playwright fixtures                               |
| `ui.md`             | Tailwind v4 CSS-first config, shadcn/ui, accessibility primitives                        |
| `monorepo.md`       | pnpm workspaces, Turborepo pipelines, shared packages                                    |
| `observability.md`  | pino logging, OpenTelemetry, Web Vitals, error tracking                                  |
| `infrastructure.md` | Docker multi-stage, GitHub Actions, deployment patterns                                  |
| `solidity/`         | Foundry, OpenZeppelin 5.4, security patterns, fuzz testing                               |
| `web3/`             | Viem 2.45+, Wagmi 3.4+, wallet connection, transaction simulation                        |

## Commands

```bash
# React / Next.js
/component   # Server or client component — React 19, no forwardRef, cn()
/feature     # Full 5-layer scaffold: RSC + Client + Server Action + Query hook + Types
/hook        # Custom React hook with TanStack Query
/page        # Next.js App Router page (RSC or client)

# API
/route       # Hono v4 RPC route with zValidator + direct Drizzle calls

# Database
/schema      # Drizzle table — createId(), withTimezone, $onUpdate, array index form
/migration   # Drizzle migration file

# Testing
/test        # Vitest unit test
/e2e         # Playwright E2E test

# Git
/commit      # Conventional commit message
/pr          # Pull request description
/review      # Code review on current changes

# Web3
/contract    # Solidity contract — OZ v5, CEI pattern, custom errors, Foundry tests
/audit       # Smart contract security audit
/wagmi-hook  # Wagmi/Viem React hook
/gas         # Gas optimization analysis

# Infrastructure
/dockerfile       # Multi-stage Node.js Dockerfile
/github-action    # GitHub Actions workflow

# Tooling
/audit-package    # Dependency security audit
```

## Hooks

Hooks run automatically on every file edit and session event. No configuration required.

| Event                   | Hook                      | What it does                                                           |
| ----------------------- | ------------------------- | ---------------------------------------------------------------------- |
| Every `Write`/`Edit`    | Prettier                  | Auto-formats the file (`CLAUDE_FORMAT=0` to disable)                   |
| Every `Write`/`Edit`    | `lint-with-feedback.js`   | ESLint auto-fix, reports unfixable errors (`CLAUDE_LINT=0` to disable) |
| Every `Write`/`Edit`    | `typecheck.js`            | `tsc --noEmit --incremental` on `.ts`/`.tsx`                           |
| Every `Write`/`Edit`    | `analysis.js`             | Secrets scan (blocking) + missing tests + complexity (advisory)        |
| Every `Write`/`Edit`    | `auto-stage.js`           | `git add` — `git diff --staged` shows all of Claude's work             |
| Every `Read` on `.env*` | `block-env-read.js`       | Blocked — secrets stay out of context                                  |
| Every `Bash`            | `block-dangerous-git.js`  | Blocks `rm -rf ~`, `curl\|bash`, force push, fork bombs                |
| `UserPromptSubmit`      | `user-prompt-context.js`  | Injects branch + modified files + recent commits                       |
| `SessionStart`          | `session-context.js`      | Loads session notes + worklog + git state                              |
| `Stop`                  | `save-session-notes.js`   | Snapshots git state to `.claude/session-notes.md`                      |
| `Stop`                  | `track-tech-debt.js`      | Scans TODO/FIXME to `.claude/tech-debt.md`                             |
| `Stop`                  | `detect-duplicates.js`    | Full project scan for duplicate export names                           |
| `Stop`                  | `pre-pr-checklist.js`     | AI-generated PR checklist when ahead of remote                         |
| `PreCompact`            | `pre-compact-snapshot.js` | Saves full git state before context compression                        |

### Toggle env vars

Create `.claude/settings.local.json` (gitignored) in any project:

```json
{
  "env": {
    "CLAUDE_FORMAT": "0",
    "CLAUDE_LINT": "0",
    "CLAUDE_ANALYSIS": "0",
    "CLAUDE_RUN_TESTS": "1"
  }
}
```

| Variable           | Default | Effect when `"0"`                                           |
| ------------------ | ------- | ----------------------------------------------------------- |
| `CLAUDE_FORMAT`    | `"1"`   | Skip Prettier on every Write/Edit                           |
| `CLAUDE_LINT`      | `"1"`   | Skip ESLint on every Write/Edit                             |
| `CLAUDE_ANALYSIS`  | `"1"`   | Skip advisory checks (missing tests, complexity, dead code) |
| `CLAUDE_RUN_TESTS` | `"0"`   | Set `"1"` to run `pnpm test` at every session Stop          |

Secrets detection and `typecheck` always run regardless of toggles.

## Philosophy

This config is opinionated by design — one stack, one way, production-ready defaults. Every skill contains real code that compiles in a TypeScript strict project. Every agent knows when to push back. See [docs/philosophy.md](docs/philosophy.md) for full rationale on stack decisions.

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines on adding skills, agents, and commands.

## License

MIT
