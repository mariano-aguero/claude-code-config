#!/usr/bin/env node
/**
 * PostToolUse hook — detects potential duplicate function/export definitions.
 * Searches the codebase for identically-named exports to prevent Claude from
 * reimplementing functionality that already exists elsewhere.
 * Uses pure Node.js (no child_process) to walk the file tree.
 */

const fs = require("fs");
const path = require("path");

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const ext = path.extname(filePath);

const CHECKABLE = [".js", ".jsx", ".ts", ".tsx", ".mjs"];
if (!CHECKABLE.includes(ext)) process.exit(0);

let content;
try {
  content = fs.readFileSync(filePath, "utf-8");
} catch {
  process.exit(0);
}

// Extract exported names from the modified file
const EXPORT_PATTERN =
  /export\s+(?:async\s+)?(?:function|class)\s+(\w+)|export\s+(?:const|let)\s+(\w+)\s*=/g;

const names = new Set();
let m;
while ((m = EXPORT_PATTERN.exec(content)) !== null) {
  const name = m[1] ?? m[2];
  if (name && name.length > 2) names.add(name);
}

if (names.size === 0) process.exit(0);

// Walk the project tree and collect source files
const IGNORE_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", ".cache"]);

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
    if (entry.isDirectory()) {
      yield* walkFiles(full);
    } else if (CHECKABLE.includes(path.extname(entry.name))) {
      yield full;
    }
  }
}

// Build a name → files map from the rest of the project
const nameFiles = new Map([...names].map((n) => [n, []]));
const DEF_PATTERN = (name) =>
  new RegExp(`\\bfunction\\s+${name}\\b|\\bconst\\s+${name}\\s*=|\\bclass\\s+${name}\\b`);

for (const file of walkFiles(".")) {
  const normalized = path.normalize(file);
  if (normalized === path.normalize(filePath)) continue;

  let src;
  try {
    src = fs.readFileSync(file, "utf-8");
  } catch {
    continue;
  }

  for (const name of names) {
    if (DEF_PATTERN(name).test(src)) {
      nameFiles.get(name).push(normalized);
    }
  }
}

const duplicates = [...nameFiles.entries()].filter(([, files]) => files.length > 0);

if (duplicates.length > 0) {
  const report = duplicates
    .map(([name, files]) => `  - ${name}() → also defined in: ${files.join(", ")}`)
    .join("\n");
  process.stderr.write(
    `⚠️  Potential duplicate exports in ${path.basename(filePath)}:\n${report}\n\nConsider importing the existing implementation instead of redefining it.\n`
  );
}
