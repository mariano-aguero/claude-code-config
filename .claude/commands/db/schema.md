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
  uuid,
  boolean,
  integer,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const ${tableName} = pgTable('${table_name}', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Add your columns here
  name: text('name').notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  // Indexes
  index('${table_name}_name_idx').on(table.name),
]);

// Type inference
export type ${TableName} = typeof ${tableName}.$inferSelect;
export type New${TableName} = typeof ${tableName}.$inferInsert;

// Relations (if any)
export const ${tableName}Relations = relations(${tableName}, ({ one, many }) => ({
  // Define relations here
}));
```

## Examples

### Basic Table

```
/db/schema products
```

### With Relations

```
/db/schema posts --belongs-to=users --has-many=comments
```

### With Enum

```
/db/schema orders --with-enum=status:pending,processing,shipped,delivered
```

### With Soft Delete

```
/db/schema users --with-soft-delete
```

## File Location

- Schemas go in `src/db/schema/<table>.ts`
- Export from `src/db/schema/index.ts`
- Import in `src/db/index.ts` for client

## Best Practices Applied

1. UUID primary keys for distributed systems
2. Timestamps with timezone
3. Inferred TypeScript types
4. Strategic indexes on query columns
5. Proper foreign key constraints
6. Soft delete support when needed
