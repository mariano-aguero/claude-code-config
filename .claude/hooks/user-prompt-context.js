#!/usr/bin/env node
/**
 * UserPromptSubmit hook — injects git context before Claude processes each prompt.
 * Automatically provides branch, modified files, and recent commits so you
 * don't have to repeat that context manually on every message.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Read stdin (UserPromptSubmit passes JSON with session_id, prompt, etc.)
let input = {};
try {
  const raw = fs.readFileSync(0, "utf-8");
  if (raw.trim()) input = JSON.parse(raw);
} catch {}

// Git: current branch
const branchResult = spawnSync("git", ["branch", "--show-current"], {
  encoding: "utf-8",
});
const branch = branchResult.stdout?.trim() ?? "";

// Git: modified files (unstaged + staged)
const statusResult = spawnSync("git", ["status", "--porcelain"], {
  encoding: "utf-8",
});
const modifiedFiles = (statusResult.stdout ?? "")
  .trim()
  .split("\n")
  .filter(Boolean)
  .slice(0, 8); // cap at 8 files to avoid noise

// Git: last 3 commits
const logResult = spawnSync("git", ["log", "--oneline", "-3"], {
  encoding: "utf-8",
});
const recentCommits = (logResult.stdout ?? "").trim();

// Last work log entry (last non-empty line)
const worklogPath = path.join(os.homedir(), ".daily-worklog", "current.md");
let lastLogEntry = "";
try {
  const lines = fs.readFileSync(worklogPath, "utf-8").split("\n").filter(Boolean);
  const last = lines.at(-1);
  if (last) lastLogEntry = last;
} catch {}

// Only inject if there's something worth saying
const hasGitContext = branch || modifiedFiles.length > 0;
if (!hasGitContext) process.exit(0);

const parts = [];

if (branch) parts.push(`Branch: ${branch}`);

if (modifiedFiles.length > 0) {
  parts.push(`Modified files (${modifiedFiles.length}):\n${modifiedFiles.map((f) => `  ${f}`).join("\n")}`);
} else {
  parts.push("Working tree: clean");
}

if (recentCommits) {
  parts.push(`Recent commits:\n${recentCommits.split("\n").map((l) => `  ${l}`).join("\n")}`);
}

if (lastLogEntry) {
  parts.push(`Last work log: ${lastLogEntry}`);
}

process.stdout.write(`<git-context>\n${parts.join("\n")}\n</git-context>\n`);
