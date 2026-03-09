# Top-Tier Config Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite this Claude Code config into a publishable, opinionated reference for TypeScript + React 19 + Next.js 16+ + Hono + Drizzle + Web3 development.

**Architecture:** Four work areas executed in dependency order: Skills first (highest Claude output impact), then Agents (deepen opinionatedness), then Commands (production-ready output), then Docs (publishability). Hooks and settings.json are out of scope.

**Tech Stack:** Claude Code agents/skills/commands (Markdown), Node.js hooks (JS), React 19, Next.js 16+, Hono v4, Drizzle v0.38+, Better Auth, Redis/ioredis, Turborepo, OpenTelemetry

---

## Wave 1: Skills — Update Existing (7 files)

### Task 1: Update `react.md`

**Files:**
- Modify: `.claude/skills/react.md`

**Step 1: Read current file**
```bash
cat .claude/skills/react.md
```

**Step 2: Update the file**

Changes needed:
- Add "React 19 APIs" section with `use()`, `useOptimistic`, `useFormStatus`, `useActionState`
- Remove `forwardRef` — replace with `ref` as a prop (React 19)
- Add Server Actions as the mutation primitive (replaces useCallback + fetch)
- Update Suspense section: `use(promise)` inside components
- Add `<Form>` component for progressive enhancement
- Ensure `"use client"` boundary examples are correct

Key patterns:
```tsx
// use() for async resources
const data = use(fetchPromise); // inside Suspense boundary

// useOptimistic
const [optimisticItems, addOptimistic] = useOptimistic(items);

// useActionState (replaces useFormState from react-dom)
const [state, formAction, isPending] = useActionState(action, initialState);

// useFormStatus — must be inside a <form>
const { pending, data, method, action } = useFormStatus();

// ref as prop (no forwardRef needed in React 19)
function Input({ ref, ...props }: { ref: React.Ref<HTMLInputElement> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input ref={ref} {...props} />;
}
```

**Step 3: Verify**
```bash
grep -n "forwardRef\|useFormState" .claude/skills/react.md
```
Expected: zero matches.

**Step 4: Commit**
```bash
git add .claude/skills/react.md
git commit -m "feat(skills): update react.md to React 19 API surface"
```

---

### Task 2: Update `nextjs.md`

**Files:**
- Modify: `.claude/skills/nextjs.md`

**Context:** Next.js 15+/16+ introduced `"use cache"` directive, async `params`/`searchParams`, `cacheTag`/`cacheLife`/`revalidateTag`, `dynamicIO`, and `after()`.

**Step 1: Read current file**
```bash
cat .claude/skills/nextjs.md
```

**Step 2: Update the file**

Changes needed:
- Update all page/layout examples to `Promise<{ params: {...} }>` (async params)
- Update `cookies()`, `headers()` to `await cookies()`, `await headers()`
- Add `"use cache"` directive section with presets (seconds, minutes, hours, days, weeks, max)
- Add `dynamicIO` config option
- Add `after()` API for post-response analytics/logging

Key patterns:
```tsx
// Async params (Next.js 15+)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// "use cache" directive
"use cache";
import { cacheTag, cacheLife } from "next/cache";

export async function getUser(id: string) {
  cacheTag(`user-${id}`);
  cacheLife("hours");
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

// after() — runs after response is sent
import { after } from "next/server";
after(() => analytics.track("page-view"));
```

**Step 3: Verify**
```bash
grep -n "await params\|await cookies\|use cache" .claude/skills/nextjs.md | wc -l
```
Expected: â¥3 lines.

**Step 4: Commit**
```bash
git add .claude/skills/nextjs.md
git commit -m "feat(skills): update nextjs.md to Next.js 15+/16+ patterns"
```

---

### Task 3: Update `drizzle.md`

**Files:**
- Modify: `.claude/skills/drizzle.md`

**Step 1: Read current file**
```bash
cat .claude/skills/drizzle.md
```

**Step 2: Update the file**

Changes needed:
- Add `$with` CTE pattern
- Add `onConflictDoUpdate` for upserts
- Update drizzle-kit commands: `drizzle-kit generate` (not `generate:pg`)
- Verify `withTimezone: true` on timestamps and `$onUpdate` for updatedAt
- Verify index array form: `index('name').on(t.col)`

