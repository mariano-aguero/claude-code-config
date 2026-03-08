# /commit - Create Conventional Commit

Create a git commit following Conventional Commits specification.

## Usage

```
/commit [options]
```

## Options

- `--amend` - Amend previous commit
- `--scope` - Specify scope explicitly

## Commit Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

| Type       | Description                  |
| ---------- | ---------------------------- |
| `feat`     | New feature                  |
| `fix`      | Bug fix                      |
| `docs`     | Documentation only           |
| `style`    | Formatting (no code change)  |
| `refactor` | Code restructuring           |
| `perf`     | Performance improvement      |
| `test`     | Adding/fixing tests          |
| `chore`    | Build, dependencies, tooling |
| `ci`       | CI/CD changes                |
| `revert`   | Revert previous commit       |

## Workflow

1. **Analyze staged changes** with `git diff --staged`
2. **Determine type** based on changes
3. **Identify scope** from affected files/modules
4. **Write description** (imperative, lowercase, no period)
5. **Add body** if changes need explanation
6. **Create commit**

## Examples

### Feature

```bash
git commit -m "feat(auth): add OAuth2 login flow

- Add Google OAuth provider
- Implement token refresh
- Add login/logout redirects

Closes #123"
```

### Bug Fix

```bash
git commit -m "fix(api): handle null response from users endpoint

The API was returning 500 when user had no profile.
Now returns empty object with default values."
```

### Refactor

```bash
git commit -m "refactor(hooks): extract common fetch logic to useQuery"
```

### Breaking Change

```bash
git commit -m "feat(api)!: change response format for /users endpoint

BREAKING CHANGE: Response is now paginated.
Previous: { users: [...] }
New: { data: [...], meta: { page, total } }"
```

### Multiple Scopes

```bash
git commit -m "feat(auth,api): implement JWT authentication"
```

### Chore

```bash
git commit -m "chore(deps): update dependencies

- react 18.2.0 -> 18.3.0
- next 14.1.0 -> 14.2.0
- typescript 5.3.0 -> 5.4.0"
```

## Scope Suggestions

Based on common project structure:

- `auth` - Authentication/authorization
- `api` - API routes/endpoints
- `ui` - UI components
- `db` - Database/models
- `config` - Configuration
- `deps` - Dependencies
- `ci` - CI/CD pipelines
- `docs` - Documentation
- `test` - Testing
- `build` - Build system

## Best Practices

1. **Atomic commits** - One logical change per commit
2. **Present tense** - "add feature" not "added feature"
3. **Imperative mood** - "fix bug" not "fixes bug"
4. **Lowercase** - Start with lowercase letter
5. **No period** - Don't end description with period
6. **50/72 rule** - Subject ≤50 chars, body wrapped at 72

## Commit Message Template

```bash
# .gitmessage
# <type>(<scope>): <description>
#
# [optional body]
#
# [optional footer(s)]
#
# Types: feat, fix, docs, style, refactor, perf, test, chore, ci
# Scope: component or area affected
# Description: imperative, lowercase, no period, ≤50 chars
#
# Body: explain what and why (not how), wrap at 72 chars
# Footer: BREAKING CHANGE:, Closes #issue, Co-authored-by:
```

Configure:

```bash
git config --global commit.template ~/.gitmessage
```

## Post-Execution

Update `CLAUDE.md` only if the commit introduces a breaking change, new
architecture pattern, or environment variable that future sessions need to know.
