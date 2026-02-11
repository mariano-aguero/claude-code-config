---
name: security-patterns
description: Application security patterns including OWASP prevention, authentication, authorization, security headers, input validation, and secrets management. Use when implementing auth, securing APIs, configuring headers, or auditing code for vulnerabilities. Triggers on security, authentication, authorization, CSRF, XSS, injection, and secrets.
---

# Application Security Patterns

## OWASP Top 10 Prevention

### 1. Injection Prevention

```typescript
// SQL Injection - Use parameterized queries (Drizzle)
// BAD - Never do this
const bad = db.execute(`SELECT * FROM users WHERE id = '${userId}'`);

// GOOD - Parameterized query
import { eq } from 'drizzle-orm';
const good = await db.select().from(users).where(eq(users.id, userId));

// Command Injection - Avoid shell commands with user input
// BAD
exec(`convert ${userFilename} output.png`);

// GOOD - Use libraries, validate input
import sharp from 'sharp';
await sharp(validatedPath).png().toFile('output.png');

// NoSQL Injection - Validate and sanitize
// BAD
db.collection('users').find({ $where: `this.name == '${name}'` });

// GOOD
db.collection('users').find({ name: sanitizedName });
```

### 2. Broken Authentication Prevention

```typescript
// Password hashing with Argon2
import { hash, verify } from '@node-rs/argon2';

async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return verify(hash, password);
}

// Account lockout after failed attempts
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

async function checkLoginAttempts(userId: string): Promise<boolean> {
  const attempts = await redis.get(`login_attempts:${userId}`);
  const lockoutUntil = await redis.get(`lockout:${userId}`);

  if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
    throw new Error('Account temporarily locked');
  }

  return parseInt(attempts || '0') < MAX_ATTEMPTS;
}

async function recordFailedAttempt(userId: string): Promise<void> {
  const attempts = await redis.incr(`login_attempts:${userId}`);
  await redis.expire(`login_attempts:${userId}`, 3600);

  if (attempts >= MAX_ATTEMPTS) {
    await redis.set(`lockout:${userId}`, Date.now() + LOCKOUT_DURATION);
    await redis.expire(`lockout:${userId}`, LOCKOUT_DURATION / 1000);
  }
}

async function clearLoginAttempts(userId: string): Promise<void> {
  await redis.del(`login_attempts:${userId}`);
  await redis.del(`lockout:${userId}`);
}
```

### 3. XSS Prevention

```typescript
// React automatically escapes by default - but watch for:

// BAD - dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// GOOD - Use a sanitizer if HTML is needed
import DOMPurify from 'isomorphic-dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />

// GOOD - Just render text (auto-escaped)
<div>{userContent}</div>

// URL validation
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// BAD
<a href={userUrl}>Link</a>

// GOOD
{isSafeUrl(userUrl) && <a href={userUrl}>Link</a>}
```

### 4. IDOR Prevention (Insecure Direct Object Reference)

```typescript
// Always verify ownership/authorization
// BAD - Just checks if resource exists
app.get('/api/documents/:id', async (c) => {
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, c.req.param('id')),
  });
  return c.json(doc);
});

// GOOD - Checks ownership
app.get('/api/documents/:id', authMiddleware, async (c) => {
  const userId = c.get('user').id;
  const docId = c.req.param('id');

  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, docId),
      eq(documents.ownerId, userId)
    ),
  });

  if (!doc) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json(doc);
});
```

### 5. CSRF Prevention

```typescript
// For traditional forms - use CSRF tokens
import { csrf } from 'hono/csrf';

app.use('*', csrf({
  origin: ['https://myapp.com'],
}));

// For APIs - use SameSite cookies + check Origin header
function csrfMiddleware(c, next) {
  const origin = c.req.header('Origin');
  const allowedOrigins = [process.env.FRONTEND_URL];

  if (c.req.method !== 'GET' && !allowedOrigins.includes(origin)) {
    return c.json({ error: 'CSRF check failed' }, 403);
  }

  return next();
}

// Cookie settings for CSRF protection
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
};
```

### 6. SSRF Prevention

```typescript
import { isPrivateIP } from 'is-ip';

async function safeFetch(url: string): Promise<Response> {
  const parsed = new URL(url);

  // Block private IPs
  const hostname = parsed.hostname;
  if (isPrivateIP(hostname) || hostname === 'localhost' || hostname === '127.0.0.1') {
    throw new Error('Private IPs not allowed');
  }

  // Block dangerous protocols
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Invalid protocol');
  }

  // Block internal metadata endpoints (cloud)
  if (hostname === '169.254.169.254') {
    throw new Error('Metadata endpoint blocked');
  }

  return fetch(url, {
    redirect: 'error', // Don't follow redirects to private IPs
  });
}
```

