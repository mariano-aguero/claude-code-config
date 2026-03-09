# /feature - Generate Complete Feature

Generate a complete feature scaffold with all 5 layers: Server Component, Client Component, Server Action, TanStack Query hook, and Types.

## Usage

```
/feature <FeatureName> [options]
```

## Options

- `--with-store` - Include Zustand store
- `--with-tests` - Include test files
- `--crud` - Generate CRUD operations
- `--list` - List view with pagination

## Generated Structure

```
features/
└── <feature-name>/
    ├── page.tsx              # Layer 1: Server Component (RSC page/section)
    ├── components/
    │   ├── <feature>-list.tsx    # Layer 2: Client Component (interactive)
    │   └── <feature>-form.tsx    # Layer 2: Client Component (form)
    ├── actions.ts            # Layer 3: Server Actions (mutations)
    ├── hooks/
    │   └── use-<feature>s.ts     # Layer 4: TanStack Query (client reads)
    └── types/
        └── index.ts          # Layer 5: Types
```

## Layer 1: Server Component (page/section)

```tsx
// app/<feature>/page.tsx
import { db } from "@/db";
import { items } from "@/db/schema";
import { ${Feature}List } from "@/features/<feature>/components/<feature>-list";

// Server Component: fetch data directly, no useEffect, no loading state needed here
export default async function ${Feature}Page() {
  const initial${Feature}s = await db.query.${feature}s.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit: 20,
  });

  return (
    <main className="container py-8">
      <h1 className="text-2xl font-semibold mb-6">${Feature}s</h1>
      {/* Pass initial data to client component for hydration */}
      <${Feature}List initial={initial${Feature}s} />
    </main>
  );
}
```

## Layer 2: Client Component (interactive parts)

```tsx
// features/<feature>/components/<feature>-list.tsx
"use client";

import { use${Feature}s } from "../hooks/use-<feature>s";
import { ${Feature}Card } from "./<feature>-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ${Feature} } from "../types";

interface ${Feature}ListProps {
  initial: ${Feature}[];
}

export function ${Feature}List({ initial }: ${Feature}ListProps) {
  // initialData hydrates the cache — no extra fetch on mount
  const { data: ${feature}s, isLoading, error } = use${Feature}s({ initialData: initial });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={`skeleton-${i}`} className="h-32" />
        ))}
      </div>
    );
  }

  if (error) return <p className="text-destructive">Error: {error.message}</p>;
  if (!${feature}s?.length) return <p className="text-muted-foreground">No ${feature}s yet.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {${feature}s.map((item) => (
        <${Feature}Card key={item.id} ${feature}={item} />
      ))}
    </div>
  );
}
```

## Layer 3: Server Actions (mutations)

```ts
// features/<feature>/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ${feature}s } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Create${Feature}Input } from "./types";

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function create${Feature}(input: Create${Feature}Input) {
  const data = createSchema.parse(input);
  const [item] = await db.insert(${feature}s).values(data).returning();
  revalidatePath("/<feature>s");
  return item;
}

export async function delete${Feature}(id: string) {
  await db.delete(${feature}s).where(eq(${feature}s.id, id));
  revalidatePath("/<feature>s");
}
```

## Layer 4: TanStack Query Hook (client reads)

```ts
// features/<feature>/hooks/use-<feature>s.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ${Feature} } from "../types";

export const ${feature}Keys = {
  all: ["${feature}s"] as const,
  lists: () => [...${feature}Keys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...${feature}Keys.lists(), filters] as const,
  detail: (id: string) => [...${feature}Keys.all, "detail", id] as const,
};

async function fetch${Feature}s(): Promise<${Feature}[]> {
  const res = await fetch("/api/${feature}s");
  if (!res.ok) throw new Error("Failed to fetch ${feature}s");
  return res.json();
}

interface Use${Feature}sOptions {
  initialData?: ${Feature}[];
}

export function use${Feature}s(options: Use${Feature}sOptions = {}) {
  return useQuery({
    queryKey: ${feature}Keys.list(),
    queryFn: fetch${Feature}s,
    initialData: options.initialData,
  });
}

export function useCreate${Feature}() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const res = await fetch("/api/${feature}s", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json() as Promise<${Feature}>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ${feature}Keys.lists() });
    },
  });
}

export function useDelete${Feature}() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/${feature}s/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ${feature}Keys.lists() });
    },
  });
}
```

## Layer 5: Types

```ts
// features/<feature>/types/index.ts
export interface ${Feature} {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Create${Feature}Input {
  name: string;
}

export interface Update${Feature}Input {
  id: string;
  name?: string;
}

export interface ${Feature}Filters {
  search?: string;
  page?: number;
  limit?: number;
}
```

## RSC → Client Boundary Rules

- **Server Components**: fetch from DB directly, pass data as props, no hooks
- **Client Components**: `"use client"`, use TanStack Query with `initialData` from RSC
- **Server Actions**: `"use server"`, mutate DB, call `revalidatePath`
- **Query hooks**: client-side reads, separate from mutations, `initialData` prevents double fetch
- Never `fetch()` from a Server Component into a Client Component — pass data as props

## Examples

```
/feature User --crud --with-tests
/feature Product --list --with-store
/feature Order --crud
```

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Add the new feature to the "Features" or "Architecture" section
2. Document the feature's components, hooks, actions, and API endpoints
3. Update the project structure with the new feature directory
