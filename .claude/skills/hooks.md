---
name: claude-hooks
description: Claude Code hooks configuration for automating linting, formatting, testing, and other tasks. Use when configuring automation in Claude Code projects.
---

# Claude Code Hooks

Hooks are shell commands that run automatically in response to Claude Code events.

## Configuration

Hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [...],
    "PostToolUse": [...],
    "Stop": [...],
    "Notification": [...]
  }
}
```

## Hook Types

| Hook | When it runs | Use case |
|------|--------------|----------|
| `PreToolUse` | Before a tool executes | Validation, confirmation |
| `PostToolUse` | After a tool executes | Formatting, linting |
| `Stop` | When Claude finishes a task | Tests, notifications |
| `Notification` | When Claude sends a notification | Alerts, logging |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `$CLAUDE_FILE_PATH` | Path to the affected file |
| `$CLAUDE_TOOL_NAME` | Name of the tool used |
| `$CLAUDE_TOOL_INPUT` | Tool input as JSON |

## Current Configuration

### PostToolUse Hooks

After every `Write` or `Edit`:
1. **Prettier** - Format the file
2. **ESLint** - Fix linting issues

```json
{
  "matcher": "Write",
  "command": "pnpm prettier --write \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
}
```

### Stop Hooks

When Claude finishes:
1. **Run tests** - Execute test suite

```json
{
  "command": "pnpm test 2>/dev/null || echo 'No tests configured'"
}
```

## Common Patterns

### Format on Save

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "command": "pnpm prettier --write \"$CLAUDE_FILE_PATH\""
    }
  ]
}
```

### Lint TypeScript Files Only

```json
{
  "PostToolUse": [
    {
      "matcher": "Write",
      "command": "[[ \"$CLAUDE_FILE_PATH\" == *.ts ]] && pnpm eslint --fix \"$CLAUDE_FILE_PATH\" || true"
    }
  ]
}
```

### Run Tests for Changed Files

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "command": "pnpm vitest related \"$CLAUDE_FILE_PATH\" --run 2>/dev/null || true"
    }
  ]
}
```

### Notify on Completion (macOS)

```json
{
  "Stop": [
    {
      "command": "osascript -e 'display notification \"Claude finished\" with title \"Claude Code\"'"
    }
  ]
}
```

### Slack Notification

```json
{
  "Stop": [
    {
      "command": "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"Claude finished task\"}' $SLACK_WEBHOOK_URL"
    }
  ]
}
```

### Type Check After Edit

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "command": "[[ \"$CLAUDE_FILE_PATH\" == *.ts* ]] && pnpm tsc --noEmit 2>/dev/null || true"
    }
  ]
}
```

### Git Add Modified Files

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "command": "git add \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
    }
  ]
}
```

## Tips

1. **Always use `|| true`** to prevent hook failures from blocking Claude
2. **Use `2>/dev/null`** to suppress error output for optional tools
3. **Use matchers** to target specific tools (Write, Edit, Bash, etc.)
4. **Test hooks manually** before adding to settings
5. **Keep hooks fast** - slow hooks delay Claude's responses

## Limitations

- Hooks run shell commands only (not Claude Code commands like `/init`)
- Hooks run synchronously and block until complete
- No access to Claude's context or conversation
- Cannot modify Claude's behavior, only run side effects
