# Claude Code Configuration

Personal Claude Code configuration with specialized agents, skills, and commands for modern full-stack and Web3 development.

## Overview

This configuration extends Claude Code with:

- **Agents** - Expert personas with specialized knowledge and behavioral traits
- **Skills** - Technical reference materials with patterns and code examples
- **Commands** - Slash commands for common development tasks

## Directory Structure

```
.claude/
├── agents/                    # Expert personas
│   ├── frontend-expert.md     # React 19, Next.js 16, TanStack
│   ├── backend-expert.md      # Node.js, Hono, Drizzle, PostgreSQL
│   ├── infrastructure-expert.md # Docker, CI/CD, GitHub Actions
│   ├── ui-expert.md           # Tailwind v4, shadcn/ui, Framer Motion
│   ├── web3-expert.md         # Solidity, Foundry, Viem, Wagmi
│   ├── typescript-expert.md   # Advanced types, generics, Zod
│   ├── testing-expert.md      # Vitest, Playwright, mocking
│   ├── database-expert.md     # PostgreSQL, Drizzle, migrations
│   └── security-expert.md     # OWASP, auth, headers, secrets
│
├── skills/                    # Technical knowledge base
│   ├── javascript.md          # ES6+, async/await, functional patterns
│   ├── typescript.md          # Advanced types, generics, infer
│   ├── nodejs.md              # Hono, middleware, error handling
│   ├── react.md               # React patterns, TanStack Query/Form
│   ├── nextjs.md              # App Router, Server Components
│   ├── ui.md                  # Tailwind, accessibility, forms
│   ├── testing.md             # Vitest, Playwright, MSW
│   ├── database.md            # Drizzle ORM, PostgreSQL
│   ├── security.md            # OWASP, auth, headers, secrets
│   ├── infrastructure.md      # Docker, deployment
│   ├── tooling.md             # Build tools, package management
│   ├── solidity/              # Smart contract development
│   │   ├── SKILL.md
│   │   └── references/
│   └── web3/                  # Blockchain frontend
│       ├── SKILL.md
│       └── references/
│
└── commands/                  # Slash commands
    ├── react/                 # /component, /hook, /page, /feature
    ├── next/                  # /route
    ├── git/                   # /commit, /pr, /review
    ├── testing/               # /test, /e2e
    ├── api/                   # /route (API endpoints)
    ├── db/                    # /schema, /migration
    ├── web3/                  # /contract, /audit, /wagmi-hook
    ├── infra/                 # /dockerfile, /github-action
    └── tooling/               # /audit-package
```

## Agents

Expert personas that define behavior, approach, and specialized knowledge.

| Agent | Expertise | Model |
|-------|-----------|-------|
| `frontend-expert` | React 19, Next.js 16+, TanStack ecosystem | sonnet |
| `backend-expert` | Node.js, Hono/Fastify, Drizzle/Prisma, PostgreSQL | sonnet |
| `infrastructure-expert` | Docker, GitHub Actions, Kubernetes, Terraform | sonnet |
| `ui-expert` | Tailwind CSS v4, shadcn/ui, Framer Motion, a11y | sonnet |
| `web3-expert` | Solidity, Foundry, Viem, Wagmi, DeFi, NFTs | sonnet |
| `typescript-expert` | Advanced types, generics, Zod, type-safe patterns | sonnet |
| `testing-expert` | Vitest, Playwright, Testing Library, MSW, mocking | sonnet |
| `database-expert` | PostgreSQL, Drizzle ORM, migrations, query optimization | sonnet |
| `security-expert` | OWASP, authentication, authorization, security headers | sonnet |

### Agent Format

```yaml
---
name: agent-name
description: Brief description for triggering
model: sonnet | opus
---

# Agent Name

## Capabilities
- Organized by domain

## Behavioral Traits
- Guiding principles

## Response Approach
- Step-by-step methodology

## Example Interactions
- Representative use cases
```

## Skills

Technical reference materials with patterns, code examples, and best practices.

