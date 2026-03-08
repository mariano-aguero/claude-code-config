---
name: react-best-practices
description: React 19, TanStack Query v5, and TanStack Form v1 patterns for building performant, type-safe applications. Use when writing React components, custom hooks, implementing data fetching with TanStack Query (NOT raw fetch or axios), building forms with TanStack Form (NOT React Hook Form), or setting up state management. Triggers on tasks involving React components, hooks, forms, data fetching, Zustand, or TanStack libraries. IMPORTANT - Always use TanStack Query for server state and TanStack Form for forms.
---

# React 19 Best Practices

## TanStack Ecosystem

| Task                    | Library                                 |
| ----------------------- | --------------------------------------- |
| Server state (API data) | **TanStack Query** (not fetch/axios)    |
| Forms & validation      | **TanStack Form** (not React Hook Form) |
| Client state            | **Zustand** or Context                  |
| Tables                  | **TanStack Table**                      |

## Component Patterns

### Functional Components with TypeScript

```tsx
interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### Compound Components

```tsx
interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

function Tabs({
  children,
  defaultTab,
}: {
  children: React.ReactNode;
  defaultTab: string;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children }: { children: React.ReactNode }) {
  return <div className="tab-list">{children}</div>;
}

function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tab must be used within Tabs");

  return (
    <button
      className={context.activeTab === id ? "active" : ""}
      onClick={() => context.setActiveTab(id)}
    >
      {children}
    </button>
  );
}

function TabPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabPanel must be used within Tabs");

  return context.activeTab === id ? <div>{children}</div> : null;
}

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// Usage
<Tabs defaultTab="tab1">
  <Tabs.List>
    <Tabs.Tab id="tab1">First</Tabs.Tab>
    <Tabs.Tab id="tab2">Second</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="tab1">Content 1</Tabs.Panel>
  <Tabs.Panel id="tab2">Content 2</Tabs.Panel>
</Tabs>;
```

### Render Props

```tsx
interface MousePosition {
  x: number;
  y: number;
}

interface MouseTrackerProps {
  children: (position: MousePosition) => React.ReactNode;
}

function MouseTracker({ children }: MouseTrackerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return <>{children(position)}</>;
}

// Usage
<MouseTracker>
  {({ x, y }) => (
    <div>
      Mouse: {x}, {y}
    </div>
  )}
</MouseTracker>;
```

## Hooks

### Custom Hooks

```tsx
// useLocalStorage — SSR-safe: initialValue on server, real value after hydration
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Read from storage after mount to avoid SSR hydration mismatch
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch {
      /* ignore — quota exceeded or private mode */
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    try {
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch {
      /* quota exceeded or private mode */
    }
  };

  return [storedValue, setValue] as const;
}

// useDebounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// IMPORTANT: Use TanStack Query for data fetching, NOT raw fetch/axios
// See "Data Fetching: TanStack Query" section below for patterns
```

### useCallback and useMemo

```tsx
// useCallback - memoize functions
const handleSubmit = useCallback(
  (data: FormData) => {
    onSubmit(data);
  },
  [onSubmit],
); // Only recreate if onSubmit changes

// useMemo - memoize expensive calculations
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}, [items]); // Only recalculate when items change

// When to use:
// - useCallback: When passing callbacks to optimized child components
// - useMemo: For expensive calculations or referential equality
```

### useReducer for Complex State

```tsx
type State = {
  items: Item[];
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Item[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "ADD_ITEM"; payload: Item }
  | { type: "REMOVE_ITEM"; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, items: action.payload };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.payload] };
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload),
      };
    default:
      return state;
  }
}

function ItemList() {
  const [state, dispatch] = useReducer(reducer, {
    items: [],
    loading: false,
    error: null,
  });

  // Use dispatch({ type: "ADD_ITEM", payload: newItem })
}
```

## React 19 Hooks

### useOptimistic

Optimistic UI updates while an async action is in flight. Automatically reverts if the action fails.

```tsx
import { useOptimistic } from "react";

