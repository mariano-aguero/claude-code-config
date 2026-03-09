---
name: nodejs-patterns
description: Node.js backend patterns including Hono/Fastify/Express setup, middleware, error handling, logging, authentication, and production best practices. Use when building APIs, microservices, or backend services. Triggers on Node.js, Express, Fastify, Hono, middleware, and server-side JavaScript.
---

# Node.js Backend Patterns

## Framework Setup

### Hono (Recommended)

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { zValidator } from "@hono/zod-validator";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors({ origin: process.env.CORS_ORIGIN }));

// Routes
app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/users", usersRoutes);
app.route("/api/posts", postsRoutes);

// Error handling
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;
```

### Fastify

```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

const fastify = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  },
});

// Plugins
await fastify.register(cors, { origin: process.env.CORS_ORIGIN });
await fastify.register(helmet);

// Routes
fastify.get("/health", async () => ({ status: "ok" }));

// Start
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
```

## Layered Architecture

```
src/
├── routes/           # HTTP handlers, validation
│   └── users.ts
├── services/         # Business logic
│   └── user.service.ts
├── repositories/     # Data access
│   └── user.repository.ts
├── middleware/       # Auth, logging, etc.
│   └── auth.ts
├── lib/              # Utilities, clients
│   ├── db.ts
│   └── redis.ts
└── index.ts          # App entry point
```

## Middleware Patterns

### Authentication

```typescript
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verify(token, process.env.JWT_SECRET!);
    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Usage
app.use("/api/*", authMiddleware);
```

### Validation with Zod

```typescript
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(12),
});

app.post("/users", zValidator("json", createUserSchema), async (c) => {
  const data = c.req.valid("json"); // Typed!
  const user = await userService.create(data);
  return c.json(user, 201);
});
```

### Rate Limiting

```typescript
import { rateLimiter } from "hono-rate-limiter";

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: "draft-6",
  keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "unknown",
});

app.use("/api/*", limiter);

// Stricter for auth endpoints
const authLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 5,
});

app.use("/api/auth/*", authLimiter);
```

### Request Logging

```typescript
import { createMiddleware } from "hono/factory";

export const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  c.set("requestId", requestId);

  await next();

  const duration = Date.now() - start;
  const { method } = c.req;
  const path = c.req.path;
  const status = c.res.status;

  console.log(
    JSON.stringify({
      requestId,
      method,
      path,
      status,
      duration,
      timestamp: new Date().toISOString(),
    }),
  );
});
```

## Error Handling

### Custom Error Classes

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public isOperational: boolean = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}
```

### Global Error Handler

```typescript
app.onError((err, c) => {
  const requestId = c.get("requestId");

  // Log error
  console.error({
    requestId,
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });

  // Handle known errors
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      },
      err.statusCode,
    );
  }

  // Handle Zod errors
  if (err.name === "ZodError") {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: err.errors,
        },
      },
      400,
    );
  }

  // Unknown errors
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message,
      },
    },
    500,
  );
});
```

## Service Layer

```typescript
// services/user.service.ts
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { NotFoundError, ValidationError } from "@/lib/errors";

export const userService = {
  async findById(id: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) throw new NotFoundError("User");
    return user;
  },

  async create(data: CreateUserInput) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existing) {
      throw new ValidationError("Email already exists");
    }

    const hashedPassword = await hashPassword(data.password);

    const [user] = await db
      .insert(users)
      .values({
        ...data,
        password: hashedPassword,
      })
      .returning();

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async update(id: string, data: UpdateUserInput) {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!user) throw new NotFoundError("User");
    return user;
  },

  async delete(id: string) {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    if (!deleted) throw new NotFoundError("User");
  },
};
```

## Authentication

> **Next.js projects**: Use Better Auth instead of custom JWT. See `better-auth.md`.
> The JWT patterns below apply to standalone Hono APIs without Next.js.

### JWT Implementation

```typescript
import { sign, verify } from "hono/jwt";

export async function generateTokens(userId: string) {
  const accessToken = await sign(
    {
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    },
    process.env.JWT_SECRET!,
  );

  const refreshToken = await sign(
    {
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    },
    process.env.JWT_REFRESH_SECRET!,
  );

  return { accessToken, refreshToken };
}

export async function verifyAccessToken(token: string) {
  return verify(token, process.env.JWT_SECRET!);
}

export async function verifyRefreshToken(token: string) {
  return verify(token, process.env.JWT_REFRESH_SECRET!);
}
```

### Password Hashing

```typescript
import { hash, verify } from "@node-rs/argon2";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return verify(hashedPassword, password);
}
```

## Caching with Redis

```typescript
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async delPattern(pattern: string): Promise<void> {
    // Use SCAN instead of KEYS to avoid blocking the Redis event loop on large keyspaces
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const pipeline = redis.pipeline();
    stream.on("data", (keys: string[]) => {
      if (keys.length) keys.forEach((k) => pipeline.del(k));
    });
    await new Promise<void>((resolve, reject) => {
      stream.on("end", () => {
        pipeline.exec().then(() => resolve(), reject);
      });
      stream.on("error", reject);
    });
  },
};

// Cache wrapper — type-safe, no decorator needed
export function withCache<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  keyFn: (...args: TArgs) => string,
  ttl = 3600,
): (...args: TArgs) => Promise<TReturn> {
  return async (...args) => {
    const key = keyFn(...args);
    const hit = await cache.get<TReturn>(key);
    if (hit) return hit;
    const result = await fn(...args);
    await cache.set(key, result, ttl);
    return result;
  };
}
```

## Response Format

```typescript
// Standard success response
type SuccessResponse<T> = {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

// Standard error response
type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

// Helper functions
export function success<T>(data: T, meta?: SuccessResponse<T>["meta"]) {
  return { success: true, data, meta };
}

export function paginated<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
) {
  return success(data, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
```

## Graceful Shutdown

```typescript
import { serve } from "@hono/node-server";
import { pool } from "./db"; // export pool from db/index.ts alongside the drizzle instance

const server = serve({
  fetch: app.fetch,
  port: 3000,
});

const signals = ["SIGINT", "SIGTERM"];

signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down gracefully...`);

    server.close(() => {
      console.log("HTTP server closed");
    });

    // Close database connections
    await pool.end(); // pool is the pg.Pool instance passed to drizzle()
    console.log("Database connections closed");

    // Close Redis
    await redis.quit();
    console.log("Redis connection closed");

    process.exit(0);
  });
});
```

## Health Check

```typescript
app.get("/health", async (c) => {
  const checks = {
    database: false,
    redis: false,
  };

  try {
    await db.execute(sql`SELECT 1`);
    checks.database = true;
  } catch (e) {
    console.error("Database health check failed:", e);
  }

  try {
    await redis.ping();
    checks.redis = true;
  } catch (e) {
    console.error("Redis health check failed:", e);
  }

  const healthy = Object.values(checks).every(Boolean);

  return c.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      checks,
      timestamp: new Date().toISOString(),
    },
    healthy ? 200 : 503,
  );
});
```

## Environment Variables

```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().url(),
});

export const env = envSchema.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
```

## Best Practices

1. **Use TypeScript** with strict mode
2. **Validate all input** with Zod at the boundary
3. **Layer your architecture** - Routes → Services → Repositories
4. **Use dependency injection** for testability
5. **Implement proper error handling** with custom error classes
6. **Add structured logging** with request IDs
7. **Implement rate limiting** especially on auth endpoints
8. **Use connection pooling** for databases
9. **Implement graceful shutdown** for zero-downtime deploys
10. **Add health checks** for orchestration
