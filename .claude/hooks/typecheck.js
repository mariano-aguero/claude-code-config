#!/usr/bin/env node
/**
 * PostToolUse hook — runs TypeScript type checking after editing .ts/.tsx files.
 * Catches type errors across the project (e.g. updated signature, missed call sites).
 *
 * Skips automatically on large projects (> 300 TS files) to avoid 30s+ blocking runs.
 * Override: set CLAUDE_TYPECHECK=1 to force, CLAUDE_TYPECHECK=0 to disable entirely.
 */

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Explicit opt-out
if (process.env.CLAUDE_TYPECHECK === "0") process.exit(0);

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const ext = path.extname(filePath);

if (![".ts", ".tsx"].includes(ext)) process.exit(0);

const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");
if (!fs.existsSync(tsconfigPath)) process.exit(0);

// Skip tiny files — not worth a full tsc run for a 5-line change
try {
  const lines = fs.readFileSync(filePath, "utf-8").split("\n").length;
  if (lines < 10) process.exit(0);
} catch {
  process.exit(0);
}

// Auto-skip on large projects unless user explicitly forced it
if (process.env.CLAUDE_TYPECHECK !== "1") {
  const IGNORE_DIRS = new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    ".cache",
    "coverage",
  ]);
  let tsFileCount = 0;

  function countTsFiles(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      if (entry.isDirectory()) {
        countTsFiles(path.join(dir, entry.name));
      } else if (/\.[jt]sx?$/.test(entry.name)) {
        tsFileCount++;
        if (tsFileCount > 300) return; // early exit
      }
    }
  }

  countTsFiles(process.cwd());

  if (tsFileCount > 300) {
    process.stderr.write(
      `ℹ️  Skipping typecheck — large project (${tsFileCount}+ TS files).\n` +
        `  Set CLAUDE_TYPECHECK=1 in settings.local.json to force it.\n`,
    );
    process.exit(0);
  }
}

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
  pm === "npm"
    ? ["exec", "tsc", "--", "--noEmit"]
    : pm === "bun"
      ? ["x", "tsc", "--noEmit"]
      : pm === "yarn"
        ? ["dlx", "tsc", "--noEmit"]
        : ["tsc", "--noEmit"]; // pnpm

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
