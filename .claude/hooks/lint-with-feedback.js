#!/usr/bin/env node
/**
 * PostToolUse hook — runs ESLint with auto-fix, then reports remaining errors.
 * Unlike the silent `eslint --fix || true` pattern, this feeds unresolved
 * lint violations back to Claude so it can fix them manually.
 */

const { spawnSync } = require("child_process");
const path = require("path");

// Set CLAUDE_LINT=0 in settings.local.json → env to disable linting
if (process.env.CLAUDE_LINT === "0") process.exit(0);

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const ext = path.extname(filePath);

const LINTABLE = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];
if (!LINTABLE.includes(ext)) process.exit(0);

// Step 1: auto-fix what ESLint can
spawnSync("pnpm", ["eslint", "--fix", filePath], { stdio: "ignore" });

// Step 2: check for remaining unfixable issues
const result = spawnSync("pnpm", ["eslint", filePath], { encoding: "utf-8" });

// status is null when the process couldn't be spawned (pnpm/eslint not in PATH)
if (result.status === null) process.exit(0);

if (result.status !== 0) {
  const output = [result.stdout ?? "", result.stderr ?? ""].join("").trim();
  process.stderr.write(
    `⚠️  ESLint errors remain in ${path.basename(filePath)} (after auto-fix):\n\n${output}\n\nFix these manually before proceeding.\n`,
  );
  process.exit(2);
}
