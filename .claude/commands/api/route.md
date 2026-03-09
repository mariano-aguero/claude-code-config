# /route - Generate API Route

Generate a Hono v4 route with zValidator, HTTPException, and direct Drizzle ORM calls.

## Usage

```
/route <resource> [options]
```

## Options

- `--with-auth` - Add Better Auth session middleware
- `--with-pagination` - Add cursor-based pagination
- `--crud` - Generate all CRUD endpoints

## Template

```typescript
// src/routes/<resource>.ts
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

const updateSchema = createSchema.partial();

export const itemsRoute = new Hono()
  .get("/", async (c) => {
    const result = await db.query.items.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
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
  .patch("/:id", zValidator("json", updateSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const [updated] = await db
      .update(items)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();
    if (!updated) throw new HTTPException(404, { message: "Not found" });
    return c.json(updated);
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(items).where(eq(items.id, id));
    return c.body(null, 204);
  });
```

## With Auth Middleware

```typescript
// src/routes/<resource>.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

// Auth middleware — attach to routes that require a session
const requireAuth = async (
  c: Parameters<Parameters<typeof Hono.prototype.use>[0]>[0],
  next: () => Promise<void>,
) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) throw new HTTPException(401, { message: "Unauthorized" });
  c.set("user", session.user);
  await next();
};

export const postsRoute = new Hono()
  .get("/", async (c) => {
    const result = await db.query.posts.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    return c.json({ posts: result });
  })
  .post("/", requireAuth, zValidator("json", createSchema), async (c) => {
    const user = c.get("user");
    const data = c.req.valid("json");
    const [post] = await db
      .insert(posts)
      .values({ ...data, userId: user.id })
      .returning();
    return c.json(post, 201);
  })
  .delete("/:id", requireAuth, async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, user.id)));
    return c.body(null, 204);
  });
```

## With Pagination

```typescript
// src/routes/<resource>.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/db";
import { items } from "@/db/schema";
import { lt, desc } from "drizzle-orm";

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const itemsRoute = new Hono().get(
  "/",
  zValidator("query", querySchema),
  async (c) => {
    const { cursor, limit } = c.req.valid("query");

    const result = await db.query.items.findMany({
      where: cursor ? lt(items.createdAt, new Date(cursor)) : undefined,
      orderBy: [desc(items.createdAt)],
      limit: limit + 1, // fetch one extra to detect next page
    });

    const hasMore = result.length > limit;
    const data = hasMore ? result.slice(0, limit) : result;
    const nextCursor = hasMore
      ? data[data.length - 1]?.createdAt.toISOString()
      : null;

    return c.json({ items: data, nextCursor });
  },
);
```

## Registration in main app

```typescript
// src/index.ts
import { Hono } from "hono";
import { itemsRoute } from "./routes/items";

const app = new Hono().route("/items", itemsRoute);

// RPC type export for client-side type safety
export type AppType = typeof app;

export default app;
```

## Client-side RPC usage (hono/client)

```typescript
// src/lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "@/server";

export const api = hc<AppType>(process.env.NEXT_PUBLIC_API_URL!);

// Usage in a TanStack Query hook:
const { data } = useQuery({
  queryKey: ["items"],
  queryFn: () => api.items.$get().then((r) => r.json()),
});
```

## Examples

```
/route items --crud
/route posts --crud --with-auth
/route products --with-pagination
```

## File Location

- Routes go in `src/routes/<resource>.ts`
- Register in `src/index.ts` via `app.route()`
- Export `AppType` for end-to-end type safety with `hono/client`

## Rules

1. Method chaining on `new Hono()` — enables RPC type inference
2. `zValidator` for all request inputs (json, query, param)
3. `HTTPException` for errors — not manual `c.json({ error })` calls
4. Direct Drizzle calls — no service layer abstraction needed
5. `returning()` after insert/update to get the created/updated row
6. `c.body(null, 204)` for DELETE — not `c.json({})`
