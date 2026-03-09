# /feature - Generate Complete Feature

Generate a complete feature with components, hooks, types, and tests.

## Usage

```
/feature <FeatureName> [options]
```

## Options

- `--with-api` - Include API route/server action
- `--with-store` - Include Zustand store
- `--with-tests` - Include test files
- `--crud` - Generate CRUD operations
- `--list` - List view with pagination
- `--form` - Form with validation

## Generated Structure

```
features/
└── <feature-name>/
    ├── components/
    │   ├── <feature>-list.tsx
    │   ├── <feature>-card.tsx
    │   ├── <feature>-form.tsx
    │   └── <feature>-details.tsx
    ├── hooks/
    │   ├── use-<feature>s.ts
    │   ├── use-<feature>.ts
    │   └── use-<feature>-mutations.ts
    ├── types/
    │   └── index.ts
    ├── api/
    │   └── actions.ts
    └── __tests__/
        ├── <feature>-list.test.tsx
        └── use-<feature>s.test.ts
```

## Templates

### Types

```tsx
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

### Query Hooks

```tsx
// features/<feature>/hooks/use-<feature>s.ts
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { ${Feature}, ${Feature}Filters } from "../types";

export const ${feature}Keys = {
  all: ["${feature}s"] as const,
  lists: () => [...${feature}Keys.all, "list"] as const,
  list: (filters: ${Feature}Filters) => [...${feature}Keys.lists(), filters] as const,
  details: () => [...${feature}Keys.all, "detail"] as const,
  detail: (id: string) => [...${feature}Keys.details(), id] as const,
};

// Keep fetch functions in a separate api/ file (e.g. api/${feature}s.ts) and import here.
// This prevents calling raw fetch directly from components and keeps queryFns reusable.
async function fetch${Feature}s(filters: ${Feature}Filters): Promise<${Feature}[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));

  const response = await fetch(`/api/${feature}s?${params}`);
  if (!response.ok) throw new Error("Failed to fetch ${feature}s");
  return response.json();
}

export function use${Feature}s(filters: ${Feature}Filters = {}) {
  return useQuery({
    queryKey: ${feature}Keys.list(filters),
    queryFn: () => fetch${Feature}s(filters),
  });
}

export function use${Feature}(id: string) {
  return useQuery({
    queryKey: ${feature}Keys.detail(id),
    queryFn: () => fetch${Feature}(id),
    enabled: !!id,
  });
}
```

### Mutation Hooks

```tsx
// features/<feature>/hooks/use-<feature>-mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ${feature}Keys } from "./use-${feature}s";
import { Create${Feature}Input, Update${Feature}Input } from "../types";

export function useCreate${Feature}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Create${Feature}Input) => {
      const response = await fetch("/api/${feature}s", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to create");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ${feature}Keys.lists() });
    },
  });
}

export function useUpdate${Feature}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Update${Feature}Input) => {
      const response = await fetch(`/api/${feature}s/${input.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ${feature}Keys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ${feature}Keys.lists() });
    },
  });
}

export function useDelete${Feature}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/${feature}s/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ${feature}Keys.lists() });
    },
  });
}
```

### List Component

```tsx
// features/<feature>/components/<feature>-list.tsx
"use client";

import { use${Feature}s } from "../hooks/use-${feature}s";
import { ${Feature}Card } from "./${feature}-card";
import { Skeleton } from "@/components/ui/skeleton";

export function ${Feature}List() {
  const { data: ${feature}s, isLoading, error } = use${Feature}s();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={`skeleton-${i}`} className="h-32" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Error: {error.message}</div>;
  }

  if (!${feature}s?.length) {
    return <div className="text-muted-foreground">No ${feature}s found</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {${feature}s.map((${feature}) => (
        <${Feature}Card key={${feature}.id} ${feature}={${feature}} />
      ))}
    </div>
  );
}
```

### Form Component

```tsx
// features/<feature>/components/<feature>-form.tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { useCreate${Feature} } from "../hooks/use-${feature}-mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

interface ${Feature}FormProps {
  onSuccess?: () => void;
}

export function ${Feature}Form({ onSuccess }: ${Feature}FormProps) {
  const createMutation = useCreate${Feature}();

  const form = useForm({
    defaultValues: { name: "" },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync(value);
      form.reset();
      onSuccess?.();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field name="name">
        {(field) => (
          <div className="space-y-1">
            <Label htmlFor={field.name}>Name</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter name..."
            />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <Button type="submit" disabled={createMutation.isPending || form.state.isSubmitting}>
        {createMutation.isPending ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
```

## Examples

```
/feature User --crud --with-tests
/feature Product --list --form --with-api
/feature Order --with-store --crud
```

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Add the new feature to the "Features" or "Architecture" section
2. Document the feature's components, hooks, and API endpoints
3. Update the project structure with the new feature directory
4. Add any new environment variables if required
