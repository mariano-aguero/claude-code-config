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

| Hook | When it runs | `CLAUDE_FILE_PATH` set? | Use case |
|------|--------------|------------------------|----------|
| `PreToolUse` | Before a tool executes | Yes (Read/Write/Edit) | Block dangerous commands, protect files |
| `PostToolUse` | After a tool executes | Yes | Formatting, linting, type checking, analysis |
| `Stop` | When Claude finishes responding | No | Session-level scans, notifications, reminders |
| `Notification` | When Claude emits a notification | No | Alerts, desktop notifications |
| `UserPromptSubmit` | Before Claude processes each message | No | Inject context (git state, agents list) |
| `PreCompact` | Before context window compaction | No | Snapshot state before memory is compressed |
| `SessionStart` | Once at the start of each session | No | Load persistent context, memory, work log |

> **Important:** `CLAUDE_FILE_PATH` is only available in `PreToolUse`/`PostToolUse` hooks triggered
> by file-related tools (Read, Write, Edit). Hooks registered on `Stop`, `SessionStart`,
> `UserPromptSubmit`, `PreCompact`, and `Notification` receive `CLAUDE_FILE_PATH=""` — hooks
> that depend on it must be registered under `PostToolUse`, not `Stop`.

## Environment Variables

| Variable | Description | Available in |
|----------|-------------|-------------|
| `CLAUDE_FILE_PATH` | Absolute path to the affected file | PreToolUse, PostToolUse (file tools) |
| `CLAUDE_TOOL_INPUT` | Tool input as JSON string | PreToolUse, PostToolUse |
| `CLAUDE_TOOL_NAME` | Name of the tool used | PreToolUse, PostToolUse |

## Current Configuration

### PostToolUse Hooks (Write/Edit)

After every `Write` or `Edit`, these run in order:
1. **Prettier** — Format the file (skipped if `CLAUDE_FORMAT=0`)
2. **ESLint** — Fix and report lint errors (skipped if `CLAUDE_LINT=0`)
3. **TypeScript** — Type-check `.ts`/`.tsx` files
4. **Analysis** — Detect secrets, missing tests, high complexity
5. **Tech Debt** — Track TODO/FIXME comments → `.claude/tech-debt.md`
6. **Dead Code** — Check for unexported or unused named exports
7. **Duplicates** — Per-file duplicate export check
8. **Auto-stage** — `git add` the written file

### Stop Hooks (session-level, no CLAUDE_FILE_PATH)

When Claude finishes a response:
1. **save-session-notes** — Persist git state + work log to `.claude/session-notes.md`
2. **detect-duplicates** — Full project-wide duplicate export scan
3. **pre-pr-checklist** — Generate `.claude/pr-checklist.md` if commits are ahead of remote
4. **pnpm test** — Run test suite
5. **Reminder** — Prompt to run `/log-auto`

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
      "command": "node -e \"if(process.env.CLAUDE_FILE_PATH?.endsWith('.ts'))require('child_process').spawnSync('pnpm',['eslint','--fix',process.env.CLAUDE_FILE_PATH],{stdio:'inherit'})\""
    }
  ]
}
```

> **Note:** Avoid bash-specific `[[ ]]` syntax in hook commands — it requires bash and silently fails in sh/dash (Ubuntu, CI containers). Prefer Node.js one-liners or dedicated hook scripts for cross-shell compatibility.

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