## Authentication

### JWT Implementation

```typescript
import { sign, verify } from 'hono/jwt';

const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

async function generateTokens(user: { id: string; email: string; role: string }) {
  const now = Math.floor(Date.now() / 1000);

  const accessToken = await sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRY,
    },
    process.env.JWT_SECRET!
  );

  const refreshToken = await sign(
    {
      sub: user.id,
      type: 'refresh',
      iat: now,
      exp: now + REFRESH_TOKEN_EXPIRY,
    },
    process.env.JWT_REFRESH_SECRET!
  );

  // Store refresh token hash in database for revocation
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: await hash(refreshToken),
    expiresAt: new Date((now + REFRESH_TOKEN_EXPIRY) * 1000),
  });

  return { accessToken, refreshToken };
}

async function refreshAccessToken(refreshToken: string) {
  const payload = await verify(refreshToken, process.env.JWT_REFRESH_SECRET!);

  // Verify token exists in database (not revoked)
  const stored = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.userId, payload.sub),
  });

  if (!stored || !(await verify(refreshToken, stored.tokenHash))) {
    throw new Error('Invalid refresh token');
  }

  // Generate new access token
  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.sub),
  });

  return generateTokens(user);
}

async function revokeRefreshToken(userId: string) {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}
```

### OAuth 2.0 / OIDC

```typescript
// Using Arctic for OAuth
import { GitHub, Google } from 'arctic';

const github = new GitHub(
  process.env.GITHUB_CLIENT_ID!,
  process.env.GITHUB_CLIENT_SECRET!
);

const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

// Generate authorization URL with state
app.get('/auth/github', async (c) => {
  const state = crypto.randomUUID();
  await redis.set(`oauth_state:${state}`, '1', 'EX', 600);

  const url = await github.createAuthorizationURL(state, {
    scopes: ['user:email'],
  });

  return c.redirect(url.toString());
});

// Callback handler
app.get('/auth/github/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');

  // Verify state
  const storedState = await redis.get(`oauth_state:${state}`);
  if (!storedState) {
    return c.json({ error: 'Invalid state' }, 400);
  }
  await redis.del(`oauth_state:${state}`);

  // Exchange code for tokens
  const tokens = await github.validateAuthorizationCode(code);

  // Get user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  const githubUser = await userResponse.json();

  // Create or update user in database
  // ...

  return c.redirect('/dashboard');
});
```

### Password Reset Flow

```typescript
import { createHash, randomBytes } from 'crypto';

// Generate secure reset token
async function createPasswordResetToken(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  // Always return success to prevent email enumeration
  if (!user) return;

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResets).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  // Send email with reset link
  await sendEmail({
    to: email,
    subject: 'Password Reset',
    html: `<a href="${process.env.APP_URL}/reset-password?token=${token}">Reset Password</a>`,
  });
}

// Verify and use reset token
async function resetPassword(token: string, newPassword: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex');

  const reset = await db.query.passwordResets.findFirst({
    where: and(
      eq(passwordResets.tokenHash, tokenHash),
      gt(passwordResets.expiresAt, new Date())
    ),
  });

  if (!reset) {
    throw new Error('Invalid or expired token');
  }

  // Update password and delete token
  const hashedPassword = await hashPassword(newPassword);

  await db.transaction(async (tx) => {
    await tx.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, reset.userId));

    await tx.delete(passwordResets)
      .where(eq(passwordResets.userId, reset.userId));

    // Revoke all sessions
    await tx.delete(refreshTokens)
      .where(eq(refreshTokens.userId, reset.userId));
  });
}
```

## Authorization (RBAC)

```typescript
// Define permissions
const PERMISSIONS = {
  'users:read': ['admin', 'manager', 'user'],
  'users:write': ['admin', 'manager'],
  'users:delete': ['admin'],
  'posts:read': ['admin', 'manager', 'user', 'guest'],
  'posts:write': ['admin', 'manager', 'user'],
  'posts:delete': ['admin', 'manager'],
  'settings:read': ['admin'],
  'settings:write': ['admin'],
} as const;

type Permission = keyof typeof PERMISSIONS;
type Role = 'admin' | 'manager' | 'user' | 'guest';

function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[permission]?.includes(role) ?? false;
}

// Authorization middleware
function requirePermission(permission: Permission) {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!hasPermission(user.role, permission)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await next();
  });
}

// Usage
app.get('/api/users', requirePermission('users:read'), async (c) => {
  const users = await userService.findAll();
  return c.json(users);
});

app.delete('/api/users/:id', requirePermission('users:delete'), async (c) => {
  await userService.delete(c.req.param('id'));
  return c.json({ success: true });
});
```

