#!/usr/bin/env node
/**
 * Stop hook — generates a pre-PR checklist using Claude when commits are ahead of remote.
 * Only activates when there's unreleased work (avoids overhead on every response).
 * Saves checklist to .claude/pr-checklist.md for review before opening a PR.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

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
  { encoding: "utf-8" }
);
const commitsAhead = (aheadResult.stdout ?? "").trim().split("\n").filter(Boolean);
if (commitsAhead.length === 0) process.exit(0);

// Get current branch and diff
const branch = spawnSync("git", ["branch", "--show-current"], { encoding: "utf-8" }).stdout?.trim() ?? "";
const diffResult = spawnSync("git", ["diff", "origin/HEAD...HEAD", "--stat"], { encoding: "utf-8" });
const diffStat = (diffResult.stdout ?? "").trim();

const fullDiffResult = spawnSync(
  "git",
  ["diff", "origin/HEAD...HEAD", "--unified=2"],
  { encoding: "utf-8", maxBuffer: 100 * 1024 }
);
const fullDiff = (fullDiffResult.stdout ?? "").slice(0, 8000); // cap to avoid token overflow

// Read existing tech debt for context
const debtPath = path.join(".claude", "tech-debt.md");
let openDebt = "";
try {
  const debt = fs.readFileSync(debtPath, "utf-8");
  const openItems = debt.split("\n").filter((l) => l.startsWith("- [ ]"));
  openDebt = openItems.slice(0, 10).join("\n");
} catch {}

// Build prompt for Claude
const prompt = `You are a senior engineer doing a pre-PR review. Analyze this git diff and generate a concise PR checklist in markdown.

Branch: ${branch}
Commits ahead: ${commitsAhead.length}

Diff stat:
${diffStat}

Open tech debt items:
${openDebt || "(none)"}

Diff (truncated to 8000 chars):
${fullDiff}

Generate a markdown checklist with these sections:
1. **⚠️ Needs attention** — untested functions, remaining TODOs/FIXMEs, complex code, potential issues
2. **✅ Looks good** — what's done well
3. **📝 Suggested PR description** — one paragraph summarizing the changes

Be specific (mention file names and function names). Be concise. Today's date: ${new Date().toISOString().split("T")[0]}.`;

// Call claude CLI
const claudeResult = spawnSync("claude", ["-p", prompt], {
  encoding: "utf-8",
  timeout: 60_000,
});

if (claudeResult.status !== 0 || !claudeResult.stdout?.trim()) {
  // Claude CLI not available or failed — generate a basic checklist without AI
  const basic = [
    `# PR Checklist — ${branch}`,
    `_Generated: ${new Date().toISOString().split("T")[0]} (basic mode — claude CLI unavailable)_`,
    ``,
    `## Commits ahead (${commitsAhead.length})`,
    commitsAhead.map((c) => `- ${c}`).join("\n"),
    ``,
    `## Diff stat`,
    diffStat,
    ``,
    `## Manual checklist`,
    `- [ ] All new functions have tests`,
    `- [ ] No TODOs/FIXMEs left unresolved`,
    `- [ ] TypeScript types are correct`,
    `- [ ] No hardcoded secrets`,
    `- [ ] PR description written`,
  ].join("\n");

  fs.writeFileSync(path.join(".claude", "pr-checklist.md"), basic, "utf-8");
  process.stderr.write(`📋 Basic PR checklist saved → .claude/pr-checklist.md\n`);
  process.exit(0);
}

// Save AI-generated checklist
const checklist = [
  `# PR Checklist — ${branch}`,
  `_Generated: ${new Date().toISOString().split("T")[0]} | ${commitsAhead.length} commit(s) ahead_`,
  ``,
  claudeResult.stdout.trim(),
].join("\n");

fs.writeFileSync(path.join(".claude", "pr-checklist.md"), checklist, "utf-8");
process.stderr.write(
  `📋 PR checklist generated → .claude/pr-checklist.md\n` +
    `   ${commitsAhead.length} commit(s) ahead of remote on '${branch}'\n`
);
