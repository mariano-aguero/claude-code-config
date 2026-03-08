#!/usr/bin/env node
/**
 * PostToolUse hook — tracks TODO/FIXME/HACK comments as tech debt entries.
 * Appends new items to .claude/tech-debt.md without duplicating existing ones.
 * Uses matchAll to scan markers (avoids exec()).
 */

const fs = require("fs");
const path = require("path");

const filePath = process.env.CLAUDE_FILE_PATH ?? "";
const ext = path.extname(filePath);

const CHECKABLE = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".py", ".go", ".rs"];
const SKIP = [/\.test\./, /\.spec\./, /\.d\.ts$/];

if (!CHECKABLE.includes(ext)) process.exit(0);
if (SKIP.some((p) => p.test(filePath))) process.exit(0);

let content;
try {
  content = fs.readFileSync(filePath, "utf-8");
} catch {
  process.exit(0);
}

// Scan for debt markers line by line
const DEBT_PATTERN = /\/\/\s*(TODO|FIXME|HACK|XXX|DEBT|TEMP)\s*:?\s*(.+)/gi;
const lines = content.split("\n");
const found = [];

for (let i = 0; i < lines.length; i++) {
  const matches = [...lines[i].matchAll(DEBT_PATTERN)];
  for (const match of matches) {
    found.push({
      key: `${filePath}:${i + 1}`,
      marker: match[1].toUpperCase(),
      text: match[2].trim(),
      line: i + 1,
    });
  }
}

if (found.length === 0) process.exit(0);

// Load or init tech-debt.md
const debtPath = path.join(process.cwd(), ".claude", "tech-debt.md");
let existing = "";
try {
  existing = fs.readFileSync(debtPath, "utf-8");
} catch {
  existing =
    "# Tech Debt\n\nTracked automatically by Claude Code hooks.\nMark items as `[x]` when resolved.\n\n";
}

const timestamp = new Date().toISOString().split("T")[0];
let added = 0;

for (const item of found) {
  // Match the backtick-wrapped key as written in the file to avoid substring false matches
  // e.g., "file.ts:5" must not match "file.ts:51" — the backtick terminates the key
  const writtenKey = `\`${item.key}\``;
  if (existing.includes(writtenKey)) continue;
  existing += `- [ ] ${writtenKey} — **${item.marker}**: ${item.text} _(${timestamp})_\n`;
  added++;
}

if (added > 0) fs.writeFileSync(debtPath, existing, "utf-8");

// Report current debt for this file
// Count only open (unresolved) debt items to avoid inflating counts with resolved ones
const openLines = existing.split("\n").filter((l) => l.startsWith("- [ ]"));
const fileDebtCount = openLines.filter((l) => l.includes(filePath)).length;

if (fileDebtCount > 0) {
  process.stderr.write(
    `📋 Tech debt in ${path.basename(filePath)}: ${fileDebtCount} item(s)` +
      (added > 0 ? ` (${added} new)` : "") +
      ` → .claude/tech-debt.md\n`,
  );
}
