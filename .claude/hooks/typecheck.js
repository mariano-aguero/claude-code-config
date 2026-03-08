#!/usr/bin/env node
/**
 * PostToolUse hook — runs TypeScript type checking after editing .ts/.tsx files.
 * Catches type errors across the project (e.g. updated signature, missed call sites).
 * Uses --incremental when tsconfig supports it to avoid 10-30s full rebuilds.
 */

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const ext = path.extname(filePath);

if (![".ts", ".tsx"].includes(ext)) process.exit(0);

const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");
if (!fs.existsSync(tsconfigPath)) process.exit(0);

// Note: --incremental + --noEmit was removed — it corrupts .tsbuildinfo on TS < 5.4
// and provides minimal benefit since we're only checking, not emitting.
const args = ["tsc", "--noEmit"];

const result = spawnSync("pnpm", args, {
  encoding: "utf-8",
  timeout: 30_000,
  cwd: process.cwd(),
});

if (result.status !== 0) {
  const output = (result.stdout ?? "") + (result.stderr ?? "");
  process.stderr.write(
    `⚠️  TypeScript errors detected — fix before proceeding:\n\n${output}\n`,
  );
  process.exit(2);
}
