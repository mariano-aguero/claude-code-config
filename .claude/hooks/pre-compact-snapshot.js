#!/usr/bin/env node
/**
 * PreCompact hook — saves a rich snapshot before context window compaction.
 * Captures git state, session notes, and recent work log so Claude can
 * resume with full awareness after the context is compressed.
 *
 * Writes to:
 *   - ~/.claude/pre-compact-snapshot.md  (global, one per user)
 *   - .claude/pre-compact-snapshot.md    (local to project, if in git repo)
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

let input = {};
try {
  const raw = fs.readFileSync(0, "utf-8");
  if (raw.trim()) input = JSON.parse(raw);
} catch {}

const timestamp = new Date().toISOString();
const isGitRepo =
  spawnSync("git", ["rev-parse", "--git-dir"], { encoding: "utf-8" }).status ===
  0;

// Git state
const branch = isGitRepo
  ? (spawnSync("git", ["branch", "--show-current"], {
      encoding: "utf-8",
    }).stdout?.trim() ?? "")
  : "";
const modifiedFiles = isGitRepo
  ? (
      spawnSync("git", ["status", "--porcelain"], { encoding: "utf-8" })
        .stdout ?? ""
    ).trim()
  : "";
const recentCommits = isGitRepo
  ? (
      spawnSync("git", ["log", "--oneline", "-5"], { encoding: "utf-8" })
        .stdout ?? ""
    ).trim()
  : "";
const diffStat = isGitRepo
  ? (spawnSync("git", ["diff", "--stat", "HEAD"], {
      encoding: "utf-8",
    }).stdout?.trim() ?? "")
  : "";

// Session notes (manual section only — above auto-snapshot marker)
let sessionNotesContext = "";
try {
  const notesRaw = fs.readFileSync(
    path.join(".claude", "session-notes.md"),
    "utf-8",
  );
  const autoMarkerIdx = notesRaw.indexOf("<!-- auto-snapshot -->");
  const manual =
    autoMarkerIdx !== -1
      ? notesRaw.slice(0, autoMarkerIdx).trimEnd()
      : notesRaw.trimEnd();
  if (manual) sessionNotesContext = manual;
} catch {}

// Last 5 work log entries (excluding COMPACT markers)
const worklogPath = path.join(os.homedir(), ".daily-worklog", "current.md");
let worklogContext = "";
try {
  const lines = fs
    .readFileSync(worklogPath, "utf-8")
    .split("\n")
    .filter(Boolean);
  const recent = lines.filter((l) => !l.includes("[COMPACT]")).slice(-5);
  if (recent.length) worklogContext = recent.join("\n");
} catch {}

// Build snapshot
const sections = [
  `# Pre-compact snapshot`,
  `Saved: ${timestamp}`,
  `Session: ${input.session_id ?? "unknown"}`,
];

if (branch || modifiedFiles || recentCommits) {
  sections.push(
    `\n## Git state`,
    `Branch: ${branch || "(detached)"}`,
    `\n### Modified files`,
    modifiedFiles || "(none)",
    `\n### Diff stat`,
    diffStat || "(none)",
    `\n### Recent commits`,
    recentCommits || "(none)",
  );
}

if (sessionNotesContext) {
  sections.push(`\n## Session notes (at compaction time)`, sessionNotesContext);
}

if (worklogContext) {
  sections.push(`\n## Recent work log`, worklogContext);
}

const snapshot = sections.join("\n");

// Write global snapshot
const globalPath = path.join(
  os.homedir(),
  ".claude",
  "pre-compact-snapshot.md",
);
fs.writeFileSync(globalPath, snapshot, "utf-8");

// Write local snapshot (project-level) if in a git repo
if (isGitRepo) {
  const localPath = path.join(".claude", "pre-compact-snapshot.md");
  try {
    fs.writeFileSync(localPath, snapshot, "utf-8");
  } catch {}
}

// Append marker to work log
try {
  fs.appendFileSync(
    worklogPath,
    `\n[${timestamp}] [COMPACT] Context window compacted on branch '${branch}' — snapshot at ${globalPath}\n`,
  );
} catch {}

process.stderr.write(`📸 Snapshot saved → ${globalPath}\n`);
