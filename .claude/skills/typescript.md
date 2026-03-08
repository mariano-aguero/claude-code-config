---
name: typescript-patterns
description: Advanced TypeScript patterns including generics, conditional types, mapped types, utility types, discriminated unions, and Zod validation. Use when designing type-safe APIs, creating reusable type utilities, implementing complex type inference, or ensuring compile-time safety. Triggers on TypeScript type challenges, generic functions, branded types, or runtime validation with Zod.
---

# TypeScript Best Practices

## Type Definitions

### Prefer `interface` for Objects, `type` for Unions

```typescript
// Interface for object shapes (extendable)
interface User {
  id: string;
  name: string;
  email: string;
}

// Type for unions, intersections, mapped types
type Status = "pending" | "approved" | "rejected";
type Result<T> = { success: true; data: T } | { success: false; error: string };
```

### Use `readonly` for Immutability

```typescript
interface Config {
  readonly apiUrl: string;
  readonly maxRetries: number;
}

// For arrays
type ImmutableList<T> = readonly T[];
const items: ImmutableList<string> = ["a", "b"];
// items.push("c"); // Error!
```

### Generics

```typescript
// Generic function
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Generic with constraints
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Generic interface
interface Repository<T> {
  find(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
```

### Utility Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

// Pick specific properties
type PublicUser = Pick<User, "id" | "name">;

// Omit properties
type UserWithoutPassword = Omit<User, "password">;

// Make all optional
type PartialUser = Partial<User>;

// Make all required
type RequiredUser = Required<User>;

// Make all readonly
type ReadonlyUser = Readonly<User>;

// Record type
type UserRoles = Record<string, "admin" | "user" | "guest">;

// Extract from union
type SuccessStatus = Extract<Status, "approved">;

// Exclude from union
type PendingStatus = Exclude<Status, "approved" | "rejected">;
```

### Discriminated Unions

```typescript
type ApiResponse<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

function handleResponse<T>(response: ApiResponse<T>) {
  switch (response.status) {
    case "loading":
      return "Loading...";
    case "success":
      return response.data; // TypeScript knows data exists
    case "error":
      return response.error; // TypeScript knows error exists
  }
}
```

### Type Guards

```typescript
// Type predicate
function isString(value: unknown): value is string {
  return typeof value === "string";
}

// `in` operator
function isUser(obj: unknown): obj is User {
  return typeof obj === "object" && obj !== null && "email" in obj;
}

// Assertion function
function assertNonNull<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error("Value is null or undefined");
  }
}
```

### Branded Types

```typescript
// Prevent mixing IDs
type UserId = string & { readonly brand: unique symbol };
type PostId = string & { readonly brand: unique symbol };

function createUserId(id: string): UserId {
  return id as UserId;
}

function getUser(id: UserId): User {
  // ...
}

const userId = createUserId("123");
const postId = "456" as PostId;

getUser(userId); // OK
// getUser(postId); // Error! Type mismatch
```

### Const Assertions

```typescript
// Literal types
const config = {
  endpoint: "/api",
  methods: ["GET", "POST"],
} as const;
// type: { readonly endpoint: "/api"; readonly methods: readonly ["GET", "POST"] }

// Enum-like objects
const Status = {
  Pending: "pending",
  Active: "active",
  Closed: "closed",
} as const;

type StatusValue = (typeof Status)[keyof typeof Status];
```

### Template Literal Types

```typescript
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type Endpoint = "/users" | "/posts";

type ApiRoute = `${HttpMethod} ${Endpoint}`;
// "GET /users" | "GET /posts" | "POST /users" | ...

type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<"click">; // "onClick"
```

### Mapped Types

```typescript
// Make all properties optional with undefined
type Nullable<T> = { [K in keyof T]: T[K] | null };

// Getters
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }
```

### Zod for Runtime Validation

```typescript
import { z } from "zod";

// Define schema
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().min(0).max(150).optional(),
  role: z.enum(["admin", "user"]),
});

// Infer TypeScript type from schema
type User = z.infer<typeof UserSchema>;

// Validate at runtime
function createUser(input: unknown): User {
  return UserSchema.parse(input); // Throws if invalid
}

// Safe parse (no throw)
const result = UserSchema.safeParse(input);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error.issues);
}
```

### Conditional Types with `infer`

```typescript
// Extract return type
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract promise value — use built-in Awaited<T> (TypeScript 4.5+)
// type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T; // built-in, no need to redefine
type UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T; // custom name to avoid shadowing

// Extract array element
type ElementOf<T> = T extends (infer E)[] ? E : never;

// Parameters<T> is a built-in since TS 3.1 — use it directly
// The infer pattern in action (using a non-conflicting name):
type ExtractArgs<T> = T extends (...args: infer P) => unknown ? P : never;

