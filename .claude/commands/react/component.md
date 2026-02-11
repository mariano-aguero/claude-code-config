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
- `--with-test` - Generate test file alongside

## Template

When generating a component, follow this structure:

```tsx
// For client components
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ${ComponentName}Props {
  className?: string;
  children?: React.ReactNode;
}

export function ${ComponentName}({ className, children }: ${ComponentName}Props) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
}
```

## Examples

### Basic Component
```
/component Button
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

## Best Practices Applied

1. Use `cn()` utility for className merging
2. Always type props with interface
3. Export named functions (not default)
4. Include className prop for styling flexibility
5. Use Tailwind for all styling
6. Add forwardRef when component wraps native elements

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Add the new component to the "Components" or "Architecture" section
2. Document the component's purpose and usage
3. Update the project structure if a new directory was created