interface Message {
  id: string;
  text: string;
  sending?: boolean;
}

function MessageList({
  messages,
  sendMessage,
}: {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
}) {
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    // Pure updater: (currentState, optimisticValue) => newState
    (state, newText: string) => [
      ...state,
      { id: crypto.randomUUID(), text: newText, sending: true },
    ],
  );

  async function handleSubmit(formData: FormData) {
    const text = formData.get("text") as string;
    addOptimistic(text); // update UI immediately
    await sendMessage(text); // actual async op
    // React reverts the optimistic entry and replaces with real server state
  }

  return (
    <>
      <ul>
        {optimisticMessages.map((msg) => (
          <li key={msg.id} style={{ opacity: msg.sending ? 0.5 : 1 }}>
            {msg.text}
            {msg.sending && " (sending…)"}
          </li>
        ))}
      </ul>
      <form action={handleSubmit}>
        <input name="text" required />
        <button type="submit">Send</button>
      </form>
    </>
  );
}
```

### use()

Reads a resource (Promise or Context) inside a component. Unlike other hooks, can be called conditionally.

```tsx
import { use, Suspense } from "react";

// --- Unwrap a Promise (suspends until resolved) ---
function UserCard({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // suspends here, caught by nearest Suspense
  return <div>{user.name}</div>;
}

// Pass the un-awaited promise from Server Component → Client Component
// This lets streaming start immediately
async function Page() {
  const userPromise = fetchUser("123"); // intentionally NOT awaited
  return (
    <Suspense fallback={<Skeleton />}>
      <UserCard userPromise={userPromise} />
    </Suspense>
  );
}

// --- Read Context conditionally (unlike useContext) ---
function ThemeLabel({ show }: { show: boolean }) {
  if (!show) return null;
  const theme = use(ThemeContext); // valid — use() can be called after a conditional return
  return <span>{theme}</span>;
}
```

Key rules:

- In **Client Components**, the Promise must be **stable** (created outside render or memoized) — an unstable Promise (created inline each render) causes infinite re-renders. In Server Components this is not a concern since they render once.
- Errors from the Promise bubble to the nearest **Error Boundary**
- `use(Context)` is equivalent to `useContext()` but works conditionally

## Performance

### React.memo

```tsx
// Only re-render if props change
const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  return <div>{/* expensive render */}</div>;
});

// With custom comparison
const ListItem = memo(
  function ListItem({ item }: { item: Item }) {
    return <div>{item.name}</div>;
  },
  (prevProps, nextProps) => prevProps.item.id === nextProps.item.id,
);
```

### Lazy Loading

```tsx
import { lazy, Suspense } from "react";

const HeavyComponent = lazy(() => import("./HeavyComponent"));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Virtualization for Long Lists

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: "400px", overflow: "auto" }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              transform: `translateY(${virtualItem.start}px)`,
              height: `${virtualItem.size}px`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Forms — TanStack Form v1

Never use React Hook Form. Use `@tanstack/react-form`.

```tsx
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
});

function CreateUserForm({
  onSubmit,
}: {
  onSubmit: (data: z.infer<typeof schema>) => Promise<void>;
}) {
  const form = useForm({
    defaultValues: { name: "", email: "" },
    onSubmit: async ({ value }) => {
      await onSubmit(value); // already validated by TanStack Form validators
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => (!value ? "Required" : undefined),
        }}
        children={(field) => (
          <div>
            <input
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors[0] && <p>{field.state.meta.errors[0]}</p>}
          </div>
        )}
      />
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) =>
            z.string().email().safeParse(value).success
              ? undefined
              : "Invalid email",
        }}
        children={(field) => (
          <div>
            <input
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors[0] && <p>{field.state.meta.errors[0]}</p>}
          </div>
        )}
      />
      <form.Subscribe
        selector={(state) => state.isSubmitting}
        children={(isSubmitting) => (
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        )}
      />
    </form>
  );
}
```