Key patterns:
```typescript
// CTE with $with
const sq = db.$with('active_users').as(
  db.select().from(users).where(eq(users.active, true))
);
const result = await db.with(sq).select().from(sq);

// Upsert
await db.insert(users)
  .values(data)
  .onConflictDoUpdate({
    target: users.email,
    set: { updatedAt: new Date() },
  });

// drizzle-kit v0.30+ commands
// drizzle-kit generate   (not generate:pg)
// drizzle-kit migrate
// drizzle-kit studio
```

**Step 3: Verify**
```bash
grep -n "generate:pg\|generate:mysql" .claude/skills/drizzle.md
```
Expected: zero matches.

**Step 4: Commit**
```bash
git add .claude/skills/drizzle.md
git commit -m "feat(skills): update drizzle.md to v0.38+ patterns"
```

---

### Task 4: Update `nodejs.md` (Hono focus)

**Files:**
- Modify: `.claude/skills/nodejs.md`

**Context:** Refocus on Hono v4 as the primary framework. Add RPC, `zValidator`, `HTTPException`, middleware context, and `testClient`.

**Step 1: Read current file**
```bash
cat .claude/skills/nodejs.md
```

**Step 2: Update the file**

Key Hono v4 patterns:
```typescript
// Typed RPC route group
const usersRoute = new Hono()
  .get("/", async (c) => c.json({ users: await db.query.users.findMany() }))
  .post("/", zValidator("json", createUserSchema), async (c) => {
    const data = c.req.valid("json");
    const [user] = await db.insert(users).values(data).returning();
    return c.json(user, 201);
  });

export const app = new Hono().route("/users", usersRoute);
export type AppType = typeof app;

// RPC Client
import { hc } from "hono/client";
const client = hc<AppType>(process.env.API_URL!);
const res = await client.users.$get();
const { users } = await res.json();

// HTTPException for expected errors
throw new HTTPException(404, { message: "User not found" });

// Middleware with typed context
const authMiddleware = createMiddleware<{ Variables: { user: User } }>(
  async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) throw new HTTPException(401);
    c.set("user", session.user);
    await next();
  }
);

// Test
import { testClient } from "hono/testing";
const client = testClient(app);
const res = await client.users.$get();
expect(res.status).toBe(200);
```

**Step 3: Verify**
```bash
grep -n "testClient\|hc<\|HTTPException\|zValidator" .claude/skills/nodejs.md | wc -l
```
Expected: â¥6 lines.

**Step 4: Commit**
```bash
git add .claude/skills/nodejs.md
git commit -m "feat(skills): refocus nodejs.md on Hono v4 RPC patterns"
```

---

### Task 5: Update `typescript.md`

**Files:**
- Modify: `.claude/skills/typescript.md`

**Step 1: Read current file**
```bash
cat .claude/skills/typescript.md
```

**Step 2: Update the file**

Changes: `satisfies` operator, `const` type parameters, `NoInfer<T>`, Zod v4 patterns.

```typescript
// satisfies — validates without widening
const config = {
  port: 3000,
  host: "localhost",
} satisfies Record<string, string | number>;
config.port; // number, not string | number

// const type parameters
function identity<const T>(val: T): T { return val; }
const result = identity({ a: 1 }); // { readonly a: 1 }, not { a: number }

// NoInfer<T>
function createStore<T>(initial: T, transform: (val: NoInfer<T>) => T): T;

// Zod v4
import { z } from "zod/v4";
const EmailSchema = z.email(); // ZodEmail, stricter than z.string().email()
const schema = z.object({ email: z.email() }).meta({ title: "User" });
const jsonSchema = z.toJSONSchema(schema);
```

**Step 3: Verify**
```bash
grep -n "satisfies\|NoInfer\|const T" .claude/skills/typescript.md | wc -l
```
Expected: â¥3 lines.

**Step 4: Commit**
```bash
git add .claude/skills/typescript.md
git commit -m "feat(skills): update typescript.md with satisfies, NoInfer, Zod v4"
```

---

### Task 6: Update `security.md`

