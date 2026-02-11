---
name: database-patterns
description: Database patterns with Drizzle ORM for PostgreSQL. Use when designing schemas, writing migrations, optimizing queries, or implementing data access patterns. Triggers on Drizzle, PostgreSQL, migrations, and database design.
---

# Database Patterns with Drizzle ORM

## Schema Definition

### Basic Tables

```typescript
// src/db/schema/users.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'user', 'guest']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: roleEnum('role').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  loginCount: integer('login_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Infer types from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Relations

```typescript
// src/db/schema/posts.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content'),
  slug: text('slug').notNull().unique(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  tags: many(postTags),
}));

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));
```

### Many-to-Many Relations

```typescript
// src/db/schema/tags.ts
import { pgTable, text, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

export const postTags = pgTable('post_tags', {
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  posts: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}));
```

### Indexes

```typescript
import { pgTable, text, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  authorId: uuid('author_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Single column index
  authorIdx: index('posts_author_idx').on(table.authorId),
  // Descending index for sorting
  createdAtIdx: index('posts_created_at_idx').on(table.createdAt.desc()),
  // Unique index
  slugIdx: uniqueIndex('posts_slug_idx').on(table.slug),
  // Composite index
  authorCreatedIdx: index('posts_author_created_idx').on(table.authorId, table.createdAt),
}));
```

## Database Client

### Setup

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
```

### With Neon (Serverless)

```typescript
// src/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

## Queries

### Basic CRUD

```typescript
import { eq, and, or, like, desc, asc, sql } from 'drizzle-orm';
import { db } from './db';
import { users, posts } from './db/schema';

// Select all
const allUsers = await db.select().from(users);

// Select with where
const activeUsers = await db
  .select()
  .from(users)
  .where(eq(users.isActive, true));

// Select specific columns
const userEmails = await db
  .select({ id: users.id, email: users.email })
  .from(users);

// Insert
const [newUser] = await db
  .insert(users)
  .values({ email: 'john@example.com', name: 'John' })
  .returning();

// Insert multiple
await db.insert(users).values([
  { email: 'a@example.com', name: 'A' },
  { email: 'b@example.com', name: 'B' },
]);

// Update
await db
  .update(users)
  .set({ name: 'John Doe', updatedAt: new Date() })
  .where(eq(users.id, userId));

// Delete
await db.delete(users).where(eq(users.id, userId));
```

### Query with Relations

```typescript
// Find one with relations
const userWithPosts = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    posts: {
      orderBy: desc(posts.createdAt),
      limit: 10,
    },
  },
});

// Find many with nested relations
const postsWithDetails = await db.query.posts.findMany({
  with: {
    author: true,
    comments: {
      with: { author: true },
      orderBy: desc(comments.createdAt),
    },
    tags: {
      with: { tag: true },
    },
  },
  orderBy: desc(posts.createdAt),
  limit: 20,
});
```

### Complex Where Clauses

```typescript
import { eq, and, or, like, gte, lte, inArray, isNull, isNotNull } from 'drizzle-orm';

// AND conditions
const results = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.isActive, true),
      eq(users.role, 'admin')
    )
  );

// OR conditions
const results = await db
  .select()
  .from(users)
  .where(
    or(
      eq(users.role, 'admin'),
      eq(users.role, 'user')
    )
  );

// LIKE (pattern matching)
const results = await db
  .select()
  .from(users)
  .where(like(users.email, '%@gmail.com'));

// IN array
const results = await db
  .select()
  .from(users)
  .where(inArray(users.id, ['id1', 'id2', 'id3']));

// Date range
const results = await db
  .select()
  .from(posts)
  .where(
    and(
      gte(posts.createdAt, startDate),
      lte(posts.createdAt, endDate)
    )
  );

// NULL checks
const drafts = await db
  .select()
  .from(posts)
  .where(isNull(posts.publishedAt));
