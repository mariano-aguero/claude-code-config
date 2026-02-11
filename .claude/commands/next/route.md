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

    const items = await db.${resource}.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });

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

    const item = await db.${resource}.create({
      data: validated,
    });

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
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const item = await db.${resource}.findUnique({
      where: { id: params.id },
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
    const body = await request.json();
    const validated = updateSchema.parse(body);

    const item = await db.${resource}.update({
      where: { id: params.id },
      data: validated,
    });

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
    await db.${resource}.delete({
      where: { id: params.id },
    });

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

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function create${Resource}(
  input: z.infer<typeof createSchema>
): Promise<ActionResult<${Resource}>> {
  try {
    const validated = createSchema.parse(input);

    const item = await db.${resource}.create({
      data: validated,
    });

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
  input: Partial<z.infer<typeof createSchema>>
): Promise<ActionResult<${Resource}>> {
  try {
    const item = await db.${resource}.update({
      where: { id },
      data: input,
    });

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
    await db.${resource}.delete({
      where: { id },
    });

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
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

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
