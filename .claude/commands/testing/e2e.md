# /e2e - Generate E2E Tests

Generate end-to-end tests with Playwright.

## Usage

```
/e2e <feature> [options]
```

## Options

- `--auth` - Include authentication flow
- `--crud` - Test CRUD operations
- `--form` - Test form submission
- `--navigation` - Test page navigation
- `--visual` - Include visual regression tests

## Templates

### Basic Page Test

```typescript
// e2e/${feature}.spec.ts
import { test, expect } from "@playwright/test";

test.describe("${Feature} Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/${feature}");
  });

  test("should display page title", async ({ page }) => {
    await expect(page).toHaveTitle(/${Feature}/);
  });

  test("should load content", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "${Feature}" })).toBeVisible();
  });

  test("should navigate correctly", async ({ page }) => {
    await page.getByRole("link", { name: "Details" }).click();
    await expect(page).toHaveURL(/\/${feature}\/\d+/);
  });
});
```

### Authentication Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should login successfully", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("user@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("Welcome")).toBeVisible();
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid credentials")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("should logout successfully", async ({ page }) => {
    // Assume logged in state
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "Logout" }).click();

    await expect(page).toHaveURL("/login");
  });

  test("should redirect unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL("/login?redirect=/dashboard");
  });
});
```

### CRUD Operations

```typescript
// e2e/${feature}-crud.spec.ts
import { test, expect } from "@playwright/test";

test.describe("${Feature} CRUD", () => {
  test.beforeEach(async ({ page }) => {
    // Login if needed
    await page.goto("/login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("/dashboard");
  });

  test("should create new ${feature}", async ({ page }) => {
    await page.goto("/${feature}s");

    await page.getByRole("button", { name: "Create" }).click();

    await page.getByLabel("Name").fill("New ${Feature}");
    await page.getByLabel("Description").fill("Test description");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Created successfully")).toBeVisible();
    await expect(page.getByText("New ${Feature}")).toBeVisible();
  });

  test("should read ${feature} list", async ({ page }) => {
    await page.goto("/${feature}s");

    await expect(page.getByRole("list")).toBeVisible();
    const items = page.getByRole("listitem");
    await expect(items).toHaveCount.greaterThan(0);
  });

  test("should update ${feature}", async ({ page }) => {
    await page.goto("/${feature}s");

    await page.getByRole("listitem").first().getByRole("button", { name: "Edit" }).click();

    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill("Updated Name");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Updated successfully")).toBeVisible();
    await expect(page.getByText("Updated Name")).toBeVisible();
  });

  test("should delete ${feature}", async ({ page }) => {
    await page.goto("/${feature}s");

    const item = page.getByRole("listitem").first();
    const itemName = await item.getByRole("heading").textContent();

    await item.getByRole("button", { name: "Delete" }).click();

    // Confirm deletion
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByText("Deleted successfully")).toBeVisible();
    await expect(page.getByText(itemName!)).not.toBeVisible();
  });
});
```

### Form Validation

```typescript
// e2e/${feature}-form.spec.ts
import { test, expect } from "@playwright/test";

test.describe("${Feature} Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/${feature}/new");
  });

  test("should show validation errors for required fields", async ({ page }) => {
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Email is required")).toBeVisible();
  });

  test("should validate email format", async ({ page }) => {
    await page.getByLabel("Email").fill("invalid-email");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText("Invalid email")).toBeVisible();
  });

  test("should submit valid form", async ({ page }) => {
    await page.getByLabel("Name").fill("John Doe");
    await page.getByLabel("Email").fill("john@example.com");
    await page.getByLabel("Message").fill("Test message");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText("Submitted successfully")).toBeVisible();
  });

  test("should show loading state during submission", async ({ page }) => {
    await page.getByLabel("Name").fill("John Doe");
    await page.getByLabel("Email").fill("john@example.com");

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByRole("button", { name: "Submitting..." })).toBeVisible();
  });
});
```

### Auth Fixture

```typescript
// e2e/fixtures/auth.ts
import { test as base, Page } from "@playwright/test";

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login
    await page.goto("/login");
    await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("/dashboard");

    await use(page);

    // Logout
    await page.goto("/logout");
  },
});

export { expect } from "@playwright/test";

// Usage in tests
// import { test, expect } from "./fixtures/auth";
// test("should access protected page", async ({ authenticatedPage }) => {
//   await authenticatedPage.goto("/settings");
//   await expect(authenticatedPage.getByRole("heading")).toHaveText("Settings");
// });
```

### Visual Regression

```typescript
// e2e/visual/${feature}.spec.ts
import { test, expect } from "@playwright/test";

test.describe("${Feature} Visual", () => {
  test("should match homepage snapshot", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot("homepage.png");
  });

  test("should match ${feature} page snapshot", async ({ page }) => {
    await page.goto("/${feature}");
    await expect(page).toHaveScreenshot("${feature}-page.png", {
      fullPage: true,
    });
  });

  test("should match component snapshot", async ({ page }) => {
    await page.goto("/${feature}");
    const card = page.getByTestId("${feature}-card").first();
    await expect(card).toHaveScreenshot("${feature}-card.png");
  });
});
```

## Examples

```
/e2e login --auth
/e2e users --crud
/e2e contact --form
/e2e dashboard --navigation --visual
```

## Commands

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e e2e/auth.spec.ts

# Run in headed mode (see browser)
pnpm test:e2e --headed

# Run in debug mode
pnpm test:e2e --debug

# Update snapshots
pnpm test:e2e --update-snapshots

# Generate HTML report
pnpm test:e2e --reporter=html
```

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Add the E2E test to the "Testing" section
2. Document any new test fixtures or authentication flows
3. Update the testing commands section if new scripts were added
