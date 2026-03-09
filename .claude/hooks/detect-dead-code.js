#!/usr/bin/env node
/**
 * Hook — detects named exports that are never imported elsewhere.
 *
 * Two modes:
 *   PostToolUse (CLAUDE_FILE_PATH set): checks only the written file against the project
 *   Stop (no CLAUDE_FILE_PATH):         full project scan — one O(2n) pass over all files
 */

const fs = require("fs");
const path = require("path");

if (process.env.CLAUDE_ANALYSIS === "0") process.exit(0);

const CHECKABLE = [".ts", ".tsx", ".js", ".jsx"];
const SKIP = [
  /index\.[jt]sx?$/,
  /\.test\./,
  /\.spec\./,
  /\.d\.ts$/,
  /\.config\./,
];
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  "coverage",
]);

const EXPORT_PATTERN =
  /export\s+(?:async\s+)?(?:function|class)\s+(\w+)|export\s+(?:const|let|var)\s+(\w+)|export\s+(?:type|interface)\s+(\w+)/g;

function* walkFiles(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkFiles(full);
    else if (CHECKABLE.includes(path.extname(entry.name))) yield full;
  }
}

function extractExports(content) {
  return new Set(
    [...content.matchAll(EXPORT_PATTERN)]
      .map((m) => m[1] ?? m[2] ?? m[3])
      .filter((n) => n && n.length > 2),
  );
}

// ── Per-file mode (PostToolUse) ──────────────────────────────────────────────
const filePath = process.env.CLAUDE_FILE_PATH ?? "";

if (filePath) {
  const ext = path.extname(filePath);
  if (!CHECKABLE.includes(ext)) process.exit(0);
  if (SKIP.some((p) => p.test(filePath))) process.exit(0);

  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    process.exit(0);
  }

  const namedExports = extractExports(content);
  if (namedExports.size === 0) process.exit(0);

  const normalizedPath = path.normalize(filePath);
  const baseName = path.basename(filePath.replace(/\.[jt]sx?$/, ""));
  const usedExports = new Set();

  for (const file of walkFiles(process.cwd())) {
    if (path.normalize(file) === normalizedPath) continue;
    let src;
    try {
      src = fs.readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    const importsFromUs =
      new RegExp(`['"][^'"]*\\/${baseName}['"]`).test(src) ||
      new RegExp(`from\\s+['"]${baseName}['"]`).test(src) ||
      new RegExp(`require\\(['"]${baseName}['"]\\)`).test(src);
    if (!importsFromUs) continue;
    for (const name of namedExports) {
      if (!/^\w+$/.test(name)) continue;
      if (new RegExp(`\\b${name}\\b`).test(src)) usedExports.add(name);
    }
  }

  const dead = [...namedExports].filter((n) => !usedExports.has(n));
  if (dead.length > 0) {
    process.stderr.write(
      `⚠️  Potentially unused exports in ${path.basename(filePath)}:\n` +
        dead.map((n) => `  - ${n}`).join("\n") +
        `\nVerify these are used or remove them to keep the codebase clean.\n`,
    );
  }
  process.exit(0);
}

// ── Full-scan mode (Stop) ────────────────────────────────────────────────────
// Pass 1: collect all exports per file
const exportMap = new Map(); // file → Set<name>
for (const file of walkFiles(process.cwd())) {
  if (SKIP.some((p) => p.test(file))) continue;
  let src;
  try {
    src = fs.readFileSync(file, "utf-8");
  } catch {
    continue;
  }
  const exports = extractExports(src);
  if (exports.size > 0) exportMap.set(file, exports);
}

if (exportMap.size === 0) process.exit(0);

// Pass 2: collect all identifiers used across the entire codebase
const allUsed = new Set();
for (const file of walkFiles(process.cwd())) {
  let src;
  try {
    src = fs.readFileSync(file, "utf-8");
  } catch {
    continue;
  }
  // Extract imported names from: import { A, B } from '...'; require('...')
  const importedNames = [...src.matchAll(/import\s+\{([^}]+)\}/g)].flatMap(
    (m) => m[1].split(",").map((s) => s.trim().replace(/\s+as\s+\w+/, "")),
  );
  for (const n of importedNames) {
    if (n && /^\w+$/.test(n)) allUsed.add(n);
  }
}

// Report dead exports (names never imported anywhere)
const issues = [];
for (const [file, exports] of exportMap) {
  const dead = [...exports].filter((n) => !allUsed.has(n));
  if (dead.length > 0) {
    issues.push(`  ${path.relative(process.cwd(), file)}: ${dead.join(", ")}`);
  }
}

if (issues.length > 0) {
  process.stderr.write(
    `⚠️  Potentially unused exports detected at session end:\n${issues.join("\n")}\n` +
      `Verify these are used or remove them to keep the codebase clean.\n`,
  );
}
process.exit(0);
