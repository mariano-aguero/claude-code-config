# Contributing

## Philosophy

This config is a curated, opinionated reference — not a wiki. Every addition must earn its place. The bar is: would a senior engineer on the target stack find this immediately useful in a production project?

This is NOT a place for:

- Beginner tutorials or step-by-step explanations of basics
- Multiple patterns for the same thing ("you could also...")
- Pseudocode, placeholder comments, or `// TODO: implement this`
- Stack-agnostic advice that applies to any project

## Adding a Skill

Skills live in `.claude/skills/`. They are technical reference documents Claude loads into context when working on relevant tasks.

### Template

```markdown
# <technology> Patterns

Brief one-sentence description of what this skill covers.

## Setup

<!-- Real install commands and config. Must work. -->

## Core Patterns

<!-- Code examples that compile in a TypeScript strict project -->

## <Pattern Name>

<!-- Each pattern: when to use it, complete working code, notes on edge cases -->

## DO / DON'T

| DO          | DON'T                      |
| ----------- | -------------------------- |
| Use X for Y | Don't use Z for Y — reason |

## Common Mistakes

<!-- Errors Claude or developers commonly make with this technology -->
```

### Requirements

1. All code examples must compile in a TypeScript strict project — no `any`, no missing imports
2. Imports must reference real packages with correct import paths
3. No pseudocode — use placeholder names (`items`, `users`) but real API calls
4. Include at least one DO/DON'T table for the most common pitfalls
5. Cover version-specific behavior where it matters (e.g., Drizzle v0.38+ index syntax)

### Placement

- Single-file skills: `.claude/skills/<name>.md`
- Multi-file skills with references: `.claude/skills/<name>/SKILL.md` + `.claude/skills/<name>/references/`

## Adding an Agent

Agents live in `.claude/agents/`. They define a persona, behavioral constraints, and response methodology.

### Required sections

```markdown
---
name: <agent-name>
description: <one sentence — used for routing>
model: claude-sonnet-4-5 # or claude-opus-4-5 for security/web3/review
---

# <Agent Name>

## Capabilities

<!-- Bullet list of what this agent knows and handles -->

## Behavioral Traits

<!-- How this agent communicates, what it prioritizes, what it refuses -->

## DO / DON'T

| DO  | DON'T |
| --- | ----- |

## Response Approach

<!-- Step-by-step methodology: how the agent breaks down requests -->

## Example Interactions

<!-- 2-3 realistic examples showing the agent's voice and judgment -->
```

### Quality bar

- Agent must have a clearly differentiated focus from existing agents
- Behavioral traits must be specific, not generic ("be helpful")
- DO/DON'T rules must reflect real mistakes people make with this technology
- The `description` field is used for automatic routing — it must be precise

## Adding a Command

Commands live in `.claude/commands/<category>/<name>.md`. They are slash command templates.

### Requirements

1. **Template code must compile** — same standard as skills
2. Include usage, options, at least one complete template, and examples
3. Include a "Rules" or "Best Practices" section — what invariants does this command enforce?
4. End with a "Post-Execution" section noting any follow-up actions (update CLAUDE.md, run migrations, etc.)

### Compilability requirement

Before submitting a command, verify every code block would work if pasted into a TypeScript strict project with the target stack installed. Run it mentally: are all imports resolvable? Are all types correct? Are API calls using the right method signatures?

## Updating a Skill

When a library releases a breaking change:

1. Update version numbers in the relevant skill and any commands that reference it
2. Add a note in the DO/DON'T table if the old pattern is still common
3. Grep for other skills/agents that may reference the old pattern and update them
4. Commit with a message like: `fix(skills): update drizzle.md to v0.38 index array form`

Version conventions:

- Skills reference the minimum version where a pattern works
- Use `v0.38+` notation, not `latest`
- When a pattern requires a specific version, call it out explicitly in the code comment

## Quality Bar — Non-Negotiables

These rules apply to everything in this repository:

1. **All code examples must compile** in a TypeScript strict project. No exceptions.
2. **Imports must be real.** Import paths must match what the package actually exports.
3. **No pseudocode.** Use real variable names and real API calls.
4. **No filler.** Every sentence must add information. No "you can also...", no "it's worth noting that...".
5. **Versions matter.** If a pattern only works on a specific version, say so.
6. **Stack decisions are final.** Don't add Prisma patterns to a Drizzle skill, or React Hook Form to a TanStack Form skill.
