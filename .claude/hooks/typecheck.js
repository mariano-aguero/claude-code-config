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

// Detect package manager from lockfile
function detectPackageManager() {
  const cwd = process.cwd();
  // bun.lockb = binary (< 1.1.14), bun.lock = textual (>= 1.1.14)
  if (
    fs.existsSync(path.join(cwd, "bun.lockb")) ||
    fs.existsSync(path.join(cwd, "bun.lock"))
  )
    return "bun";
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(cwd, "package-lock.json"))) return "npm";
  return "pnpm"; // default
}
const pm = detectPackageManager();

// Note: --incremental + --noEmit was removed — it corrupts .tsbuildinfo on TS < 5.4
// and provides minimal benefit since we're only checking, not emitting.
const args =
  pm === "npm"  ? ["exec", "tsc", "--", "--noEmit"] :
  pm === "bun"  ? ["x", "tsc", "--noEmit"] :
  pm === "yarn" ? ["dlx", "tsc", "--noEmit"] :
                  ["tsc", "--noEmit"]; // pnpm

const result = spawnSync(pm, args, {
  encoding: "utf-8",
  timeout: 30_000,
  cwd: process.cwd(),
});

// Timed out — don't block Claude
if (result.signal === "SIGTERM") process.exit(0);

if (result.status !== 0) {
  const output = (result.stdout ?? "") + (result.stderr ?? "");
  process.stderr.write(
    `⚠️  TypeScript errors detected — fix before proceeding:\n\n${output}\n`,
  );
  process.exit(2);
}
