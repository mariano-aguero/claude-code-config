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

// Match shell commands that read .env files: cat .env, cat .env.local, etc.
const ENV_READ_PATTERN =
  /(?:cat|head|tail|sed|awk|less|more|bat|vim?|nano|open|print)\s+\S*\.env(?:\.\S+)?\b/i;

if (ENV_READ_PATTERN.test(command)) {
  process.stderr.write(
    "🚫 Blocked: Reading .env files via shell commands is not allowed.\n",
  );
  process.exit(2);
}
