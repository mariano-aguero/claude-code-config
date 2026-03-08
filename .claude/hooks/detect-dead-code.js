#!/usr/bin/env node
/**
 * PostToolUse hook — detects namedExports that are never imported elsewhere.
 * Helps prevent Claude from leaving dead code in the codebase.
 * Uses pure Node.js file walking and matchAll (no exec, no child_process).
 */

const fs = require("fs");
const path = require("path");

if (process.env.CLAUDE_ANALYSIS === "0") process.exit(0);

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const ext = path.extname(filePath);

const CHECKABLE = [".ts", ".tsx", ".js", ".jsx"];
const SKIP = [/index\.[jt]sx?$/, /\.test\./, /\.spec\./, /\.d\.ts$/, /\.config\./];
const IGNORE_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", ".cache", "coverage"]);

if (!CHECKABLE.includes(ext)) process.exit(0);
if (SKIP.some((p) => p.test(filePath))) process.exit(0);

let content;
try {
  content = fs.readFileSync(filePath, "utf-8");
} catch {
  process.exit(0);
}

// Extract named namedExports using matchAll
const EXPORT_PATTERN =
  /export\s+(?:async\s+)?(?:function|class)\s+(\w+)|export\s+(?:const|let|var)\s+(\w+)|export\s+(?:type|interface)\s+(\w+)/g;

const namedExports = new Set(
  [...content.matchAll(EXPORT_PATTERN)]
    .map((m) => m[1] ?? m[2] ?? m[3])
    .filter((n) => n && n.length > 2)
);

if (namedExports.size === 0) process.exit(0);

const normalizedPath = path.normalize(filePath);
const withoutExt = filePath.replace(/\.[jt]sx?$/, "");
const baseName = path.basename(withoutExt);

// Walk project files
function* walkFiles(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkFiles(full);
    else if (CHECKABLE.includes(path.extname(entry.name))) yield full;
  }
}

const usedExports = new Set();

for (const file of walkFiles(process.cwd())) {
  if (path.normalize(file) === normalizedPath) continue;

  let src;
  try { src = fs.readFileSync(file, "utf-8"); }
  catch { continue; }

  // Check files that import from ours via any path variant:
  //   from './Button', from '../utils/Button', from '@/components/Button', from 'Button'
  // Require a '/' prefix or 'from ' prefix to avoid matching arbitrary string literals.
  const importsFromUs =
    src.includes(`/${baseName}'`) ||
    src.includes(`/${baseName}"`) ||
    src.includes(`from '${baseName}'`) ||
    src.includes(`from "${baseName}"`);
  if (!importsFromUs) continue;

  for (const name of namedExports) {
    if (new RegExp(`\\b${name}\\b`).test(src)) usedExports.add(name);
  }
}

const deadExports = [...namedExports].filter((name) => !usedExports.has(name));

if (deadExports.length > 0) {
  process.stderr.write(
    `⚠️  Potentially unused namedExports in ${path.basename(filePath)}:\n` +
      deadExports.map((n) => `  - ${n}`).join("\n") +
      `\nVerify these are used or remove them to keep the codebase clean.\n`
  );
}
