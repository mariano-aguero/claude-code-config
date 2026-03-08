#!/usr/bin/env node
/**
 * PreToolUse hook — blocks destructive git, filesystem, and bash commands.
 * Covers: force pushes, hard resets, rm -rf, curl|sh, fork bombs, chmod 777, etc.
 * Requires explicit user confirmation before allowing any of these.
 */

const input = process.env.CLAUDE_TOOL_INPUT ?? "{}";

let command = "";
try {
  command = JSON.parse(input).command ?? "";
} catch {
  process.exit(0);
}

const DANGEROUS = [
  // ── Git ──────────────────────────────────────────────────────────────────
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
    pattern: /git\s+branch\s+-[a-z]*D\b/,
    label: "git branch -D",
    hint: "Force deletes a branch even with unmerged commits.",
  },

  // ── Filesystem ───────────────────────────────────────────────────────────
  {
    pattern: /\brm\s+-[a-z]*r[a-z]*f\b.*?(~|\/\s*$|\$HOME|\/root|\/usr|\/etc|\/var)/,
    label: "rm -rf targeting home/system directory",
    hint: "Recursive deletion of home or system directories is irreversible.",
  },
  {
    pattern: /\brm\s+-[a-z]*rf?\s+\/\s*$/,
    label: "rm -rf /",
    hint: "This would delete the entire filesystem.",
  },
  {
    pattern: /\bchmod\s+-[a-z]*R\b.*?777/,
    label: "chmod -R 777",
    hint: "Recursively opening all permissions is a security risk.",
  },
  {
    pattern: /\bmkfs\b/,
    label: "mkfs",
    hint: "This formats a filesystem, destroying all data on the device.",
  },
  {
    pattern: /\bdd\b.*\bif=\/dev\/zero\b/,
    label: "dd if=/dev/zero",
    hint: "Zeroing a device destroys all data on it.",
  },

  // ── Remote code execution ────────────────────────────────────────────────
  {
    pattern: /\bcurl\b[^|]*\|.*\b(bash|sh|zsh|fish)\b/,
    label: "curl | bash",
    hint: "Piping curl to a shell executes unreviewed remote code.",
  },
  {
    pattern: /\bwget\b[^|]*\|.*\b(bash|sh|zsh|fish)\b/,
    label: "wget | bash",
    hint: "Piping wget to a shell executes unreviewed remote code.",
  },

  // ── System attacks ───────────────────────────────────────────────────────
  {
    pattern: /:\(\)\s*\{\s*:\|:&\s*\}/,
    label: "fork bomb",
    hint: "This will crash the system by exhausting all processes.",
  },
];

const matched = DANGEROUS.find((d) => d.pattern.test(command));

if (matched) {
  process.stderr.write(
    `🚨 Blocked: '${matched.label}' is a destructive command.\n${matched.hint}\nAsk the user for explicit confirmation before running this.\n`
  );
  process.exit(2);
}