// Practical example: Extract event payload
type EventPayload<T> = T extends { payload: infer P } ? P : never;

type ClickEvent = { type: "click"; payload: { x: number; y: number } };
type ClickPayload = EventPayload<ClickEvent>; // { x: number; y: number }
```

### Type-Safe Event Emitter

```typescript
type EventMap = {
  userCreated: { id: string; email: string };
  userDeleted: { id: string };
  orderPlaced: { orderId: string; amount: number };
};

class TypedEventEmitter<T extends Record<string, unknown>> {
  private listeners = new Map<keyof T, Set<(data: any) => void>>();

  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    this.listeners.get(event)?.forEach((listener) => listener(data));
  }

  off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    this.listeners.get(event)?.delete(listener);
  }
}

// Usage
const emitter = new TypedEventEmitter<EventMap>();
emitter.on("userCreated", (data) => {
  console.log(data.email); // Type-safe: data is { id: string; email: string }
});
```

### Builder Pattern with Type Accumulation

```typescript
type BuilderState = {
  name?: string;
  email?: string;
  age?: number;
};

type RequiredKeys = "name" | "email";

class UserBuilder<T extends BuilderState = {}> {
  private state: T;

  constructor(state: T = {} as T) {
    this.state = state;
  }

  name(name: string): UserBuilder<T & { name: string }> {
    return new UserBuilder({ ...this.state, name });
  }

  email(email: string): UserBuilder<T & { email: string }> {
    return new UserBuilder({ ...this.state, email });
  }

  age(age: number): UserBuilder<T & { age: number }> {
    return new UserBuilder({ ...this.state, age });
  }

  build(this: UserBuilder<{ name: string; email: string }>): User {
    return this.state as User;
  }
}

// Usage - build() only available when required fields are set
const user = new UserBuilder().name("John").email("john@example.com").build(); // OK

// new UserBuilder().name("John").build(); // Error! Missing email
```

### Deep Utility Types

```typescript
// Deep Partial
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

// Deep Readonly
type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

// Deep Required
type DeepRequired<T> = T extends object
  ? { [K in keyof T]-?: DeepRequired<T[K]> }
  : T;

// Path types for nested access
type Path<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends object
    ? `${K}` | `${K}.${Path<T[K]>}`
    : `${K}`
  : never;

interface Config {
  database: {
    host: string;
    port: number;
    credentials: {
      user: string;
      password: string;
    };
  };
}

type ConfigPath = Path<Config>;
// "database" | "database.host" | "database.port" | "database.credentials" | ...
```

### Type-Safe API Client

```typescript
interface ApiEndpoints {
  "/users": {
    GET: { response: User[] };
    POST: { body: CreateUserDto; response: User };
  };
  "/users/:id": {
    GET: { response: User };
    PUT: { body: UpdateUserDto; response: User };
    DELETE: { response: void };
  };
}

type ExtractParams<T extends string> =
  T extends `${infer _}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : T extends `${infer _}:${infer Param}`
      ? Param
      : never;

async function api<
  Path extends keyof ApiEndpoints,
  Method extends keyof ApiEndpoints[Path],
>(
  path: Path,
  method: Method,
  options?: {
    params?: Record<ExtractParams<Path>, string>;
    body?: ApiEndpoints[Path][Method] extends { body: infer B } ? B : never;
  },
): Promise<
  ApiEndpoints[Path][Method] extends { response: infer R } ? R : never
> {
  // Implementation
}

// Usage - fully typed
const users = await api("/users", "GET"); // User[]
const user = await api("/users/:id", "GET", { params: { id: "123" } }); // User
```

### Satisfies Operator

```typescript
// Type checking without widening
const routes = {
  home: "/",
  users: "/users",
  settings: "/settings",
} satisfies Record<string, string>;

// routes.home is still "/" (literal), not string
type HomeRoute = typeof routes.home; // "/"

// Error if value doesn't match
const badRoutes = {
  home: "/",
  users: 123, // Error! Not a string
} satisfies Record<string, string>;
```

### Best Practices

1. **Avoid `any`** - Use `unknown` for truly unknown types
2. **Enable strict mode** - `"strict": true` in tsconfig.json
3. **Use `satisfies`** for type checking without widening
4. **Prefer union types** over enums for simplicity
5. **Use `never`** for exhaustive checks
6. **Use `infer`** for extracting types from generics
7. **Document with JSDoc** when types aren't self-explanatory

```typescript
// Exhaustive check pattern
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

function handleStatus(status: Status) {
  switch (status) {
    case "pending":
      return "Waiting";
    case "approved":
      return "Done";
    case "rejected":
      return "Failed";
    default:
      return assertNever(status); // Compile error if case missing
  }
}
```

### Strict tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true
  }
}
```
