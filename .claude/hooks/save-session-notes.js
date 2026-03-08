#!/usr/bin/env node
/**
 * Stop hook — saves session state to .claude/session-notes.md.
 * Writes:
 *   - Last 5 work log entries as "last task context" (above auto-snapshot marker)
 *   - Git snapshot (branch, modified files, recent commits)
 *
 * The manual section above <!-- auto-snapshot --> is preserved unless it only
 * contains the auto-generated last-task block (identified by <!-- last-task -->).
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

// Read stdin (Stop event JSON)
let input = {};
try {
  const raw = fs.readFileSync(0, "utf-8");
  if (raw.trim()) input = JSON.parse(raw);
} catch {}

// Don't overwrite if stop_hook_active (prevents infinite loops)
if (input.stop_hook_active) process.exit(0);

const timestamp = new Date().toISOString();
const time = new Date().toTimeString().slice(0, 5);

const isGitRepo = spawnSync("git", ["rev-parse", "--git-dir"], { encoding: "utf-8" }).status === 0;

const branch = isGitRepo ? spawnSync("git", ["branch", "--show-current"], { encoding: "utf-8" }).stdout?.trim() ?? "" : "";
const statusOut = isGitRepo ? spawnSync("git", ["status", "--porcelain"], { encoding: "utf-8" }).stdout?.trim() ?? "" : "";
const modified = statusOut.split("\n").filter(Boolean).slice(0, 10);
const logOut = isGitRepo ? spawnSync("git", ["log", "--oneline", "-3"], { encoding: "utf-8" }).stdout?.trim() ?? "" : "";

// Recent commits: hash + message for dedup check
const recentCommits = isGitRepo
  ? spawnSync("git", ["log", "--format=%H %s", "-5"], { encoding: "utf-8" }).stdout?.trim().split("\n").filter(Boolean) ?? []
  : [];

const notesPath = path.join(".claude", "session-notes.md");

// Work log
const worklogPath = path.join(os.homedir(), ".daily-worklog", "current.md");
let worklogLines = [];
try {
  worklogLines = fs.readFileSync(worklogPath, "utf-8").split("\n").filter(Boolean);
} catch {}

// Auto-stop log entry — skip if commits already appear in the last 40 work log lines
// (means /log-auto was already run or previous AUTO-STOP covered this)
const recentLogWindow = worklogLines.slice(-40).join("\n");
const alreadyLogged = recentCommits.some((c) => {
  const [hash] = c.split(" ");
  return recentLogWindow.includes(hash.slice(0, 8));
});

if (!alreadyLogged && branch) {
  const topCommit = recentCommits[0] ?? "";
  const topHash = topCommit.split(" ")[0]?.slice(0, 8) ?? "";
  const commitMessages = recentCommits
    .slice(0, 3)
    .map((c) => c.split(" ").slice(1).join(" "))
    .filter(Boolean);
  const modifiedCount = modified.length;
  const parts = [`branch: ${branch}${topHash ? ` (${topHash})` : ""}`];
  if (commitMessages.length) parts.push(`commits: "${commitMessages.join('", "')}"`);
  if (modifiedCount) parts.push(`${modifiedCount} file${modifiedCount > 1 ? "s" : ""} modified`);
  const entry = `- [${time}] [AUTO-STOP] ${parts.join(" — ")}`;
  try {
    fs.appendFileSync(worklogPath, `${entry}\n`);
  } catch {}
}

// Last 5 non-COMPACT work log entries for session notes
const lastTaskEntries = worklogLines
  .filter((l) => !l.includes("[COMPACT]"))
  .slice(-5);

// Read existing notes, separate manual section from auto-generated parts
let manualSection = "";
try {
  const existing = fs.readFileSync(notesPath, "utf-8");
  const autoMarkerIdx = existing.indexOf("<!-- auto-snapshot -->");
  const rawManual = autoMarkerIdx !== -1
    ? existing.slice(0, autoMarkerIdx).trimEnd()
    : existing.trimEnd();

  // Strip the previously auto-generated last-task block (identified by <!-- last-task -->)
  const lastTaskMarkerIdx = rawManual.indexOf("<!-- last-task -->");
  manualSection = lastTaskMarkerIdx !== -1
    ? rawManual.slice(0, lastTaskMarkerIdx).trimEnd()
    : rawManual;
} catch {}

// Build last-task block from work log entries
const lastTaskBlock = lastTaskEntries.length
  ? [
      `<!-- last-task -->`,
      `## Last task context`,
      `_Auto-captured from work log at ${timestamp}_`,
      ``,
      ...lastTaskEntries,
    ].join("\n")
  : "";

// Assemble the final file
const sections = [];

if (manualSection) sections.push(manualSection);
if (lastTaskBlock) sections.push(lastTaskBlock);

sections.push(
  [
    `<!-- auto-snapshot -->`,
    `_Last updated: ${timestamp}_`,
    ``,
    `**Branch:** ${branch || "(none)"}`,
    `**Modified files:** ${modified.length ? modified.join(", ") : "none"}`,
    `**Recent commits:**`,
    logOut ? logOut.split("\n").map((l) => `- ${l}`).join("\n") : "- (none)",
  ].join("\n")
);

try {
  fs.writeFileSync(notesPath, sections.join("\n\n"), "utf-8");
} catch {}