**Files:**
- Modify: `.claude/skills/security.md`

**Step 1: Read current file**
```bash
cat .claude/skills/security.md
```

**Step 2: Update the file**

Add: Better Auth Hono middleware, CSP nonce generation for Next.js middleware, `better-auth/plugins/rate-limit`.

```typescript
// Better Auth + Hono session middleware
import { auth } from "@/lib/auth";
const requireAuth = createMiddleware<{ Variables: { user: User } }>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) throw new HTTPException(401, { message: "Unauthorized" });
  c.set("user", session.user);
  await next();
});

// CSP nonce in Next.js middleware.ts
const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
const cspHeader = [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
  `style-src 'self' 'nonce-${nonce}'`,
  "object-src 'none'",
].join("; ");
response.headers.set("Content-Security-Policy", cspHeader);
response.headers.set("x-nonce", nonce);
```

Remove: `X-Frame-Options` as primary header — use `frame-ancestors` in CSP instead.

**Step 3: Commit**
```bash
git add .claude/skills/security.md
git commit -m "feat(skills): update security.md with Better Auth middleware and CSP nonces"
```

---

### Task 7: Update `better-auth.md`

**Files:**
- Modify: `.claude/skills/better-auth.md`

**Step 1: Read current file**
```bash
cat .claude/skills/better-auth.md
```

**Step 2: Update the file**

Add: Redis `secondaryStorage`, `trustedOrigins`, full Drizzle adapter config, `onAPIError` hook.

```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: { clientId: env.GITHUB_ID, clientSecret: env.GITHUB_SECRET },
  },
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  secondaryStorage: {
    get: (key) => redis.get(key),
    set: (key, value, ttl) => redis.setex(key, ttl ?? 3600, value),
    delete: (key) => redis.del(key),
  },
  hooks: {
    after: [{ matcher: () => true, handler: async (ctx) => {
      if (ctx.error) console.error({ path: ctx.path, error: ctx.error });
    }}],
  },
});
```

**Step 3: Commit**
```bash
git add .claude/skills/better-auth.md
git commit -m "feat(skills): update better-auth.md with Redis storage and full config"
```

---

## Wave 2: Skills — Create New (4 files)

### Task 8: Create `.claude/skills/redis.md`

**Files:**
- Create: `.claude/skills/redis.md`

**Content to include:**
- Client setup (singleton pattern with ioredis)
- Key naming conventions (`{namespace}:{id}:{field}`)
- Cache-aside pattern with type safety
- Write-through pattern
- Cache invalidation by tag
- Pipeline for batch reads
- Pub/Sub for real-time
- Session storage integration
- TTL constants
- Testing with `ioredis-mock`

Key patterns:
```typescript
// Singleton client
import Redis from "ioredis";
export const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Cache-aside
async function getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;
  const fresh = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(fresh));
  return fresh;
}

// Key helpers
const USER_KEY = (id: string) => `user:${id}:profile` as const;
const FEED_KEY = (userId: string) => `feed:${userId}:posts` as const;

// Batch with pipeline (ioredis pipeline)
const pipeline = redis.pipeline();
ids.forEach(id => pipeline.get(USER_KEY(id)));
const results = await pipeline.exec() as [Error | null, string | null][];

// TTL constants
export const TTL = { MINUTE: 60, HOUR: 3600, DAY: 86400, WEEK: 604800 } as const;
```

**Step 1: Write the file** (create with full content)

**Step 2: Verify**
```bash
wc -l .claude/skills/redis.md
```
Expected: â¥150 lines.

**Step 3: Commit**
```bash
git add .claude/skills/redis.md
git commit -m "feat(skills): add redis.md with ioredis cache patterns"
```

---

### Task 9: Create `.claude/skills/hono.md`

**Files:**
- Create: `.claude/skills/hono.md`

**Content to include:**
- App factory pattern
- Route groups with typed RPC
- `AppType` export for RPC client
- `zValidator` for request validation
- `HTTPException` for error handling
- Middleware with typed context (`c.set`/`c.get`, `Variables`)
- Streaming with `streamText`
- `testClient` for testing
- Deployment adapters (Node.js, Cloudflare Workers)