## State Management

### Context + Reducer Pattern

```tsx
interface AppState {
  user: User | null;
  theme: "light" | "dark";
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | null>(null);

function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
```

### Zustand (Global State)

```tsx
import { create } from "zustand";

interface Store {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// Usage
function Counter() {
  const { count, increment } = useStore();
  return <button onClick={increment}>{count}</button>;
}
```

## Error Boundaries

```tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Error caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>;
```

## Data Fetching: TanStack Query

TanStack Query (React Query) is the standard for server state management. Handles caching, background updates, stale data, and more.

### Setup

```tsx
// providers.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Basic Query

```tsx
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch user");
  return response.json();
}

function UserProfile({ userId }: { userId: string }) {
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId, // Only fetch if userId exists
  });

  if (isLoading) return <Skeleton />;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### Mutations

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function updateUser(data: { id: string; name: string }): Promise<User> {
  const response = await fetch(`/api/users/${data.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update user");
  return response.json();
}

function EditUserForm({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name);

  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["user", user.id] });

      // Or update cache directly
      queryClient.setQueryData(["user", user.id], updatedUser);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate({ id: user.id, name });
      }}
    >
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

### Optimistic Updates

```tsx
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["user", newData.id] });

    // Snapshot previous value
    const previousUser = queryClient.getQueryData(["user", newData.id]);

    // Optimistically update
    queryClient.setQueryData(["user", newData.id], (old: User) => ({
      ...old,
      ...newData,
    }));

    return { previousUser };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(["user", newData.id], context?.previousUser);
  },
  onSettled: (data, error, variables) => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
  },
});
```

### Infinite Queries (Pagination)

```tsx
import { useInfiniteQuery } from "@tanstack/react-query";

interface PostsPage {
  posts: Post[];
  nextCursor: string | null;
}

function PostList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["posts"],
      queryFn: async ({ pageParam }) => {
        const res = await fetch(`/api/posts?cursor=${pageParam}`);
        return res.json() as Promise<PostsPage>;
      },
      initialPageParam: "",
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div>
      {allPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

### Parallel Queries

```tsx
import { useQueries } from "@tanstack/react-query";

function Dashboard({ userIds }: { userIds: string[] }) {
  const userQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ["user", id],
      queryFn: () => fetchUser(id),
    })),
  });

  const isLoading = userQueries.some((query) => query.isLoading);
  const users = userQueries
    .filter((query) => query.isSuccess)
    .map((query) => query.data);

  return <UserList users={users} isLoading={isLoading} />;
}
```

### Prefetching

```tsx
// Prefetch on hover
function UserLink({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  return (
    <Link
      href={`/users/${userId}`}
      onMouseEnter={() => {
        queryClient.prefetchQuery({
          queryKey: ["user", userId],
          queryFn: () => fetchUser(userId),
          staleTime: 1000 * 60 * 5,
        });
      }}
    >
      View User
    </Link>
  );
}

// Prefetch in loader (Next.js App Router)
async function prefetchUserData(userId: string) {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  });
  return queryClient;
}
```

### Query Keys Factory

```tsx
// Organized query keys
const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: Filters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Usage
useQuery({
  queryKey: userKeys.detail(userId),
  queryFn: () => fetchUser(userId),
});

// Invalidate all user queries
queryClient.invalidateQueries({ queryKey: userKeys.all });

// Invalidate specific user
queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
```

## Best Practices Summary

1. **Prefer composition** over inheritance
2. **Lift state up** only when necessary
3. **Colocate state** with components that use it
4. **Use keys properly** - never use index as key for dynamic lists
5. **Avoid prop drilling** - use Context or state management
6. **Keep components small** - single responsibility
7. **Avoid inline objects/functions** in JSX when it causes re-renders
8. **Use fragments** `<>...</>` to avoid unnecessary divs
