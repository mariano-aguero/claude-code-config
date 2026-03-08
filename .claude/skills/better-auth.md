---
name: better-auth
description: Better Auth integration patterns for TypeScript applications. Use when implementing authentication, session management, OAuth providers, or route protection with Better Auth. Never use NextAuth, Auth.js, Lucia, or custom JWT implementations — Better Auth is the confirmed auth library.
---

# Better Auth Patterns

Better Auth is a TypeScript-first auth library. The server exports a typed `auth` object used for both server-side handling and client inference — no separate type definitions needed.

## Installation

```bash
pnpm add better-auth
```

## Server Setup

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // rotate every 24h
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

## API Route Handler (Next.js App Router)

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

## Client Setup

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

// Destructure for convenience
export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;
```

## Session in Server Components

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  return <div>Hello {session.user.name}</div>;
}
```

## Session in Client Components

```tsx
"use client";
import { useSession } from "@/lib/auth-client";

export function UserMenu() {
  const { data: session, isPending } = useSession();

  if (isPending) return <Skeleton />;
  if (!session) return <SignInButton />;

  return <UserAvatar user={session.user} />;
}
```

## Middleware Route Protection (Next.js)

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_ROUTES = ["/dashboard", "/settings", "/api/protected"];

export async function middleware(request: NextRequest) {
  const isProtected = PROTECTED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!isProtected) return NextResponse.next();

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
```

## Sign In / Sign Up (Client)

```tsx
"use client";
import { signIn, signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const { error } = await signIn.email({
      email: data.get("email") as string,
      password: data.get("password") as string,
    });

    if (error) {
      // handle error
      return;
    }

    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Sign In</button>
    </form>
  );
}

// OAuth sign in
async function handleGoogleSignIn() {
  await signIn.social({ provider: "google", callbackURL: "/dashboard" });
}
```

## Sign Out

```tsx
"use client";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await signOut();
        router.push("/");
      }}
    >
      Sign out
    </button>
  );
}
```

## Database Schema (Drizzle)

Better Auth auto-generates the schema. Run the migration tool:

```bash
pnpm dlx @better-auth/cli generate --output ./db/schema/auth.ts
pnpm drizzle-kit push
```

The generated tables: `user`, `session`, `account`, `verification`.

## Role-Based Access Control (RBAC Plugin)

```typescript
import { betterAuth } from "better-auth";
import { rbac } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    rbac({
      roles: {
        admin: { permissions: ["*"] },
        member: { permissions: ["read:posts", "write:own-posts"] },
      },
    }),
  ],
});

// Check permission in server
const session = await auth.api.getSession({ headers });
const hasPermission = await auth.api.hasPermission({
  headers,
  body: { permission: "write:own-posts" },
});
```

## Environment Variables

```bash
BETTER_AUTH_SECRET=                # 32+ random chars — required
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DATABASE_URL=
```

## Common Pitfalls

- Always pass `headers: await headers()` in Server Components — auth reads cookies from headers
- `useSession()` returns `{ data, isPending, error }` — check `isPending` before rendering
- The `[...all]` API route must be at `/api/auth/[...all]` (default base path)
- Don't call `auth.api.*` in Client Components — use `authClient.*` instead
