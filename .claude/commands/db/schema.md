# /db/schema - Generate Drizzle Schema

Generate a Drizzle ORM schema with TypeScript types, relations, and indexes.

## Usage

```
/db/schema <table-name> [options]
```

## Options

- `--with-timestamps` - Add createdAt/updatedAt columns (default: true)
- `--with-soft-delete` - Add deletedAt column for soft deletes
- `--belongs-to=<table>` - Add foreign key relation
- `--has-many=<table>` - Define has-many relation
- `--with-enum=<name:value1,value2>` - Add enum column

## Template

```typescript
// src/db/schema/${tableName}.ts
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const ${tableName} = pgTable(
  "${table_name}",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    // Add your columns here
    name: text("name").notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // Drizzle v0.38+: index array form
    index("${table_name}_name_idx").on(t.name),
  ],
);

// Type inference
export type ${TableName} = typeof ${tableName}.$inferSelect;
export type New${TableName} = typeof ${tableName}.$inferInsert;

// Relations (if any)
export const ${tableName}Relations = relations(${tableName}, ({ one, many }) => ({
  // Define relations here
}));
```

## With Foreign Key

```typescript
// src/db/schema/posts.ts
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const posts = pgTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text("title").notNull(),
    content: text("content").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("posts_user_id_idx").on(t.userId),
    index("posts_created_at_idx").on(t.createdAt),
  ],
);

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
}));
```

## With Enum

```typescript
// src/db/schema/orders.ts
import { pgTable, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const orders = pgTable(
  "orders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    status: orderStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("orders_status_idx").on(t.status)],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderStatus = (typeof orders.$inferSelect)["status"];
```

## With Soft Delete

```typescript
// src/db/schema/users.ts
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { isNull } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("users_email_idx").on(t.email),
    index("users_deleted_at_idx").on(t.deletedAt),
  ],
);

// Helper to filter soft-deleted rows:
// db.query.users.findMany({ where: isNull(users.deletedAt) })
```

## Examples

```
/db/schema products
/db/schema posts --belongs-to=users --has-many=comments
/db/schema orders --with-enum=status:pending,processing,shipped,delivered
/db/schema users --with-soft-delete
```

## File Location

- Schemas go in `src/db/schema/<table>.ts`
- Export from `src/db/schema/index.ts`
- Import in `src/db/index.ts` for the Drizzle client

## Rules

1. `createId()` from `@paralleldrive/cuid2` for IDs — not `uuid().defaultRandom()`
2. `{ withTimezone: true }` on ALL timestamps — never omit it
3. `$onUpdate(() => new Date())` for updatedAt — not a trigger
4. Index array form: `(t) => [index("name").on(t.col)]` — Drizzle v0.38+
5. Always export `$inferSelect` and `$inferInsert` types
6. Always export relations even if empty — required for relational queries
