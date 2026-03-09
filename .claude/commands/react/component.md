# /component - Generate React Component

Generate a React component with TypeScript, proper typing, and Tailwind CSS styling.

## Usage

```
/component <ComponentName> [options]
```

## Options

- `--client` - Add "use client" directive (default for interactive components)
- `--server` - Server component (default)
- `--with-props` - Generate with detailed props interface
- `--with-state` - Include useState hooks
- `--with-form` - Form component with TanStack Form + Zod
- `--with-query` - Include TanStack Query hook
- `--with-ref` - Accept a ref prop (React 19 — no forwardRef needed)
- `--with-test` - Generate test file alongside

## Template

### Server Component (default)

```tsx
// components/<component-name>.tsx
import { cn } from "@/lib/utils";

interface ${ComponentName}Props {
  className?: string;
  children?: React.ReactNode;
}

export function ${ComponentName}({ className, children }: ${ComponentName}Props) {
  return (
    <section className={cn("", className)}>
      {children}
    </section>
  );
}
```

### Client Component

```tsx
// components/<component-name>.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ${ComponentName}Props {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function ${ComponentName}({ className, children, onClick }: ${ComponentName}Props) {
  const [active, setActive] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setActive((prev) => !prev);
        onClick?.();
      }}
      className={cn("", active && "is-active", className)}
    >
      {children}
    </button>
  );
}
```

### Component with ref (React 19)

```tsx
// components/<component-name>.tsx
"use client";

import { useRef, type Ref } from "react";
import { cn } from "@/lib/utils";

// React 19: ref is a plain prop — no forwardRef needed
interface ${ComponentName}Props {
  ref?: Ref<HTMLDivElement>;
  className?: string;
  children?: React.ReactNode;
}

export function ${ComponentName}({ ref, className, children }: ${ComponentName}Props) {
  return (
    <div ref={ref} className={cn("", className)}>
      {children}
    </div>
  );
}
```

### Form Component (TanStack Form v1)

```tsx
// components/<component-name>-form.tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().min(1, "Required").max(100),
});

interface ${ComponentName}FormProps {
  onSuccess?: (data: z.infer<typeof schema>) => void;
}

export function ${ComponentName}Form({ onSuccess }: ${ComponentName}FormProps) {
  const form = useForm({
    defaultValues: { name: "" },
    validatorAdapter: zodValidator(),
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      onSuccess?.(value);
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
            />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors[0]?.toString()}
              </p>
            )}
          </div>
        )}
      </form.Field>
      <Button type="submit" disabled={form.state.isSubmitting}>
        Submit
      </Button>
    </form>
  );
}
```

## Examples

### Basic Component

```
/component Button
```

### Interactive Client Component

```
/component Dropdown --client --with-state
```

### Component with ref

```
/component Panel --with-ref
```

### Form Component

```
/component LoginForm --with-form
```

### Component with Data Fetching

```
/component UserList --client --with-query
```

## File Location

- Components go in `components/` or `components/ui/` for UI primitives
- Feature components go in `components/features/<feature>/`
- Use kebab-case for file names: `user-profile.tsx`

## Rules

1. `function Comp(props: Props)` — never `React.FC` or `const Comp: FC`
2. `ref` is a plain prop in React 19 — never use `forwardRef`
3. `cn()` for all className merging — never string concatenation
4. Named exports only — never `export default`
5. Semantic HTML elements (`section`, `article`, `nav`, `button`) — not `div` for everything
6. Always include `className?: string` prop for external style flexibility
7. Tailwind v4 — use CSS variables and `data-*` attributes, not arbitrary `[brackets]` by default

## Post-Execution

If this component introduces a significant new pattern or directory structure,
update `CLAUDE.md` to document it — otherwise no update needed.
