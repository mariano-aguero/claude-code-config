# Philosophy

## The 4 Pillars

### Opinionated

Every layer of the stack has one answer. Drizzle, not Prisma. TanStack Form, not React Hook Form. Hono, not Express. Better Auth, not NextAuth. Tailwind v4, not v3. When there is one answer, Claude can generate production-grade code immediately without asking clarifying questions or hedging with alternatives. Opinions are chosen based on technical merit for the TypeScript + Node.js + React 19 use case specifically.

### Production-ready

Every code example in every skill compiles in a TypeScript strict project with real imports and real API calls. There is no pseudocode, no `// implement this`, no placeholder logic. The bar is: could a developer paste this into a production project and have it work? Skills that fail this bar are not merged.

### Zero friction

Hooks run automatically. Agents route automatically. Skills load automatically. The developer writes the prompt; Claude handles formatting, linting, type-checking, secrets scanning, and git staging without being asked. Friction accumulates in small ways — a missed lint error, an unstaged file, a forgotten type check — and this config eliminates all of it.

### DX

Claude should work the way a senior engineer on the team would work: direct, no filler, no alternatives unless asked, no restating the question. Agents have behavioral constraints that enforce this. The configuration itself is a form of DX — every agent, skill, and command exists to make Claude more useful in the first response, not the fourth.

## Stack Decisions

### Hono over Express

Hono v4 has native TypeScript RPC support — routes are typed end-to-end from server to client via `hono/client`. It runs on Node.js, Deno, Bun, and edge runtimes without modification. `zValidator` integrates Zod validation directly into the route middleware chain. Express has none of this and requires significant boilerplate to achieve type safety. For a TypeScript-first stack, Hono is the correct choice.

### Drizzle over Prisma

Drizzle sits one layer above SQL — you write queries that are recognizably SQL, with TypeScript types inferred from the schema. There is no code generation step, no `prisma generate`, no build artifact to commit. The schema is plain TypeScript that compiles with `tsc`. Migrations are SQL files you control. Prisma's abstraction makes it faster to start and harder to optimize. For production PostgreSQL workloads where query control matters, Drizzle is the correct choice.

### TanStack Query over SWR

TanStack Query v5 has: query key factories, `initialData` for SSR hydration, `useInfiniteQuery` with cursor pagination, `useMutation` with optimistic updates, `QueryClient` for server-side prefetching with `HydrationBoundary`, and first-class devtools. SWR covers the basic case and stops there. For applications with complex server state requirements, TanStack Query is the correct choice.

### Better Auth over NextAuth

Better Auth is framework-agnostic TypeScript — it works with Hono, Fastify, and Next.js equally. The Drizzle adapter integrates directly with the project's existing schema. Session management, OAuth, email/password, and 2FA are all first-class. It exposes a low-level API that allows full control over session storage, including Redis secondary storage for performance. NextAuth v5 has improved but still assumes Next.js and has less control over the data layer. For a Hono + Drizzle stack, Better Auth is the correct choice.

### Tailwind v4 over v3

Tailwind v4 is CSS-first — configuration lives in a `.css` file as CSS custom properties, not a `tailwind.config.js`. This eliminates the build step overhead and aligns with how browsers natively handle design tokens. The `@theme` block replaces the `theme.extend` object. Performance is significantly better due to the Oxide engine. v3 patterns (arbitrary values in `[]`, JS config) still work but are legacy. For new projects, Tailwind v4 is the correct choice.

## What This Config Is Not

**Not exhaustive.** There are valid tools, libraries, and patterns not covered here. The absence of something is not a statement against it — it means it falls outside the primary stack. Adding coverage for every possible tool would dilute the quality of what is here.

**Not multi-stack.** This config does not cover Vue, Angular, Svelte, Python, Go, or any other language or framework. It is TypeScript + React + Node.js + PostgreSQL, end to end. Agents that try to be all things to all stacks end up being mediocre for all of them.

**Not beginner-focused.** The code examples assume TypeScript proficiency, familiarity with React patterns, and comfort reading Drizzle queries. There are no step-by-step explanations of async/await or what a React hook is. The target user is a senior engineer who wants faster scaffolding and better defaults, not a tutorial.