```

### Pagination

```typescript
// Offset pagination
async function getUsers(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;

  const [data, [{ count }]] = await Promise.all([
    db.select().from(users).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(users),
  ]);

  return {
    data,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
}

// Cursor pagination (more efficient for large datasets)
async function getPostsCursor(cursor?: string, limit = 20) {
  const query = db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1);

  if (cursor) {
    const [cursorDate, cursorId] = cursor.split('_');
    query.where(
      or(
        sql`${posts.createdAt} < ${cursorDate}`,
        and(
          eq(posts.createdAt, new Date(cursorDate)),
          sql`${posts.id} < ${cursorId}`
        )
      )
    );
  }

  const results = await query;
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, -1) : results;

  return {
    data,
    nextCursor: hasMore
      ? `${data[data.length - 1].createdAt.toISOString()}_${data[data.length - 1].id}`
      : null,
  };
}
```

### Transactions

```typescript
import { db } from './db';

// Basic transaction
const result = await db.transaction(async (tx) => {
  const [user] = await tx
    .insert(users)
    .values({ email, name })
    .returning();

  await tx
    .insert(posts)
    .values({ title: 'First Post', authorId: user.id });

  return user;
});

// Transaction with rollback
try {
  await db.transaction(async (tx) => {
    await tx.update(accounts).set({ balance: sql`balance - 100` }).where(eq(accounts.id, fromId));
    await tx.update(accounts).set({ balance: sql`balance + 100` }).where(eq(accounts.id, toId));

    // Verify balance didn't go negative
    const [from] = await tx.select().from(accounts).where(eq(accounts.id, fromId));
    if (from.balance < 0) {
      throw new Error('Insufficient balance');
    }
  });
} catch (error) {
  // Transaction automatically rolled back
  console.error('Transfer failed:', error);
}
```

### Aggregations

```typescript
import { sql, count, sum, avg, min, max } from 'drizzle-orm';

// Count
const [{ total }] = await db
  .select({ total: count() })
  .from(users);

// Count with condition
const [{ activeCount }] = await db
  .select({ activeCount: count() })
  .from(users)
  .where(eq(users.isActive, true));

// Group by
const postsByAuthor = await db
  .select({
    authorId: posts.authorId,
    postCount: count(),
  })
  .from(posts)
  .groupBy(posts.authorId);

// With having
const prolificAuthors = await db
  .select({
    authorId: posts.authorId,
    postCount: count(),
  })
  .from(posts)
  .groupBy(posts.authorId)
  .having(sql`count(*) > 5`);
```

## Migrations

### drizzle.config.ts

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Commands

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Apply pending migrations
pnpm drizzle-kit migrate

# Push schema directly (development only)
pnpm drizzle-kit push

# Open Drizzle Studio
pnpm drizzle-kit studio

# Drop all tables (dangerous!)
pnpm drizzle-kit drop
```

### Safe Migration Patterns

```sql
-- Adding a column (safe)
ALTER TABLE users ADD COLUMN phone text;

-- Adding NOT NULL column (requires default or backfill)
ALTER TABLE users ADD COLUMN phone text NOT NULL DEFAULT '';

-- Renaming column (can break queries)
-- Better: add new column, migrate data, drop old column
ALTER TABLE users ADD COLUMN full_name text;
UPDATE users SET full_name = name;
ALTER TABLE users DROP COLUMN name;
ALTER TABLE users RENAME COLUMN full_name TO name;

-- Adding index concurrently (doesn't lock table)
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

## Repository Pattern

```typescript
// src/repositories/user.repository.ts
import { eq } from 'drizzle-orm';
import { db, Database } from '@/db';
import { users, User, NewUser } from '@/db/schema';

export class UserRepository {
  constructor(private db: Database = db) {}

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user ?? null;
  }

  async create(data: NewUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(data)
      .returning();
    return user;
  }

  async update(id: string, data: Partial<NewUser>): Promise<User | null> {
    const [user] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(users)
      .where(eq(users.id, id));
    return result.rowCount > 0;
  }
}

export const userRepository = new UserRepository();
```

## Soft Delete Pattern

```typescript
// Schema with soft delete
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  // ... other fields
});

// Query helpers
export const isNotDeleted = isNull(users.deletedAt);

// Usage
const activeUsers = await db
  .select()
  .from(users)
  .where(isNotDeleted);

// Soft delete
await db
  .update(users)
  .set({ deletedAt: new Date() })
  .where(eq(users.id, userId));

// Restore
await db
  .update(users)
  .set({ deletedAt: null })
  .where(eq(users.id, userId));
```
