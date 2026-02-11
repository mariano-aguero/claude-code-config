# /pr - Create Pull Request

Create a pull request with proper description template.

## Usage

```
/pr [options]
```

## Options

- `--draft` - Create as draft PR
- `--base <branch>` - Target branch (default: main)
- `--title <title>` - PR title
- `--reviewers <users>` - Request reviewers

## Workflow

1. **Ensure branch is pushed** to remote
2. **Analyze commits** on current branch
3. **Generate title** from commits or branch name
4. **Generate description** with summary, changes, testing
5. **Create PR** with `gh pr create`

## PR Template

```markdown
## Summary

Brief description of what this PR does and why.

## Changes

- Change 1
- Change 2
- Change 3

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

### Test Instructions

1. Step to test
2. Expected result

## Screenshots (if applicable)

| Before | After |
|--------|-------|
| image  | image |

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally

## Related Issues

Closes #<issue_number>
```

## Commands

### Create PR
```bash
# Interactive
gh pr create

# With options
gh pr create --title "feat: add user authentication" --body-file .github/pr-body.md

# Draft PR
gh pr create --draft

# With reviewers
gh pr create --reviewer user1,user2

# To specific branch
gh pr create --base develop
```

### View/Manage PRs
```bash
# List PRs
gh pr list

# View PR
gh pr view 123

# View in browser
gh pr view --web

# Check status
gh pr checks

# Merge PR
gh pr merge 123 --squash --delete-branch
```

## Title Format

Follow Conventional Commits format:

```
<type>(<scope>): <description>
```

Examples:
- `feat(auth): implement OAuth login`
- `fix(api): handle rate limiting errors`
- `docs: update API documentation`

## Branch to Title Mapping

| Branch Pattern | PR Title |
|---------------|----------|
| `feat/AUTH-123-oauth-login` | `feat(auth): implement oauth login` |
| `fix/BUG-456-null-error` | `fix: handle null error` |
| `chore/update-deps` | `chore(deps): update dependencies` |

## Automation

### GitHub Actions for PR

```yaml
# .github/workflows/pr.yml
name: PR Checks

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate PR Title
        uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Check for linked issues
        uses: nearform-actions/github-action-check-linked-issues@v1
        with:
          exclude-branches: "main,develop"
```

## Best Practices

1. **Small PRs** - Easier to review, faster to merge
2. **Single purpose** - One feature/fix per PR
3. **Good title** - Clear, follows convention
4. **Detailed description** - What, why, how to test
5. **Link issues** - Connect to related issues
6. **Add screenshots** - For UI changes
7. **Request reviews** - Get early feedback
8. **Respond to feedback** - Address comments promptly

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Document the new feature or fix in the appropriate section
2. Update the architecture section if significant changes were made
3. Add any new environment variables or configuration changes