**Step 1: Write the file**

**Step 2: Verify**
```bash
grep -n "hc<\|testClient\|HTTPException\|zValidator\|streamText" .claude/skills/hono.md | wc -l
```
Expected: â¥6 lines.

**Step 3: Commit**
```bash
git add .claude/skills/hono.md
git commit -m "feat(skills): add hono.md with v4 RPC and middleware patterns"
```

---

### Task 10: Create `.claude/skills/monorepo.md`

**Files:**
- Create: `.claude/skills/monorepo.md`

**Content to include:**
- pnpm-workspace.yaml setup
- Directory structure: `apps/*`, `packages/*`
- Shared package patterns (`@repo/ui`, `@repo/config`, `@repo/types`)
- `turbo.json` pipeline with correct task definitions
- TypeScript project references
- Shared ESLint + Tailwind config packages
- Remote caching setup
- Common pitfalls (circular deps, missing `"exports"` field, forgetting `"workspace:*"`)

Key turbo.json:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^lint"] },
    "typecheck": { "dependsOn": ["^typecheck"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

**Step 1: Write the file**

**Step 2: Verify**
```bash
wc -l .claude/skills/monorepo.md
```
Expected: â¥150 lines.

**Step 3: Commit**
```bash
git add .claude/skills/monorepo.md
git commit -m "feat(skills): add monorepo.md with pnpm workspaces + Turborepo"
```

---

### Task 11: Create `.claude/skills/observability.md`

**Files:**
- Create: `.claude/skills/observability.md`

**Content to include:**
- Structured logging with pino (setup, child loggers, levels)
- OpenTelemetry setup for Next.js (`instrumentation.ts`)
- Web Vitals via `reportWebVitals` and `@next/third-parties`
- Sentry integration (error + performance)
- Health check endpoint pattern (Hono)
- Log level strategy by environment

```typescript
// pino singleton
import pino from "pino";
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  formatters: { level: (label) => ({ level: label }) },
  transport: process.env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});

// Child logger for request context
const reqLogger = logger.child({ requestId: crypto.randomUUID(), userId });
reqLogger.info({ path: req.path }, "Request received");

// OpenTelemetry (instrumentation.ts)
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const sdk = new NodeSDK({ serviceName: process.env.OTEL_SERVICE_NAME ?? "app" });
    sdk.start();
  }
}

// Web Vitals
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (metric.label === "web-vital") {
    logger.info({ name: metric.name, value: metric.value, id: metric.id }, "web-vital");
  }
}

// Health check (Hono)
app.get("/health", (c) => c.json({
  status: "ok",
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
}));
```

**Step 1: Write the file**

**Step 2: Verify**
```bash
grep -n "pino\|register\|reportWebVitals\|health" .claude/skills/observability.md | wc -l
```
Expected: â¥6 lines.

**Step 3: Commit**
```bash
git add .claude/skills/observability.md
git commit -m "feat(skills): add observability.md with pino, OTel, and Web Vitals"
```

---

## Wave 3: Agents (5 rewrites)

### Task 12: Deepen `frontend-expert.md`

**Files:**
- Modify: `.claude/agents/frontend-expert.md`

**Step 1: Read current file**
```bash
cat .claude/agents/frontend-expert.md
```

**Step 2: Add Behavioral Rules and delegation section**

Replace generic list with:
```markdown
## Behavioral Rules

DO: Default to Server Components. If it needs no interactivity, it stays on the server.
DON'T: Add `"use client"` preemptively — every client boundary increases bundle size.

DO: Use `useActionState` + Server Actions for mutations.
DON'T: Use `useState` + `useEffect` + `fetch` for form submissions.

DO: Use TanStack Query for ALL client-side server state — no raw fetch in client components.
DON'T: Mix TanStack Query and raw fetch in the same feature.

DO: Use `function Comp(props: Props)` syntax for components.
DON'T: Use `React.FC<Props>` — deprecated in style and hides ref types.

DO: Use `use(promise)` inside Suspense for async data in RSC trees.
DON'T: Use `useEffect` + `useState` for data that can be fetched server-side.

## When to Delegate

- Tailwind/shadcn design decisions → `ui-expert`
- API route implementation → `backend-expert`
- Auth flows → `security-expert`
- Tests → `testing-expert`
- Type system puzzles → `typescript-expert`
```

**Step 3: Verify**
```bash
grep -n "DO:\|DON'T:\|When to Delegate" .claude/agents/frontend-expert.md | wc -l
```
Expected: â¥12 lines.

**Step 4: Commit**
```bash
git add .claude/agents/frontend-expert.md
git commit -m "feat(agents): deepen frontend-expert with DO/DON'T rules"
```

---

### Task 13: Deepen `backend-expert.md`

**Files:**
- Modify: `.claude/agents/backend-expert.md`

**Step 1: Read current file**
```bash
cat .claude/agents/backend-expert.md
```

**Step 2: Add Behavioral Rules**

```markdown
## Behavioral Rules

DO: Use Hono RPC — typed routes, exported `AppType`, `hc` client.
DON'T: Return untyped responses — define response schemas.

DO: Validate all inputs with `zValidator` at the route level.
DON'T: Validate inside the handler body — the middleware should reject first.

DO: Use Drizzle transactions for multi-table writes.
DON'T: Chain multiple inserts without a transaction when atomicity matters.

DO: Throw `HTTPException` for expected errors (401, 403, 404, 422).
DON'T: Return 500 for validation errors or business logic failures.

DO: Add Redis caching for read-heavy queries that tolerate stale data.
DON'T: Cache user-specific data without including the userId in the key.

## When to Delegate

- DB schema design → `database-expert`
- Auth middleware → `security-expert`
- Client-side data fetching → `frontend-expert`
- Infrastructure/deployment → `infrastructure-expert`
```

**Step 3: Commit**
```bash
git add .claude/agents/backend-expert.md
git commit -m "feat(agents): deepen backend-expert with Hono-specific DO/DON'T rules"
```

---

### Task 14: Deepen `ui-expert.md`

**Files:**
- Modify: `.claude/agents/ui-expert.md`

**Step 1: Read current file**
```bash
cat .claude/agents/ui-expert.md
```

**Step 2: Add Behavioral Rules for Tailwind v4 + shadcn/ui**

```markdown
## Behavioral Rules

DO: Use Tailwind v4 CSS variables (`--color-primary`, `var(--spacing-4)`) not v3 class utilities.
DON'T: Use `text-blue-500` when a semantic token exists (`text-primary`).

DO: Use shadcn/ui components as the base. Extend via `className` prop.
DON'T: Build custom form controls when shadcn has them (Input, Select, Checkbox, etc.).

DO: Use `cn()` utility for conditional class merging.
DON'T: Concatenate class names conditionally with template strings.

DO: Use `motion.div` from `motion/react` for animations. Prefer `layout` prop for size changes.
DON'T: Use CSS transitions for complex state-driven animations — Framer Motion handles it better.

DO: Verify color contrast for all text/background combinations (WCAG AA: 4.5:1 ratio).
DON'T: Use opacity variants (`text-foreground/60`) for primary content — use semantic tokens.

## When to Delegate

- React component logic → `frontend-expert`
- Animation performance tied to React state → `frontend-expert`
```

**Step 3: Commit**
```bash
git add .claude/agents/ui-expert.md
git commit -m "feat(agents): deepen ui-expert with Tailwind v4 and shadcn/ui rules"
```

---

### Task 15: Add severity framework to `code-reviewer.md`

**Files:**
- Modify: `.claude/agents/code-reviewer.md`

**Step 1: Read current file**
```bash
cat .claude/agents/code-reviewer.md
```

**Step 2: Add severity table and rules**

```markdown
## Severity Framework

| Level | Label | When | Action |
|-------|-------|------|--------|
| 🔴 Critical | Security vulnerability, data loss, broken auth | Always | Block merge |
| 🟠 High | Incorrect logic, N+1 query, missing error handling | Always | Fix before merge |
| 🟡 Medium | Missing types, poor naming, no test coverage | Often | Fix in follow-up |
| 🔵 Low | Style, comments, minor DX improvements | Rarely | Optional |

## Behavioral Rules

DO: Lead every finding with its severity label.
DON'T: Report 🔵 Low issues if 🔴/🟠 findings exist and haven't been addressed.

DO: Provide a corrected code snippet for every 🔴 and 🟠 finding.
DON'T: Describe the problem without showing the fix.

DO: Check specifically: N+1 queries, missing `await`, hardcoded secrets, SQL string concat.
DON'T: Comment on formatting — Prettier handles it automatically.

## When to Delegate

- Deep security audit → `security-expert`
- DB query optimization → `database-expert`
- Complex TypeScript issues → `typescript-expert`
```

**Step 3: Commit**
```bash
git add .claude/agents/code-reviewer.md
git commit -m "feat(agents): add severity framework to code-reviewer"
```

---

### Task 16: Deepen `testing-expert.md`

**Files:**
- Modify: `.claude/agents/testing-expert.md`

**Step 1: Read current file**
```bash
cat .claude/agents/testing-expert.md
```

**Step 2: Add philosophy and DO/DON'T**

```markdown
## Testing Philosophy

Coverage is a lagging indicator. Test behavior, not implementation. Three well-designed behavior tests beat twenty implementation tests.

Test pyramid: many unit tests, fewer integration tests, few E2E tests. If E2E tests catch most bugs, the unit tests are wrong.

## Behavioral Rules

DO: Test what the user sees or what the API returns — not internal state.
DON'T: Test that `setState` was called — test that the UI reflects the new state.

DO: Use Testing Library query priority: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`.
DON'T: Use `getByTestId` unless no semantic query works.

DO: Mock at the network boundary with MSW.
DON'T: `vi.mock('./db')` when you can intercept the HTTP request.

DO: Use `@testing-library/user-event` for interactions.
DON'T: `fireEvent.click()` — it doesn't simulate real user behavior.

DO: Write the test first, watch it fail, then implement.
DON'T: Write tests after implementation as a checkbox exercise.

## When to Delegate

- E2E infrastructure setup → `infrastructure-expert`
- Component implementation → `frontend-expert`
```

**Step 3: Commit**
```bash
git add .claude/agents/testing-expert.md
git commit -m "feat(agents): add testing philosophy and DO/DON'T to testing-expert"
```

---

## Wave 4: Commands (5 updates)

### Task 17: Update `/component` command

**Files:**
- Modify: `.claude/commands/react/component.md`

**Step 1: Read current file**
```bash
cat .claude/commands/react/component.md
```

**Step 2: Update output template to React 19**

The generated component must:
- Use `function Comp(props: Props)` not `React.FC`
- Use `ref` as prop (no `forwardRef`)
- Use Tailwind v4 with `cn()`
- Include semantic HTML and basic accessibility

```tsx
type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? <Spinner aria-hidden /> : null}
      {children}
    </button>
  );
}
```

**Step 3: Verify**
```bash
grep -n "React.FC\|forwardRef" .claude/commands/react/component.md
```
Expected: zero matches.

**Step 4: Commit**
```bash
git add .claude/commands/react/component.md
git commit -m "feat(commands): update /component to React 19 patterns"
```

---

### Task 18: Update `/feature` command

**Files:**
- Modify: `.claude/commands/react/feature.md`

**Step 1: Read current file**
```bash
cat .claude/commands/react/feature.md
```

**Step 2: Update scaffold**

A complete feature must include all layers:
1. Server Component (page/section — no interactivity)
2. Client Component (interactive parts only)
3. Server Action (mutations)
4. TanStack Query hook (client-side reads)
5. Types file

The RSC → Client boundary must be explicit in the template.

**Step 3: Commit**
```bash
git add .claude/commands/react/feature.md
git commit -m "feat(commands): update /feature with RSC + Server Action + TanStack Query layers"
```

---

### Task 19: Update `/route` command (Hono v4 RPC)

**Files:**
- Modify: `.claude/commands/api/route.md`

**Step 1: Read current file**
```bash
cat .claude/commands/api/route.md
```

**Step 2: Update to Hono v4 RPC pattern**

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { db } from "@/db";
import { items } from "@/db/schema";
import { eq } from "drizzle-orm";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export const itemsRoute = new Hono()
  .get("/", async (c) => {
    const result = await db.query.items.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)] });
    return c.json({ items: result });
  })
  .post("/", zValidator("json", createSchema), async (c) => {
    const data = c.req.valid("json");
    const [item] = await db.insert(items).values(data).returning();
    return c.json(item, 201);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const item = await db.query.items.findFirst({ where: eq(items.id, id) });
    if (!item) throw new HTTPException(404, { message: "Not found" });
    return c.json(item);
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(items).where(eq(items.id, id));
    return c.body(null, 204);
  });
```

