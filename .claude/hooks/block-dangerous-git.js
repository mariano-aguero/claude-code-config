#!/usr/bin/env node
/**
 * PreToolUse hook — blocks destructive git and filesystem commands.
 * Requires explicit user confirmation before allowing force pushes,
 * hard resets, and recursive deletions.
 */

const input = process.env.CLAUDE_TOOL_INPUT ?? "{}";

let command = "";
try {
  command = JSON.parse(input).command ?? "";
} catch {
  process.exit(0);
}

const DANGEROUS = [
  {
    pattern: /git\s+push\s+.*?(--force|-f)\b/,
    label: "git push --force",
    hint: "Force pushing can overwrite remote history.",
  },
  {
    pattern: /git\s+reset\s+--hard/,
    label: "git reset --hard",
    hint: "Hard reset discards all uncommitted changes permanently.",
  },
  {
    pattern: /git\s+clean\s+.*?-[a-z]*f/,
    label: "git clean -f",
    hint: "This permanently deletes untracked files.",
  },
  {
    pattern: /git\s+checkout\s+.*?(--force|-f)\b/,
    label: "git checkout --force",
    hint: "Force checkout discards local modifications.",
  },
  {
    pattern: /\brm\s+-[a-z]*rf?\b/,
    label: "rm -rf",
    hint: "Recursive deletion is irreversible.",
  },
  {
    pattern: /git\s+branch\s+-[a-z]*D\b/,
    label: "git branch -D",
    hint: "Force deletes a branch even with unmerged commits.",
  },
];

const matched = DANGEROUS.find((d) => d.pattern.test(command));

if (matched) {
  process.stderr.write(
    `🚨 Blocked: '${matched.label}' is a destructive command.\n${matched.hint}\nAsk the user for explicit confirmation before running this.\n`
  );
  process.exit(2);
}
