# Claude Code Configuration

Personal Claude Code configuration with specialized agents, skills, commands, and automated hooks for modern full-stack and Web3 development.

## Overview

This configuration extends Claude Code with:

- **Agents** - Expert personas with specialized knowledge and behavioral traits
- **Skills** - Technical reference materials with patterns and code examples
- **Commands** - Slash commands for common development tasks
- **Hooks** - Automated quality checks and safety guards that run during development

## Cheatsheet

Quick reference for day-to-day usage.

### Slash commands

```bash
# Code generation
/component    # React component (with hooks, types, tests)
/hook         # Custom React hook
/page         # Next.js page (RSC or client)
/feature      # Full feature scaffold (component + hook + types)
/route        # API endpoint (Hono/Next.js)

# Database
/schema       # Drizzle schema table
/migration    # Database migration file

# Testing
/test         # Unit tests (Vitest)
/e2e          # Playwright E2E test

# Git
/commit       # Conventional commit message
/pr           # Pull request description
/review       # Code review on current changes

# Web3
/contract     # Solidity contract (Foundry + OpenZeppelin)
/audit        # Smart contract security audit
/wagmi-hook   # Wagmi/Viem React hook
/gas          # Gas optimization analysis

# Infrastructure
/dockerfile   # Dockerfile for Node.js app
/github-action # GitHub Actions workflow

# Tooling
/audit-package # Dependency security audit
```

### Work log

```bash
/log <message>           # Add manual entry to today's log
/log [BLOCKER] <message> # Flag a blocker
/log [HOY] <message>     # Flag a focus item
/log-auto                # Auto-summarize session and append to log
/daily                   # Generate standup report from log + git
```

Run `/log-auto` before closing a long session. The `Stop` hook also appends an `[AUTO-STOP]` entry automatically.

### Agents

Agents activate automatically based on task type. You can also invoke them explicitly:

```
Use the frontend-expert agent to build a paginated table component.
Use the security-expert agent to review this auth flow.
Use the code-reviewer agent after I finish this feature.
```

| Task type | Agent invoked |
|-----------|--------------|
| React, Next.js, TanStack | `frontend-expert` |
| API, DB queries, server logic | `backend-expert` |
| SQL schema, Drizzle, migrations | `database-expert` |
| Auth, OWASP, secrets | `security-expert` |
| Tailwind, shadcn/ui, animations | `ui-expert` |
| Solidity, DeFi, Wagmi | `web3-expert` |
| Vitest, Playwright, mocking | `testing-expert` |
| Advanced TypeScript, Zod | `typescript-expert` |
| Docker, CI/CD, GitHub Actions | `infrastructure-expert` |
| PR / feature review | `code-reviewer` |

### Hooks — what runs automatically

| Event | What happens |
|-------|-------------|
| Every `Write` / `Edit` | Prettier → ESLint → tsc → secrets scan → `git add` |
| Every `Bash` command | Blocks dangerous commands (rm -rf ~, force push, etc.) |
| Every `Read` on `.env*` | Blocked — secrets stay out of context |
| Every prompt submitted | Injects branch + modified files + recent commits |
| Session start | Loads session notes + worklog + git state |
| Context compaction | Saves full git snapshot before compressing |
| Session end | Saves snapshot, scans tech debt, generates PR checklist, runs tests |

### Inspect Claude's work

```bash
git diff --staged          # everything Claude wrote/edited this session
git restore --staged <f>   # unstage a specific file
git reset HEAD             # unstage everything
cat .claude/tech-debt.md   # accumulated TODOs/FIXMEs
cat .claude/session-notes.md # last session context
```

### Disable formatting/linting per project

Create `.claude/settings.local.json` (gitignored):

```json
{
  "env": {
    "CLAUDE_FORMAT": "0",
    "CLAUDE_LINT": "0"
  }
}
```

---

## Directory Structure