## Security Headers

### Next.js Configuration

```typescript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\n/g, '');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Hono/API Headers

```typescript
import { secureHeaders } from 'hono/secure-headers';

app.use('*', secureHeaders({
  strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
  },
}));
```

## Input Validation

### Zod Schemas

```typescript
import { z } from 'zod';

// Email
const emailSchema = z.string().email().max(255).toLowerCase();

// Password with requirements
const passwordSchema = z.string()
  .min(12, 'Minimum 12 characters')
  .max(128, 'Maximum 128 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character');

// Username (alphanumeric, no spaces)
const usernameSchema = z.string()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores');

// URL
const urlSchema = z.string().url().refine(
  (url) => ['http:', 'https:'].includes(new URL(url).protocol),
  'Must be HTTP or HTTPS'
);

// UUID
const uuidSchema = z.string().uuid();

// Pagination
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// File upload
const fileSchema = z.object({
  name: z.string().max(255),
  type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  size: z.number().max(10 * 1024 * 1024), // 10MB
});
```

## Secrets Management

### Environment Variables

```typescript
// env.ts - Validate all env vars at startup
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url(),

  // Auth secrets (minimum length enforced)
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // External services
  REDIS_URL: z.string().url(),
  SMTP_HOST: z.string(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),

  // OAuth (optional in dev)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
});

// Parse and validate
export const env = envSchema.parse(process.env);

// Fail fast if missing required vars
```

### .env.example Template

```bash
# .env.example - Commit this, never commit .env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/myapp

# Auth (generate with: openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Redis
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=smtp.example.com
SMTP_USER=
SMTP_PASS=

# OAuth (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## Rate Limiting

```typescript
import { rateLimiter } from 'hono-rate-limiter';

// General API rate limit
const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // 100 requests per window
  standardHeaders: 'draft-6',
  keyGenerator: (c) => {
    return c.get('user')?.id ?? c.req.header('x-forwarded-for') ?? 'anonymous';
  },
});

// Strict limit for auth endpoints
const authLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // 5 requests per minute
  message: { error: 'Too many attempts, please try again later' },
});

// Apply
app.use('/api/*', apiLimiter);
app.use('/api/auth/*', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
```

## Logging (Without Sensitive Data)

```typescript
// Redact sensitive fields
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'authorization', 'cookie'];

function redactSensitive(obj: Record<string, any>): Record<string, any> {
  const redacted = { ...obj };

  for (const key of Object.keys(redacted)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitive(redacted[key]);
    }
  }

  return redacted;
}

// Usage in logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();

  await next();

  const log = {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: Date.now() - start,
    userId: c.get('user')?.id,
    // Never log: body, headers with auth, query params with tokens
  };

  console.log(JSON.stringify(log));
});
```

## Security Checklist

### Authentication
- [ ] Passwords hashed with Argon2 or bcrypt
- [ ] JWT with short expiry (15min) + refresh tokens
- [ ] Refresh tokens stored hashed in database
- [ ] Account lockout after failed attempts
- [ ] Secure password reset flow
- [ ] Session invalidation on password change

### Authorization
- [ ] RBAC or ABAC implemented
- [ ] Resource ownership verified (IDOR prevention)
- [ ] Principle of least privilege applied

### Input/Output
- [ ] All input validated with Zod
- [ ] Output encoded for context (HTML, JS, URL)
- [ ] File uploads validated (type, size)
- [ ] SQL injection prevented (parameterized queries)

### Transport
- [ ] HTTPS only (HSTS enabled)
- [ ] Secure cookie attributes (HttpOnly, Secure, SameSite)
- [ ] CORS properly configured

### Headers
- [ ] Content-Security-Policy
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy

### Secrets
- [ ] Secrets in environment variables
- [ ] .env not committed to git
- [ ] Secrets rotated periodically
- [ ] No secrets in logs or error messages

### Dependencies
- [ ] Dependencies scanned for vulnerabilities
- [ ] Lockfile committed
- [ ] Regular updates applied
