#!/usr/bin/env node
/**
 * PreCompact hook — saves a git state snapshot before context window compaction.
 * Prevents losing track of what was in progress when Claude compresses history.
 * Snapshot is written to ~/.claude/pre-compact-snapshot.md
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Read stdin (PreCompact passes JSON with session_id, transcript_path, etc.)
let input = {};
try {
  const raw = fs.readFileSync(0, "utf-8");
  if (raw.trim()) input = JSON.parse(raw);
} catch {}

const timestamp = new Date().toISOString();

// Git state
const branch =
  spawnSync("git", ["branch", "--show-current"], { encoding: "utf-8" }).stdout?.trim() ?? "";

const statusResult = spawnSync("git", ["status", "--porcelain"], { encoding: "utf-8" });
const modifiedFiles = (statusResult.stdout ?? "").trim();

const logResult = spawnSync("git", ["log", "--oneline", "-5"], { encoding: "utf-8" });
const recentCommits = (logResult.stdout ?? "").trim();

const diffStat = spawnSync("git", ["diff", "--stat", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ?? "";

// Build snapshot
const snapshot = [
  `# Pre-compact snapshot`,
  `Saved: ${timestamp}`,
  `Session: ${input.session_id ?? "unknown"}`,
  ``,
  `## Git state`,
  `Branch: ${branch || "(detached)"}`,
  ``,
  `### Modified files`,
  modifiedFiles || "(none)",
  ``,
  `### Diff stat`,
  diffStat || "(none)",
  ``,
  `### Recent commits`,
  recentCommits || "(none)",
].join("\n");

// Write to ~/.claude/pre-compact-snapshot.md (overwrites each time — only last matters)
const snapshotPath = path.join(os.homedir(), ".claude", "pre-compact-snapshot.md");
fs.writeFileSync(snapshotPath, snapshot, "utf-8");

// Append a marker to the work log so it shows up in /daily
const worklogPath = path.join(os.homedir(), ".daily-worklog", "current.md");
try {
  fs.appendFileSync(
    worklogPath,
    `\n[${timestamp}] [COMPACT] Context window compacted on branch '${branch}' — snapshot at ${snapshotPath}\n`
  );
} catch {}

process.stderr.write(`📸 Snapshot saved → ${snapshotPath}\n`);
