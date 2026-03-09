#!/usr/bin/env node
/**
 * PostToolUse hook — runs ESLint with auto-fix, then reports remaining errors.
 * Unlike the silent `eslint --fix || true` pattern, this feeds unresolved
 * lint violations back to Claude so it can fix them manually.
 */

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Set CLAUDE_LINT=0 in settings.local.json → env to disable linting
if (process.env.CLAUDE_LINT === "0") process.exit(0);

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const ext = path.extname(filePath);

const LINTABLE = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];
if (!LINTABLE.includes(ext)) process.exit(0);

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

const fixArgs =
  pm === "npm"
    ? ["exec", "eslint", "--", "--fix", filePath]
    : pm === "bun"
      ? ["x", "eslint", "--fix", filePath]
      : pm === "yarn"
        ? ["dlx", "eslint", "--fix", filePath]
        : ["eslint", "--fix", filePath]; // pnpm

const checkArgs =
  pm === "npm"
    ? ["exec", "eslint", "--", filePath]
    : pm === "bun"
      ? ["x", "eslint", filePath]
      : pm === "yarn"
        ? ["dlx", "eslint", filePath]
        : ["eslint", filePath]; // pnpm

// Step 1: auto-fix what ESLint can
spawnSync(pm, fixArgs, {
  stdio: "ignore",
  timeout: 30_000,
});

// Step 2: check for remaining unfixable issues
const result = spawnSync(pm, checkArgs, {
  encoding: "utf-8",
  timeout: 30_000,
});

// status is null when the process couldn't be spawned (pnpm/eslint not in PATH)
if (result.status === null) process.exit(0);
if (result.signal === "SIGTERM") {
  process.stderr.write(
    `⚠️  ESLint timed out on ${path.basename(filePath)} — skipping lint check.\n`,
  );
  process.exit(0);
}

if (result.status !== 0) {
  const output = [result.stdout ?? "", result.stderr ?? ""].join("").trim();
  process.stderr.write(
    `⚠️  ESLint errors remain in ${path.basename(filePath)} (after auto-fix):\n\n${output}\n\nFix these manually before proceeding.\n`,
  );
  process.exit(2);
}
