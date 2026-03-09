# /review - Code Review

Perform a code review on current changes or a pull request.

## Usage

```
/review [options]
```

## Options

- `--pr <number>` - Review specific PR
- `--staged` - Review staged changes
- `--branch <name>` - Review branch diff
- `--security` - Focus on security issues
- `--performance` - Focus on performance
- `--style` - Focus on code style

## Review Checklist

### Code Quality

- [ ] Code is readable and self-documenting
- [ ] Functions/methods are small and focused
- [ ] No code duplication
- [ ] Proper error handling
- [ ] Edge cases considered

### Security

- [ ] No hardcoded secrets/credentials
- [ ] Input validation present
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Authentication/authorization checks

### Performance

- [ ] No N+1 queries
- [ ] Proper memoization (useMemo, useCallback)
- [ ] No unnecessary re-renders
- [ ] Large lists are virtualized
- [ ] Images are optimized

### Testing

- [ ] Tests cover new functionality
- [ ] Edge cases tested
- [ ] Tests are meaningful (not just for coverage)
- [ ] Mocks are appropriate

### TypeScript

- [ ] Proper types (no `any`)
- [ ] Interfaces over types where appropriate
- [ ] Generics used correctly
- [ ] Null/undefined handled

### React Specific

- [ ] Proper use of hooks
- [ ] Keys in lists
- [ ] useEffect dependencies correct
- [ ] No memory leaks (cleanup in useEffect)
- [ ] Components properly decomposed

### API/Backend

- [ ] Proper HTTP methods
- [ ] Validation on input
- [ ] Error responses consistent
- [ ] Rate limiting considered
- [ ] Proper status codes

## Review Comments Template

### Approve

```
LGTM!

Minor suggestions:
- Consider extracting X to a separate function
- Add a comment explaining the logic in Y
```

### Request Changes

```
Thanks for the PR! A few things need attention:

**Must fix:**
- [ ] Add error handling for the API call
- [ ] Input validation missing

**Suggestions:**
- Consider using useMemo for the expensive calculation
- The function name could be more descriptive
```

### Blocking Issues

```
🚨 **Security Issue**

This code is vulnerable to SQL injection:
\`\`\`ts
const query = \`SELECT * FROM users WHERE id = \${userId}\`;
\`\`\`

Please use parameterized queries:
\`\`\`ts
const query = "SELECT * FROM users WHERE id = $1";
await db.query(query, [userId]);
\`\`\`
```

## Comment Prefixes

| Prefix        | Meaning                    |
| ------------- | -------------------------- |
| `nit:`        | Minor suggestion, optional |
| `suggestion:` | Improvement idea           |
| `question:`   | Need clarification         |
| `todo:`       | Must be addressed          |
| `blocking:`   | Prevents approval          |

## Review Workflow

1. **Understand context**
   - Read PR description
   - Check linked issues
   - Understand the goal

2. **Review changes**
   - Start with test files (understand expected behavior)
   - Review implementation
   - Check for edge cases

3. **Test locally** (if needed)

   ```bash
   gh pr checkout 123
   pnpm install
   pnpm test
   pnpm dev
   ```

4. **Leave feedback**
   - Be constructive
   - Explain the "why"
   - Suggest alternatives

5. **Submit review**

   ```bash
   # Approve
   gh pr review 123 --approve -b "LGTM!"

   # Request changes
   gh pr review 123 --request-changes -b "Please address the comments"

   # Comment only
   gh pr review 123 --comment -b "Some thoughts..."
   ```

## Common Issues to Look For

### React

```tsx
// BAD: Missing dependency
useEffect(() => {
  fetchData(userId);
}, []); // userId missing

// BAD: Object in dependency array
useEffect(() => {
  doSomething(config);
}, [config]); // New object every render

// BAD: Function recreated every render
<Button onClick={() => handleClick(id)} />;
```

### TypeScript

```tsx
// BAD: Using any
const data: any = response.json();

// BAD: Type assertion without validation
const user = data as User;

// GOOD: Runtime validation
const user = userSchema.parse(data);
```

### Performance

```tsx
// BAD: Expensive calculation every render
const sorted = items.sort((a, b) => a.name.localeCompare(b.name));

// GOOD: Memoized
const sorted = useMemo(
  () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
  [items],
);
```

## GitHub CLI Commands

```bash
# View PR diff
gh pr diff 123

# View PR files
gh pr view 123 --json files

# Add comment to PR
gh pr comment 123 -b "Great work!"

# View PR checks
gh pr checks 123

# List pending reviews
gh pr list --search "review:required"
```

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Document any patterns or issues discovered during review
2. Update coding guidelines if new best practices were identified
3. Add notes about technical debt or follow-up tasks needed
