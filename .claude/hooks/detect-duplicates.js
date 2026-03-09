#!/usr/bin/env node
/**
 * Hook — detects duplicate function/export definitions across the codebase.
 *
 * Two modes:
 *   PostToolUse (CLAUDE_FILE_PATH set): checks only the written file against the project
 *   Stop (no CLAUDE_FILE_PATH):         full project scan for all duplicate names
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

if (process.env.CLAUDE_ANALYSIS === "0") process.exit(0);

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const ext = path.extname(filePath);

const CHECKABLE = [".js", ".jsx", ".ts", ".tsx", ".mjs"];
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
  /export\s+(?:async\s+)?(?:function|class)\s+(\w+)|export\s+(?:const|let)\s+(\w+)\s*=/g;

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

function extractNames(content) {
  const names = new Set();
  for (const m of content.matchAll(EXPORT_PATTERN)) {
    const name = m[1] ?? m[2];
    if (name && name.length > 2) names.add(name);
  }
  return names;
}

// ── Per-file mode (PostToolUse) ─────────────────────────────────────────────
if (filePath) {
  if (!CHECKABLE.includes(ext)) process.exit(0);

  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    process.exit(0);
  }

  const names = extractNames(content);
  if (names.size === 0) process.exit(0);

  const nameFiles = new Map([...names].map((n) => [n, []]));

  const compiledPatterns = new Map(
    [...names].map((n) => [
      n,
      new RegExp(
        `\\bfunction\\s+${n}\\b|\\bconst\\s+${n}\\s*=|\\blet\\s+${n}\\s*=|\\bclass\\s+${n}\\b`,
      ),
    ]),
  );

  for (const file of walkFiles(process.cwd())) {
    const normalized = path.normalize(file);
    if (normalized === path.normalize(filePath)) continue;

    let src;
    try {
      src = fs.readFileSync(file, "utf-8");
    } catch {
      continue;
    }

    for (const name of names) {
      if (compiledPatterns.get(name).test(src))
        nameFiles.get(name).push(normalized);
    }
  }

  const duplicates = [...nameFiles.entries()].filter(
    ([, files]) => files.length > 0,
  );
  if (duplicates.length > 0) {
    const report = duplicates
      .map(([name, files]) => `  - ${name} → also in: ${files.join(", ")}`)
      .join("\n");
    process.stderr.write(
      `⚠️  Duplicate exports in ${path.basename(filePath)}:\n${report}\n\nConsider importing instead of redefining.\n`,
    );
  }
  process.exit(0);
}

// ── Full project scan mode (Stop) ───────────────────────────────────────────
// Use git rev-parse to detect the repo root — works in monorepos where .git is in a parent dir
const isGitRepo =
  spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf-8" })
    .status === 0;
if (!isGitRepo) process.exit(0);

/** name → [file, file, ...] */
const nameToFiles = new Map();

for (const file of walkFiles(process.cwd())) {
  let src;
  try {
    src = fs.readFileSync(file, "utf-8");
  } catch {
    continue;
  }

  const fileNames = extractNames(src);
  for (const name of fileNames) {
    if (!nameToFiles.has(name)) nameToFiles.set(name, []);
    nameToFiles.get(name).push(path.normalize(file));
  }
}

const projectDuplicates = [...nameToFiles.entries()].filter(
  ([, files]) => files.length > 1,
);

if (projectDuplicates.length > 0) {
  const report = projectDuplicates
    .map(([name, files]) => `  - ${name}: ${files.join(", ")}`)
    .join("\n");
  process.stderr.write(
    `⚠️  Project-wide duplicate exports detected:\n${report}\n\nConsider consolidating into shared utilities.\n`,
  );
}

process.exit(0);
