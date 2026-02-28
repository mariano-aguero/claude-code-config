#!/usr/bin/env node
/**
 * Stop hook — saves a lightweight git state snapshot to .claude/session-notes.md.
 * Keeps the file current so the next SessionStart has fresh context.
 * No Claude SDK call — runs on every Stop without overhead.
 */

const fs = require("fs");
const path = require("path");
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

const branch = spawnSync("git", ["branch", "--show-current"], { encoding: "utf-8" }).stdout?.trim() ?? "";
const statusOut = spawnSync("git", ["status", "--porcelain"], { encoding: "utf-8" }).stdout?.trim() ?? "";
const modified = statusOut.split("\n").filter(Boolean).slice(0, 10);
const logOut = spawnSync("git", ["log", "--oneline", "-3"], { encoding: "utf-8" }).stdout?.trim() ?? "";

const notesPath = path.join(".claude", "session-notes.md");

// Read existing notes to preserve any manually written context
let existing = "";
try {
  existing = fs.readFileSync(notesPath, "utf-8");
  // Keep everything above the auto-generated marker
  const markerIdx = existing.indexOf("<!-- auto-snapshot -->");
  if (markerIdx !== -1) existing = existing.slice(0, markerIdx).trimEnd();
} catch {}

const snapshot = [
  existing ? existing + "\n\n" : "",
  `<!-- auto-snapshot -->`,
  `_Last updated: ${timestamp}_`,
  ``,
  `**Branch:** ${branch || "(none)"}`,
  `**Modified files:** ${modified.length ? modified.join(", ") : "none"}`,
  `**Recent commits:**`,
  logOut ? logOut.split("\n").map((l) => `- ${l}`).join("\n") : "- (none)",
].join("\n");

try {
  fs.writeFileSync(notesPath, snapshot, "utf-8");
} catch {}
