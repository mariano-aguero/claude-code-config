---
name: testing-patterns
description: Testing patterns for TypeScript applications with Vitest, Testing Library, Playwright, and MSW. Use when writing unit tests, integration tests, E2E tests, or setting up test infrastructure. Triggers on test files, mocking, assertions, and coverage.
---

# Testing Patterns

## Vitest Configuration

### Basic Setup

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: ["node_modules/", "tests/", "**/*.d.ts", "**/*.config.*"],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

### Test Setup File

```typescript
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
```

## Unit Testing

### Function Testing

```typescript
import { describe, it, expect } from "vitest";
import { calculateTotal, formatCurrency } from "./utils";

describe("calculateTotal", () => {
  it("sums item prices correctly", () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ];

    expect(calculateTotal(items)).toBe(35);
  });

  it("returns 0 for empty array", () => {
    expect(calculateTotal([])).toBe(0);
  });

  it("handles decimal prices", () => {
    const items = [{ price: 10.5, quantity: 2 }];

    expect(calculateTotal(items)).toBeCloseTo(21);
  });
});
```

### Async Function Testing

```typescript
import { describe, it, expect, vi } from "vitest";
import { fetchUser } from "./api";

describe("fetchUser", () => {
  it("returns user data on success", async () => {
    const user = await fetchUser("123");

    expect(user).toEqual({
      id: "123",
      name: expect.any(String),
      email: expect.stringContaining("@"),
    });
  });

  it("throws on invalid id", async () => {
    await expect(fetchUser("")).rejects.toThrow("Invalid user ID");
  });
});
```

## React Component Testing

### Basic Component Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Form Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('submits with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows validation errors', async () => {
    const user = userEvent.setup();

    render(<LoginForm onSubmit={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });
});
```

### Testing with Providers

```typescript
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

// Usage
it('fetches and displays data', async () => {
  renderWithProviders(<UserProfile userId="123" />);

  expect(await screen.findByText('John Doe')).toBeInTheDocument();
});
```

## Mocking

### Module Mocking

```typescript
import { vi } from "vitest";

// Mock entire module
vi.mock("./api", () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: "1", name: "John" }),
  updateUser: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock with factory
vi.mock("./config", () => ({
  default: {
    apiUrl: "http://test-api.com",
    timeout: 1000,
  },
}));
```

### Spy on Functions

```typescript
import { vi, describe, it, expect } from "vitest";
import * as api from "./api";

describe("UserService", () => {
  it("calls fetchUser with correct id", async () => {
    const spy = vi
      .spyOn(api, "fetchUser")
      .mockResolvedValue({ id: "1", name: "John" });

    await userService.getUser("1");

    expect(spy).toHaveBeenCalledWith("1");
    spy.mockRestore();
  });
});
```

### Timer Mocking

```typescript
import { vi, beforeEach, afterEach, it, expect } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("debounces input", async () => {
  const callback = vi.fn();
  const debounced = debounce(callback, 300);

  debounced("a");
  debounced("ab");
  debounced("abc");

  expect(callback).not.toHaveBeenCalled();

  vi.advanceTimersByTime(300);

  expect(callback).toHaveBeenCalledOnce();
  expect(callback).toHaveBeenCalledWith("abc");
});
```

## MSW (Mock Service Worker)

### Setup

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/users", () => {
    return HttpResponse.json([
      { id: "1", name: "John" },
      { id: "2", name: "Jane" },
    ]);
  }),

  http.get("/api/users/:id", ({ params }) => {
    return HttpResponse.json({ id: params.id, name: "John" });
  }),

  http.post("/api/users", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: "3", ...body }, { status: 201 });
  }),

  http.delete("/api/users/:id", () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
```

```typescript
// tests/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

```typescript
// tests/setup.ts
import { server } from "./mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Override Handlers in Tests

```typescript
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';

it('handles server error', async () => {
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json({ message: 'Server error' }, { status: 500 });
    })
  );

  render(<UserList />);

  expect(await screen.findByText(/error/i)).toBeInTheDocument();
});
```

## Playwright E2E Testing

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("user can sign in", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("user@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid credentials")).toBeVisible();
  });
});
```

### Page Object Model

```typescript
// e2e/pages/login.page.ts
import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.submitButton = page.getByRole("button", { name: "Sign in" });
    this.errorMessage = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// Usage in test
test("user can sign in", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("user@example.com", "password123");

  await expect(page).toHaveURL("/dashboard");
});
```

## Test Factories

```typescript
// tests/factories/user.factory.ts
import { faker } from "@faker-js/faker";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: Date;
}

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: "user",
    createdAt: faker.date.past(),
    ...overrides,
  };
}

export function createUsers(
  count: number,
  overrides: Partial<User> = {},
): User[] {
  return Array.from({ length: count }, () => createUser(overrides));
}

// Usage
const admin = createUser({ role: "admin" });
const users = createUsers(5);
```

## TanStack Query Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUser } from './useUser';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useUser', () => {
  it('fetches user data', async () => {
    const { result } = renderHook(() => useUser('123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      id: '123',
      name: 'John',
    });
  });
});
```
