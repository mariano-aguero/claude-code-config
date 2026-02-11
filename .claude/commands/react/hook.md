# /hook - Generate Custom React Hook

Generate a custom React hook with proper TypeScript typing and best practices.

## Usage

```
/hook <hookName> [options]
```

## Options

- `--query` - TanStack Query hook for data fetching
- `--mutation` - TanStack Query mutation hook
- `--state` - Local state management hook
- `--zustand` - Zustand store hook
- `--form` - Form handling hook
- `--with-test` - Generate test file

## Templates

### Query Hook (Data Fetching)

```tsx
import { useQuery } from "@tanstack/react-query";

interface ${Entity} {
  id: string;
  // ... fields
}

async function fetch${Entity}s(): Promise<${Entity}[]> {
  const response = await fetch("/api/${entity}s");
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
}

export function use${Entity}s() {
  return useQuery({
    queryKey: ["${entity}s"],
    queryFn: fetch${Entity}s,
  });
}

export function use${Entity}(id: string) {
  return useQuery({
    queryKey: ["${entity}", id],
    queryFn: () => fetch${Entity}(id),
    enabled: !!id,
  });
}
```

### Mutation Hook

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Create${Entity}Input {
  // ... fields
}

async function create${Entity}(input: Create${Entity}Input): Promise<${Entity}> {
  const response = await fetch("/api/${entity}s", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Failed to create");
  return response.json();
}

export function useCreate${Entity}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: create${Entity},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["${entity}s"] });
    },
  });
}
```

### Zustand Store

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ${Store}State {
  // State
  items: Item[];
  selectedId: string | null;

  // Actions
  setItems: (items: Item[]) => void;
  selectItem: (id: string | null) => void;
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
}

export const use${Store}Store = create<${Store}State>()(
  persist(
    (set) => ({
      items: [],
      selectedId: null,

      setItems: (items) => set({ items }),
      selectItem: (id) => set({ selectedId: id }),
      addItem: (item) => set((state) => ({
        items: [...state.items, item]
      })),
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id)
      })),
    }),
    {
      name: "${store}-storage",
    }
  )
);
```

### Local State Hook

```tsx
import { useState, useCallback } from "react";

interface Use${Hook}Options {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export function use${Hook}(options: Use${Hook}Options = {}) {
  const { initialValue = "", onChange } = options;
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    setError(null);
    onChange?.(newValue);
  }, [onChange]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
  }, [initialValue]);

  return {
    value,
    error,
    setValue: handleChange,
    setError,
    reset,
  };
}
```

## Examples

```
/hook useUsers --query
/hook useCreatePost --mutation
/hook useCart --zustand
/hook useDebounce --state
```

## File Location

- Hooks go in `hooks/` directory
- Name files as `use-<name>.ts` (kebab-case)
- One hook per file, or group related hooks

## Best Practices

1. Always prefix with `use`
2. Return object for multiple values (not array)
3. Memoize callbacks with useCallback
4. Include cleanup in useEffect
5. Type all parameters and return values

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Add the new hook to the "Hooks" or "Architecture" section
2. Document the hook's purpose, parameters, and return values
3. Add usage examples if the hook has complex behavior
