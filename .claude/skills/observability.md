---
name: observability-patterns
description: Observability patterns including structured logging with pino, OpenTelemetry for Next.js, Web Vitals, and Sentry integration. Use when setting up logging, tracing, monitoring, or health checks.
---

# Observability Patterns

## Installation

```bash
pnpm add pino pino-pretty @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @sentry/nextjs
```

## Structured Logging with pino

### Singleton Logger

```typescript
// lib/logger.ts
import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss" },
        },
      }
    : {
        // Production: structured JSON for log aggregators
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
});
```

### Child Loggers for Context

```typescript
// Bind context to a child logger — all log lines include bound fields
const requestLogger = logger.child({
  requestId: crypto.randomUUID(),
  userId: session.user.id,
  route: "/api/posts",
});

requestLogger.info({ postId }, "Fetching post");
requestLogger.warn({ attempt: 3 }, "Retry attempt");
requestLogger.error({ err }, "Failed to fetch post");
```

### Log Level Strategy

| Environment | Level   | Reason                                  |
| ----------- | ------- | --------------------------------------- |
| local dev   | `debug` | Full visibility during development      |
| staging     | `info`  | Normal operational logs                 |
| production  | `warn`  | Only warnings and errors to reduce cost |

```typescript
// Set LOG_LEVEL=debug in .env.local
// Set LOG_LEVEL=warn in production env vars
```

### Request Logging Middleware (Hono)

```typescript
// middleware/logger.ts
import { createMiddleware } from "hono/factory";
import { logger } from "@/lib/logger";

export const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  const reqId = crypto.randomUUID();

  const reqLog = logger.child({
    requestId: reqId,
    method: c.req.method,
    path: c.req.path,
  });

  reqLog.info("Request started");
  c.set("logger", reqLog);

  await next();

  const duration = Date.now() - start;
  reqLog.info({ status: c.res.status, duration }, "Request completed");
});
```

## OpenTelemetry for Next.js

### instrumentation.ts

```typescript
// instrumentation.ts  (Next.js 15+ — place in project root)
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { getNodeAutoInstrumentations } =
      await import("@opentelemetry/auto-instrumentations-node");
    const { OTLPTraceExporter } =
      await import("@opentelemetry/exporter-trace-otlp-http");

    const sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter({
        url:
          process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
          "http://localhost:4318/v1/traces",
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": { enabled: false },
        }),
      ],
    });

    sdk.start();
  }
}
```

```json
// next.config.ts — enable instrumentation hook
{
  "experimental": {
    "instrumentationHook": true
  }
}
```

### Manual Spans

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-app");

async function processOrder(orderId: string) {
  return tracer.startActiveSpan("processOrder", async (span) => {
    try {
      span.setAttributes({ "order.id": orderId });
      const result = await doWork(orderId);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw err;
    } finally {
      span.end();
    }
  });
}
```

## Web Vitals

```typescript
// app/layout.tsx — report Web Vitals to analytics
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}) {
  // Send to your analytics endpoint
  fetch("/api/vitals", {
    method: "POST",
    body: JSON.stringify(metric),
    headers: { "Content-Type": "application/json" },
  }).catch(() => {}); // Fire and forget — never block the page
}
```

```typescript
// app/api/vitals/route.ts
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const metric = await req.json();
  logger.info({ metric }, "Web Vital");
  return new Response(null, { status: 204 });
}
```

## Sentry Integration

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  integrations: [Sentry.prismaIntegration()],
});
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,
  integrations: [Sentry.replayIntegration()],
});
```

## Health Check Endpoint (Hono)

```typescript
// src/routes/health.ts
import { Hono } from "hono";
import { db } from "@/db";
import { redis } from "@/lib/redis";
import { sql } from "drizzle-orm";

export const healthRoute = new Hono().get("/", async (c) => {
  const checks = await Promise.allSettled([
    db.execute(sql`SELECT 1`),
    redis.ping(),
  ]);

  const status = {
    status: checks.every((r) => r.status === "fulfilled") ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status === "fulfilled" ? "ok" : "error",
      redis: checks[1].status === "fulfilled" ? "ok" : "error",
    },
  };

  return c.json(status, status.status === "ok" ? 200 : 503);
});
```

## Environment Variables

```bash
LOG_LEVEL=info
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

## Common Pitfalls

- Never log sensitive data (passwords, tokens, PII) — use `redact` option in pino to strip fields automatically
- `instrumentation.ts` must be at the project root (not inside `src/`) for Next.js to pick it up
- Child loggers are cheap — create one per request/job with bound context rather than passing IDs on every log call
- Web Vitals `reportWebVitals` runs in the browser — never import server-only modules there
- Sentry `tracesSampleRate: 1.0` in production will cause high costs — use 0.05–0.1 for most apps
