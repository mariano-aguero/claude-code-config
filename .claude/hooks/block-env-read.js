#!/usr/bin/env node
/**
 * PreToolUse hook — blocks Claude from reading .env files.
 * Matches: .env, .env.local, .env.production, .env.development, etc.
 *
 * Works for two tool types:
 *   Read tool  — checks CLAUDE_FILE_PATH (set by Claude for file tool calls)
 *   Bash tool  — checks CLAUDE_TOOL_INPUT.command for shell reads of .env files
 */

const path = require("path");

// ── Read tool path ─────────────────────────────────────────────────────────
const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const toolName = process.env.CLAUDE_TOOL_NAME ?? "";

if (toolName === "Read") {
  const filename = path.basename(filePath);
  const isEnvFile = filename === ".env" || filename.startsWith(".env.");
  if (isEnvFile) {
    process.stderr.write(
      `🚫 Blocked: '${filename}' is a protected .env file and cannot be read by Claude.\n`,
    );
    process.exit(2);
  }
  process.exit(0);
}

// ── Bash tool path ─────────────────────────────────────────────────────────
let command = "";
try {
  command = JSON.parse(process.env.CLAUDE_TOOL_INPUT ?? "{}").command ?? "";
} catch {}

// Match shell commands that read .env files in two forms:
//   Direct: cat .env, head .env.local, cat /path/to/.env, cat ~/.env
//   Grep:   grep SECRET .env, rg "" .env.local (filename is a later arg)
//   Source: source .env, source .env.local
// Uses [/\s] instead of \s alone to also catch path-prefixed forms like
// `cat /path/to/.env` or `cat ~./env` where .env follows a slash.
const ENV_READ_DIRECT =
  /(?:cat|head|tail|sed|awk|less|more|bat|vim?|nano|open|print|source)\b[^;\n&|]*[/\s]\.env(?:\.[^\s;|&]*)?(?:\s|$)/i;
// Requires at least one arg before .env so .env is the filename, not the pattern
// (handles: grep SECRET .env, rg -n "" .env.local, but not: grep .env file.txt)
const ENV_GREP_PATTERN =
  /\b(?:grep|rg)\b\s+(?:\S+\s+)+\.env(?:\.[^\s;|&]*)?(?:\s|$)/;
// POSIX dot-source: `. .env` or `. .env.local`
const ENV_DOT_SOURCE = /(?:^|\s)\.\s+\.env(?:\.[^\s;|&]*)?(?:\s|$)/;

if (
  ENV_READ_DIRECT.test(command) ||
  ENV_GREP_PATTERN.test(command) ||
  ENV_DOT_SOURCE.test(command)
) {
  process.stderr.write(
    "🚫 Blocked: Reading .env files via shell commands is not allowed.\n",
  );
  process.exit(2);
}
