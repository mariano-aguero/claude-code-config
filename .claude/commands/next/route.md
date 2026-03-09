# /api - Generate API Route

Generate Next.js API route or Server Action with validation and error handling.

## Usage

```
/api <path> [options]
```

## Options

- `--route` - Route Handler (app/api/)
- `--action` - Server Action
- `--crud` - Generate all CRUD operations
- `--auth` - Include authentication check
- `--with-zod` - Include Zod validation schema

## Templates

### Route Handler (GET, POST)

```tsx
// app/api/<resource>/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");

    const items = await db
      .select()
      .from(${resource}Table)
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /${resource} error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ${resource}s" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createSchema.parse(body);

    const [item] = await db
      .insert(${resource}Table)
      .values(validated)
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /${resource} error:", error);
    return NextResponse.json(
      { error: "Failed to create ${resource}" },
      { status: 500 }
    );
  }
}
```

### Route Handler (GET, PATCH, DELETE by ID)

```tsx
// app/api/<resource>/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const item = await db.query.${resource}.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    });

    if (!item) {
      return NextResponse.json(
        { error: "${Resource} not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("GET /${resource}/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ${resource}" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateSchema.parse(body);

    const [item] = await db
      .update(${resource}Table)
      .set(validated)
      .where(eq(${resource}Table.id, id))
      .returning();

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }

    console.error("PATCH /${resource}/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update ${resource}" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await db.delete(${resource}Table).where(eq(${resource}Table.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /${resource}/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete ${resource}" },
      { status: 500 }
    );
  }
}
```

### Server Action

```tsx
// app/actions/<resource>.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

const updateSchema = createSchema.partial();

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function create${Resource}(
  input: z.infer<typeof createSchema>
): Promise<ActionResult<${Resource}>> {
  try {
    const validated = createSchema.parse(input);

    const [item] = await db
      .insert(${resource}Table)
      .values(validated)
      .returning();

    revalidatePath("/${resource}s");

    return { success: true, data: item };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }

    console.error("create${Resource} error:", error);
    return { success: false, error: "Failed to create ${resource}" };
  }
}

export async function update${Resource}(
  id: string,
  input: z.infer<typeof updateSchema>
): Promise<ActionResult<${Resource}>> {
  try {
    const validated = updateSchema.parse(input);

    const [item] = await db
      .update(${resource}Table)
      .set(validated)
      .where(eq(${resource}Table.id, id))
      .returning();

    revalidatePath("/${resource}s");
    revalidatePath(`/${resource}s/${id}`);

    return { success: true, data: item };
  } catch (error) {
    console.error("update${Resource} error:", error);
    return { success: false, error: "Failed to update ${resource}" };
  }
}

export async function delete${Resource}(id: string): Promise<ActionResult<null>> {
  try {
    await db
      .delete(${resource}Table)
      .where(eq(${resource}Table.id, id));

    revalidatePath("/${resource}s");

    return { success: true, data: null };
  } catch (error) {
    console.error("delete${Resource} error:", error);
    return { success: false, error: "Failed to delete ${resource}" };
  }
}
```

### With Authentication

```tsx
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ... rest of handler
}
```

## Examples

```
/api users --crud --auth
/api posts --route --with-zod
/api comments --action
```

## File Structure

```
app/
├── api/
│   └── users/
│       ├── route.ts          # GET (list), POST (create)
│       └── [id]/
│           └── route.ts      # GET, PATCH, DELETE (by id)
└── actions/
    └── users.ts              # Server Actions
```

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Add the new API route to the "API Endpoints" section
2. Document the request/response schema and validation rules
3. Note any authentication requirements
4. Update the architecture section if new patterns were introduced
