#!/usr/bin/env node
/**
 * PostToolUse hook — detects overly complex functions using static analysis.
 * Measures cyclomatic complexity, nesting depth, and line count per function.
 * No AST required — regex-based for speed, uses matchAll to avoid exec().
 */

const fs = require("fs");
const path = require("path");

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const ext = path.extname(filePath);

const CHECKABLE = [".ts", ".tsx", ".js", ".jsx", ".mjs"];
const SKIP = [/\.test\./, /\.spec\./, /\.d\.ts$/, /\.config\./];

if (!CHECKABLE.includes(ext)) process.exit(0);
if (SKIP.some((p) => p.test(filePath))) process.exit(0);

let content;
try {
  content = fs.readFileSync(filePath, "utf-8");
} catch {
  process.exit(0);
}

// Thresholds
const MAX_COMPLEXITY = 10;
const MAX_NESTING = 3;
const MAX_LINES = 60;

// Find function boundaries using matchAll + brace tracking
function extractFunctions(src) {
  const fns = [];
  const FN_PATTERN =
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)[^{]*\{|(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=\n])\s*=>[^{]*\{/g;

  for (const match of src.matchAll(FN_PATTERN)) {
    const name = match[1] ?? match[2] ?? "(anonymous)";
    const startLine = src.slice(0, match.index).split("\n").length;

    // Track braces to find function body end
    let depth = 0;
    let i = match.index + match[0].length - 1;
    const bodyStart = i;
    while (i < src.length) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") {
        depth--;
        if (depth === 0) break;
      }
      i++;
    }

    const body = src.slice(bodyStart, i + 1);
    const endLine = startLine + body.split("\n").length - 1;
    fns.push({ name, body, startLine, endLine });
  }
  return fns;
}

function cyclomatic(body) {
  return 1 + (body.match(/\bif\b|\belse\b|\bfor\b|\bwhile\b|\bcase\b|\bcatch\b|&&|\|\||\?\./g) ?? []).length;
}

function maxNesting(body) {
  let max = 0;
  let depth = 0;
  for (const ch of body) {
    if (ch === "{") { depth++; if (depth > max) max = depth; }
    else if (ch === "}") depth--;
  }
  return max;
}

const issues = [];

for (const fn of extractFunctions(content)) {
  const lineCount = fn.endLine - fn.startLine;
  const complexity = cyclomatic(fn.body);
  const nesting = maxNesting(fn.body);
  const problems = [];

  if (complexity > MAX_COMPLEXITY) problems.push(`complexity ${complexity} (max ${MAX_COMPLEXITY})`);
  if (nesting > MAX_NESTING) problems.push(`nesting depth ${nesting} (max ${MAX_NESTING})`);
  if (lineCount > MAX_LINES) problems.push(`${lineCount} lines (max ${MAX_LINES})`);

  if (problems.length > 0) {
    issues.push(`  - ${fn.name}() at line ${fn.startLine}: ${problems.join(", ")}`);
  }
}

if (issues.length > 0) {
  process.stderr.write(
    `⚠️  Complex functions in ${path.basename(filePath)}:\n` +
      issues.join("\n") +
      `\nConsider breaking these into smaller functions.\n`
  );
  process.exit(2);
}
