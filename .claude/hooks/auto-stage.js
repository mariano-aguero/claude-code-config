#!/usr/bin/env node
/**
 * PostToolUse hook — automatically git-stages files after Claude writes or edits them.
 *
 * Benefit: `git diff --staged` always shows exactly what Claude changed this session.
 * To review: `git diff --staged`
 * To unstage: `git reset HEAD <file>` or `git restore --staged <file>`
 *
 * Skips: binary files, files outside a git repo, node_modules, .env files.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
if (!filePath) process.exit(0);

// Skip binary and sensitive files
const SKIP_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
]);
const ext = path.extname(filePath).toLowerCase();
const basename = path.basename(filePath);

if (SKIP_EXTENSIONS.has(ext)) process.exit(0);
if (basename === ".env" || basename.startsWith(".env.")) process.exit(0);
if (filePath.includes("node_modules")) process.exit(0);

// Use rev-parse to find the git root — supports monorepos where .git is in a parent dir
// Capture the root path so git add runs from the correct working directory
const revParseResult = spawnSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf-8",
});
if (revParseResult.status !== 0) process.exit(0);
const gitRoot = revParseResult.stdout.trim();

// Verify file still exists (Write might have been a delete in some edge case)
if (!fs.existsSync(filePath)) process.exit(0);

const result = spawnSync("git", ["add", filePath], {
  encoding: "utf-8",
  cwd: gitRoot,
});

// Silently succeed — staging is a side effect, not feedback to Claude
process.exit(0);
