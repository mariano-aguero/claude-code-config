# /page - Generate Next.js Page

Generate a Next.js App Router page with layout, loading, and error handling.

## Usage

```
/page <path> [options]
```

## Options

- `--with-layout` - Include layout.tsx
- `--with-loading` - Include loading.tsx
- `--with-error` - Include error.tsx
- `--with-all` - Include all (layout, loading, error)
- `--dynamic` - Dynamic route with [param]
- `--parallel` - Parallel route with @slot
- `--protected` - Add auth check in layout

## Templates

### Page Component

```tsx
// app/<path>/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "${PageTitle}",
  description: "${description}",
};

interface ${Page}PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ${Page}Page({ params, searchParams }: ${Page}PageProps) {
  // Fetch data here (Server Component)
  const { id } = await params;
  const data = await getData(id);

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">${PageTitle}</h1>
      {/* Content */}
    </main>
  );
}
```

### Layout

```tsx
// app/<path>/layout.tsx
interface ${Page}LayoutProps {
  children: React.ReactNode;
}

export default function ${Page}Layout({ children }: ${Page}LayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
```

### Protected Layout

```tsx
// app/<path>/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface ${Page}LayoutProps {
  children: React.ReactNode;
}

export default async function ${Page}Layout({ children }: ${Page}LayoutProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}
```

### Loading State

```tsx
// app/<path>/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function ${Page}Loading() {
  return (
    <main className="container mx-auto py-8">
      <Skeleton className="h-10 w-64 mb-6" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </main>
  );
}
```

### Error Boundary

```tsx
// app/<path>/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ${Page}Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container mx-auto py-8">
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-muted-foreground mb-6">{error.message}</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
```

### Not Found

```tsx
// app/<path>/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ${Page}NotFound() {
  return (
    <main className="container mx-auto py-8">
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold mb-4">Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The requested resource could not be found.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </main>
  );
}
```

## Examples

```
/page dashboard --with-all --protected
/page users/[id] --dynamic --with-loading
/page settings --with-layout
```

## File Structure Generated

```
app/
└── dashboard/
    ├── page.tsx
    ├── layout.tsx
    ├── loading.tsx
    ├── error.tsx
    └── not-found.tsx
```

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Add the new route to the "Routes" or "Pages" section
2. Document any authentication requirements or middleware
3. Update the project structure with the new page hierarchy
