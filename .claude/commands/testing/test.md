# /test - Generate Unit Tests

Generate unit tests with Vitest and React Testing Library.

## Usage

```
/test <file-path> [options]
```

## Options

- `--component` - Test React component
- `--hook` - Test custom hook
- `--function` - Test utility function
- `--api` - Test API route
- `--coverage` - Include edge cases for coverage

## Templates

### Component Test

```tsx
// __tests__/<component>.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ${Component} } from "@/components/${component}";

// Mock dependencies
vi.mock("@/hooks/use-something", () => ({
  useSomething: vi.fn(() => ({
    data: mockData,
    isLoading: false,
  })),
}));

const mockData = {
  id: "1",
  name: "Test",
};

describe("${Component}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<${Component} />);

    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("handles user interaction", async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    render(<${Component} onClick={onClickMock} />);

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it("displays loading state", () => {
    vi.mocked(useSomething).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<${Component} />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("displays error state", () => {
    vi.mocked(useSomething).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to load"),
    });

    render(<${Component} />);

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### Hook Test

```tsx
// __tests__/hooks/use-${hook}.test.ts
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { use${Hook} } from "@/hooks/use-${hook}";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("use${Hook}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => use${Hook}(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });

  it("fetches data successfully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "1", name: "Test" }),
    });

    const { result } = renderHook(() => use${Hook}(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: "1", name: "Test" });
  });

  it("handles errors", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => use${Hook}(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("updates state correctly", () => {
    const { result } = renderHook(() => use${Hook}());

    act(() => {
      result.current.setValue("new value");
    });

    expect(result.current.value).toBe("new value");
  });
});
```

### Function Test

```tsx
// __tests__/utils/${function}.test.ts
import { describe, it, expect } from "vitest";
import { ${function} } from "@/lib/${function}";

describe("${function}", () => {
  it("handles normal input", () => {
    const result = ${function}("input");
    expect(result).toBe("expected output");
  });

  it("handles edge cases", () => {
    expect(${function}("")).toBe("");
    expect(${function}(null)).toBeNull();
    expect(${function}(undefined)).toBeUndefined();
  });

  it("throws on invalid input", () => {
    expect(() => ${function}(-1)).toThrow("Invalid input");
  });

  it("handles array input", () => {
    const result = ${function}([1, 2, 3]);
    expect(result).toEqual([2, 4, 6]);
    expect(result).toHaveLength(3);
  });
});
```

### API Route Test

```tsx
// __tests__/api/${route}.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/${route}/route";

const mockItems = [{ id: "1", name: "Test" }];
const newItem = { id: "1", name: "New Item" };

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(mockItems),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([newItem]),
    query: {
      ${resource}s: {
        findMany: vi.fn().mockResolvedValue(mockItems),
        findFirst: vi.fn().mockResolvedValue(mockItems[0]),
      },
    },
  },
}));

describe("API /${route}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns list of items", async () => {
      const request = new NextRequest("http://localhost/api/${route}");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockItems);
    });

    it("handles pagination", async () => {
      const request = new NextRequest(
        "http://localhost/api/${route}?page=2&limit=10"
      );
      await GET(request);

      // Drizzle uses limit/offset, not skip/take
      expect(data).toEqual(mockItems);
    });
  });

  describe("POST", () => {
    it("creates new item", async () => {
      const request = new NextRequest("http://localhost/api/${route}", {
        method: "POST",
        body: JSON.stringify({ name: "New Item" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(newItem);
    });

    it("validates input", async () => {
      const request = new NextRequest("http://localhost/api/${route}", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
```

## Examples

```
/test components/user-card.tsx --component
/test hooks/use-users.ts --hook
/test lib/format-date.ts --function
/test app/api/users/route.ts --api
```

## Test Setup File

```tsx
// test/setup.ts
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock next/navigation
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

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Add the test file to the "Testing" section
2. Document any new testing patterns or utilities introduced
3. Update test coverage expectations if applicable
