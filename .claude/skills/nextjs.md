---
name: nextjs-app-router
description: Next.js 16+ App Router patterns including Server Components, Client Components, Server Actions, Route Handlers, Cache Components, TanStack Query, and TanStack Form integration. Use when building Next.js applications, implementing data fetching, creating API routes, building forms, or optimizing with Turbopack and PPR. Triggers on tasks involving Next.js pages, layouts, middleware, metadata, use cache, forms, or server/client component decisions. Use TanStack Query for client data fetching and TanStack Form for complex forms.
---

# Next.js Best Practices

## App Router (Next.js 16+)

### File Structure

```
app/
├── layout.tsx          # Root layout (required)
├── page.tsx            # Home page
├── loading.tsx         # Loading UI
├── error.tsx           # Error boundary
├── not-found.tsx       # 404 page
├── (auth)/             # Route group (no URL segment)
│   ├── login/page.tsx
│   └── register/page.tsx
├── dashboard/
│   ├── layout.tsx      # Nested layout
│   ├── page.tsx
│   └── [id]/page.tsx   # Dynamic route
└── api/
    └── route.ts        # API route handler
```

### Server vs Client Components

**Server Components (default)**

- Fetch data directly
- Access backend resources
- Keep sensitive info on server
- Reduce client bundle size

```tsx
// app/users/page.tsx - Server Component by default
async function UsersPage() {
  const users = await db.select().from(users); // Direct DB access
  return <UserList users={users} />;
}
```

**Client Components**

- Use `"use client"` directive
- For interactivity, hooks, browser APIs

```tsx
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

### Data Fetching Strategy

| Location         | Use Case                   | Solution                           |
| ---------------- | -------------------------- | ---------------------------------- |
| Server Component | Initial page data          | Direct `fetch` or DB query         |
| Client Component | Interactive/real-time data | **TanStack Query** (NOT raw fetch) |
| Server Action    | Mutations                  | `"use server"` functions           |

**Server Components with async/await (for initial data)**

```tsx
async function Page() {
  const res = await fetch("https://api.example.com/data", {
    next: { revalidate: 3600 }, // ISR: revalidate every hour
  });
  const data = await res.json();
  return <Component data={data} />;
}
```

**Client Components: ALWAYS use TanStack Query**

```tsx
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Never use raw fetch/axios in client components
// Always use TanStack Query for caching, deduplication, and loading states
```

**Parallel Data Fetching**

```tsx
async function Page() {
  // Start both requests in parallel
  const userPromise = getUser();
  const postsPromise = getPosts();

  const [user, posts] = await Promise.all([userPromise, postsPromise]);
  return <Dashboard user={user} posts={posts} />;
}
```

### Route Handlers (API Routes)

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  const allUsers = await db.select().from(users);
  return NextResponse.json(allUsers);
}

export async function POST(request: NextRequest) {
  const CreateUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  });
  const data = CreateUserSchema.parse(await request.json());
  const [user] = await db.insert(users).values(data).returning();
  return NextResponse.json(user, { status: 201 });
}
```

### Server Actions

```tsx
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

const CreatePostSchema = z.object({
  title: z.string().min(1).max(255),
});

export async function createPost(formData: FormData) {
  const { title } = CreatePostSchema.parse({
    title: formData.get("title"),
  });

  await db.insert(posts).values({ title });
  revalidatePath("/posts");
}

// Usage in component
export function PostForm() {
  return (
    <form action={createPost}>
      <input name="title" />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Async Dynamic APIs (Next.js 15+)

`params`, `searchParams`, `cookies()`, and `headers()` are all async in Next.js 15+.

```tsx
// Dynamic route page — params is a Promise
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  return <UserProfile user={user} query={q} />;
}

// Dynamic metadata — same pattern
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser(id);
  return { title: user.name };
}

// cookies() and headers() are async
import { cookies, headers } from "next/headers";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  return token ? verifyToken(token) : null;
}

export async function getUserAgent() {
  const headersList = await headers();
  return headersList.get("user-agent");
}
```

### `after()` — Post-Response Work

Run side effects (analytics, logging) **after** the response is sent. Does not block the response.

```tsx
import { after } from "next/server";

// In a Server Component or Server Action
export default async function Page() {
  const data = await fetchData();

  // Runs after response is flushed — does not delay it
  after(async () => {
    await analytics.track("page-view", { path: "/dashboard" });
    await logger.info("Dashboard viewed");
  });

  return <Dashboard data={data} />;
}
```

Key rules:

- Requires `experimental.dynamicIO: true` or Next.js 15.1+
- `after()` callbacks run even if the component throws
- Do not use `after()` for critical mutations — it's fire-and-forget

### `"use cache"` Directive (Next.js 15+)

Fine-grained caching for Server Components and data functions. Replaces `fetch` cache options with explicit, composable cache control.

```tsx
// Cache a Server Component
"use cache";

