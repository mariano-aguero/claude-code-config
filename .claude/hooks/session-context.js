#!/usr/bin/env node
/**
 * SessionStart hook — injects persistent context at the start of each session.
 * Reads session notes, work log, tech debt summary, and git state so Claude
 * starts every conversation with full awareness of what's in progress.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const parts = [];

// 1. Session notes (.claude/session-notes.md)
const notesPath = path.join(".claude", "session-notes.md");
try {
  const notes = fs.readFileSync(notesPath, "utf-8").trim();
  if (notes) parts.push(`## Session notes\n${notes}`);
} catch {}

// 2. Last 3 work log entries
const worklogPath = path.join(os.homedir(), ".daily-worklog", "current.md");
try {
  const entries = fs.readFileSync(worklogPath, "utf-8")
    .split("\n")
    .filter(Boolean)
    .slice(-3);
  if (entries.length) parts.push(`## Last work log entries\n${entries.join("\n")}`);
} catch {}

// 3. Tech debt summary
const debtPath = path.join(".claude", "tech-debt.md");
try {
  const debt = fs.readFileSync(debtPath, "utf-8");
  const open = (debt.match(/^- \[ \]/gm) ?? []).length;
  const resolved = (debt.match(/^- \[x\]/gm) ?? []).length;
  if (open > 0) parts.push(`## Tech debt\n${open} open item(s), ${resolved} resolved → .claude/tech-debt.md`);
} catch {}

// 4. Git state
const branch = spawnSync("git", ["branch", "--show-current"], { encoding: "utf-8" }).stdout?.trim() ?? "";
const statusOut = spawnSync("git", ["status", "--porcelain"], { encoding: "utf-8" }).stdout?.trim() ?? "";
const modified = statusOut.split("\n").filter(Boolean);
const logOut = spawnSync("git", ["log", "--oneline", "-3"], { encoding: "utf-8" }).stdout?.trim() ?? "";

if (branch || modified.length) {
  const gitParts = [];
  if (branch) gitParts.push(`Branch: ${branch}`);
  if (modified.length) gitParts.push(`Modified: ${modified.slice(0, 5).join(", ")}`);
  else gitParts.push("Working tree: clean");
  if (logOut) gitParts.push(`Recent commits:\n${logOut.split("\n").map((l) => `  ${l}`).join("\n")}`);
  parts.push(`## Git state\n${gitParts.join("\n")}`);
}

if (parts.length > 0) {
  process.stdout.write(`<session-context>\n${parts.join("\n\n")}\n</session-context>\n`);
}
