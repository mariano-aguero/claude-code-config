#!/usr/bin/env node
/**
 * PostToolUse hook — detects source files missing test coverage.
 * When Claude writes a new function or class, checks whether a corresponding
 * test file exists and whether it covers the exported names.
 */

const fs = require("fs");
const path = require("path");

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const ext = path.extname(filePath);

const CHECKABLE = [".ts", ".tsx", ".js", ".jsx"];
const SKIP_PATTERNS = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /__tests__/,
  /\.d\.ts$/,
  /\.config\.[jt]sx?$/,
  /\.stories\.[jt]sx?$/,
];

if (!CHECKABLE.includes(ext)) process.exit(0);
if (SKIP_PATTERNS.some((p) => p.test(filePath))) process.exit(0);

let content;
try {
  content = fs.readFileSync(filePath, "utf-8");
} catch {
  process.exit(0);
}

// Extract exported names using matchAll instead of exec loop
const EXPORT_PATTERN =
  /export\s+(?:async\s+)?(?:function|class)\s+(\w+)|export\s+(?:const|let)\s+(\w+)\s*=/g;

const namedExports = new Set(
  [...content.matchAll(EXPORT_PATTERN)]
    .map((m) => m[1] ?? m[2])
    .filter((n) => n && n.length > 2)
);

if (namedExports.size === 0) process.exit(0);

// Candidate test file paths
const dir = path.dirname(filePath);
const base = path.basename(filePath, ext);
const candidates = [
  path.join(dir, `${base}.test${ext}`),
  path.join(dir, `${base}.spec${ext}`),
  path.join(dir, "__tests__", `${base}${ext}`),
  path.join(dir, `${base}.test.ts`),
  path.join(dir, `${base}.spec.ts`),
  path.join(dir, "__tests__", `${base}.ts`),
];

const testFile = candidates.find((c) => fs.existsSync(c));

if (!testFile) {
  process.stderr.write(
    `⚠️  No test file found for ${path.basename(filePath)}.\n` +
      `Expected one of:\n${candidates.slice(0, 3).map((c) => `  ${c}`).join("\n")}\n` +
      `Exports without tests: ${[...namedExports].join(", ")}\n`
  );
  process.exit(2);
}

// Test file exists — check which exports appear in it
let testContent;
try {
  testContent = fs.readFileSync(testFile, "utf-8");
} catch {
  process.exit(0);
}

const uncovered = [...namedExports].filter((name) => !testContent.includes(name));

if (uncovered.length > 0) {
  process.stderr.write(
    `⚠️  ${path.basename(testFile)} exists but doesn't cover:\n` +
      uncovered.map((n) => `  - ${n}`).join("\n") +
      `\nAdd tests for these exports.\n`
  );
  process.exit(2);
}
