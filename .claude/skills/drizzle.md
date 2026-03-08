---
name: drizzle-orm
description: Drizzle ORM patterns for PostgreSQL with TypeScript. Use when writing database schemas, queries, migrations, relations, or transactions. Always use Drizzle — never Prisma, TypeORM, or raw pg. Triggers on: database schema, SQL queries, migrations, db types, joins, aggregations, drizzle-kit.
---

# Drizzle ORM Patterns

Drizzle is a TypeScript ORM with SQL-like query builder. Zero runtime overhead, full type inference from schema.

## Setup

```typescript
// db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
export type DB = typeof db;
```

## Schema Definition

```typescript
// db/schema/users.ts
import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "member", "viewer"] })
    .notNull()
    .default("member"),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// TypeScript types inferred from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

## Relations

```typescript
// db/schema/relations.ts
import { relations } from "drizzle-orm";
import { users, posts, comments } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
}));
```

## Queries

### Select

```typescript
import {
  eq,
  and,
  or,
  like,
  gt,
  lt,
  gte,
  lte,
  isNull,
  desc,
  asc,
  sql,
} from "drizzle-orm";

// Single record
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
});

// With relations (requires schema + relations export)
const userWithPosts = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    posts: {
      orderBy: desc(posts.createdAt),
      limit: 10,
    },
  },
});

// Multiple with conditions
const activeAdmins = await db
  .select()
  .from(users)
  .where(and(eq(users.role, "admin"), eq(users.emailVerified, true)))
  .orderBy(desc(users.createdAt))
  .limit(20);

// Specific columns only
const emails = await db
  .select({ id: users.id, email: users.email })
  .from(users);

// Join
const postsWithAuthors = await db
  .select({
    postId: posts.id,
    title: posts.title,
    authorName: users.name,
  })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id))
  .where(isNull(posts.publishedAt));
```

### Insert

```typescript
// Single
const [newUser] = await db
  .insert(users)
  .values({ email: "user@example.com", name: "Alice" })
  .returning();

// Batch
const newPosts = await db
  .insert(posts)
  .values([
    { title: "Post 1", authorId: userId },
    { title: "Post 2", authorId: userId },
  ])
  .returning();

// Upsert (conflict handling)
await db
  .insert(users)
  .values({ email: "user@example.com", name: "Alice" })
  .onConflictDoUpdate({
    target: users.email,
    set: { name: "Alice Updated", updatedAt: new Date() },
  });
```

### Update

```typescript
const [updated] = await db
  .update(users)
  .set({ name: "New Name", updatedAt: new Date() })
  .where(eq(users.id, userId))
  .returning();

// Conditional update guard — always check rows affected
if (!updated) throw new Error("User not found");
```

### Delete

```typescript
const [deleted] = await db
  .delete(posts)
  .where(and(eq(posts.id, postId), eq(posts.authorId, userId)))
  .returning({ id: posts.id });
```

## Transactions

```typescript
// Always use transactions for multi-step mutations
const result = await db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values({ email, name }).returning();

  const [profile] = await tx
    .insert(profiles)
    .values({ userId: user.id, bio: "" })
    .returning();

  return { user, profile };
});

// Transaction with rollback on error
try {
  await db.transaction(async (tx) => {
    await tx
      .update(accounts)
      .set({ balance: sql`balance - ${amount}` })
      .where(eq(accounts.id, fromId));
    await tx
      .update(accounts)
      .set({ balance: sql`balance + ${amount}` })
      .where(eq(accounts.id, toId));
  });
} catch (err) {
  // tx auto-rolled back
  throw err;
}
```

## Prepared Statements

```typescript
// Prepare once, execute many (better performance for repeated queries)
import { placeholder } from "drizzle-orm";

const getUserById = db
  .select()
  .from(users)
  .where(eq(users.id, placeholder("id")))
  .prepare("get_user_by_id");

// Execute
const user = await getUserById.execute({ id: userId });
```

## Aggregations

```typescript
import { count, sum, avg, max, min } from "drizzle-orm";

const stats = await db
  .select({
    total: count(),
    avgAge: avg(users.age),
  })
  .from(users)
  .where(eq(users.role, "member"));

// Count with group by
const postCountByUser = await db
  .select({
    authorId: posts.authorId,
    postCount: count(posts.id),
  })
  .from(posts)
  .groupBy(posts.authorId)
  .having(sql`count(${posts.id}) > 5`);
```

## Pagination

```typescript
// Offset-based (simple, less efficient for large datasets)
async function getPostsPage(page: number, pageSize = 20) {
  const offset = (page - 1) * pageSize;

  const [data, [{ total }]] = await Promise.all([
    db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ total: count() }).from(posts),
  ]);

  return {
    data,
    total: Number(total),
    pages: Math.ceil(Number(total) / pageSize),
  };
}

// Cursor-based (scalable for infinite scroll)
async function getPostsCursor(cursor?: string, limit = 20) {
  const data = await db
    .select()
    .from(posts)
    .where(cursor ? lt(posts.createdAt, new Date(cursor)) : undefined)
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1); // fetch one extra to detect next page

  const hasMore = data.length > limit;
  return {
    data: hasMore ? data.slice(0, -1) : data,
    nextCursor: hasMore ? data[limit - 1].createdAt.toISOString() : null,
  };
}
```

## drizzle-kit Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Push schema directly (dev only)
pnpm drizzle-kit push

# Studio (browser UI)
pnpm drizzle-kit studio
```

## Indexing

```typescript
import {
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("posts_author_idx").on(table.authorId),
    index("posts_status_created_idx").on(table.status, table.createdAt),
  ],
);
```

## Raw SQL (escape hatch)

```typescript
import { sql } from "drizzle-orm";

// Raw expression in query
const results = await db
  .select({
    id: users.id,
    nameUpper: sql<string>`upper(${users.name})`,
  })
  .from(users);

// Full raw query (parameterized — safe from injection)
const result = await db.execute(
  sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`,
);
```

## Common Pitfalls

- **N+1 queries**: use `db.query.*` with `with:` instead of looping and querying per row
- **Missing `.returning()`**: `insert/update/delete` return empty array without it
- **Transaction scope**: don't use `db.` inside `db.transaction(async (tx) => {})` — use `tx.` only
- **Schema drift**: always run `drizzle-kit generate` after schema changes, never edit migrations manually
- **Type narrowing**: `findFirst()` returns `T | undefined`, always null-check the result
