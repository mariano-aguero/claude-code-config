---
name: hono-patterns
description: Hono v4 API patterns including typed RPC, middleware, validation, streaming, and testing. Use when building Hono APIs, creating middleware, implementing RPC clients, or testing Hono routes.
---

# Hono v4 Patterns

## Installation

```bash
pnpm add hono @hono/node-server zod @hono/zod-validator
```

## App Factory Pattern

Split routes into groups, then mount on a root app.

```typescript
// src/index.ts
import { Hono } from "hono";
import { usersRoute } from "./routes/users";
import { postsRoute } from "./routes/posts";

const app = new Hono()
  .route("/users", usersRoute)
  .route("/posts", postsRoute);

export type AppType = typeof app;
export default app;
```

```typescript
// src/routes/users.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const usersRoute = new Hono()
  .get("/", async (c) => {
    const users = await db.query.users.findMany();
    return c.json(users);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!user) throw new HTTPException(404, { message: "User not found" });
    return c.json(user);
  })
  .post("/", zValidator("json", createUserSchema), async (c) => {
    const body = c.req.valid("json");
    const [user] = await db.insert(users).values(body).returning();
    return c.json(user, 201);
  });
```

## Typed RPC Client

Export `AppType` from the server and use `hc<AppType>` on the client for end-to-end type safety — no manual type duplication.

```typescript
// src/client.ts
import { hc } from "hono/client";
import type { AppType } from "./index";

export const client = hc<AppType>(process.env.NEXT_PUBLIC_API_URL!);

// Fully typed — IDE autocomplete on routes, params, and responses
const res = await client.users.$get();
const users = await res.json(); // typed

const created = await client.users.$post({
  json: { name: "Alice", email: "alice@example.com" },
});
const user = await created.json(); // typed
```

## zValidator for Request Validation

```typescript
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const bodySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  published: z.boolean().default(false),
});

app.get("/posts", zValidator("query", querySchema), async (c) => {
  const { page, limit } = c.req.valid("query");
  // page and limit are typed numbers
});

app.post("/posts", zValidator("json", bodySchema), async (c) => {
  const body = c.req.valid("json");
  // body is fully typed
});
```

## HTTPException for Error Handling

```typescript
import { HTTPException } from "hono/http-exception";

// Throw anywhere in a handler
app.get("/posts/:id", async (c) => {
  const post = await getPost(c.req.param("id"));
  if (!post) throw new HTTPException(404, { message: "Post not found" });
  if (!canRead(post, c.get("user"))) {
    throw new HTTPException(403, { message: "Forbidden" });
  }
  return c.json(post);
});
```

## Typed Middleware with Variables

Use the generic `Variables` map to pass typed data through middleware.

```typescript
// middleware/auth.ts
import { createMiddleware } from "hono/factory";

type AuthVariables = {
  user: { id: string; role: string };
};

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw new HTTPException(401, { message: "Unauthorized" });

    const user = await verifyToken(token);
    if (!user) throw new HTTPException(401, { message: "Invalid token" });

    c.set("user", user);
    await next();
  },
);

// In route
app.get("/me", authMiddleware, (c) => {
  const user = c.get("user"); // typed as { id: string; role: string }
  return c.json(user);
});
```

## Global Error Handler

```typescript
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));
```

## Streaming Responses

```typescript
import { streamText } from "hono/streaming";

app.get("/stream", (c) =>
  streamText(c, async (stream) => {
    for await (const chunk of generateText()) {
      await stream.writeln(chunk);
    }
  }),
);
```

## Deployment: Node.js

```typescript
// src/server.ts
import { serve } from "@hono/node-server";
import app from "./index";

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});
```

## Deployment: Cloudflare Workers

```typescript
// src/worker.ts
import app from "./index";
export default app; // Hono app is a valid CF Workers handler
```

## Testing with testClient

```typescript
// __tests__/users.test.ts
import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { usersRoute } from "../src/routes/users";

const client = testClient(new Hono().route("/users", usersRoute));

describe("users", () => {
  it("GET /users returns array", async () => {
    const res = await client.users.$get();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("POST /users validates body", async () => {
    const res = await client.users.$post({ json: { name: "", email: "bad" } });
    expect(res.status).toBe(400);
  });

  it("POST /users creates user", async () => {
    const res = await client.users.$post({
      json: { name: "Alice", email: "alice@example.com" },
    });
    expect(res.status).toBe(201);
    const user = await res.json();
    expect(user.name).toBe("Alice");
  });
});
```

## Common Pitfalls

- Always export `AppType` as a `typeof app` — not a type alias — so `hc<AppType>` resolves the full route tree
- `c.req.valid("json")` is only safe to call after `zValidator("json", ...)` — calling without it throws at runtime
- `c.set` / `c.get` values are per-request — do not store mutable state on the app object
- Middleware added with `.use()` applies to all routes defined after it — order matters
- For streaming, always `await` each `stream.write` call to avoid backpressure issues