**Step 3: Commit**
```bash
git add .claude/commands/api/route.md
git commit -m "feat(commands): update /route to Hono v4 RPC with zValidator"
```

---

### Task 20: Update `/schema` command

**Files:**
- Modify: `.claude/commands/db/schema.md`

**Step 1: Read current file**
```bash
cat .claude/commands/db/schema.md
```

**Step 2: Update to Drizzle v0.38+ with index array form**

```typescript
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const items = pgTable("items", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("items_user_id_idx").on(t.userId),
  index("items_created_at_idx").on(t.createdAt),
]);

export const itemsRelations = relations(items, ({ one }) => ({
  user: one(users, { fields: [items.userId], references: [users.id] }),
}));
```

**Step 3: Commit**
```bash
git add .claude/commands/db/schema.md
git commit -m "feat(commands): update /schema to Drizzle v0.38+ with array index form"
```

---

### Task 21: Verify `/contract` command

**Files:**
- Modify: `.claude/commands/web3/contract.md`

**Step 1: Read current file**
```bash
cat .claude/commands/web3/contract.md
```

**Step 2: Verify and fix if needed**

Check:
- `pragma solidity ^0.8.20` or higher (OZ 5.4 requires â¥0.8.20)
- OpenZeppelin v5 import paths (e.g., `@openzeppelin/contracts/token/ERC20/ERC20.sol`)
- CEI pattern in all state-changing functions
- Custom errors (not `require(condition, "string")`)
- `SafeERC20` for external token transfers
- Foundry test structure with `setUp()`, `test_` prefix

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

