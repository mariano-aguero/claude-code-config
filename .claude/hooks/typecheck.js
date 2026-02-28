#!/usr/bin/env node
/**
 * PostToolUse hook — runs TypeScript type checking after editing .ts/.tsx files.
 * Catches type errors across the project (e.g. updated signature, missed call sites).
 */

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const ext = path.extname(filePath);

if (![".ts", ".tsx"].includes(ext)) process.exit(0);

if (!fs.existsSync("tsconfig.json")) process.exit(0);

const result = spawnSync("npx", ["tsc", "--noEmit"], {
  encoding: "utf-8",
  timeout: 30_000,
});

if (result.status !== 0) {
  const output = (result.stdout ?? "") + (result.stderr ?? "");
  process.stderr.write(
    `⚠️  TypeScript errors detected — fix before proceeding:\n\n${output}\n`
  );
  process.exit(2);
}
