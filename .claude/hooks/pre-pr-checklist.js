#!/usr/bin/env node
/**
 * Stop hook — generates a pre-PR checklist when commits are ahead of remote.
 * Only activates when there's unreleased work (avoids overhead on every session stop).
 * Saves checklist to .claude/pr-checklist.md for review before opening a PR.
 *
 * Intentionally fast: no external AI calls. Uses local git data only.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Read stdin (Stop event JSON)
let input = {};
try {
  const raw = fs.readFileSync(0, "utf-8");
  if (raw.trim()) input = JSON.parse(raw);
} catch {}

// Avoid infinite loops from stop_hook_active
if (input.stop_hook_active) process.exit(0);

// Check if we have commits ahead of remote — exit early if not
const aheadResult = spawnSync(
  "git",
  ["log", "origin/HEAD..HEAD", "--oneline"],
  { encoding: "utf-8" },
);
// If git fails (no remote, detached HEAD, etc.) exit — but hint when remote ref is missing
if (aheadResult.status !== 0) {
  const stderr = aheadResult.stderr ?? "";
  if (
    stderr.includes("unknown revision") ||
    stderr.includes("no remote") ||
    stderr.includes("not found")
  ) {
    process.stderr.write(
      "📋 PR checklist skipped: no remote tracking branch found (run `git fetch` first)\n",
    );
  }
  process.exit(0);
}

const commitsAhead = (aheadResult.stdout ?? "")
  .trim()
  .split("\n")
  .filter(Boolean);
if (commitsAhead.length === 0) process.exit(0);

// Get current branch
const branch =
  spawnSync("git", ["branch", "--show-current"], {
    encoding: "utf-8",
  }).stdout?.trim() ?? "";

// Diff stat vs remote
const diffResult = spawnSync("git", ["diff", "origin/HEAD...HEAD", "--stat"], {
  encoding: "utf-8",
});
const diffStat = (diffResult.stdout ?? "").trim();

// Changed files list
const changedFilesResult = spawnSync(
  "git",
  ["diff", "origin/HEAD...HEAD", "--name-only"],
  { encoding: "utf-8" },
);
const changedFiles = (changedFilesResult.stdout ?? "")
  .trim()
  .split("\n")
  .filter(Boolean);

// Read open tech debt items for this PR's changed files
const debtPath = path.join(process.cwd(), ".claude", "tech-debt.md");
let relevantDebt = [];
try {
  const debt = fs.readFileSync(debtPath, "utf-8");
  const openItems = debt.split("\n").filter((l) => l.startsWith("- [ ]"));
  // Only show debt items from files changed in this PR
  relevantDebt = openItems.filter((item) =>
    changedFiles.some((f) => item.includes(path.basename(f, path.extname(f)))),
  );
  // Fall back to all open debt if nothing matches
  if (relevantDebt.length === 0) relevantDebt = openItems.slice(0, 8);
} catch {}

// Detect TODO/FIXME in changed files
const todoResult = spawnSync(
  "git",
  ["diff", "origin/HEAD...HEAD", "-G", "TODO|FIXME|HACK", "--name-only"],
  { encoding: "utf-8" },
);
const filesWithTodos = (todoResult.stdout ?? "")
  .trim()
  .split("\n")
  .filter(Boolean);

// Detect test files in the changed set
const sourceFiles = changedFiles.filter(
  (f) => /\.[jt]sx?$/.test(f) && !/\.(test|spec)/.test(f),
);
const untested = sourceFiles.filter(
  (f) =>
    !changedFiles.some(
      (t) =>
        t.includes(path.basename(f, path.extname(f))) &&
        /\.(test|spec)/.test(t),
    ),
);

// Build checklist
const date = new Date().toISOString().split("T")[0];

const sections = [
  `# PR Checklist — ${branch}`,
  `_Generated: ${date} | ${commitsAhead.length} commit(s) ahead of remote_`,
  ``,
  `## Commits (${commitsAhead.length})`,
  commitsAhead.map((c) => `- ${c}`).join("\n"),
];

if (diffStat) {
  sections.push(``, `## Changes`, `\`\`\``, diffStat, `\`\`\``);
}

if (relevantDebt.length > 0) {
  sections.push(``, `## Open tech debt`, relevantDebt.join("\n"));
}

if (filesWithTodos.length > 0) {
  sections.push(
    ``,
    `## ⚠️ Files with TODO/FIXME`,
    filesWithTodos.map((f) => `- \`${f}\``).join("\n"),
  );
}

const checklist = [
  ``,
  `## Pre-PR Checklist`,
  untested.length > 0
    ? `- [ ] Add tests for: ${untested.map((f) => `\`${path.basename(f)}\``).join(", ")}`
    : `- [x] Tests present for changed source files`,
  `- [ ] No TODO/FIXME left unresolved`,
  `- [ ] TypeScript passes (\`pnpm tsc --noEmit\`)`,
  `- [ ] No hardcoded secrets or credentials`,
  `- [ ] Branch is up to date with main (\`git pull --rebase origin main\`)`,
  `- [ ] Reviewed full diff (\`git diff origin/main...HEAD\`)`,
  `- [ ] PR description written`,
];

sections.push(...checklist);

const output = sections.join("\n");
const checklistPath = path.join(".claude", "pr-checklist.md");

fs.writeFileSync(checklistPath, output, "utf-8");
process.stderr.write(
  `📋 PR checklist → .claude/pr-checklist.md` +
    `  (${commitsAhead.length} commit(s) ahead on '${branch}')\n`,
);
