#!/usr/bin/env node
/**
 * PostToolUse orchestrator — runs multiple lightweight checks in a single Node.js process.
 *
 * Combining these in one process saves ~300ms per Write/Edit vs. spawning separate nodes:
 *   - detect-secrets    (security — exits(2) on real secrets)
 *   - detect-missing-tests (advisory)
 *   - check-complexity  (advisory)
 *
 * track-tech-debt runs at Stop (session-level bookkeeping, not per-file feedback).
 */

const fs = require("fs");
const path = require("path");

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const ext = path.extname(filePath);
const basename = path.basename(filePath);

// ── Fast exit for files that don't need any of these checks ─────────────────
const BINARY_SKIP = new Set([".png", ".jpg", ".jpeg", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".lock", ".map"]);
const ENV_SKIP = new Set([".env", ".env.local", ".env.example"]);
const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

if (BINARY_SKIP.has(ext) || ENV_SKIP.has(basename)) process.exit(0);

// Secrets check runs on all text files; rest only on source files
const isSource = SOURCE_EXTS.has(ext);
const isTestFile = /\.(test|spec)\.[jt]sx?$/.test(filePath) || filePath.includes("__tests__");
const isConfigFile = /\.(config|d)\.[jt]sx?$/.test(filePath) || /\.(stories)\.[jt]sx?$/.test(filePath);

let content;
try {
  content = fs.readFileSync(filePath, "utf-8");
} catch {
  process.exit(0);
}

const warnings = [];
let hasSecurityIssue = false;

// ── 1. Detect Secrets ────────────────────────────────────────────────────────
const SECRET_PATTERNS = [
  { name: "Private key",       regex: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH)\s+PRIVATE KEY-----/ },
  { name: "AWS Access Key",    regex: /AKIA[0-9A-Z]{16}/ },
  { name: "GitHub token",      regex: /ghp_[a-zA-Z0-9]{36}/ },
  { name: "Anthropic API key", regex: /sk-ant-[a-zA-Z0-9\-]{20,}/ },
  { name: "OpenAI API key",    regex: /sk-[a-zA-Z0-9]{32,}/ },
  { name: "Hardcoded password",regex: /password\s*[:=]\s*["'][^"']{8,}["']/i },
  { name: "Bearer token",      regex: /Bearer\s+[a-zA-Z0-9\-._~+/]{20,}/i },
  { name: "Generic secret",    regex: /(?:secret|token|api_key)\s*[:=]\s*["'][a-zA-Z0-9\-_]{16,}["']/i },
];

const secretsFound = SECRET_PATTERNS.filter((p) => p.regex.test(content));
if (secretsFound.length > 0) {
  const list = secretsFound.map((p) => `  - ${p.name}`).join("\n");
  process.stderr.write(
    `🔐 Potential secrets detected in ${basename}:\n${list}\n\nRemove hardcoded secrets and use environment variables instead.\n`
  );
  hasSecurityIssue = true;
}

// ── 2. Detect Missing Tests ──────────────────────────────────────────────────
if (isSource && !isTestFile && !isConfigFile) {
  const EXPORT_PATTERN =
    /export\s+(?:async\s+)?(?:function|class)\s+(\w+)|export\s+(?:const|let)\s+(\w+)\s*=/g;
  const namedExports = new Set(
    [...content.matchAll(EXPORT_PATTERN)]
      .map((m) => m[1] ?? m[2])
      .filter((n) => n && n.length > 2)
  );

  if (namedExports.size > 0) {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, ext);
    const candidates = [
      path.join(dir, `${base}.test${ext}`),
      path.join(dir, `${base}.spec${ext}`),
      path.join(dir, "__tests__", `${base}${ext}`),
      path.join(dir, `${base}.test.ts`),
      path.join(dir, `${base}.spec.ts`),
    ];

    const testFile = candidates.find((c) => fs.existsSync(c));

    if (!testFile) {
      warnings.push(
        `⚠️  No test file found for ${basename}.\n` +
          `Expected: ${candidates[0]}\n` +
          `Exports without tests: ${[...namedExports].join(", ")}`
      );
    } else {
      try {
        const testContent = fs.readFileSync(testFile, "utf-8");
        const uncovered = [...namedExports].filter((n) => !testContent.includes(n));
        if (uncovered.length > 0) {
          warnings.push(
            `⚠️  ${path.basename(testFile)} doesn't cover: ${uncovered.join(", ")}`
          );
        }
      } catch { /* ignore */ }
    }
  }
}

// ── 3. Check Complexity ──────────────────────────────────────────────────────
if (isSource && !isTestFile) {
  const SKIP_COMPLEXITY = [/\.config\./, /\.d\.ts$/];
  if (!SKIP_COMPLEXITY.some((p) => p.test(filePath))) {
    const MAX_COMPLEXITY = 10;
    const MAX_NESTING = 5;
    const MAX_LINES = 60;

    const FN_PATTERN =
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)[^{]*\{|(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=\n])\s*=>[^{]*\{/g;

    const complexIssues = [];

    for (const match of content.matchAll(FN_PATTERN)) {
      const name = match[1] ?? match[2] ?? "(anonymous)";
      const startLine = content.slice(0, match.index).split("\n").length;

      let depth = 0;
      let i = match.index + match[0].length - 1;
      const bodyStart = i;
      while (i < content.length) {
        if (content[i] === "{") depth++;
        else if (content[i] === "}") { depth--; if (depth === 0) break; }
        i++;
      }

      const body = content.slice(bodyStart, i + 1);
      const lineCount = body.split("\n").length;
      const complexity =
        1 + (body.match(/\bif\b|\belse\b|\bfor\b|\bwhile\b|\bcase\b|\bcatch\b|&&|\|\||\?\./g) ?? []).length;

      let nestingDepth = 0, maxNest = 0;
      for (const ch of body) {
        if (ch === "{") { nestingDepth++; if (nestingDepth > maxNest) maxNest = nestingDepth; }
        else if (ch === "}") nestingDepth--;
      }

      const problems = [];
      if (complexity > MAX_COMPLEXITY) problems.push(`complexity ${complexity} (max ${MAX_COMPLEXITY})`);
      if (maxNest > MAX_NESTING) problems.push(`nesting depth ${maxNest} (max ${MAX_NESTING})`);
      if (lineCount > MAX_LINES) problems.push(`${lineCount} lines (max ${MAX_LINES})`);

      if (problems.length > 0) {
        complexIssues.push(`  - ${name}() at line ${startLine}: ${problems.join(", ")}`);
      }
    }

    if (complexIssues.length > 0) {
      warnings.push(
        `⚠️  Complex functions in ${basename}:\n${complexIssues.join("\n")}\nConsider breaking these into smaller functions.`
      );
    }
  }
}

// ── Output ───────────────────────────────────────────────────────────────────
if (warnings.length > 0) {
  process.stderr.write(warnings.join("\n\n") + "\n");
}

process.exit(hasSecurityIssue ? 2 : 0);