error Unauthorized();
error InsufficientBalance(uint256 required, uint256 available);

contract MyContract is Ownable {
  constructor(address initialOwner) Ownable(initialOwner) {}
  
  // CEI: Checks → Effects → Interactions
  function withdraw(uint256 amount) external onlyOwner {
    if (amount > address(this).balance) revert InsufficientBalance(amount, address(this).balance);
    // Effects
    // (no state here, but update state before external calls)
    // Interactions
    (bool success,) = msg.sender.call{ value: amount }("");
    if (!success) revert();
  }
}
```

**Step 3: Commit**
```bash
git add .claude/commands/web3/contract.md
git commit -m "feat(commands): verify /contract uses Solidity 0.8.20+ and OZ v5 patterns"
```

---

## Wave 5: Docs (3 files)

### Task 22: Rewrite `README.md`

**Files:**
- Modify: `README.md`

**Step 1: Read current README**
```bash
cat README.md
```

**Step 2: Rewrite with GitHub-first structure**

New structure (in order):
1. **Tagline** — one sentence, opinionated stack
2. **What you get** — 4 bullet points, concrete value
3. **Quick start** — install instructions (clone, symlink or copy)
4. **Agents** — table: name | what it handles | trigger examples
5. **Skills** — table: file | topics
6. **Commands** — existing cheatsheet, polished
7. **Hooks** — what runs automatically + toggle instructions
8. **Philosophy** — 3 sentences + link to `docs/philosophy.md`
9. **Contributing** — link to `docs/CONTRIBUTING.md`

Target: 200-280 lines. Comprehensive but not bloated.

**Step 3: Verify**
```bash
wc -l README.md
```
Expected: 200-280 lines.

**Step 4: Commit**
```bash
git add README.md
git commit -m "docs: rewrite README for GitHub discovery"
```

---

### Task 23: Create `docs/CONTRIBUTING.md`

**Files:**
- Create: `docs/CONTRIBUTING.md`

**Step 1: Create the file**

Content sections:
1. **Philosophy** — what this config is and is not
2. **Adding a Skill** — step by step, with template
3. **Adding an Agent** — required sections, quality bar
4. **Adding a Command** — compilability requirement
5. **Updating a Skill** — versioning conventions
6. **Quality Bar** — non-negotiables for any contribution

Key rule to include:
> All code examples must compile in a TypeScript strict project. Imports must be real — verify against npm or official docs. No pseudocode.

**Step 2: Commit**
```bash
git add docs/CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING.md with contribution guidelines"
```

---

### Task 24: Create `docs/philosophy.md`

**Files:**
- Create: `docs/philosophy.md`

**Step 1: Create the file**

Content:
1. **The 4 pillars** — each with 2-3 sentences of rationale
2. **Stack decisions** — why each technology was chosen:
   - Hono over Express (typed RPC, edge-ready, Zod-native)
   - Drizzle over Prisma (SQL proximity, no code gen, TS-first)
   - TanStack over SWR (features, ecosystem, type safety)
   - Better Auth over NextAuth (control, Drizzle adapter, extensible)
   - Tailwind v4 over v3 (CSS-first, no JS config, better performance)
3. **What this config is NOT** — not exhaustive, not multi-stack, not beginner-focused

**Step 2: Commit**
```bash
git add docs/philosophy.md
git commit -m "docs: add philosophy.md with stack decisions rationale"
```

---

### Task 25: Final verification

**Step 1: Count everything**
```bash
echo "=== Skills ==="
ls .claude/skills/ | sort
echo "Total:"       16

