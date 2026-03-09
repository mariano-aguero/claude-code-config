# Design: Top-Tier Config for Publishing

**Date:** 2026-03-09
**Approach:** Rewrite for publishing
**Goal:** A config so good it's worth open-sourcing as a template

---

## Context

This repository is a Claude Code configuration with specialized agents, skills, commands, and hooks for modern full-stack + Web3 development. It has been actively iterated through 11 rounds of fixes. The goal of this rewrite is to elevate it from a personal utility to a publishable reference configuration.

Current state:

- 10 agents (some shallow)
- 16 skill files (some outdated, missing key areas)
- 9 command groups (outputs not always production-ready)
- 16 hooks (solid — not in scope for changes)

---

## Guiding Principles

1. **Opinionated over configurable** — The config targets a specific stack (TypeScript + React 19 + Next.js 16+ + Hono + Drizzle + Web3). Each agent and skill speaks authoritatively about that stack.

2. **Production-ready by default** — Every command generates code you can commit. Skills carry patterns current to today's library versions. Agents prioritize security, performance, and strict types.

3. **Zero friction for the user, maximum guardrails for Claude** — Hooks protect without interrupting flow. Routing is automatic. Claude knows when to delegate and to whom.

4. **Easy to adopt, easy to contribute** — Clear structure, a README that explains every decision, and a `CONTRIBUTING.md` that makes adding a skill or agent a documented process.

---

## Repository Structure (Target)

```
.claude/
├── agents/          — 10 expert agents (deeper rewrite)
├── skills/          — 16 existing + 4 new (redis, hono, monorepo, observability)
├── commands/        — all commands produce production-ready output
├── hooks/           — unchanged (solid)
└── settings.json    — unchanged

docs/
├── CONTRIBUTING.md  — how to add agents, skills, commands
├── philosophy.md    — the 4 pillars with context
└── plans/           — design documents

README.md            — full rewrite for GitHub discovery
CLAUDE.md            — minor adjustments only
```

---

## Work Areas

### Area 1: Skills (highest impact on Claude output)

**Update existing:**

- `react.md` — React 19 Server/Client boundary, new hooks (useOptimistic, use(), useFormStatus), Suspense patterns
- `nextjs.md` — Next.js 16+ `"use cache"` directive, `cacheTag`/`cacheLife`/`revalidateTag`, `dynamicIO`, async params/searchParams
- `typescript.md` — Updated generics, branded types, Zod v4 patterns
- `drizzle.md` — Drizzle v0.38+ syntax, new relation API, batch queries
- `security.md` — Better Auth specific examples, CSRF, rate limiting patterns
- `nodejs.md` — Hono v4 patterns (currently mixed with Fastify)
- `better-auth.md` — Session management, OAuth flows, middleware patterns

**Create new:**

- `redis.md` — ioredis patterns, cache-aside, write-through, session storage, pub/sub, invalidation strategies, TTL design
- `hono.md` — RPC client/server, middleware chain, Zod validator, OpenAPI spec, error handling, streaming
- `monorepo.md` — pnpm workspaces, Turborepo pipeline config, shared packages (ui, config, types), build caching
- `observability.md` — OpenTelemetry setup, structured logging (pino), Web Vitals tracking, Sentry integration, feature flags

### Area 2: Agents (opinionatedness depth)

For each agent, the rewrite adds:

- **3-5 explicit behavioral rules** with DO/DON'T examples
- **"When to delegate"** section — explicit handoff criteria to other agents
- Stronger connection to the stack's specific libraries

Priority rewrites: `frontend-expert`, `backend-expert`, `ui-expert`
Also needs depth: `code-reviewer` (severity framework), `testing-expert` (coverage philosophy)

### Area 3: Commands (production-ready output)

Each command must generate code that:

1. Compiles without errors (TypeScript strict)
2. Follows patterns from the updated skills
3. Includes the right imports for current library versions

Priority commands:

- `/component` — React 19 patterns, proper prop types, accessibility
- `/feature` — Full feature scaffold with RSC + client split + query + form
- `/route` — Hono v4 RPC route with Zod validation and error handling
- `/schema` — Drizzle v0.38+ schema with relations and indexes
- `/contract` — Solidity 0.8.33 + OpenZeppelin 5.4 + Foundry tests

### Area 4: Docs (publishability)

**README.md rewrite:**

- Lead with "what you get" not "what this is"
- Visual table of agents and skills
- Quick install instructions
- Philosophy section linking to `docs/philosophy.md`
- Cheatsheet (keep current one, polish)

**docs/CONTRIBUTING.md:**

- How to add a new agent (template + checklist)
- How to add a new skill (structure conventions)
- How to add a new command (output quality bar)
- How to update a skill (versioning notes)

**docs/philosophy.md:**

- The 4 pillars with rationale
- What this config is NOT (exhaustive, multi-stack)
- Decision log for non-obvious choices (why Hono over Express, why Drizzle over Prisma)

---

## Success Criteria

- [ ] All skills reference library versions in use today (no outdated APIs)
- [ ] All agents have DO/DON'T examples and delegation criteria
- [ ] All priority commands generate compilable, production-ready code
- [ ] README clearly communicates value to someone who finds it on GitHub
- [ ] CONTRIBUTING.md enables a new contributor to add a skill without asking questions
- [ ] 4 new skills added: redis, hono, monorepo, observability

---

## Out of Scope

- Hooks (solid, not touching)
- Settings.json (works correctly)
- Modular/layered config system (over-engineering for current goals)
- Supporting multiple stacks (opinionated = single stack)