```
.claude/
├── agents/                      # Expert personas
│   ├── frontend-expert.md       # React 19, Next.js 15+, TanStack
│   ├── backend-expert.md        # Node.js, Hono, Drizzle, PostgreSQL
│   ├── infrastructure-expert.md # Docker, CI/CD, GitHub Actions
│   ├── ui-expert.md             # Tailwind v4, shadcn/ui, Framer Motion
│   ├── web3-expert.md           # Solidity, Foundry, Viem, Wagmi
│   ├── typescript-expert.md     # Advanced types, generics, Zod
│   ├── testing-expert.md        # Vitest, Playwright, mocking
│   ├── database-expert.md       # PostgreSQL, Drizzle, migrations
│   ├── security-expert.md       # OWASP, auth, headers, secrets
│   └── code-reviewer.md         # Evidence-based reviews, severity classification
│
├── hooks/                       # Automated quality & safety scripts
│   ├── package.json             # Forces CommonJS (required for Node 23+)
│   │
│   ├── block-env-read.js        # PreToolUse: blocks reading .env files
│   ├── block-dangerous-git.js   # PreToolUse: blocks rm -rf, curl|sh, force push, fork bombs
│   │
│   ├── lint-with-feedback.js    # PostToolUse: ESLint auto-fix + error feedback to Claude
│   ├── typecheck.js             # PostToolUse: tsc --noEmit (incremental) on .ts/.tsx
│   ├── analysis.js              # PostToolUse: detect-secrets + missing-tests + complexity
│   ├── auto-stage.js            # PostToolUse: git add after every Write/Edit
│   ├── detect-dead-code.js      # PostToolUse: detects unused named exports (opt-in, not wired by default)
│   │
│   ├── user-prompt-context.js   # UserPromptSubmit: injects git context per prompt
│   ├── notify.js                # Notification: native macOS alert when Claude needs attention
│   ├── session-context.js       # SessionStart: loads notes + worklog + git state
│   ├── save-session-notes.js    # Stop: saves git snapshot + worklog to session-notes.md
│   ├── pre-pr-checklist.js      # Stop: AI-generated PR checklist when ahead of remote
│   ├── track-tech-debt.js       # Stop: logs TODO/FIXME to tech-debt.md
│   ├── detect-duplicates.js     # Stop: full project scan for duplicate exports
│   └── pre-compact-snapshot.js  # PreCompact: saves state before context compression
│
├── skills/                      # Technical knowledge base
│   ├── javascript.md            # ES6+, async/await, functional patterns
│   ├── typescript.md            # Advanced types, generics, infer
│   ├── nodejs.md                # Hono, middleware, error handling
│   ├── react.md                 # React patterns, TanStack Query/Form
│   ├── nextjs.md                # App Router, Server Components
│   ├── ui.md                    # Tailwind, accessibility, forms
│   ├── testing.md               # Vitest, Playwright, MSW
│   ├── database.md              # Drizzle ORM, PostgreSQL
│   ├── security.md              # OWASP, auth, headers, secrets
│   ├── infrastructure.md        # Docker, deployment
│   ├── hooks.md                 # Claude Code hook patterns
│   ├── tooling.md               # Build tools, package management
│   ├── solidity/                # Smart contract development
│   │   ├── SKILL.md
│   │   └── references/
│   └── web3/                    # Blockchain frontend
│       ├── SKILL.md
│       └── references/
│
├── commands/                    # Slash commands
│   ├── react/                   # /component, /hook, /page, /feature
│   ├── next/                    # /route
│   ├── git/                     # /commit, /pr, /review
│   ├── testing/                 # /test, /e2e
│   ├── api/                     # /route (API endpoints)
│   ├── db/                      # /schema, /migration
│   ├── web3/                    # /contract, /audit, /wagmi-hook, /gas
│   ├── infra/                   # /dockerfile, /github-action
│   └── tooling/                 # /audit-package
│
└── memory.md                    # Persistent cross-session memory (committed, user-editable)
```

## Agents

Expert personas that define behavior, approach, and specialized knowledge.

| Agent | Expertise | Model |
|-------|-----------|-------|
| `frontend-expert` | React 19, Next.js 15+, TanStack ecosystem | sonnet |
| `backend-expert` | Node.js, Hono/Fastify, Drizzle ORM, PostgreSQL | sonnet |
| `infrastructure-expert` | Docker, GitHub Actions, Kubernetes, Terraform | sonnet |
| `ui-expert` | Tailwind CSS v4, shadcn/ui, Framer Motion, a11y | sonnet |
| `web3-expert` | Solidity, Foundry, Viem, Wagmi, DeFi, NFTs | **opus** |
| `typescript-expert` | Advanced types, generics, Zod, type-safe patterns | sonnet |
| `testing-expert` | Vitest, Playwright, Testing Library, MSW, mocking | sonnet |
| `database-expert` | PostgreSQL, Drizzle ORM, migrations, query optimization | sonnet |
| `security-expert` | OWASP, authentication, authorization, security headers | **opus** |
| `code-reviewer` | Evidence-based reviews, severity classification, stack-aware | **opus** |

> Opus is used for security, web3, and code review — tasks where deeper reasoning has high impact.

## Hooks

Automated scripts configured via `.claude/settings.json`.

> **Node.js 23+**: `.claude/hooks/package.json` sets `"type": "commonjs"` to prevent ESM issues.

### Security — PreToolUse (block before execution)

| Hook | Trigger | Blocks |
|------|---------|--------|
| `block-env-read.js` | `Read` on `.env*` files | Prevents exposing secrets |
| `block-dangerous-git.js` | `Bash` | `rm -rf ~`, `curl\|bash`, fork bombs, force push, `chmod -R 777`, `mkfs` |

### Code Quality — PostToolUse (runs on every Write/Edit)

| Hook | What it does |
|------|-------------|
| Prettier | Auto-formats the file (`CLAUDE_FORMAT=0` to disable) |
| `lint-with-feedback.js` | ESLint auto-fix, reports unfixable errors to Claude (`CLAUDE_LINT=0` to disable) |
| `typecheck.js` | `tsc --noEmit --incremental` on `.ts`/`.tsx` files |
| `analysis.js` | Secrets detection (blocking) + missing tests + complexity (advisory) |
| `auto-stage.js` | `git add` every edited file — `git diff --staged` shows all of Claude's work |

