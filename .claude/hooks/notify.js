#!/usr/bin/env node
/**
 * Notification hook — sends native macOS notifications when Claude needs attention.
 *
 * Triggers on:
 *   - permission_prompt: Claude is waiting for you to approve/deny something
 *   - idle_prompt:       Claude is waiting for your next message
 *
 * Uses osascript (built into macOS, no dependencies required).
 * On non-macOS systems, falls back to a console bell + stderr message.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");

// Read the Notification event payload from stdin
let payload = {};
try {
  const raw = fs.readFileSync(0, "utf-8");
  if (raw.trim()) payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

const event = payload.hook_event_name ?? "";
const message = payload.message ?? "";

// Only handle events where Claude needs your attention
const ATTENTION_EVENTS = ["permission_prompt", "idle_prompt"];
const isAttentionNeeded = ATTENTION_EVENTS.some((e) => message.toLowerCase().includes(e) || event.toLowerCase().includes(e));

// Exit silently if this is not an attention-required event
if (!isAttentionNeeded) process.exit(0);

// Build notification content
const title = isAttentionNeeded && message.includes("permission")
  ? "Claude needs permission"
  : "Claude is waiting";

const body = message
  ? message.slice(0, 100) + (message.length > 100 ? "…" : "")
  : "Claude Code needs your attention.";

const isMac = process.platform === "darwin";

if (isMac) {
  // Native macOS notification via osascript
  const script = `display notification "${body.replace(/"/g, '\\"')}" with title "${title}" sound name "Ping"`;
  spawnSync("osascript", ["-e", script], { stdio: "ignore" });
} else {
  // Fallback: terminal bell + stderr
  process.stdout.write("\x07"); // bell
  process.stderr.write(`\n🔔 ${title}: ${body}\n`);
}

process.exit(0);
