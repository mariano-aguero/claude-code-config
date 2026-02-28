#!/usr/bin/env node
/**
 * PreToolUse hook — blocks Claude from reading .env files.
 * Matches: .env, .env.local, .env.production, .env.development, etc.
 */

const path = require("path");

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const filename = path.basename(filePath);

const isEnvFile = filename === ".env" || filename.startsWith(".env.");

if (isEnvFile) {
  process.stderr.write(
    `🚫 Blocked: '${filename}' is a protected .env file and cannot be read by Claude.\n`
  );
  process.exit(2);
}
