---
name: redis-patterns
description: Redis and ioredis patterns for caching, session storage, pub/sub, and rate limiting. Use when implementing caching, real-time features, or session management with Redis.
---

# Redis Patterns (ioredis)

## Installation

```bash
pnpm add ioredis
pnpm add -D ioredis-mock
```

## Singleton Client

Create one connection shared across the app. In Next.js, prevent hot-reload from spawning multiple connections.

```typescript
// lib/redis.ts
import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

function createRedis(): Redis {
  return new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableReadyCheck: true,
  });
}

export const redis =
  process.env.NODE_ENV === "production"
    ? createRedis()
    : (globalThis.__redis ??= createRedis());
```

## TTL Constants

```typescript
export const TTL = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
} as const;

export type TTLValue = (typeof TTL)[keyof typeof TTL];
```

## Key Naming Conventions

Prefix all keys with `<entity>:<id>:<field>`. Keep keys lowercase, colon-separated. Never store unnamespaced keys.

```typescript
// key-helpers.ts
const USER_KEY = (id: string) => `user:${id}:profile` as const;
const FEED_KEY = (userId: string) => `feed:${userId}:posts` as const;
const RATE_KEY = (ip: string, route: string) => `rate:${ip}:${route}` as const;
const SESSION_KEY = (token: string) => `session:${token}` as const;
const LOCK_KEY = (resource: string) => `lock:${resource}` as const;
```

## Cache-Aside Pattern

Read from cache first; on miss, fetch from DB and populate cache.

```typescript
async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  const fresh = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(fresh));
  return fresh;
}

// Usage
const user = await getOrSet(
  USER_KEY(userId),
  () => db.query.users.findFirst({ where: eq(users.id, userId) }),
  TTL.HOUR,
);
```

## Write-Through Pattern

Write to DB and cache simultaneously so the cache is never stale.

```typescript
async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const [updated] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();

  await redis.setex(USER_KEY(id), TTL.HOUR, JSON.stringify(updated));
  return updated;
}

async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
  await redis.del(USER_KEY(id));
}
```

## Pipeline for Batch Reads

Reduce round-trips by sending multiple commands in one network call.

```typescript
async function getUsersFromCache(ids: string[]): Promise<(User | null)[]> {
  const pl = redis.pipeline();
  for (const id of ids) {
    pl.get(USER_KEY(id));
  }
  const results = await pl.exec();
  if (!results) return ids.map(() => null);

  return results.map(([err, value]) => {
    if (err || !value) return null;
    return JSON.parse(value as string) as User;
  });
}
```

## Pub/Sub Pattern

Use separate connections for publisher and subscriber — a subscribed connection cannot issue other commands.

```typescript
// lib/pubsub.ts
import Redis from "ioredis";

const publisher = new Redis(process.env.REDIS_URL!);
const subscriber = new Redis(process.env.REDIS_URL!);

export type NotificationPayload = {
  userId: string;
  event: string;
  data?: unknown;
};

export async function initSubscriber(
  handler: (payload: NotificationPayload) => void,
): Promise<void> {
  await subscriber.subscribe("notifications");
  subscriber.on("message", (_channel: string, message: string) => {
    const payload = JSON.parse(message) as NotificationPayload;
    handler(payload);
  });
}

export async function publish(payload: NotificationPayload): Promise<void> {
  await publisher.publish("notifications", JSON.stringify(payload));
}

// Usage
await publish({ userId, event: "new-message", data: { from: senderId } });
```

## Rate Limiting

Sliding window rate limiter using INCR + EXPIRE.

```typescript
async function rateLimit(
  ip: string,
  route: string,
  limit: number,
  windowSecs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const key = RATE_KEY(ip, route);
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, windowSecs);
  }

  const remaining = Math.max(0, limit - count);
  return { allowed: count <= limit, remaining };
}

// In Hono middleware
app.use("/api/*", async (c, next) => {
  const ip = c.req.header("x-forwarded-for") ?? "unknown";
  const { allowed, remaining } = await rateLimit(ip, c.req.path, 100, 60);

  c.header("X-RateLimit-Remaining", String(remaining));
  if (!allowed) return c.json({ error: "Rate limit exceeded" }, 429);

  await next();
});
```

## Distributed Lock

Prevent race conditions with a simple Redis-based lock.

```typescript
async function acquireLock(
  resource: string,
  ttlMs: number,
): Promise<string | null> {
  const token = crypto.randomUUID();
  const key = LOCK_KEY(resource);
  const result = await redis.set(key, token, "PX", ttlMs, "NX");
  return result === "OK" ? token : null;
}

async function releaseLock(resource: string, token: string): Promise<boolean> {
  const key = LOCK_KEY(resource);
  const current = await redis.get(key);
  if (current !== token) return false;
  await redis.del(key);
  return true;
}

// Usage
const token = await acquireLock("payment:process", 5000);
if (!token) throw new Error("Resource locked");
try {
  await processPayment();
} finally {
  await releaseLock("payment:process", token);
}
```

## Testing with ioredis-mock

```typescript
// __tests__/setup.ts
import RedisMock from "ioredis-mock";
import { vi } from "vitest";

vi.mock("ioredis", () => ({ default: RedisMock }));

// In individual tests
import { redis } from "@/lib/redis";

beforeEach(async () => {
  await redis.flushall();
});

it("caches user on first fetch", async () => {
  const user = await getOrSet(
    USER_KEY("1"),
    () => Promise.resolve({ id: "1", name: "Alice" }),
    TTL.HOUR,
  );
  expect(user.name).toBe("Alice");

  const hit = await redis.get(USER_KEY("1"));
  expect(hit).not.toBeNull();
});
```

## Common Pitfalls

- Never store non-serializable values — always `JSON.stringify` before `set`/`setex`
- Always set a TTL — unbounded keys exhaust memory silently
- Use separate connections for pub/sub — subscribed clients cannot run other commands
- In Next.js, use the `globalThis` singleton pattern to avoid connection leaks during hot reload
- `pipeline().exec()` returns `[Error | null, unknown][]` — always check the error slot per command