`detect-dead-code.js` is also available but not wired by default — add it to `settings.json` PostToolUse to enable.

### Session — Stop (once per session, not per file)

| Hook | What it does |
|------|-------------|
| `save-session-notes.js` | Snapshots git state + last 5 worklog entries to `.claude/session-notes.md` |
| `track-tech-debt.js` | Scans TODO/FIXME/HACK → `.claude/tech-debt.md` |
| `detect-duplicates.js` | Full project scan for duplicate export names |
| `pre-pr-checklist.js` | AI-generated PR checklist when commits are ahead of remote |
| `pnpm test` | Runs test suite (silently skips if not configured) |
| `/log-auto` reminder | Prints a reminder to run `/log-auto` before closing the session |

### Context Injection

| Hook | Event | Injects |
|------|-------|---------|
| `session-context.js` | `SessionStart` | Session notes + worklog + git state |
| `user-prompt-context.js` | `UserPromptSubmit` | Branch + modified files + recent commits |
| `notify.js` | `Notification` | Native macOS alert (osascript) when Claude needs attention |
| `pre-compact-snapshot.js` | `PreCompact` | Full git state before context compression |

### Hook Toggles

Disable formatting or linting per project via `.claude/settings.local.json` (not committed):

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

`detect-secrets` and `typecheck` always run regardless.

### Auto-stage workflow

Every file Claude writes or edits is automatically staged:

```bash
git diff --staged          # see everything Claude changed
git restore --staged <f>   # unstage a specific file if needed
git reset HEAD             # unstage everything
```

## Work Log System

Persistent work log for daily standups, stored at `~/.daily-worklog/current.md`.

| Command | What it does |
|---------|-------------|
| `/log <message>` | Manually log a work entry (supports `[BLOCKER]` and `[HOY]` prefixes) |
| `/log-auto` | Auto-generates a summary of the current session and appends it |
| `/daily` | Generates a daily standup report from git history, PRs, and the work log |

The `save-session-notes.js` Stop hook also appends an `[AUTO-STOP]` entry automatically at the end of every session.

## Skills

| Skill | Content |
|-------|---------|
| `javascript.md` | ES6+, destructuring, async/await, functional patterns |
| `typescript.md` | Generics, conditional types, infer, branded types |
| `nodejs.md` | Hono/Fastify, middleware, error handling, auth, caching |
| `react.md` | Components, hooks, TanStack Query v5, TanStack Form v1, Zustand |
| `nextjs.md` | App Router, Server Components, Server Actions, caching |
| `ui.md` | Tailwind v4, shadcn/ui, forms, accessibility |
| `testing.md` | Vitest, Playwright, Testing Library, MSW, mocking |
| `database.md` | Drizzle ORM, PostgreSQL, migrations, queries |
| `security.md` | OWASP Top 10, JWT, RBAC, headers, input validation |
| `hooks.md` | Claude Code hook patterns and event reference |
| `solidity/` | Foundry, OpenZeppelin 5.4, security patterns, testing |
| `web3/` | Viem 2.45+, Wagmi 3.4+, wallet connection, transactions |

## Commands

| Category | Commands |
|----------|---------|
| React | `/component`, `/hook`, `/page`, `/feature` |
| Git | `/commit`, `/pr`, `/review` |
| Web3 | `/contract`, `/audit`, `/wagmi-hook`, `/gas` |
| Database | `/schema`, `/migration` |
| API | `/route` |
| Infrastructure | `/dockerfile`, `/github-action` |
| Testing | `/test`, `/e2e` |
| Tooling | `/audit-package` |

## Tech Stack

| Domain | Stack |
|--------|-------|
| Frontend | TypeScript 5.x, React 19, Next.js 15+, TanStack Query v5 + Form v1, Tailwind v4.1, Zustand v5 |
| Backend | Node.js 20+, Hono/Fastify, Drizzle ORM, PostgreSQL 16+, Redis |
| Web3 | Solidity 0.8.33, Foundry, OpenZeppelin 5.4, Viem 2.45+, Wagmi 3.4+ |
| Testing | Vitest, Testing Library, Playwright, MSW |

## Key Principles

- **Server Components by default** — `"use client"` only when necessary
- **TanStack for client data** — Query for server state, Form for forms (never React Hook Form); `fetch()` in Server Components is fine
- **TypeScript strict** — No `any`, proper generics, Zod at boundaries
- **Drizzle for database** — Type-safe queries, proper migrations
- **Web3 security** — CEI pattern, reentrancy guards, simulate before send

## Generated Files (gitignored)

```
.claude/session-notes.md        # Persistent session context (git state + worklog snapshot)
.claude/tech-debt.md            # Accumulated TODO/FIXME log
.claude/pr-checklist.md         # AI-generated PR checklist
.claude/pre-compact-snapshot.md # Git state before last context compaction
```

## License

MIT
