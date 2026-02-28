#!/usr/bin/env node
/**
 * PostToolUse hook — scans written files for hardcoded secrets and credentials.
 * Catches API keys, tokens, private keys, and passwords before they reach git.
 */

const fs = require("fs");
const path = require("path");

const filePath = process.env.CLAUDE_FILE_PATH ?? "";

const SKIP_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".lock"];
const SKIP_FILES = [".env", ".env.local", ".env.example"];

const basename = path.basename(filePath);
const ext = path.extname(filePath);

if (SKIP_EXTENSIONS.includes(ext) || SKIP_FILES.includes(basename)) process.exit(0);

const PATTERNS = [
  { name: "Private key",      regex: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH)\s+PRIVATE KEY-----/ },
  { name: "AWS Access Key",   regex: /AKIA[0-9A-Z]{16}/ },
  { name: "GitHub token",     regex: /ghp_[a-zA-Z0-9]{36}/ },
  { name: "Anthropic API key",regex: /sk-ant-[a-zA-Z0-9\-]{20,}/ },
  { name: "OpenAI API key",   regex: /sk-[a-zA-Z0-9]{32,}/ },
  { name: "Hardcoded password",regex: /password\s*[:=]\s*["'][^"']{8,}["']/i },
  { name: "Bearer token",     regex: /Bearer\s+[a-zA-Z0-9\-._~+/]{20,}/i },
  { name: "Generic secret",   regex: /(?:secret|token|api_key)\s*[:=]\s*["'][a-zA-Z0-9\-_]{16,}["']/i },
];

let content;
try {
  content = fs.readFileSync(filePath, "utf-8");
} catch {
  process.exit(0);
}

const found = PATTERNS.filter((p) => p.regex.test(content));

if (found.length > 0) {
  const list = found.map((p) => `  - ${p.name}`).join("\n");
  process.stderr.write(
    `🔐 Potential secrets detected in ${basename}:\n${list}\n\nRemove hardcoded secrets and use environment variables instead.\n`
  );
  process.exit(2);
}