import { cacheTag, cacheLife } from "next/cache";

export async function UserProfile({ userId }: { userId: string }) {
  cacheTag(`user-${userId}`); // tag for targeted revalidation
  cacheLife("hours"); // preset lifetime

  const user = await db.select().from(users).where(eq(users.id, userId));
  return <div>{user.name}</div>;
}
```

```tsx
// Cache a data function
"use cache";

import { cacheTag, cacheLife } from "next/cache";

export async function getProducts(category: string) {
  cacheTag("products", `category-${category}`);
  cacheLife({ revalidate: 3600, expire: 86400 }); // custom: revalidate/1h, expire/1d

  return db.select().from(products).where(eq(products.category, category));
}
```

```tsx
// On-demand revalidation via Server Action
"use server";

import { revalidateTag } from "next/cache";

export async function updateProduct(id: string, data: ProductUpdate) {
  await db.update(products).set(data).where(eq(products.id, id));
  revalidateTag("products"); // invalidate all caches tagged "products"
  revalidateTag(`product-${id}`); // or just the specific entry
}
```

**`cacheLife` presets**

| Preset      | stale | revalidate | expire |
| ----------- | ----- | ---------- | ------ |
| `"seconds"` | 0s    | 1s         | 60s    |
| `"minutes"` | 5m    | 1m         | 1h     |
| `"hours"`   | 5m    | 1h         | 1d     |
| `"days"`    | 1h    | 1d         | 7d     |
| `"weeks"`   | 1d    | 7d         | 30d    |
| `"max"`     | 1d    | 30d        | ∞      |

Key rules:

- `"use cache"` must be the **first statement** in the file or function
- Dynamic data (`cookies()`, `headers()`, `searchParams`) inside a cached function causes a **build error** — extract them above the cache boundary
- `cacheTag` / `cacheLife` must be called at the **top level** of the cached function (not inside conditionals)
- Requires `experimental.dynamicIO: true` in `next.config.ts`

```ts
// next.config.ts
export default {
  experimental: {
    dynamicIO: true,
  },
};
```

### Metadata & SEO

```tsx
// Static metadata
export const metadata = {
  title: "My App",
  description: "App description",
  openGraph: {
    title: "My App",
    images: ["/og-image.png"],
  },
};

// Dynamic metadata
export async function generateMetadata({ params }) {
  const post = await getPost(params.id);
  return {
    title: post.title,
    description: post.excerpt,
  };
}
```

### Middleware

```tsx
// middleware.ts (root level)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Auth check
  const token = request.cookies.get("token");
  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
```

### Image Optimization

```tsx
import Image from "next/image";

export function Avatar({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={64}
      height={64}
      placeholder="blur"
      blurDataURL="data:image/..."
      priority={false} // true for above-the-fold
    />
  );
}
```

### Performance Tips

1. **Use `loading.tsx`** for instant loading states
2. **Streaming with Suspense** for progressive rendering
3. **Route Segments** with `generateStaticParams` for static generation
4. **Parallel Routes** with `@folder` for simultaneous loading
5. **Intercepting Routes** with `(.)folder` for modals

### Common Patterns

**Protected Routes**

```tsx
// app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return <>{children}</>;
}
```

**Error Handling**

```tsx
// app/error.tsx
"use client";

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### TanStack Query Integration

```tsx
// app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create client inside component to avoid sharing between requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Hydration with Server Data**

```tsx
// app/users/page.tsx (Server Component)
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { UserList } from "./user-list";

async function getUsers() {
  const res = await fetch("https://api.example.com/users");
  return res.json();
}

export default async function UsersPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserList />
    </HydrationBoundary>
  );
}
```

```tsx
// app/users/user-list.tsx (Client Component)
"use client";

import { useQuery } from "@tanstack/react-query";

export function UserList() {
  // Uses prefetched data, no loading state on initial render
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

**Server Actions with Mutations**

```tsx
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createUser(data: { name: string; email: string }) {
  const [user] = await db.insert(users).values(data).returning();
  revalidatePath("/users");
  return user;
}
```

```tsx
// app/users/create-user-form.tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { createUser } from "../actions";

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
});

export function CreateUserForm() {
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: { name: "", email: "" },
    validatorAdapter: zodValidator(),
    validators: { onChange: userSchema },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      form.reset();
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
          <div>
            <input
              placeholder="Name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border rounded px-3 py-2"
            />
            {field.state.meta.isTouched && field.state.meta.errors[0] && (
              <p className="text-red-500 text-sm">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>
      <form.Field name="email">
        {(field) => (
          <div>
            <input
              placeholder="Email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border rounded px-3 py-2"
            />
            {field.state.meta.isTouched && field.state.meta.errors[0] && (
              <p className="text-red-500 text-sm">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <button
            type="submit"
            disabled={!canSubmit || mutation.isPending}
            className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {mutation.isPending ? "Creating..." : "Create User"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
```
