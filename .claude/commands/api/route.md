# /api/route - Generate API Endpoint

Generate an API route handler with Hono, Zod validation, and proper error handling.

## Usage

```
/api/route <resource> [options]
```

## Options

- `--method=GET|POST|PUT|PATCH|DELETE` - HTTP method (default: GET)
- `--with-auth` - Add authentication middleware
- `--with-pagination` - Add pagination for list endpoints
- `--crud` - Generate all CRUD endpoints

## Template

```typescript
// src/routes/<resource>.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ${resource}Service } from '@/services/${resource}.service';
import { authMiddleware } from '@/middleware/auth';

const app = new Hono();

// Validation schemas
const create${Resource}Schema = z.object({
  name: z.string().min(1).max(255),
  // Add more fields
});

const update${Resource}Schema = create${Resource}Schema.partial();

const paramsSchema = z.object({
  id: z.string().uuid(),
});

// GET /${resource}
app.get('/', async (c) => {
  const items = await ${resource}Service.findAll();
  return c.json({ success: true, data: items });
});

// GET /${resource}/:id
app.get('/:id', zValidator('param', paramsSchema), async (c) => {
  const { id } = c.req.valid('param');
  const item = await ${resource}Service.findById(id);

  if (!item) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '${Resource} not found' } }, 404);
  }

  return c.json({ success: true, data: item });
});

// POST /${resource}
app.post('/', zValidator('json', create${Resource}Schema), async (c) => {
  const data = c.req.valid('json');
  const item = await ${resource}Service.create(data);
  return c.json({ success: true, data: item }, 201);
});

// PATCH /${resource}/:id
app.patch('/:id', zValidator('param', paramsSchema), zValidator('json', update${Resource}Schema), async (c) => {
  const { id } = c.req.valid('param');
  const data = c.req.valid('json');
  const item = await ${resource}Service.update(id, data);

  if (!item) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '${Resource} not found' } }, 404);
  }

  return c.json({ success: true, data: item });
});

// DELETE /${resource}/:id
app.delete('/:id', zValidator('param', paramsSchema), async (c) => {
  const { id } = c.req.valid('param');
  const deleted = await ${resource}Service.delete(id);

  if (!deleted) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '${Resource} not found' } }, 404);
  }

  return c.body(null, 204);
});

export default app;
```

## Examples

### Basic CRUD

```
/api/route users --crud
```

### Authenticated Route

```
/api/route posts --crud --with-auth
```

### List with Pagination

```
/api/route products --method=GET --with-pagination
```

## File Location

- Routes go in `src/routes/<resource>.ts`
- Register in main app: `app.route('/<resource>', resourceRoutes)`

## Best Practices Applied

1. Zod validation for all inputs
2. Consistent response format `{ success, data/error }`
3. Proper HTTP status codes
4. UUID validation for IDs
5. Partial schema for updates
6. Error handling with meaningful messages