| Skill | Content |
|-------|---------|
| `javascript.md` | ES6+, destructuring, async/await, array methods, functional patterns |
| `typescript.md` | Generics, conditional types, infer, branded types, builder pattern |
| `nodejs.md` | Hono/Fastify setup, middleware, error handling, auth, caching |
| `react.md` | Components, hooks, TanStack Query v5, TanStack Form v1, Zustand |
| `nextjs.md` | App Router, Server Components, Server Actions, caching |
| `ui.md` | Tailwind v4, shadcn/ui, forms, accessibility |
| `testing.md` | Vitest, Playwright, Testing Library, MSW, mocking patterns |
| `database.md` | Drizzle ORM, PostgreSQL, migrations, queries, repositories |
| `security.md` | OWASP Top 10, JWT auth, RBAC, headers, input validation, secrets |
| `solidity/` | Foundry, OpenZeppelin 5.4, security patterns, testing |
| `web3/` | Viem 2.45+, Wagmi 3.4+, wallet connection, transactions |

### Progressive Disclosure

Large skills use a folder structure for better organization:

```
solidity/
├── SKILL.md              # Main skill file (summary + links)
└── references/
    ├── foundry.md        # Detailed Foundry patterns
    ├── security.md       # Security patterns
    ├── testing.md        # Testing strategies
    └── ...
```

## Commands

Slash commands for common development tasks. Invoke with `/<command>`.

### React
| Command | Description |
|---------|-------------|
| `/component` | Create a React component |
| `/hook` | Create a custom hook |
| `/page` | Create a Next.js page |
| `/feature` | Scaffold a feature module |

### Git
| Command | Description |
|---------|-------------|
| `/commit` | Create a conventional commit |
| `/pr` | Create a pull request |
| `/review` | Review code changes |

### Web3
| Command | Description |
|---------|-------------|
| `/contract` | Create a Solidity contract |
| `/audit` | Security audit a contract |
| `/wagmi-hook` | Create a Wagmi hook |
| `/gas` | Gas optimization analysis |

### Database
| Command | Description |
|---------|-------------|
| `/schema` | Create a Drizzle schema |
| `/migration` | Guide for database migrations |

### API
| Command | Description |
|---------|-------------|
| `/route` | Create an API route (Hono) |

### Infrastructure
| Command | Description |
|---------|-------------|
| `/dockerfile` | Create a production Dockerfile |
| `/github-action` | Create a GitHub Actions workflow |

## Tech Stack

### Frontend
| Technology | Version |
|------------|---------|
| TypeScript | 5.x |
| React | 19.x |
| Next.js | 16+ |
| TanStack Query | v5 |
| TanStack Form | v1 |
| Tailwind CSS | v4.1 |
| Zustand | v5 |

### Backend
| Technology | Version |
|------------|---------|
| Node.js | 20+ |
| Hono / Fastify | Latest |
| Drizzle ORM | Latest |
| PostgreSQL | 16+ |
| Redis | Latest |

### Web3
| Technology | Version |
|------------|---------|
| Solidity | 0.8.33 |
| Foundry | Latest |
| OpenZeppelin | 5.4 |
| Viem | 2.45+ |
| Wagmi | 3.4+ |

## Usage

### With Agents

Agents are automatically triggered based on the task context. The `description` field in each agent helps Claude determine when to apply that expertise.

### With Skills

Skills provide reference knowledge that Claude uses when working on related tasks. They're loaded based on the YAML frontmatter `description`.

### With Commands

Invoke commands directly:

```bash
# In Claude Code
/component Button
/commit
/dockerfile
```

## Key Principles

### Frontend
- **Server Components by default** - Use `"use client"` only when needed
- **TanStack for data** - Query for server state, Form for forms (never React Hook Form)
- **TypeScript strict** - No `any`, proper generics

### Backend
- **Zod validation** - Validate all external input
- **Repository pattern** - Abstract data access
- **Custom errors** - Proper HTTP codes, structured responses

### Web3
- **Security first** - CEI pattern, reentrancy guards, timelocks
- **Test thoroughly** - Unit + fuzz + invariant tests
- **Simulate first** - Always simulate before sending transactions

### UI
- **Accessibility first** - ARIA, keyboard navigation, screen readers
- **Mobile first** - Responsive from smallest breakpoint
- **Reduced motion** - Respect user preferences

## Hooks

Automated tasks configured in `.claude/settings.json`:

| Hook | Trigger | Action |
|------|---------|--------|
| `PostToolUse` | After Write/Edit | Run Prettier + ESLint |
| `Stop` | Task complete | Run tests |

See `skills/hooks.md` for more patterns and configuration options.

## License

MIT