echo "=== Agents ==="
ls .claude/agents/ | sort
echo "Total:"       10

echo "=== Docs ==="
ls docs/

echo "=== Git log ==="
git log --oneline -30
```

Expected:
- Skills: 20 files (16 original + redis, hono, monorepo, observability)
- Agents: 10 files (all with DO/DON'T + delegation sections)
- Docs: CONTRIBUTING.md, philosophy.md, 2026-03-09-top-tier-config-design.md

**Step 2: Clean working tree**
```bash
git status
```
Expected: nothing to commit.

---

## Success Checklist

- [ ] Task 1: react.md — React 19 APIs (use, useOptimistic, useActionState, useFormStatus, ref prop)
- [ ] Task 2: nextjs.md — async params, "use cache", after()
- [ ] Task 3: drizzle.md — v0.38+ CTEs, upsert, drizzle-kit commands
- [ ] Task 4: nodejs.md — Hono v4 RPC, testClient, HTTPException
- [ ] Task 5: typescript.md — satisfies, NoInfer, Zod v4
- [ ] Task 6: security.md — Better Auth middleware, CSP nonces
- [ ] Task 7: better-auth.md — Redis secondaryStorage, full config
- [ ] Task 8: redis.md created — ioredis patterns, cache-aside, pipeline, pub/sub
- [ ] Task 9: hono.md created — RPC, zValidator, middleware, streaming, testClient
- [ ] Task 10: monorepo.md created — pnpm workspaces, Turborepo, shared packages
- [ ] Task 11: observability.md created — pino, OTel, Web Vitals, health checks
- [ ] Task 12: frontend-expert.md — DO/DON'T rules, delegation criteria
- [ ] Task 13: backend-expert.md — Hono-specific rules, delegation
- [ ] Task 14: ui-expert.md — Tailwind v4, shadcn/ui rules
- [ ] Task 15: code-reviewer.md — severity framework (🔴🟠🟡🔵)
- [ ] Task 16: testing-expert.md — philosophy, testing-library query priority
- [ ] Task 17: /component — React 19 (no forwardRef, no React.FC)
- [ ] Task 18: /feature — RSC + Server Action + TanStack Query layers
- [ ] Task 19: /route — Hono v4 RPC with zValidator
- [ ] Task 20: /schema — Drizzle v0.38+ with index array form
- [ ] Task 21: /contract — Solidity 0.8.20+ + OZ v5
- [ ] Task 22: README.md — GitHub-first rewrite (200-280 lines)
- [ ] Task 23: docs/CONTRIBUTING.md — contribution guidelines
- [ ] Task 24: docs/philosophy.md — stack decisions rationale
- [ ] Task 25: Final verification — clean git, correct file counts
